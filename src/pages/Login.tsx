import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { loginWithGoogle, user, loading, updateUserName } = useAuth()
  const navigate = useNavigate()
  
  // 새 학생 실명 입력용 상태
  const [showNameModal, setShowNameModal] = useState(false)
  const [realName, setRealName] = useState('')

  // 이미 로그인된 경우 자동 이동
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'student') {
        if (user.isNewUser) {
          setShowNameModal(true)
        } else {
          navigate('/student/ethics', { replace: true })
        }
      } else {
        navigate('/teacher/dashboard', { replace: true })
      }
    }
  }, [user, loading, navigate])

  const handleLogin = async () => {
    setError('')
    setIsLoading(true)
    try {
      await loginWithGoogle(role)
      // 로그인 성공 후 useEffect에서 라우팅 처리됨
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('로그인 팝업이 닫혔습니다. 다시 시도해 주세요.')
      } else {
        setError(err.message || '로그인에 실패했습니다. 다시 시도해 주세요.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleNameSubmit = async () => {
    if (!realName.trim()) return
    setIsLoading(true)
    try {
      await updateUserName(realName.trim())
      setShowNameModal(false)
      navigate('/student/ethics', { replace: true })
    } catch (err: any) {
      setError('이름 저장에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-slate-400 text-sm animate-pulse">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      {/* 실명 입력 모달 */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">학생 이름 설정</h2>
            <p className="text-sm text-slate-500 mb-6">
              선생님이 확인할 수 있도록 <strong className="text-blue-600">실명(정자)</strong>을 입력해 주세요.
            </p>
            <input
              type="text"
              placeholder="예: 홍길동"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-center"
              autoFocus
            />
            <button
              onClick={handleNameSubmit}
              disabled={!realName.trim() || isLoading}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-sm"
            >
              {isLoading ? '저장 중...' : '저장하고 시작하기'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full max-w-md overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-center text-white">
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">TimeTalk</h1>
          <p className="text-blue-100 text-sm">역사 인물과 대화하며 배우는 역사 탐구</p>
        </div>

        <div className="p-8">
          {/* 역할 탭 */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setRole('student')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${role === 'student'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              👩‍🎓 학생
            </button>
            <button
              onClick={() => setRole('teacher')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${role === 'teacher'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              👨‍🏫 교사
            </button>
          </div>

          {/* 역할별 안내 */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-slate-600 leading-relaxed">
              {role === 'student'
                ? '학생은 개인 Google 계정으로 로그인합니다.'
                : '교사는 Google 계정으로 로그인 후 수업을 관리할 수 있습니다.'}
            </p>
            <p className="text-xs text-orange-600 font-semibold mt-2">
              ⚠️ 이 서비스는 실명 기반으로 운영됩니다.
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700 text-center break-keep">
              {error}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="animate-pulse">로그인 중...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                Google로 시작하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
