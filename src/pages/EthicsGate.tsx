import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const GUIDES = [
  {
    value: '주도성',
    valueColor: 'bg-yellow-400',
    badge: '합목적성',
    badgeColor: 'bg-orange-400',
    number: 1,
    label: '활용 목적',
    title: "생성형 AI를 쓰기 전, '왜' 쓰는지 말할 수 있어야 해요.",
    description:
      "생성형 AI를 사용하기 전에 '지금 내가 왜 쓰려고 하지?'라고 스스로 물어보세요. 생성형 AI는 내 생각을 대신해주는 게 아니라, 내 생각을 도와주는 도구임을 기억하세요. 모든 공부에 생성형 AI가 필요한 것은 아니므로, 지금 하는 활동에 생성형 AI를 사용하는 것이 나의 학습에 정말 도움이 될지 먼저 고민해요.",
  },
  {
    value: '주도성',
    valueColor: 'bg-yellow-400',
    badge: null,
    badgeColor: '',
    number: 2,
    label: '주도적 학습',
    title: '생성형 AI에게 물어보기 전, 내 생각을 먼저 말해요.',
    description:
      '막막할 때 바로 생성형 AI에게 묻고 싶은 마음이 들 수 있지만, 먼저 스스로 시도해 보아야 나의 성장에 도움이 돼요. 주제에 대해 내가 아는 것과 내 아이디어를 먼저 공책에 적어본 뒤에 생성형 AI를 활용하세요.',
  },
  {
    value: '주도성',
    valueColor: 'bg-yellow-400',
    badge: '합목적성',
    badgeColor: 'bg-orange-400',
    number: 3,
    label: '비판적 검증',
    title: '생성형 AI가 틀릴 수 있다는 점을 알아요.',
    description:
      "생성형 AI는 틀린 정보를 마치 사실인 것처럼 제시하기도 하므로, 알려준 내용은 항상 '정말 맞을까?' 하고 한 번 더 확인하는 습관을 가져요. 중요한 내용일수록 책을 찾아보거나 선생님께 여쭤보는 등 다른 방법으로도 꼭 다시 확인하세요.",
  },
  {
    value: '주도성',
    valueColor: 'bg-yellow-400',
    badge: '합목적성',
    badgeColor: 'bg-orange-400',
    number: 4,
    label: '사고의 확장',
    title: '생성형 AI와 함께 상상하며 내 생각을 더 크게 키워요.',
    description:
      '생성형 AI를 내 생각의 범위를 넓혀주는 도구로 사용해보세요. 생성형 AI의 결과물을 그대로 사용하지 말고, 나의 경험과 생각을 더하여 나만의 색깔을 담은 최종 결과물을 만들어요.',
  },
  {
    value: '안전성',
    valueColor: 'bg-green-500',
    badge: null,
    badgeColor: '',
    number: 5,
    label: '안전과 관계',
    title: '나의 정보와 비밀을 말하지 않아요.',
    description:
      '내가 입력한 정보는 어디에서 어떻게 사용될지 모르기 때문에 이름, 주소, 학교, 전화번호 같은 개인정보는 생성형 AI에게 알려주면 안 돼요. 생성형 AI는 계산된 답변을 하는 프로그램이라 감정이 없어요. 나의 고민을 털어놓으며 지나치게 의지하기보다, 친구나 부모님, 선생님과의 실제 대화를 통해 마음을 나누어요.',
  },
  {
    value: '투명성',
    valueColor: 'bg-sky-500',
    badge: null,
    badgeColor: '',
    number: 6,
    label: '투명성·윤리',
    title: '생성형 AI의 도움을 받았다면 숨기지 않고 정직하게 이야기해요.',
    description:
      '어느 부분이 생성형 AI의 것이고 어느 부분이 나의 것인지 명확히 밝히는 것은 나 자신을 속이지 않는 정직한 태도예요. 생성형 AI가 쓴 사실을 정직하게 밝힐 때 나의 노력이 더 빛나고 가치 있게 인정받을 수 있어요.',
  },
]

export default function EthicsGate() {
  const [agreed, setAgreed] = useState(false)
  const navigate = useNavigate()

  const handleAgree = () => {
    setAgreed(true)
    setTimeout(() => {
      navigate('/student/interview')
    }, 600)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-slate-800 mb-2">
            📜 초등 인공지능 윤리 핵심가이드
          </h1>
          <p className="text-sm text-slate-500">
            인터뷰 활동을 시작하기 전, 아래 가이드를 꼼꼼히 읽어주세요.
          </p>
        </div>

        {/* 가이드 목록 */}
        <div className="space-y-4 mb-8">
          {GUIDES.map((guide) => (
            <div
              key={guide.number}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex items-stretch">
                {/* 왼쪽 핵심가치 라벨 */}
                <div className={`${guide.valueColor} text-white flex flex-col items-center justify-center px-4 py-4 min-w-[80px]`}>
                  <span className="text-xs font-bold mb-1">{guide.value}</span>
                  {guide.badge && (
                    <span className={`${guide.badgeColor} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5`}>
                      {guide.badge}
                    </span>
                  )}
                </div>

                {/* 오른쪽 내용 */}
                <div className="flex-1 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      가이드 {guide.number}
                    </span>
                    <span className="text-xs text-slate-400">{guide.label}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-2 leading-snug">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {guide.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 동의 버튼 */}
        <div className="text-center">
          <button
            onClick={handleAgree}
            disabled={agreed}
            className={`px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 shadow-md ${
              agreed
                ? 'bg-green-500 text-white scale-95'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white hover:shadow-lg hover:scale-[1.02]'
            }`}
          >
            {agreed
              ? '✅ 동의 완료! 인터뷰 화면으로 이동합니다...'
              : '나는 윤리 핵심가이드를 빠짐없이 읽고 이를 실천하겠습니다.'}
          </button>
        </div>
      </div>
    </div>
  )
}
