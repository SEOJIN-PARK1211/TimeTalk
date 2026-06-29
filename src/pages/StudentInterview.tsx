import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { doc, getDoc, setDoc, increment } from 'firebase/firestore'
import { db } from '../firebase'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

// 금칙어 정규표현식 (욕설, 비하, 음란, 개인정보 패턴 등)
const BAD_WORDS_REGEX = /(바보|멍청이|개새끼|씨발|존나|병신|엿|엿먹어라|뒤져라|주민번호|전화번호|섹스|야동|\d{6}-\d{7}|\d{3}-\d{4}-\d{4})/i

interface Message {
  role: 'ai' | 'user'
  text: string
  isOffTopic?: boolean
}

interface Figure {
  id: string
  name: string
  era: string
  description: string
  prompt: string
  suggestedQuestions: string[]
}

const QUESTION_LIMIT = 10

export default function StudentInterview() {
  const [searchParams] = useSearchParams()
  const figureId = searchParams.get('figureId')
  
  const [figure, setFigure] = useState<Figure | null>(null)
  const [loadingFigure, setLoadingFigure] = useState(true)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [questionsUsed, setQuestionsUsed] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [status, setStatus] = useState<'interviewing' | 'drafting' | 'submitted'>('interviewing')
  
  const chatEndRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [chatSession, setChatSession] = useState<any>(null)

  const questionsLeft = QUESTION_LIMIT - questionsUsed

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await logout()
      navigate('/')
    }
  }

  // 인물 정보 및 인터뷰 세션 불러오기
  useEffect(() => {
    if (!figureId || figureId === 'null' || !user) {
      if (!figureId || figureId === 'null') alert('인물이 선택되지 않았습니다.')
      navigate('/student/select-figure', { replace: true })
      return
    }

    const initData = async () => {
      try {
        // 1. 인물 정보 가져오기
        const figureDoc = await getDoc(doc(db, 'figures', figureId))
        if (!figureDoc.exists()) {
          alert('존재하지 않는 인물입니다.')
          navigate('/student/select-figure')
          return
        }
        const figureData = figureDoc.data() as Figure
        setFigure(figureData)

        // 2. 인터뷰 세션 가져오기
        const interviewRef = doc(db, 'interviews', `${user.uid}_${figureId}`)
        const interviewDoc = await getDoc(interviewRef)
        
        let loadedMessages: Message[] = []
        let currentQuestionsUsed = 0
        let currentStatus: 'interviewing' | 'drafting' | 'submitted' = 'interviewing'

        if (interviewDoc.exists()) {
          const data = interviewDoc.data()
          if (data.messages && data.messages.length > 0) {
            loadedMessages = data.messages
          } else {
            loadedMessages = [{ role: 'ai', text: `안녕! 나는 ${figureData.name}이라고 해. 오늘 나에 대해 궁금한 것이 있다면 무엇이든 물어보렴.` }]
          }
          currentQuestionsUsed = data.questionsUsed || 0
          currentStatus = data.status || 'interviewing'
        } else {
          // 첫 접속
          loadedMessages = [{ role: 'ai', text: `안녕! 나는 ${figureData.name}이라고 해. 오늘 나에 대해 궁금한 것이 있다면 무엇이든 물어보렴.` }]
          await setDoc(interviewRef, {
            userId: user.uid,
            figureId,
            messages: loadedMessages,
            questionsUsed: 0,
            status: 'interviewing',
            updatedAt: new Date().toISOString()
          })
        }

        setMessages(loadedMessages)
        setQuestionsUsed(currentQuestionsUsed)
        setStatus(currentStatus)
        
        // 제출된 상태면 추천 질문 숨김 (상태를 따로 관리하지 않고 렌더링 시 조건으로 처리)

        // 3. Gemini 초기화 및 히스토리 복원
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY
        if (apiKey && currentStatus !== 'submitted') {
          const genAI = new GoogleGenerativeAI(apiKey)
          const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: figureData.prompt + '\n초등학생을 대상으로 친절하게 존댓말/반말(사극톤)을 상황에 맞게 사용하고, 절대 인공지능이라고 밝히지 마. 3~4문장으로 짧게 답해. 너는 오직 텍스트로만 답변해야 해. 이미지나 미디어 생성은 불가능해. 만약 역사적 인물 인터뷰라는 대화 주제를 벗어나거나 부적절한 내용을 요구받으면 단호하게 거절하고 인터뷰 주제로 돌아오도록 유도해.',
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
          })
          
          // 기존 대화를 Gemini history 형식으로 변환
          const history = loadedMessages.slice(1).map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text }]
          }))

          const session = model.startChat({ history })
          setChatSession(session)
        } else if (!apiKey) {
          console.warn('VITE_GEMINI_API_KEY가 설정되지 않았습니다.')
        }

      } catch (error) {
        console.error('데이터를 불러오는 중 오류 발생:', error)
      } finally {
        setLoadingFigure(false)
      }
    }

    initData()
  }, [figureId, navigate, user])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // 메시지를 Firestore에 저장하는 유틸 함수
  const saveInterviewSession = async (newMessages: Message[], newQuestionsUsed: number) => {
    if (!user || !figureId) return
    try {
      const interviewRef = doc(db, 'interviews', `${user.uid}_${figureId}`)
      await setDoc(interviewRef, {
        userId: user.uid,
        figureId,
        messages: newMessages,
        questionsUsed: newQuestionsUsed,
        updatedAt: new Date().toISOString()
      }, { merge: true })
    } catch (error) {
      console.error('세션 저장 실패:', error)
    }
  }

  // AI 검열관 함수
  const checkMessageSafety = async (text: string): Promise<boolean> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) return true // API 키가 없으면 패스

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: `너는 초등학생 대상 교육용 앱의 메시지 검열관이야.
사용자의 입력 메시지에 심한 비속어, 타인 비하, 부적절한 표현, 혹은 개인정보(전화번호, 주민번호 등)가 포함되어 있는지 문맥을 파악해.
초성이나 띄어쓰기로 교묘하게 필터링을 피하려는 시도도 찾아내야 해.
문제가 있으면 오직 "BLOCK"이라고만 출력하고, 안전하면 오직 "PASS"라고만 출력해. 다른 설명은 절대 추가하지 마.`,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      })

      const result = await model.generateContent(text)
      const response = result.response.text().trim().toUpperCase()
      
      if (response.includes('BLOCK')) return false
      return true
    } catch (e) {
      console.error('검열 AI 오류:', e)
      // Safety 차단으로 인해 에러가 난 경우도 BLOCK 처리
      return false
    }
  }

  const handleSend = async (text: string) => {
    if (!text.trim() || questionsLeft <= 0 || isTyping || !figure || status === 'submitted') return
    
    setIsTyping(true)

    // 1. 금칙어 클라이언트 1차 필터링 (가장 빠른 차단)
    if (BAD_WORDS_REGEX.test(text)) {
      alert('⚠️ 부적절한 내용이나 개인정보가 포함되어 있어 전송할 수 없습니다.')
      try {
        if (user && user.role !== 'teacher') {
          const studentRef = doc(db, 'students', user.uid)
          await setDoc(studentRef, { warnings: increment(1) }, { merge: true })
        }
      } catch (e) {
        console.error('경고 증가 실패:', e)
      }
      setIsTyping(false)
      return
    }

    // 2. AI 검열관 2차 필터링 (문맥 기반 차단)
    const isSafe = await checkMessageSafety(text)
    if (!isSafe) {
      alert('⚠️ 문맥상 부적절하거나 안전하지 않은 내용이 감지되어 전송이 차단되었습니다.')
      try {
        if (user && user.role !== 'teacher') {
          const studentRef = doc(db, 'students', user.uid)
          await setDoc(studentRef, { warnings: increment(1) }, { merge: true })
        }
      } catch (e) {
        console.error('경고 증가 실패:', e)
      }
      setIsTyping(false)
      return
    }

    // 중복 질문인지 확인
    const isDuplicate = messages.some(msg => msg.role === 'user' && msg.text.trim() === text.trim())

    const userMsg: Message = { role: 'user', text }
    const updatedMessages1 = [...messages, userMsg]
    
    // 중복 질문이 아닐 때만 차감(사용 횟수 증가)
    const updatedQuestionsUsed = isDuplicate ? questionsUsed : questionsUsed + 1
    
    setMessages(updatedMessages1)
    setQuestionsUsed(updatedQuestionsUsed)
    setInput('')

    // 전송 즉시 사용자 메시지 먼저 저장
    saveInterviewSession(updatedMessages1, updatedQuestionsUsed)

    // Gemini API 호출
    if (chatSession) {
      try {
        const result = await chatSession.sendMessage(text)
        const responseText = result.response.text()
        const updatedMessages2 = [...updatedMessages1, { role: 'ai', text: responseText } as Message]
        setMessages(updatedMessages2)
        saveInterviewSession(updatedMessages2, updatedQuestionsUsed)
      } catch (error) {
        console.error('Gemini API Error:', error)
        
        // Gemini 내부 차단 로직에 걸렸을 가능성 (Safety 등)
        try {
          if (user && user.role !== 'teacher') {
            const studentRef = doc(db, 'students', user.uid)
            await setDoc(studentRef, { warnings: increment(1) }, { merge: true })
          }
        } catch (e) {
          console.error('경고 증가 실패:', e)
        }

        const updatedMessagesError = [...updatedMessages1, { 
          role: 'ai', 
          text: '⚠️ 부적절한 내용이 감지되어 답변을 생성할 수 없습니다. 바른 말을 사용해주세요.',
          isOffTopic: true
        } as Message]
        setMessages(updatedMessagesError)
        saveInterviewSession(updatedMessagesError, updatedQuestionsUsed)
      }
    } else {
      // API 키가 없어서 세션이 없는 경우 (Fallback)
      setTimeout(() => {
        const fallbackMsg: Message = { role: 'ai', text: '[시스템] API 키가 설정되지 않아 응답할 수 없습니다. .env.local 파일에 VITE_GEMINI_API_KEY를 설정해주세요.' }
        const updatedMessagesFB = [...updatedMessages1, fallbackMsg]
        setMessages(updatedMessagesFB)
        saveInterviewSession(updatedMessagesFB, updatedQuestionsUsed)
      }, 1000)
    }
    
    setIsTyping(false)
  }

  const handleSuggestedClick = (question: string) => {
    setInput(question)
  }

  const proceedToReport = async () => {
    if (user && figureId && status !== 'submitted') {
      try {
        const interviewRef = doc(db, 'interviews', `${user.uid}_${figureId}`)
        await setDoc(interviewRef, { status: 'drafting' }, { merge: true })
      } catch (e) {
        console.error(e)
      }
    }
    navigate(`/student/report?figureId=${figureId}`)
  }

  if (loadingFigure) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-slate-400 text-sm animate-pulse">인터뷰 방을 준비하는 중입니다...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50">
      {/* 상단 바 */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                {figure?.era}
              </span>
              <h1 className="font-bold text-lg text-slate-800">{figure?.name} 인터뷰</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 break-keep leading-relaxed pr-4">
              {figure?.description}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-2">
            {/* 단계 표시 */}
            <div className="hidden md:flex items-center gap-1 text-xs whitespace-nowrap flex-nowrap">
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold shrink-0">1 인터뷰</span>
              <span className="text-slate-300 shrink-0">→</span>
              <span className="text-slate-400 px-2 py-0.5 shrink-0">2 초안</span>
              <span className="text-slate-300 shrink-0">→</span>
              <span className="text-slate-400 px-2 py-0.5 shrink-0">3 제출</span>
            </div>
            {/* 남은 질문 수 */}
            <div className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${
              status === 'submitted'
                ? 'bg-slate-100 text-slate-500 border-slate-200'
                : questionsLeft <= 3
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              {status === 'submitted' ? '제출 완료' : `남은 질문 ${questionsLeft} / ${QUESTION_LIMIT}`}
            </div>
            

            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="text-xs bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm ml-2 shrink-0"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mr-2 mt-1 shadow-sm">
                  👑
                </div>
              )}
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md shadow-sm'
                  : msg.isOffTopic
                    ? 'bg-orange-50 text-orange-800 border border-orange-200 rounded-bl-md'
                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mr-2 mt-1 shadow-sm">
                👑
              </div>
              <div className="bg-white text-slate-400 border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 text-sm shadow-sm">
                <span className="animate-pulse">답변을 생각하고 있습니다...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* 하단: 추천 질문 + 입력 */}
      <div className="bg-white border-t border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          {status === 'submitted' ? (
            <div className="mb-3 bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <p className="text-sm text-slate-600 font-medium">🔒 제출이 완료되어 더 이상 대화할 수 없습니다.</p>
              <button
                onClick={() => navigate(`/student/report?figureId=${figureId}`)}
                className="bg-slate-600 hover:bg-slate-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
              >
                제출한 보고서 보기 →
              </button>
            </div>
          ) : (
            <>
              {/* 추천 질문 (제출 안됨 & 입력창이 비어있을 때만 표시) */}
              {status !== 'submitted' && input.trim() === '' && questionsLeft > 0 && figure?.suggestedQuestions && figure.suggestedQuestions.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-500 mb-2">💡 추천 질문을 참고해 보세요</p>
                  <div className="flex flex-wrap gap-1.5">
                    {figure.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestedClick(q)}
                        className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5개 이상 질문 시 다음 단계 버튼 표시 */}
              {questionsUsed >= 5 && (
                <div className={`mb-3 border rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  questionsLeft === 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-indigo-50 border-indigo-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    questionsLeft === 0 ? 'text-green-700' : 'text-indigo-700'
                  }`}>
                    {questionsLeft === 0 
                      ? '✅ 모든 질문 기회를 사용했습니다! 다음 단계로 이동하세요.' 
                      : '✨ 충분한 대화를 나누었네요! 원한다면 지금 바로 다음 단계로 이동할 수 있습니다.'}
                  </p>
                  <button
                    onClick={proceedToReport}
                    className={`whitespace-nowrap w-full sm:w-auto shrink-0 ${
                      questionsLeft === 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    } text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors`}
                  >
                    보고서 작성하기 →
                  </button>
                </div>
              )}

              {/* 입력창 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                  placeholder={questionsLeft > 0 ? '질문을 입력해 보세요...' : '모든 질문 기회를 사용했습니다.'}
                  disabled={questionsLeft === 0 || isTyping}
                  className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
                />
                <button
                  onClick={() => handleSend(input)}
                  disabled={questionsLeft === 0 || !input.trim() || isTyping}
                  className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  전송
                </button>
              </div>
            </>
          )}
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
    </div>
  )
}
