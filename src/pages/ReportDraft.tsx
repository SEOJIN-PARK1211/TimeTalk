import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { doc, getDoc, setDoc, increment } from 'firebase/firestore'
import { db } from '../firebase'
import { GoogleGenerativeAI } from '@google/generative-ai'

// 금칙어 정규표현식 (욕설, 비하, 음란, 개인정보 패턴 등)
const BAD_WORDS_REGEX = /(바보|멍청이|개새끼|씨발|존나|병신|엿|엿먹어라|뒤져라|주민번호|전화번호|섹스|야동|\d{6}-\d{7}|\d{3}-\d{4}-\d{4})/i

const QuizText = ({ text, onComplete }: { text: string, onComplete: (isComplete: boolean, resolvedText: string) => void }) => {
  const [answers, setAnswers] = useState<string[]>([])

  const parts = text.split(/\[(.*?)\]/g)
  const expectedAnswers = parts.filter((_, i) => i % 2 === 1)

  useEffect(() => {
    if (expectedAnswers.length === 0) {
      onComplete(true, text)
      return
    }
    const allCorrect = expectedAnswers.every((expected, i) => {
      const userAns = (answers[i] || '').replace(/\s/g, '')
      const expAns = expected.replace(/\s/g, '')
      return userAns === expAns
    })

    const resolvedText = parts.map((part, i) => {
      if (i % 2 === 1) return answers[Math.floor(i / 2)] || ''
      return part
    }).join('')

    onComplete(allCorrect, resolvedText)
  }, [answers, text])

  const handleInputChange = (idx: number, val: string) => {
    const newAnswers = [...answers]
    newAnswers[idx] = val
    setAnswers(newAnswers)
  }

  if (expectedAnswers.length === 0) {
    return <div className="text-sm text-slate-600 leading-relaxed p-2 whitespace-pre-wrap">{text}</div>
  }

  let answerIdx = 0
  return (
    <div className="text-sm text-slate-600 leading-loose p-2 whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          const currentIdx = answerIdx++
          const expected = part.replace(/\s/g, '')
          const userVal = (answers[currentIdx] || '').replace(/\s/g, '')
          const isCorrect = expected === userVal
          return (
            <input
              key={i}
              type="text"
              className={`border-b-2 outline-none px-2 py-0.5 mx-1 text-center font-bold w-24 transition-colors ${isCorrect ? 'border-green-500 text-green-600 bg-green-50' : 'border-slate-300 text-blue-600 bg-blue-50 focus:border-blue-500'}`}
              value={answers[currentIdx] || ''}
              onChange={(e) => handleInputChange(currentIdx, e.target.value)}
              readOnly={isCorrect}
              placeholder="정답"
            />
          )
        }
        return <span key={i}>{part}</span>
      })}
    </div>
  )
}

export default function ReportDraft() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [searchParams] = useSearchParams()
  const figureId = searchParams.get('figureId')

  const [loading, setLoading] = useState(true)
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false)
  const [draftIntro, setDraftIntro] = useState('')
  const [draftPolitics, setDraftPolitics] = useState('')
  const [draftEconomy, setDraftEconomy] = useState('')
  const [draftCulture, setDraftCulture] = useState('')
  const [memorable, setMemorable] = useState('')
  const [reflection, setReflection] = useState('')
  const [quizStatus, setQuizStatus] = useState({ intro: false, politics: false, economy: false, culture: false })
  const [resolvedTexts, setResolvedTexts] = useState({ intro: '', politics: '', economy: '', culture: '' })
  const [status, setStatus] = useState<'drafting' | 'submitted' | 'revision_requested'>('drafting')
  const [draftGenerated, setDraftGenerated] = useState(false)
  const [hasRegenerated, setHasRegenerated] = useState(false)
  const [originalDrafts, setOriginalDrafts] = useState({ intro: '', politics: '', economy: '', culture: '' })
  const [showPreview, setShowPreview] = useState(false)
  const [showSubmittedView, setShowSubmittedView] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await logout()
      navigate('/')
    }
  }

  useEffect(() => {
    if (!user || !figureId || figureId === 'null') {
      if (!figureId || figureId === 'null') alert('비정상적인 접근입니다.')
      navigate('/student/select-figure', { replace: true })
      return
    }

    const loadReport = async () => {
      try {
        const interviewRef = doc(db, 'interviews', `${user.uid}_${figureId}`)
        const interviewDoc = await getDoc(interviewRef)

        if (interviewDoc.exists()) {
          const data = interviewDoc.data()
          if (data.status) {
            setStatus(data.status as 'drafting' | 'submitted' | 'revision_requested')
          }
          if (data.feedback && data.feedback.text) {
            setFeedbackText(data.feedback.text)
          }

          if (data.report && data.report.draftGenerated) {
            // 이미 생성된 초안이 있는 경우
            setDraftGenerated(true)
            setDraftIntro(data.report.draftIntro || '')
            setDraftPolitics(data.report.draftPolitics || '')
            setDraftEconomy(data.report.draftEconomy || '')
            setDraftCulture(data.report.draftCulture || '')
            setMemorable(data.report.memorable || '')
            setReflection(data.report.reflection || '')
            setHasRegenerated(data.report.hasRegenerated || false)
            setResolvedTexts({
              intro: data.report.resolvedIntro || '',
              politics: data.report.resolvedPolitics || '',
              economy: data.report.resolvedEconomy || '',
              culture: data.report.resolvedCulture || ''
            })
            setOriginalDrafts({
              intro: data.report.originalIntro || '',
              politics: data.report.originalPolitics || '',
              economy: data.report.originalEconomy || '',
              culture: data.report.originalCulture || ''
            })
          } else {
            // 초안이 없으면 AI 요약 생성 시작
            await generateDraftFromMessages(data.messages || [], data.figureId)
          }
        }
      } catch (error) {
        console.error('보고서 로딩 오류:', error)
      } finally {
        setLoading(false)
      }
    }
    loadReport()
  }, [user, figureId, navigate])

  const generateDraftFromMessages = async (messages: any[], figId: string, isRegenerate: boolean = false) => {
    // 메시지가 너무 적거나 없으면 기본 메시지로 대체 (방어 코드)
    const chatText = messages.map(m => `${m.role === 'ai' ? '역사적인물' : '학생'}: ${m.text}`).join('\n')

    setIsGeneratingDraft(true)
    try {
      // 1. 인물 이름 가져오기
      const figureDoc = await getDoc(doc(db, 'figures', figId))
      const figureName = figureDoc.exists() ? figureDoc.data().name : '이 인물'

      const apiKey = import.meta.env.VITE_GEMINI_DRAFT_API_KEY || import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey) {
        alert('API 키가 설정되지 않아 초안을 생성할 수 없습니다.')
        setIsGeneratingDraft(false)
        return
      }

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: `너는 학생이 역사적 인물과 나눈 대화를 분석해서 보고서 초안을 작성해주는 AI야. 
학생의 대화 내역을 읽고, ${figureName}의 생애와 업적을 초등학교 5학년 수준으로 아주 쉽고 간결하게(항목당 2~3문장) 요약해줘.
반드시 학생과 인물이 나눈 대화 내용만을 기반으로 작성하고, 대화에 없는 무관한 내용은 절대 추가하지 마.
각 항목(소개, 정치, 경제, 문화)마다 가장 중요한 핵심 단어 2개를 골라 대괄호 [ ]로 감싸서 빈칸 퀴즈를 만들어. (예: 세종대왕은 백성을 위해 [훈민정음]을 만드셨습니다.)
반드시 아래 4가지 항목으로 나누어 JSON 형식으로 반환해.
{
  "intro": "인물에 대한 기본 소개",
  "politics": "정치적 업적이나 생활 모습",
  "economy": "경제적 업적이나 생활 모습",
  "culture": "문화적 업적이나 생활 모습"
}`
      })

      const prompt = `대화 내역:\n${chatText}\n\n위 대화 내역을 바탕으로 JSON 형식의 요약 초안을 작성해줘.`
      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      // JSON 파싱 (마크다운 코드블록 제거)
      const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
      const draftData = JSON.parse(jsonStr)

      // 상태 업데이트
      setDraftIntro(draftData.intro || '')
      setDraftPolitics(draftData.politics || '')
      setDraftEconomy(draftData.economy || '')
      setDraftCulture(draftData.culture || '')
      setOriginalDrafts(draftData)
      setDraftGenerated(true)
      if (isRegenerate) setHasRegenerated(true)

      // DB에 초기 초안 저장
      if (user && figureId) {
        const interviewRef = doc(db, 'interviews', `${user.uid}_${figureId}`)
        await setDoc(interviewRef, {
          report: {
            draftIntro: draftData.intro || '',
            draftPolitics: draftData.politics || '',
            draftEconomy: draftData.economy || '',
            draftCulture: draftData.culture || '',
            originalIntro: draftData.intro || '',
            originalPolitics: draftData.politics || '',
            originalEconomy: draftData.economy || '',
            originalCulture: draftData.culture || '',
            memorable: isRegenerate ? memorable : '',
            reflection: isRegenerate ? reflection : '',
            draftGenerated: true,
            hasRegenerated: isRegenerate
          }
        }, { merge: true })
      }
    } catch (e) {
      console.error('초안 생성 오류:', e)
      alert('초안을 생성하는 중 오류가 발생했습니다.')
    } finally {
      setIsGeneratingDraft(false)
    }
  }

  const handleRegenerateDraft = async () => {
    if (hasRegenerated) {
      alert('초안 다시 쓰기는 1회만 가능합니다.')
      return
    }
    if (!window.confirm('기존에 수정했던 내용이 모두 사라지고 AI가 초안을 새로 씁니다. 계속하시겠습니까?')) return

    try {
      const interviewRef = doc(db, 'interviews', `${user?.uid}_${figureId}`)
      const interviewDoc = await getDoc(interviewRef)
      if (interviewDoc.exists()) {
        const data = interviewDoc.data()
        await generateDraftFromMessages(data.messages || [], data.figureId, true)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const saveReport = async (submit: boolean = false) => {
    if (!user || !figureId) return
    try {
      const interviewRef = doc(db, 'interviews', `${user.uid}_${figureId}`)
      await setDoc(interviewRef, {
        status: submit ? 'submitted' : status,
        report: {
          draftIntro,
          draftPolitics,
          draftEconomy,
          draftCulture,
          memorable,
          reflection,
          originalIntro: originalDrafts.intro,
          originalPolitics: originalDrafts.politics,
          originalEconomy: originalDrafts.economy,
          originalCulture: originalDrafts.culture,
          resolvedIntro: resolvedTexts.intro,
          resolvedPolitics: resolvedTexts.politics,
          resolvedEconomy: resolvedTexts.economy,
          resolvedCulture: resolvedTexts.culture,
          draftGenerated: true,
          hasRegenerated
        },
        updatedAt: new Date().toISOString()
      }, { merge: true })

      // 상태 업데이트 로직 간소화
      if (submit) {
        setStatus('submitted')
        if (user && user.role !== 'teacher') {
          await setDoc(doc(db, 'students', user.uid), { 
            status: '제출 완료', 
            submitted: true,
            lastActivity: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
          }, { merge: true })
        }
      } else {
        if (user && user.role !== 'teacher') {
          await setDoc(doc(db, 'students', user.uid), { 
            status: '수정 중',
            lastActivity: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
          }, { merge: true })
        }
      }
    } catch (error) {
      console.error('보고서 저장 실패:', error)
    }
  }

  const handleSubmit = async () => {
    // 1. 금칙어 클라이언트 필터링
    const allContent = [draftIntro, draftPolitics, draftEconomy, draftCulture, memorable, reflection].join(' ')
    if (BAD_WORDS_REGEX.test(allContent)) {
      alert('⚠️ 보고서 내용에 부적절한 단어나 개인정보가 포함되어 있어 제출할 수 없습니다.')
      try {
        if (user && user.role !== 'teacher') {
          const studentRef = doc(db, 'students', user.uid)
          await setDoc(studentRef, { warnings: increment(1) }, { merge: true })
        }
      } catch (e) {
        console.error('경고 증가 실패:', e)
      }
      return
    }

    // 미리보기 창 띄우기
    setShowPreview(true)
  }

  // 최소 한 문장 (8자 이상, 마침표나 종결어미 포함) 검사 함수
  const isAtLeastOneSentence = (text: string) => {
    const t = text.trim()
    return t.length >= 8 && /[다요음함.!~?]/.test(t)
  }

  const allQuizzesComplete = quizStatus.intro && quizStatus.politics && quizStatus.economy && quizStatus.culture
  const hasMemorableContent = isAtLeastOneSentence(memorable)
  const hasReflectionContent = isAtLeastOneSentence(reflection)
  const canSubmit = allQuizzesComplete && hasMemorableContent && hasReflectionContent

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-slate-400 text-sm animate-pulse">보고서 데이터를 불러오는 중입니다...</div>
      </div>
    )
  }

  if (isGeneratingDraft) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 flex-col px-4 text-center">
        <div className="text-6xl mb-6 animate-bounce">🤖</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">AI가 초안을 작성하고 있습니다...</h2>
        <p className="text-slate-500 text-sm">지금까지 나눈 대화를 바탕으로 보고서를 구성 중입니다. 잠시만 기다려주세요.</p>
      </div>
    )
  }

  // status가 'revision_requested' 이면 다시 수정 가능하므로 모달이나 제출완료 뷰를 띄우지 않음.
  if (status === 'submitted') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
        <div className="bg-white p-10 rounded-2xl shadow-lg border border-slate-200 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">제출 완료된 보고서입니다!</h1>
          <p className="text-slate-500 mb-2 text-sm">성공적으로 제출되어 수정할 수 없습니다.</p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-slate-600 text-left">
            <p className="font-semibold mb-1">📌 안내</p>
            <p>선생님이 보고서를 검토한 후 피드백을 보낼 예정입니다.</p>
          </div>
          <button
            onClick={() => setShowSubmittedView(true)}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-colors mb-2 shadow-md"
          >
            내가 제출한 보고서 읽어보기
          </button>
          <button
            onClick={() => navigate('/student/select-figure')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors mb-2 shadow-sm"
          >
            다른 인물 인터뷰 하러가기
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-slate-500 font-semibold hover:text-slate-700 hover:underline text-sm mt-4"
          >
            처음 화면으로 돌아가기
          </button>
        </div>

        {/* 제출된 보고서 열람 모달 */}
        {showSubmittedView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-slate-200 bg-emerald-600 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>📄</span> 내가 제출한 최종 보고서
                </h2>
                <button onClick={() => setShowSubmittedView(false)} className="text-emerald-200 hover:text-white text-xl">✕</button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-5">
                  <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">AI 초안 기반 완성본</h3>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-1">인물 소개</h4>
                    <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">{resolvedTexts.intro}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-1">정치적 생활 모습</h4>
                    <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">{resolvedTexts.politics}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-1">경제적 생활 모습</h4>
                    <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">{resolvedTexts.economy}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 mb-1">문화적 생활 모습</h4>
                    <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">{resolvedTexts.culture}</p>
                  </div>
                </div>

                <div className="bg-amber-50 p-5 rounded-xl border border-amber-100 space-y-5">
                  <h3 className="font-bold text-amber-800 border-b border-amber-200 pb-2">나의 생각</h3>
                  <div>
                    <h4 className="text-xs font-bold text-amber-700/70 mb-1">인상 깊었던 대화 내용</h4>
                    <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-amber-200 whitespace-pre-wrap">{memorable}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-700/70 mb-1">느낀점 및 해석</h4>
                    <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-amber-200 whitespace-pre-wrap">{reflection}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => setShowSubmittedView(false)}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 py-6 sm:py-8 px-4">
      <div className="max-w-5xl mx-auto pb-10">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">보고서 작성</h1>
            <p className="text-sm text-slate-500">초안을 수정하고 나의 생각을 추가해보세요.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* 단계 표시 */}
            <div className="hidden sm:flex items-center gap-1 text-xs whitespace-nowrap">
              <button
                onClick={() => {
                  saveReport(false);
                  navigate(`/student/interview?figureId=${figureId}`);
                }}
                className="text-slate-400 px-2 py-0.5 hover:text-blue-600"
              >
                1 인터뷰 ✓
              </button>
              <span className="text-slate-300">→</span>
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">2 수정·보완</span>
              <span className="text-slate-300">→</span>
              <span className="text-slate-400 px-2 py-0.5">3 제출</span>
            </div>


            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="text-xs bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm shrink-0"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 안내 박스 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-blue-600 text-lg mt-0.5">ℹ️</span>
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-1">AI가 정리한 초안입니다</p>
            <p className="leading-relaxed">
              아래 내용은 AI가 대화 내역을 바탕으로 작성한 초안입니다.
              <strong> 본문 중간중간에 뚫린 빈칸(퀴즈)의 정답을 모두 맞히고, '직접 작성' 영역을 모두 채워야</strong> 제출할 수 있습니다.
              {status === 'revision_requested' && <span className="text-red-600 font-bold ml-1">선생님의 수정 요청에 따라 보고서를 보완해 주세요!</span>}
              <br />정답이 기억나지 않으면 아래의 '이전 대화 기록 다시 보기' 버튼을 이용하세요!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 왼쪽: AI 초안 영역 */}
          <div className="lg:col-span-3 space-y-4">
            {status === 'revision_requested' && feedbackText && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">👩‍🏫</span>
                  <div>
                    <h3 className="font-bold text-red-800 mb-1 text-sm">선생님의 피드백</h3>
                    <p className="text-sm text-red-700 whitespace-pre-wrap leading-relaxed">{feedbackText}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                <span className="font-bold text-slate-700 text-sm">🤖 AI 초안 (수정 가능)</span>
                <div className="flex items-center gap-2">
                  {!hasRegenerated && status !== 'submitted' && (
                    <button
                      onClick={handleRegenerateDraft}
                      className="text-xs bg-white text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 font-semibold transition-colors"
                    >
                      🔄 다시 쓰기 (1회)
                    </button>
                  )}
                </div>
              </div>

              {/* 인물 소개 */}
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm mb-2">📝 인물 소개</h3>
                <QuizText text={draftIntro} onComplete={(c, t) => { setQuizStatus(p => ({ ...p, intro: c })); setResolvedTexts(p => ({ ...p, intro: t })) }} />
              </div>

              {/* 정치 */}
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm mb-2">🏛️ 당시 생활 모습 — 정치</h3>
                <QuizText text={draftPolitics} onComplete={(c, t) => { setQuizStatus(p => ({ ...p, politics: c })); setResolvedTexts(p => ({ ...p, politics: t })) }} />
              </div>

              {/* 경제 */}
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm mb-2">💰 당시 생활 모습 — 경제</h3>
                <QuizText text={draftEconomy} onComplete={(c, t) => { setQuizStatus(p => ({ ...p, economy: c })); setResolvedTexts(p => ({ ...p, economy: t })) }} />
              </div>

              {/* 문화 */}
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm mb-2">🎨 당시 생활 모습 — 문화</h3>
                <QuizText text={draftCulture} onComplete={(c, t) => { setQuizStatus(p => ({ ...p, culture: c })); setResolvedTexts(p => ({ ...p, culture: t })) }} />
              </div>

              {/* 대화 기록 보기 버튼 */}
              <div className="bg-slate-50 px-5 py-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    saveReport(false);
                    navigate(`/student/interview?figureId=${figureId}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm"
                >
                  <span className="text-lg">💡</span> 정답이 기억 안 나나요? 이전 대화 기록 다시 보기
                </button>
              </div>
            </div>
          </div>

          {/* 오른쪽: 학생 직접 작성 + 제출 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 인상 깊었던 대화 */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
              <div className="bg-amber-100/70 px-5 py-3 border-b border-amber-200">
                <span className="font-bold text-amber-800 text-sm">✍️ 직접 작성 1: 인상 깊었던 대화 내용</span>
              </div>
              <div className="p-5">
                <textarea
                  className="w-full text-sm leading-relaxed bg-transparent focus:outline-none focus:bg-white rounded-lg p-2 resize-none placeholder-amber-400 transition-colors"
                  rows={5}
                  placeholder="인터뷰 내용 중 가장 기억에 남는 부분과 그 이유를 적어주세요."
                  value={memorable}
                  onChange={(e) => setMemorable(e.target.value)}
                  onBlur={() => saveReport(false)}
                />
              </div>
            </div>

            {/* 느낀점 */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
              <div className="bg-amber-100/70 px-5 py-3 border-b border-amber-200">
                <span className="font-bold text-amber-800 text-sm">✍️ 직접 작성 2: 느낀점 또는 나의 해석</span>
              </div>
              <div className="p-5">
                <textarea
                  className="w-full text-sm leading-relaxed bg-transparent focus:outline-none focus:bg-white rounded-lg p-2 resize-none placeholder-amber-400 transition-colors"
                  rows={5}
                  placeholder="이 인물의 삶을 통해 무엇을 느꼈는지 자유롭게 적어주세요."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  onBlur={() => saveReport(false)}
                />
              </div>
            </div>

            {/* 제출 조건 체크리스트 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-700 text-sm mb-3">제출 조건 확인</h3>
              <ul className="space-y-2.5 text-sm">
                <li className={`flex items-center gap-2 ${allQuizzesComplete ? 'text-green-600' : 'text-slate-400'}`}>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold ${allQuizzesComplete ? 'bg-green-100 border-green-500' : 'border-slate-300'}`}>
                    {allQuizzesComplete ? '✓' : ''}
                  </span>
                  AI 초안의 모든 빈칸 퀴즈를 맞혔어요
                </li>
                <li className={`flex items-center gap-2 ${hasMemorableContent ? 'text-green-600' : 'text-slate-400'}`}>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold ${hasMemorableContent ? 'bg-green-100 border-green-500' : 'border-slate-300'}`}>
                    {hasMemorableContent ? '✓' : ''}
                  </span>
                  인상 깊었던 대화 내용을 작성했어요
                </li>
                <li className={`flex items-center gap-2 ${hasReflectionContent ? 'text-green-600' : 'text-slate-400'}`}>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold ${hasReflectionContent ? 'bg-green-100 border-green-500' : 'border-slate-300'}`}>
                    {hasReflectionContent ? '✓' : ''}
                  </span>
                  느낀점 또는 해석을 작성했어요
                </li>
              </ul>
            </div>

            {/* 제출 버튼 */}
            <div>
              {!canSubmit && (
                <p className="text-xs text-red-500 font-medium mb-2 text-center">
                  ⚠️ 모든 빈칸 퀴즈의 정답을 맞히고 직접 작성 항목을 채워야 제출할 수 있습니다.
                </p>
              )}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                최종 제출하기
              </button>
            </div>
          </div>
        </div>
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

      {/* 미리보기 모달 */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">최종 보고서 미리보기</h2>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-blue-800 mb-1">인물 소개</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{resolvedTexts.intro}</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-800 mb-1">정치적 생활 모습</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{resolvedTexts.politics}</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-800 mb-1">경제적 생활 모습</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{resolvedTexts.economy}</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-800 mb-1">문화적 생활 모습</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{resolvedTexts.culture}</p>
                </div>
              </div>

              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-amber-800 mb-1">인상 깊었던 대화 내용</h3>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{memorable}</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-800 mb-1">느낀점 및 해석</h3>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{reflection}</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                뒤로 가기 (수정)
              </button>
              <button
                onClick={() => {
                  setShowPreview(false)
                  saveReport(true)
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
              >
                이대로 최종 제출
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
