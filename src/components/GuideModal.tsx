import React, { useState, useEffect } from 'react';

const GuideModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hideGuide = localStorage.getItem('hideGuide');
    if (!hideGuide) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleHideForever = () => {
    localStorage.setItem('hideGuide', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            🚀 TimeTalk 이용 가이드
          </h2>
          <button onClick={handleClose} className="text-white/50 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 text-white/80 space-y-8">
          <section>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-blue-400">📖</span> 사용 방법
            </h3>
            <ul className="space-y-3 text-sm leading-relaxed text-white/70">
              <li className="flex gap-3">
                <span className="text-blue-500 font-bold">1.</span>
                <div>
                  <strong className="text-white">역사적 인물 선택:</strong> 대화하고 싶은 역사적 인물을 목록에서 선택하거나 직접 입력하여 롤플레잉을 준비합니다.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-500 font-bold">2.</span>
                <div>
                  <strong className="text-white">AI와의 실시간 대화:</strong> 선택한 인물의 시대적 배경, 말투, 성격이 반영된 AI와 대화하며 역사적 사실과 다양한 관점을 탐구해보세요.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-blue-500 font-bold">3.</span>
                <div>
                  <strong className="text-white">보고서 작성:</strong> 의미 있는 대화를 마친 후, 대화 내용을 요약하고 느낀 점을 담은 보고서를 작성하여 제출할 수 있습니다.
                </div>
              </li>
            </ul>
          </section>
          
          <section>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">🔑</span> 로그인 방법
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-emerald-400 font-medium mb-2">학생</h4>
                <p className="text-sm text-white/70">선생님께 부여받은 <strong className="text-white">참여 코드(Room Code)</strong>를 입력하여 별도의 회원가입 없이 바로 접속할 수 있습니다.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-emerald-400 font-medium mb-2">교사 / 관리자</h4>
                <p className="text-sm text-white/70">발급받은 관리자 계정 이메일과 비밀번호로 로그인하여 학생들의 대화 진행 상황 및 보고서를 확인하고 관리할 수 있습니다.</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-amber-400">⚠️</span> 주의사항
            </h3>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 text-sm leading-relaxed shadow-inner">
              <ul className="list-disc pl-5 space-y-2 text-amber-200/90 marker:text-amber-500/50">
                <li>AI가 생성한 답변은 역사적 사실을 기반으로 하지만, 정보의 한계가 있어 <strong>완벽하게 정확하지 않을 수 있습니다.</strong> 참고용으로만 활용해주세요.</li>
                <li>대화 중 욕설, 비방, 혐오 표현 등 부적절한 언어를 사용할 경우, 경고 및 이용 제한이 있을 수 있습니다. (AI 윤리 필터링이 작동합니다)</li>
                <li>작성된 모든 대화 내용과 보고서는 담당 선생님께 전송되며, 평가의 참고 자료로 활용될 수 있습니다.</li>
              </ul>
            </div>
          </section>
        </div>
        <div className="p-6 border-t border-white/10 bg-black/20 flex gap-3 justify-end items-center">
          <button 
            onClick={handleHideForever}
            className="text-sm text-white/50 hover:text-white transition-colors mr-auto flex items-center gap-2"
          >
            <div className="w-4 h-4 border border-white/30 rounded flex items-center justify-center"></div>
            다시 보지 않기
          </button>
          <button 
            onClick={handleClose}
            className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
          >
            확인 및 시작하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
