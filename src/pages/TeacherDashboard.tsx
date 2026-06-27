import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { collection, onSnapshot, query, where, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

interface Student {
  id: string
  name: string
  email: string
  status: string
  questions: number
  draftReady: boolean
  edited: boolean
  submitted: boolean
  lastActivity: string
}

interface RegisteredUser {
  uid: string
  name: string
  email: string
}

const STATUS_FILTERS = ['전체', '인터뷰 중', '초안 생성 완료', '수정 중', '제출 완료', '재수정 요청', '진행 전']

export default function TeacherDashboard() {
  const { user, logout, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [filter, setFilter] = useState('전체')
  
  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false)
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredUser[]>([])
  const [loadingRegistered, setLoadingRegistered] = useState(false)

  const [dbLoading, setDbLoading] = useState(true)

  // 로그인 안 되어 있으면 로그인 페이지로
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { replace: true })
    }
  }, [user, authLoading, navigate])

  // Firestore에서 학생(대시보드에 추가된 학생) 실시간 구독
  useEffect(() => {
    const q = query(collection(db, 'students'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Student[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          name: data.name || '',
          email: data.email || '',
          status: data.status || '진행 전',
          questions: data.questions || 0,
          draftReady: data.draftReady || false,
          edited: data.edited || false,
          submitted: data.submitted || false,
          lastActivity: data.lastActivity || '-',
        }
      })
      setStudents(list)
      setDbLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // 등록된 전체 학생 목록 불러오기 (모달 열 때)
  const loadRegisteredStudents = async () => {
    setLoadingRegistered(true)
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'))
      const querySnapshot = await getDocs(q)
      const users: RegisteredUser[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        // 이미 대시보드에 추가된 학생은 제외
        if (!students.find(s => s.id === doc.id)) {
          users.push({
            uid: doc.id,
            name: data.name || '이름 없음',
            email: data.email || '',
          })
        }
      })
      setRegisteredStudents(users)
    } catch (error) {
      console.error('학생 목록 불러오기 실패:', error)
    } finally {
      setLoadingRegistered(false)
    }
  }

  const handleOpenAddModal = () => {
    setShowAddModal(true)
    loadRegisteredStudents()
  }

  const handleAddStudent = async (studentUser: RegisteredUser) => {
    try {
      await setDoc(doc(db, 'students', studentUser.uid), {
        name: studentUser.name,
        email: studentUser.email,
        status: '진행 전',
        questions: 0,
        draftReady: false,
        edited: false,
        submitted: false,
        lastActivity: '-',
        createdAt: new Date(),
      })
      // 방금 추가한 학생 목록에서 제거
      setRegisteredStudents(prev => prev.filter(s => s.uid !== studentUser.uid))
    } catch (error) {
      console.error('학생 추가 실패:', error)
      alert('학생 추가에 실패했습니다.')
    }
  }

  const removeStudent = async (id: string) => {
    if (confirm('이 학생을 목록에서 삭제하시겠습니까?')) {
      await deleteDoc(doc(db, 'students', id))
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case '제출 완료': return 'bg-green-100 text-green-700 border-green-200'
      case '수정 중': return 'bg-blue-100 text-blue-700 border-blue-200'
      case '초안 생성 완료': return 'bg-purple-100 text-purple-700 border-purple-200'
      case '인터뷰 중': return 'bg-sky-100 text-sky-700 border-sky-200'
      case '재수정 요청': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-slate-100 text-slate-500 border-slate-200'
    }
  }

  const filtered = filter === '전체' ? students : students.filter(s => s.status === filter)

  const stats = {
    total: students.length,
    submitted: students.filter(s => s.status === '제출 완료').length,
    inProgress: students.filter(s => ['인터뷰 중', '수정 중', '초안 생성 완료'].includes(s.status)).length,
    needsAttention: students.filter(s => ['재수정 요청', '진행 전'].includes(s.status)).length,
  }

  if (authLoading || dbLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-slate-400 text-sm animate-pulse">대시보드 로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">📊 학급 대시보드</h1>
            <p className="text-sm text-slate-500">5학년 1반 · 세종대왕 인터뷰 과제</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              실시간 업데이트 중
            </div>
            {user && (
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                👨‍🏫 {user.name}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-600 font-medium transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-medium">전체 학생</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-green-600 font-medium">제출 완료</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.submitted}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-blue-600 font-medium">진행 중</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-red-600 font-medium">주의 필요</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.needsAttention}</p>
          </div>
        </div>

        {/* 필터 + 학생 추가 버튼 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(f => {
              const count = f === '전체' ? students.length : students.filter(s => s.status === f).length
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                    filter === f
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f} ({count})
                </button>
              )
            })}
          </div>
          <button
            onClick={handleOpenAddModal}
            className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          >
            + 학생 추가
          </button>
        </div>

        {/* 학생 추가 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg text-slate-800">학생 추가</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4 text-sm text-slate-600">
                가입된 학생 목록입니다. 대시보드에 추가할 학생의 '추가' 버튼을 클릭하세요.
              </div>

              <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl mb-4 bg-slate-50">
                {loadingRegistered ? (
                  <div className="p-8 text-center text-slate-400 text-sm animate-pulse">불러오는 중...</div>
                ) : registeredStudents.length > 0 ? (
                  <ul className="divide-y divide-slate-200">
                    {registeredStudents.map(student => (
                      <li key={student.uid} className="flex items-center justify-between p-4 bg-white hover:bg-blue-50/50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                        <button
                          onClick={() => handleAddStudent(student)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg transition-colors border border-slate-200 hover:border-blue-300"
                        >
                          추가
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    추가할 수 있는 학생이 없습니다.<br/>(학생이 가입하지 않았거나 이미 모두 추가됨)
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-slate-900 transition-colors text-sm"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 학생 테이블 */}
        {students.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">학생 이름</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">현재 상태</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">질문 수</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">초안 생성</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">수정 여부</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">제출 여부</th>
                  <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, idx) => (
                  <tr
                    key={student.id}
                    className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${
                      idx % 2 === 0 ? '' : 'bg-slate-50/30'
                    }`}
                  >
                    <td className="px-5 py-3.5 font-semibold text-sm text-slate-800">{student.name}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${getBadgeStyle(student.status)}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-sm text-slate-600">
                      <span className={student.questions >= 10 ? 'font-bold text-slate-800' : ''}>{student.questions}</span>
                      <span className="text-slate-400"> / 10</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {student.draftReady
                        ? <span className="text-green-600 font-bold text-sm">✓</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {student.edited
                        ? <span className="text-green-600 font-bold text-sm">✓ 수정함</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {student.submitted
                        ? <span className="text-green-600 font-bold text-sm">✓ 제출됨</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => removeStudent(student.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="p-10 text-center text-slate-400 text-sm">
                해당하는 학생이 없습니다.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
            <div className="text-5xl mb-4">👨‍🎓</div>
            <h2 className="text-lg font-bold text-slate-700 mb-2">등록된 학생이 없습니다</h2>
            <p className="text-sm text-slate-500 mb-6">
              '학생 추가' 버튼을 눌러 앱에 가입한 학생을 대시보드에 추가해 주세요.<br />
              학생이 구글 로그인을 완료하면 추가할 수 있습니다.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="bg-blue-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              + 첫 번째 학생 추가하기
            </button>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-4 text-center">
          AI 피드백은 보조용이며, 최종 판단은 교사가 합니다.
        </p>
      </div>
    </div>
  )
}

