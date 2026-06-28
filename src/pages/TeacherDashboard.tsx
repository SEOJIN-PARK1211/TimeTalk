import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { collection, onSnapshot, query, where, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { GoogleGenerativeAI } from '@google/generative-ai'

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
  warnings: number
}

interface RegisteredUser {
  uid: string
  name: string
  email: string
}

interface Figure {
  id: string
  name: string
  era: string
  description: string
  prompt: string
  suggestedQuestions: string[]
}

const STATUS_FILTERS = ['전체', '인터뷰 중', '초안 생성 완료', '수정 중', '제출 완료', '재수정 요청', '진행 전']

export default function TeacherDashboard() {
  const { user, logout, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState<'students' | 'figures'>('students')
  
  const [students, setStudents] = useState<Student[]>([])
  const [filter, setFilter] = useState('전체')
  
  // 학생 모달 상태
  const [showAddModal, setShowAddModal] = useState(false)
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredUser[]>([])
  const [loadingRegistered, setLoadingRegistered] = useState(false)

  // 인물 상태
  const [figures, setFigures] = useState<Figure[]>([])
  const [showAddFigureModal, setShowAddFigureModal] = useState(false)
  const [newFigure, setNewFigure] = useState({ name: '', era: '', description: '', prompt: '', suggestedQuestions: '' })
  const [editFigureId, setEditFigureId] = useState<string | null>(null)

  const [dbLoading, setDbLoading] = useState(true)

  // 상세 모니터링 모달 상태
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  // 로그인 안 되어 있으면 로그인 페이지로
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { replace: true })
    }
  }, [user, authLoading, navigate])

  // Firestore에서 학생 실시간 구독
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
          warnings: data.warnings || 0,
        }
      })
      setStudents(list)
      setDbLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Firestore에서 인물(figures) 실시간 구독
  useEffect(() => {
    const q = query(collection(db, 'figures'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Figure[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          name: data.name || '',
          era: data.era || '',
          description: data.description || '',
          prompt: data.prompt || '',
          suggestedQuestions: data.suggestedQuestions || [],
        }
      })
      setFigures(list)
    })

    return () => unsubscribe()
  }, [])

  // 등록된 전체 학생 목록 불러오기
  const loadRegisteredStudents = async () => {
    setLoadingRegistered(true)
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'))
      const querySnapshot = await getDocs(q)
      const users: RegisteredUser[] = []
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data()
        if (!students.find(s => s.id === docSnap.id)) {
          users.push({
            uid: docSnap.id,
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
        warnings: 0,
        createdAt: new Date(),
      })
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

  const handleAddFigure = async () => {
    if (!newFigure.name || !newFigure.prompt) {
      alert('인물 이름과 프롬프트를 입력해주세요.')
      return
    }
    try {
      if (editFigureId) {
        const docRef = doc(db, 'figures', editFigureId)
        await setDoc(docRef, {
          name: newFigure.name,
          era: newFigure.era,
          description: newFigure.description,
          prompt: newFigure.prompt,
          suggestedQuestions: newFigure.suggestedQuestions.split(',').map(q => q.trim()).filter(Boolean),
          updatedAt: new Date(),
        }, { merge: true })
      } else {
        const newDocRef = doc(collection(db, 'figures'))
        await setDoc(newDocRef, {
          name: newFigure.name,
          era: newFigure.era,
          description: newFigure.description,
          prompt: newFigure.prompt,
          suggestedQuestions: newFigure.suggestedQuestions.split(',').map(q => q.trim()).filter(Boolean),
          createdAt: new Date(),
        })
      }
      setShowAddFigureModal(false)
      setNewFigure({ name: '', era: '', description: '', prompt: '', suggestedQuestions: '' })
      setEditFigureId(null)
    } catch (error) {
      console.error('인물 저장 실패:', error)
      alert('인물 저장에 실패했습니다.')
    }
  }

  const handleEditFigure = (figure: Figure) => {
    setEditFigureId(figure.id)
    setNewFigure({
      name: figure.name,
      era: figure.era,
      description: figure.description,
      prompt: figure.prompt,
      suggestedQuestions: figure.suggestedQuestions.join(', ')
    })
    setShowAddFigureModal(true)
  }

  const removeFigure = async (id: string) => {
    if (confirm('이 인물을 삭제하시겠습니까?')) {
      await deleteDoc(doc(db, 'figures', id))
    }
  }

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await logout()
      navigate('/')
    }
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
            <h1 className="text-xl font-bold text-slate-800">📊 교사 대시보드</h1>
            <p className="text-sm text-slate-500">학생들의 학습 현황과 AI 인물 설정을 관리합니다.</p>
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
              onClick={() => navigate('/student/select-figure')}
              className="text-sm bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              학생 화면 미리보기
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-600 font-medium transition-colors ml-2"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {/* 탭 네비게이션 */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'students' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            학생 관리
          </button>
          <button
            onClick={() => setActiveTab('figures')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'figures' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            AI 인물 관리
          </button>
        </div>

        {activeTab === 'students' ? (
          <>
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

            {/* 학생 테이블 */}
            {students.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">학생 이름</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">현재 상태</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">질문 수</th>
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">경고 횟수</th>
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
                        <td className="px-5 py-3.5 font-semibold text-sm text-slate-800">
                          <button onClick={() => setSelectedStudent(student)} className="hover:text-blue-600 hover:underline transition-colors flex items-center gap-1">
                            {student.name}
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </button>
                        </td>
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
                          {student.warnings > 0
                            ? <span className="text-red-600 font-bold text-sm bg-red-50 px-2 py-0.5 rounded-md border border-red-200">{student.warnings}회</span>
                            : <span className="text-slate-300">—</span>}
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
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
                <div className="text-5xl mb-4">👨‍🎓</div>
                <h2 className="text-lg font-bold text-slate-700 mb-2">등록된 학생이 없습니다</h2>
                <p className="text-sm text-slate-500 mb-6">
                  '학생 추가' 버튼을 눌러 앱에 가입한 학생을 대시보드에 추가해 주세요.
                </p>
                <button
                  onClick={handleOpenAddModal}
                  className="bg-blue-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  + 첫 번째 학생 추가하기
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* 인물 관리 탭 */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">역사적 인물 목록</h2>
                <p className="text-sm text-slate-500">학생들이 선택하여 인터뷰할 수 있는 AI 인물을 관리합니다.</p>
              </div>
              <button
                onClick={() => {
                  setEditFigureId(null)
                  setNewFigure({ name: '', era: '', description: '', prompt: '', suggestedQuestions: '' })
                  setShowAddFigureModal(true)
                }}
                className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
              >
                + 새 인물 등록
              </button>
            </div>

            {figures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {figures.map(figure => (
                  <div key={figure.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md mb-1 inline-block border border-indigo-100">
                          {figure.era}
                        </span>
                        <h3 className="font-bold text-lg text-slate-800">{figure.name}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditFigure(figure)}
                          className="text-xs text-slate-400 hover:text-blue-500 transition-colors"
                          title="수정"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          onClick={() => removeFigure(figure.id)}
                          className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                          title="삭제"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{figure.description}</p>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                      <p className="text-xs font-semibold text-slate-500 mb-1">프롬프트 (역할):</p>
                      <p className="text-xs text-slate-700 line-clamp-2">{figure.prompt}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 mb-1">추천 질문:</p>
                      <ul className="list-disc pl-4 text-xs text-slate-700">
                        {figure.suggestedQuestions.map((q, i) => (
                          <li key={i} className="truncate">{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
                <div className="text-5xl mb-4">👑</div>
                <h2 className="text-lg font-bold text-slate-700 mb-2">등록된 인물이 없습니다</h2>
                <p className="text-sm text-slate-500 mb-6">
                  수업에 활용할 역사적 인물을 등록해 주세요.
                </p>
                <button
                  onClick={() => {
                    setEditFigureId(null)
                    setNewFigure({ name: '', era: '', description: '', prompt: '', suggestedQuestions: '' })
                    setShowAddFigureModal(true)
                  }}
                  className="bg-indigo-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  + 새 인물 등록하기
                </button>
              </div>
            )}
          </>
        )}
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
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl mb-4 bg-slate-50">
              {loadingRegistered ? (
                <div className="p-8 text-center text-slate-400 text-sm">불러오는 중...</div>
              ) : registeredStudents.length > 0 ? (
                <ul className="divide-y divide-slate-200">
                  {registeredStudents.map(student => (
                    <li key={student.uid} className="flex items-center justify-between p-4 bg-white">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </div>
                      <button
                        onClick={() => handleAddStudent(student)}
                        className="px-3 py-1.5 bg-slate-100 text-blue-600 text-xs font-bold rounded-lg border border-slate-200"
                      >
                        추가
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm">추가할 수 있는 학생이 없습니다.</div>
              )}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setShowAddModal(false)} className="bg-slate-800 text-white text-sm font-bold py-2.5 px-6 rounded-xl">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 인물 추가 모달 */}
      {showAddFigureModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-slate-800">
                {editFigureId ? 'AI 인물 수정' : '새 AI 인물 등록'}
              </h2>
              <button onClick={() => setShowAddFigureModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">인물 이름</label>
                <input
                  type="text"
                  value={newFigure.name}
                  onChange={e => setNewFigure({ ...newFigure, name: e.target.value })}
                  placeholder="예) 세종대왕, 이순신 장군"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">시대/분류</label>
                <input
                  type="text"
                  value={newFigure.era}
                  onChange={e => setNewFigure({ ...newFigure, era: e.target.value })}
                  placeholder="예) 조선, 고려, 현대"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">짧은 설명 (학생들에게 보여짐)</label>
                <input
                  type="text"
                  value={newFigure.description}
                  onChange={e => setNewFigure({ ...newFigure, description: e.target.value })}
                  placeholder="예) 조선의 4대 왕이자 훈민정음을 창제하신 분입니다."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">시스템 프롬프트 (AI 역할 부여)</label>
                <textarea
                  value={newFigure.prompt}
                  onChange={e => setNewFigure({ ...newFigure, prompt: e.target.value })}
                  placeholder="너는 세종대왕이야. 초등학생 수준에 맞춰서 사극 톤으로 친절하게 대답해줘. 역사적 사실에 기반해서 3~4문장으로 짧게 답해."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-32 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">추천 질문 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={newFigure.suggestedQuestions}
                  onChange={e => setNewFigure({ ...newFigure, suggestedQuestions: e.target.value })}
                  placeholder="예) 한글은 어떻게 만드셨나요?, 백성들을 위해 어떤 일을 하셨나요?"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowAddFigureModal(false)}
                className="bg-slate-100 text-slate-600 text-sm font-bold py-2.5 px-4 rounded-xl hover:bg-slate-200"
              >
                취소
              </button>
              <button
                onClick={handleAddFigure}
                className="bg-indigo-600 text-white text-sm font-bold py-2.5 px-6 rounded-xl hover:bg-indigo-700"
              >
                {editFigureId ? '수정하기' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 학생 상세 모니터링 & 피드백 모달 */}
      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent} 
          figures={figures}
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  )
}

function StudentDetailModal({ student, figures, onClose }: { student: Student, figures: Figure[], onClose: () => void }) {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'chat' | 'report'>('chat')
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null)

  const [aiFeedbackDraft, setAiFeedbackDraft] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [requestRevision, setRequestRevision] = useState(false)
  const [feedbackSending, setFeedbackSending] = useState(false)

  useEffect(() => {
    const fetchInterviews = async () => {
      setLoading(true)
      try {
        const q = query(collection(db, 'interviews'), where('userId', '==', student.id))
        const snapshot = await getDocs(q)
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        // 최신순 정렬
        list.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        setInterviews(list)
        if (list.length > 0) {
          setSelectedInterviewId(list[0].id)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchInterviews()
  }, [student.id])

  const selectedInterview = interviews.find(i => i.id === selectedInterviewId)
  const figure = figures.find(f => f.id === selectedInterview?.figureId)

  const handleGenerateFeedback = async () => {
    if (!selectedInterview?.report) return
    setIsGenerating(true)
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) {
        alert('API 키가 설정되지 않았습니다.')
        return
      }
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      
      const r = selectedInterview.report
      const reportContent = `
        [인물소개]: ${r.resolvedIntro || r.draftIntro}
        [정치]: ${r.resolvedPolitics || r.draftPolitics}
        [경제]: ${r.resolvedEconomy || r.draftEconomy}
        [문화]: ${r.resolvedCulture || r.draftCulture}
        [인상깊은 점]: ${r.memorable}
        [느낀점]: ${r.reflection}
      `

      const prompt = `
        다음은 초등학생이 역사적 인물과 대화한 뒤 작성한 보고서 내용입니다. 
        교사의 입장에서 학생에게 따뜻하고 격려하는 피드백 초안을 작성해주세요. 
        보고서 내용 중 잘한 점을 칭찬하고, 보완할 점이 있다면 부드럽게 제시해주세요. 
        학생에게 직접 말하듯 "~~했어요. ~~이 돋보이네요." 같은 친절한 높임말투를 사용하세요. 
        분량은 3~5문장 정도로 간결하게 작성하세요.

        보고서 내용:
        ${reportContent}
      `

      const result = await model.generateContent(prompt)
      setAiFeedbackDraft(result.response.text().trim())
    } catch (error) {
      console.error('피드백 생성 오류:', error)
      alert('피드백 생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendFeedback = async () => {
    if (!selectedInterviewId) return
    setFeedbackSending(true)
    try {
      // 인터뷰 문서에 피드백 저장 및 상태 변경
      const interviewRef = doc(db, 'interviews', selectedInterviewId)
      const updateData: any = {
        feedback: {
          text: aiFeedbackDraft,
          status: 'sent',
          revisionRequested: requestRevision,
          sentAt: new Date().toISOString()
        }
      }
      if (requestRevision) {
        updateData.status = 'revision_requested'
      }

      await setDoc(interviewRef, updateData, { merge: true })

      // 학생 문서 상태 업데이트 (재수정 요청 시)
      if (requestRevision) {
        const studentRef = doc(db, 'students', student.id)
        await setDoc(studentRef, {
          status: '재수정 요청',
          submitted: false
        }, { merge: true })
      }

      alert('피드백이 전송되었습니다.')
      
      // 로컬 상태 업데이트
      setInterviews(prev => prev.map(i => {
        if (i.id === selectedInterviewId) {
          return {
            ...i,
            feedback: { text: aiFeedbackDraft, status: 'sent', revisionRequested: requestRevision, sentAt: new Date().toISOString() }
          }
        }
        return i
      }))

    } catch (e) {
      console.error(e)
      alert('전송에 실패했습니다.')
    } finally {
      setFeedbackSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              <span className="text-blue-600">{student.name}</span> 학생 모니터링
            </h2>
            <p className="text-sm text-slate-500 mt-1">대화 기록 및 보고서 열람, 피드백 전송</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* 사이드바: 인터뷰 목록 */}
          <div className="w-64 border-r border-slate-200 bg-slate-50 overflow-y-auto flex-shrink-0">
            <div className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider">진행한 인터뷰</div>
            {loading ? (
              <div className="px-4 py-2 text-sm text-slate-400">로딩 중...</div>
            ) : interviews.length === 0 ? (
              <div className="px-4 py-2 text-sm text-slate-400">기록이 없습니다.</div>
            ) : (
              <div className="space-y-1 px-2">
                {interviews.map(inv => {
                  const f = figures.find(fig => fig.id === inv.figureId)
                  const isSelected = selectedInterviewId === inv.id
                  return (
                    <button
                      key={inv.id}
                      onClick={() => { setSelectedInterviewId(inv.id); setAiFeedbackDraft(''); setRequestRevision(false); }}
                      className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors ${
                        isSelected ? 'bg-blue-100 text-blue-700 font-bold border border-blue-200' : 'text-slate-600 hover:bg-slate-200/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>👑 {f?.name || '알 수 없음'}</span>
                        {inv.status === 'submitted' && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">제출됨</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 메인 영역 */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            {selectedInterview ? (
              <>
                {/* 탭 */}
                <div className="flex border-b border-slate-200 bg-white px-6 pt-2 flex-shrink-0">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'chat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                  >
                    💬 대화 기록
                  </button>
                  <button
                    onClick={() => setActiveTab('report')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'report' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                  >
                    📝 보고서 및 피드백
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 relative">
                  {activeTab === 'chat' ? (
                    <div className="max-w-2xl mx-auto space-y-4">
                      {selectedInterview.messages?.map((msg: any, i: number) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold mr-2 mt-1">👑</div>}
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-md shadow-sm' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-20">
                      {/* 보고서 내용 표시 */}
                      {selectedInterview.report ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-bold text-slate-800">최종 보고서</h3>
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">제출 완료</span>
                          </div>
                          
                          <div className="bg-slate-50 p-5 rounded-xl space-y-4 border border-slate-100">
                            <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2"><span className="text-lg">🤖</span> AI 초안 기반 완성본</h4>
                            <div>
                              <p className="text-xs font-bold text-slate-500 mb-1">인물 소개</p>
                              <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">{selectedInterview.report.resolvedIntro || selectedInterview.report.draftIntro}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-500 mb-1">정치</p>
                              <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">{selectedInterview.report.resolvedPolitics || selectedInterview.report.draftPolitics}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-500 mb-1">경제</p>
                              <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">{selectedInterview.report.resolvedEconomy || selectedInterview.report.draftEconomy}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-500 mb-1">문화</p>
                              <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">{selectedInterview.report.resolvedCulture || selectedInterview.report.draftCulture}</p>
                            </div>
                          </div>

                          <div className="bg-amber-50/50 p-5 rounded-xl space-y-4 border border-amber-100">
                            <h4 className="font-bold text-amber-800 text-sm flex items-center gap-2"><span className="text-lg">✍️</span> 학생 직접 작성란</h4>
                            <div>
                              <p className="text-xs font-bold text-amber-700/70 mb-1">인상 깊었던 대화</p>
                              <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-amber-200 whitespace-pre-wrap">{selectedInterview.report.memorable}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-amber-700/70 mb-1">느낀점 및 해석</p>
                              <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-amber-200 whitespace-pre-wrap">{selectedInterview.report.reflection}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-10 bg-white rounded-xl border border-dashed border-slate-300">
                          <p className="text-slate-500 font-medium">아직 보고서를 작성하지 않았습니다.</p>
                        </div>
                      )}

                      {/* 피드백 작성 영역 */}
                      {selectedInterview.report && (
                        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-md border-t-4 border-t-blue-500">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                              <span>👨‍🏫</span> 교사 피드백
                            </h3>
                            {selectedInterview.feedback?.status === 'sent' && (
                              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">이미 전송됨</span>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-end">
                              <p className="text-sm text-slate-500">학생에게 전달할 피드백 내용을 작성해주세요.</p>
                              <button
                                onClick={handleGenerateFeedback}
                                disabled={isGenerating}
                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                              >
                                {isGenerating ? <span className="animate-pulse">초안 생성 중...</span> : <>✨ AI 피드백 초안 생성</>}
                              </button>
                            </div>
                            
                            <textarea
                              value={aiFeedbackDraft || selectedInterview.feedback?.text || ''}
                              onChange={e => setAiFeedbackDraft(e.target.value)}
                              placeholder="칭찬할 점이나 보완할 점을 자유롭게 적어주세요."
                              className="w-full h-32 border border-slate-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-slate-50"
                            />

                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={requestRevision || selectedInterview.feedback?.revisionRequested}
                                  onChange={e => setRequestRevision(e.target.checked)}
                                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                                />
                                <div>
                                  <span className="text-sm font-bold text-slate-800">이 피드백과 함께 수정(재제출)을 요청합니다.</span>
                                  <p className="text-xs text-slate-500 mt-0.5">체크 시, 학생의 제출 상태가 '재수정 요청'으로 변경되며<br />보고서를 다시 수정할 수 있게 됩니다.</p>
                                </div>
                              </label>
                              <button
                                onClick={handleSendFeedback}
                                disabled={feedbackSending || (!aiFeedbackDraft && !selectedInterview.feedback?.text)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md transition-colors disabled:bg-slate-300"
                              >
                                {feedbackSending ? '전송 중...' : <>피드백<br />전송하기</>}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                좌측에서 인터뷰를 선택해주세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
