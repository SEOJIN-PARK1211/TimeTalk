import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ReportDraft() {
  const navigate = useNavigate()
  const [draftIntro, setDraftIntro] = useState(
    '세종대왕은 조선의 제4대 왕(재위 1418~1450)으로, 조선 시대를 대표하는 성군으로 널리 알려져 있습니다. 본명은 이도(李裪)이며, 태종의 셋째 아들로 태어났습니다.'
  )
  const [draftPolitics, setDraftPolitics] = useState(
    '세종대왕은 집현전을 설치하여 학문 연구를 장려하고 인재를 양성했습니다. 의정부서사제를 시행하여 재상들이 국정을 논의하고 왕에게 보고하는 체계를 정착시켰습니다.'
  )
  const [draftEconomy, setDraftEconomy] = useState(
    '농사직설을 편찬하여 조선의 풍토에 맞는 농법을 보급했습니다. 또한 측우기를 발명하여 강우량을 과학적으로 측정하고 농업 생산성 향상에 기여했습니다.'
  )
  const [draftCulture, setDraftCulture] = useState(
    '백성들이 글을 읽고 쓸 수 있도록 훈민정음을 창제하였습니다. 이를 통해 양반뿐 아니라 일반 백성들도 자신의 생각을 표현할 수 있는 길이 열렸습니다.'
  )
  const [memorable, setMemorable] = useState('')
  const [reflection, setReflection] = useState('')
  const [editedDraft, setEditedDraft] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // 초안 원본과 비교하여 수정 여부 확인
  const originalIntro = '세종대왕은 조선의 제4대 왕(재위 1418~1450)으로, 조선 시대를 대표하는 성군으로 널리 알려져 있습니다. 본명은 이도(李裪)이며, 태종의 셋째 아들로 태어났습니다.'
  const originalPolitics = '세종대왕은 집현전을 설치하여 학문 연구를 장려하고 인재를 양성했습니다. 의정부서사제를 시행하여 재상들이 국정을 논의하고 왕에게 보고하는 체계를 정착시켰습니다.'
  const originalEconomy = '농사직설을 편찬하여 조선의 풍토에 맞는 농법을 보급했습니다. 또한 측우기를 발명하여 강우량을 과학적으로 측정하고 농업 생산성 향상에 기여했습니다.'
  const originalCulture = '백성들이 글을 읽고 쓸 수 있도록 훈민정음을 창제하였습니다. 이를 통해 양반뿐 아니라 일반 백성들도 자신의 생각을 표현할 수 있는 길이 열렸습니다.'

  const hasEditedDraft = draftIntro !== originalIntro || draftPolitics !== originalPolitics || draftEconomy !== originalEconomy || draftCulture !== originalCulture || editedDraft
  const hasMemorableContent = memorable.trim().length > 0
  const hasReflectionContent = reflection.trim().length > 0
  const canSubmit = hasEditedDraft && hasMemorableContent && hasReflectionContent

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
        <div className="bg-white p-10 rounded-2xl shadow-lg border border-slate-200 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">제출 완료!</h1>
          <p className="text-slate-500 mb-2 text-sm">보고서가 선생님께 성공적으로 제출되었습니다.</p>
          <p className="text-xs text-slate-400 mb-8">
            제출 시각: {new Date().toLocaleString('ko-KR')}
          </p>
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-slate-600 text-left">
            <p className="font-semibold mb-1">📌 안내</p>
            <p>선생님이 보고서를 검토한 후 피드백을 보내드릴 예정입니다. 수정 가능 여부는 선생님의 정책에 따라 달라집니다.</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 font-semibold hover:underline text-sm"
          >
            처음 화면으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">보고서 작성</h1>
            <p className="text-sm text-slate-500">세종대왕 인터뷰 보고서</p>
          </div>
          {/* 단계 표시 */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 px-2 py-0.5">1 인터뷰 ✓</span>
            <span className="text-slate-300">→</span>
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">2 수정·보완</span>
            <span className="text-slate-300">→</span>
            <span className="text-slate-400 px-2 py-0.5">3 제출</span>
          </div>
        </div>

        {/* 안내 박스 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-blue-600 text-lg mt-0.5">ℹ️</span>
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-1">AI가 정리한 초안입니다</p>
            <p className="leading-relaxed">
              아래 초안은 인터뷰 내용을 바탕으로 정리된 초안입니다.
              <strong> 초안을 직접 수정·보완하고, '직접 작성' 영역을 모두 채워야</strong> 제출할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 왼쪽: AI 초안 영역 */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700 text-sm">🤖 AI 초안 (수정 가능)</span>
                {hasEditedDraft && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">수정됨 ✓</span>}
              </div>

              {/* 인물 소개 */}
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm mb-2">📝 인물 소개</h3>
                <textarea
                  className="w-full text-sm text-slate-600 leading-relaxed bg-transparent focus:outline-none focus:bg-blue-50 rounded-lg p-2 resize-none transition-colors"
                  rows={3}
                  value={draftIntro}
                  onChange={(e) => { setDraftIntro(e.target.value); setEditedDraft(true) }}
                />
              </div>

              {/* 정치 */}
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm mb-2">🏛️ 당시 생활 모습 — 정치</h3>
                <textarea
                  className="w-full text-sm text-slate-600 leading-relaxed bg-transparent focus:outline-none focus:bg-blue-50 rounded-lg p-2 resize-none transition-colors"
                  rows={3}
                  value={draftPolitics}
                  onChange={(e) => { setDraftPolitics(e.target.value); setEditedDraft(true) }}
                />
              </div>

              {/* 경제 */}
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-700 text-sm mb-2">💰 당시 생활 모습 — 경제</h3>
                <textarea
                  className="w-full text-sm text-slate-600 leading-relaxed bg-transparent focus:outline-none focus:bg-blue-50 rounded-lg p-2 resize-none transition-colors"
                  rows={3}
                  value={draftEconomy}
                  onChange={(e) => { setDraftEconomy(e.target.value); setEditedDraft(true) }}
                />
              </div>

              {/* 문화 */}
              <div className="p-5">
                <h3 className="font-bold text-slate-700 text-sm mb-2">🎨 당시 생활 모습 — 문화</h3>
                <textarea
                  className="w-full text-sm text-slate-600 leading-relaxed bg-transparent focus:outline-none focus:bg-blue-50 rounded-lg p-2 resize-none transition-colors"
                  rows={3}
                  value={draftCulture}
                  onChange={(e) => { setDraftCulture(e.target.value); setEditedDraft(true) }}
                />
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
                  className="w-full text-sm leading-relaxed bg-transparent focus:outline-none rounded-lg p-1 resize-none placeholder-amber-400"
                  rows={5}
                  placeholder="인터뷰 내용 중 가장 기억에 남는 부분과 그 이유를 적어주세요."
                  value={memorable}
                  onChange={(e) => setMemorable(e.target.value)}
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
                  className="w-full text-sm leading-relaxed bg-transparent focus:outline-none rounded-lg p-1 resize-none placeholder-amber-400"
                  rows={5}
                  placeholder="이 인물의 삶을 통해 무엇을 느꼈는지 자유롭게 적어주세요."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
              </div>
            </div>

            {/* 제출 조건 체크리스트 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-700 text-sm mb-3">제출 조건 확인</h3>
              <ul className="space-y-2.5 text-sm">
                <li className={`flex items-center gap-2 ${hasEditedDraft ? 'text-green-600' : 'text-slate-400'}`}>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold ${hasEditedDraft ? 'bg-green-100 border-green-500' : 'border-slate-300'}`}>
                    {hasEditedDraft ? '✓' : ''}
                  </span>
                  초안을 직접 수정했어요
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
                  ⚠️ 직접 수정하고 필수 항목을 모두 작성해야 제출할 수 있습니다.
                </p>
              )}
              <button
                onClick={() => setSubmitted(true)}
                disabled={!canSubmit}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                최종 제출하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
