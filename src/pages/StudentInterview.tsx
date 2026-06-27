import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Message {
  role: 'ai' | 'user'
  text: string
  isOffTopic?: boolean
}

const QUESTION_LIMIT = 10

const SUGGESTED_QUESTIONS = [
  { category: '삶', questions: ['아침에 일어나서 가장 먼저 무엇을 하시나요?', '하루 일과가 어떻게 되시나요?'] },
  { category: '정치', questions: ['어떤 정책을 가장 중요하게 생각하셨나요?', '신하들과 의견이 다를 때 어떻게 하셨나요?'] },
  { category: '경제', questions: ['백성들의 생활을 위해 어떤 노력을 하셨나요?', '조선의 농업을 발전시키기 위해 무엇을 하셨나요?'] },
  { category: '문화', questions: ['한글을 만들 때 가장 힘들었던 점은 무엇인가요?', '과학 기술 발전을 위해 어떤 일을 하셨나요?'] },
  { category: '감정', questions: ['가장 보람 있었던 일은 무엇인가요?', '가장 힘들었던 순간은 언제였나요?'] },
]

const AI_RESPONSES: Record<string, string> = {
  default: '좋은 질문이구나! 내가 조선을 다스리던 시절의 이야기를 해주마. 나는 백성을 위한 정치가 가장 중요하다고 생각했단다. 특히 백성들이 글을 읽고 쓸 수 있어야 한다고 믿었지.',
  morning: '나는 새벽에 일어나 경연(經筵)에 참석하며 하루를 시작했단다. 경연은 신하들과 함께 학문을 토론하는 자리인데, 나는 이 시간을 매우 중요하게 여겼지.',
  hangul: '한글을 만드는 과정은 정말 험난했단다. 많은 신하들이 반대했거든. 특히 최만리 같은 학자들은 "중국의 문자를 버리고 새 글자를 만드는 것은 옳지 않다"고 했지. 하지만 나는 백성들이 자기 생각을 글로 표현할 수 있어야 한다고 믿었단다.',
  policy: '나는 의정부서사제를 시행하여 재상들이 국정을 논의하고 왕에게 보고하는 방식을 정착시켰단다. 이를 통해 신하들의 의견을 충분히 듣되, 최종 결정은 왕이 내릴 수 있었지.',
  economy: '농사직설(農事直說)이라는 책을 편찬하게 했단다. 우리 조선의 풍토에 맞는 농법을 정리한 것이지. 또한 측우기를 발명하여 강우량을 측정하고, 이를 농업에 활용하도록 했단다.',
}

export default function StudentInterview() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: '안녕! 나는 조선의 제4대 왕 세종이라고 하느니라. 오늘 나에 대해 궁금한 것이 있다면 무엇이든 물어보렴. 남은 질문 수를 확인하면서 중요한 내용을 질문해 보거라!' }
  ])
  const [input, setInput] = useState('')
  const [questionsUsed, setQuestionsUsed] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const questionsLeft = QUESTION_LIMIT - questionsUsed

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const getAIResponse = (question: string): string => {
    const q = question.toLowerCase()
    if (q.includes('아침') || q.includes('일과') || q.includes('하루')) return AI_RESPONSES.morning
    if (q.includes('한글') || q.includes('훈민정음') || q.includes('글자')) return AI_RESPONSES.hangul
    if (q.includes('정책') || q.includes('정치') || q.includes('신하')) return AI_RESPONSES.policy
    if (q.includes('농') || q.includes('경제') || q.includes('백성') || q.includes('생활')) return AI_RESPONSES.economy
    return AI_RESPONSES.default
  }

  const isOffTopic = (question: string): boolean => {
    const offTopicKeywords = ['게임', '유튜브', '아이폰', '축구', '날씨', '점심', '간식']
    return offTopicKeywords.some(k => question.includes(k))
  }

  const handleSend = (text: string) => {
    if (!text.trim() || questionsLeft <= 0 || isTyping) return

    const userMsg: Message = { role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setQuestionsUsed(prev => prev + 1)
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      if (isOffTopic(text)) {
        setMessages(prev => [...prev, {
          role: 'ai',
          text: '오늘 수업 내용과 관련 있는 내용에만 답할 수 있습니다. 아래 추천 질문을 참고해 인터뷰를 이어가 보렴!',
          isOffTopic: true
        }])
        setShowSuggestions(true)
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: getAIResponse(text) }])
      }
      setIsTyping(false)
    }, 1200)
  }

  const handleSuggestedClick = (question: string) => {
    setInput(question)
    setShowSuggestions(false)
  }

  return (
    <div className="flex flex-col flex-1 bg-slate-50">
      {/* 상단 바 */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg text-slate-800">세종대왕 인터뷰</h1>
            <p className="text-xs text-slate-500">수업 목표: 조선 전기의 정치·경제·문화 이해하기</p>
          </div>
          <div className="flex items-center gap-3">
            {/* 단계 표시 */}
            <div className="hidden sm:flex items-center gap-1 text-xs">
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">1 인터뷰</span>
              <span className="text-slate-300">→</span>
              <span className="text-slate-400 px-2 py-0.5">2 초안</span>
              <span className="text-slate-300">→</span>
              <span className="text-slate-400 px-2 py-0.5">3 제출</span>
            </div>
            {/* 남은 질문 수 */}
            <div className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${
              questionsLeft <= 3
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              남은 질문 {questionsLeft} / {QUESTION_LIMIT}
            </div>
          </div>
        </div>
      </header>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mr-2 mt-1">
                  👑
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
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
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mr-2 mt-1">
                👑
              </div>
              <div className="bg-white text-slate-400 border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 text-sm shadow-sm">
                <span className="animate-pulse">답변을 작성하고 있습니다...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* 하단: 추천 질문 + 입력 */}
      <div className="bg-white border-t border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          {/* 추천 질문 */}
          {showSuggestions && questionsLeft > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-slate-500 mb-2">💡 추천 질문을 참고해 보세요</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.flatMap(cat =>
                  cat.questions.slice(0, 1).map(q => (
                    <button
                      key={q}
                      onClick={() => handleSuggestedClick(q)}
                      className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
                    >
                      {q}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 질문 완료 시 다음 단계 버튼 */}
          {questionsLeft === 0 && (
            <div className="mb-3 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
              <p className="text-sm text-green-700 font-medium">✅ 모든 질문을 완료했습니다! 다음 단계로 이동하세요.</p>
              <button
                onClick={() => navigate('/student/report')}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
              >
                보고서 초안 만들기 →
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
              placeholder={questionsLeft > 0 ? '역사 인물에게 질문해 보세요...' : '모든 질문 기회를 사용했습니다.'}
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
        </div>
      </div>
    </div>
  )
}
