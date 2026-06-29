import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

interface Figure {
  id: string
  name: string
  era: string
  description: string
}

export default function SelectFigure() {
  const [figures, setFigures] = useState<Figure[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // 피드백 관련 상태
  const [feedbacks, setFeedbacks] = useState<any[]>([])

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await logout()
      navigate('/')
    }
  }

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true })
      return
    }

    const fetchFigures = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'figures'))
        const list: Figure[] = querySnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name || '',
            era: data.era || '',
            description: data.description || ''
          }
        })
        setFigures(list)
      } catch (error) {
        console.error('Failed to fetch figures', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFigures()

    // 피드백 데이터 실시간 구독
    let unsubscribe: () => void
    if (user.uid) {
      const invQ = query(collection(db, 'interviews'), where('userId', '==', user.uid))
      unsubscribe = onSnapshot(invQ, (snapshot) => {
        const fbs: any[] = []
        snapshot.forEach(invDoc => {
          const data = invDoc.data()
          if (data.feedback) {
            fbs.push({ id: invDoc.id, ...data })
          }
        })
        fbs.sort((a, b) => new Date(b.feedback.sentAt).getTime() - new Date(a.feedback.sentAt).getTime())
        setFeedbacks(fbs)
      })
    }

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [user, navigate])

  const handleSelect = (figureId: string) => {
    navigate(`/student/ethics?figureId=${figureId}`)
  }

  return (
    <div className="flex flex-col flex-1 bg-slate-50 p-4 sm:p-6 min-h-[100dvh]">
      {/* 상단 헤더: 사용자 정보 및 로그아웃 */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-lg font-bold shadow-sm border border-indigo-200">
            {user?.name?.charAt(0) || '👤'}
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">환영합니다!</p>
            <p className="font-bold text-slate-800"><span className="text-indigo-600">{user?.name}</span> 님</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-4 py-2 rounded-xl font-bold transition-all shadow-sm"
        >
          로그아웃
        </button>
      </div>
      
      <div className="max-w-4xl mx-auto w-full">
        {feedbacks.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span>📬</span> 내 알림
            </h2>
            <div className="space-y-3">
              {feedbacks.map(fb => {
                const isRevisionRequested = fb.status === 'revision_requested'
                const figureName = figures.find(f => f.id === fb.figureId)?.name || '알 수 없음'

                return (
                  <div key={fb.id} className={`p-4 rounded-xl border ${isRevisionRequested ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'} flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 shadow-sm transition-all`}>
                    <div className="flex-1 pr-0 sm:pr-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${isRevisionRequested ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-200 text-slate-600'}`}>
                          {isRevisionRequested ? '수정 요청' : '피드백 / 제출 완료'}
                        </span>
                        <span className="text-sm font-bold text-slate-800">{figureName} 보고서 피드백</span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 sm:line-clamp-1">{fb.feedback.text}</p>
                    </div>
                    <div className="w-full sm:w-auto flex justify-end">
                      {isRevisionRequested ? (
                        <button
                          onClick={() => navigate(`/student/report?figureId=${fb.figureId}`)}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm whitespace-nowrap transition-colors"
                        >
                          수정하러 가기 →
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/student/report?figureId=${fb.figureId}`)}
                          className="w-full sm:w-auto bg-white border border-slate-300 text-slate-600 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-slate-50 whitespace-nowrap transition-colors"
                        >
                          보고서 보기
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">📜 역사적 인물 선택</h1>
            <p className="text-slate-600">오늘 인터뷰를 진행할 인물을 선택해 주세요.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-20 animate-pulse">인물 목록을 불러오는 중입니다...</div>
        ) : figures.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {figures.map(figure => (
              <div 
                key={figure.id} 
                onClick={() => handleSelect(figure.id)}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full mb-3">
                  {figure.era}
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {figure.name}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {figure.description}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 text-sm font-bold text-blue-500 flex items-center justify-between">
                  인터뷰 시작하기 <span>→</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
            <p className="text-slate-500 mb-2">현재 인터뷰할 수 있는 인물이 없습니다.</p>
            <p className="text-sm text-slate-400">선생님께서 인물을 등록해 주실 때까지 기다려 주세요.</p>
          </div>
        )}
      </div>

      {/* 교사 미리보기 전용 플로팅 버튼 */}
      {user?.role === 'teacher' && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-full text-sm font-bold shadow-xl transition-transform hover:scale-105 flex items-center gap-2 border border-slate-700"
          >
            <span className="text-lg">👨‍🏫</span> 교사 대시보드로 복귀
          </button>
        </div>
      )}
    </div>
  )
}
