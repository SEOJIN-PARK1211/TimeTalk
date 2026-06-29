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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            ✨ TimeTalk 프로젝트 소개 및 사용 가이드
          </h2>
          <button onClick={handleClose} className="text-white/50 hover:text-white transition-colors rounded-full p-2 hover:bg-white/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 text-white/80 space-y-10">
          
          <section>
            <h3 className="text-2xl font-semibold text-white mb-5 flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="text-blue-400">🎓</span> 학생 모드 플로우 (Student Flow)
            </h3>
            <div className="space-y-6">
              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors">
                <h4 className="text-lg font-bold text-blue-300 mb-2">1. 로그인 및 참여 (Login)</h4>
                <p className="text-sm leading-relaxed text-white/70">학생은 복잡한 회원가입 없이 교사가 발급한 <strong>'참여 코드(Room Code)'</strong>와 <strong>'학번/이름'</strong>만으로 즉시 수업에 참여할 수 있도록 설계되었습니다.</p>
              </div>

              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors">
                <h4 className="text-lg font-bold text-blue-300 mb-2">2. AI 윤리 서약 (Ethics Gate)</h4>
                <p className="text-sm leading-relaxed text-white/70">AI와의 대화를 시작하기 전, 생성형 AI 사용에 대한 <strong>디지털 윤리 가이드라인을 확인하고 동의</strong>하는 절차를 거칩니다. 이는 올바른 AI 활용 교육을 위한 필수 기능입니다.</p>
              </div>

              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors">
                <h4 className="text-lg font-bold text-blue-300 mb-2">3. 역사적 인물 선택 (Select Figure)</h4>
                <p className="text-sm leading-relaxed text-white/70">학생이 직접 대화하고 싶은 역사적 인물을 선택합니다. <strong>사전 정의된 인물 목록</strong>에서 고르거나, <strong>원하는 인물을 직접 입력</strong>할 수 있어 자기주도적 학습이 가능합니다.</p>
              </div>

              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors">
                <h4 className="text-lg font-bold text-blue-300 mb-2">4. AI 롤플레잉 인터뷰 (AI Interview)</h4>
                <p className="text-sm leading-relaxed text-white/70">선택한 인물의 페르소나를 가진 AI와 실시간 채팅을 진행합니다. <strong>시대적 배경, 말투, 성격이 반영된 프롬프트 엔지니어링</strong>을 통해 실제 인물과 대화하는 듯한 생생한 몰입감을 제공합니다.</p>
              </div>

              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors">
                <h4 className="text-lg font-bold text-blue-300 mb-2">5. 학습 보고서 작성 (Report Draft)</h4>
                <p className="text-sm leading-relaxed text-white/70">대화가 종료되면, 나눈 대화 내용을 바탕으로 <strong>인터뷰 요약, 새롭게 알게 된 점, 느낀 점</strong> 등을 정리하여 최종 보고서를 작성하고 교사에게 제출합니다.</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-semibold text-white mb-5 flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="text-emerald-400">👨‍🏫</span> 교사 모드 플로우 (Teacher Flow)
            </h3>
            <div className="space-y-6">
              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors">
                <h4 className="text-lg font-bold text-emerald-300 mb-2">1. 관리자 로그인</h4>
                <p className="text-sm leading-relaxed text-white/70">사전에 부여된 교사 이메일 계정과 비밀번호로 로그인하여 관리자 페이지에 접근합니다.</p>
              </div>

              <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors">
                <h4 className="text-lg font-bold text-emerald-300 mb-2">2. 교사 대시보드 (Teacher Dashboard)</h4>
                <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed text-white/70">
                  <li><strong>수업 관리:</strong> 클래스룸(참여 코드)을 생성하고 관리할 수 있습니다.</li>
                  <li><strong>실시간 모니터링:</strong> 학생들이 현재 누구와 대화하고 있는지, 대화 진행 상황은 어떠한지 한눈에 파악할 수 있습니다.</li>
                  <li><strong>보고서 평가:</strong> 학생들이 제출한 최종 인터뷰 보고서를 열람하고 평가 및 피드백을 제공할 수 있는 환경을 지원합니다.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-semibold text-white mb-5 flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="text-amber-400">💡</span> 프로젝트 주요 특징 (Key Features)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-xl p-5">
                <h4 className="font-bold text-indigo-300 mb-2">맞춤형 프롬프트 시스템</h4>
                <p className="text-sm text-indigo-100/70">단순한 질의응답을 넘어 역사적 맥락과 인물의 성향을 고려한 정교한 시스템 프롬프트가 백그라운드에서 동작합니다.</p>
              </div>
              <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-500/30 rounded-xl p-5">
                <h4 className="font-bold text-blue-300 mb-2">원스톱 교육 플랫폼</h4>
                <p className="text-sm text-blue-100/70">역사 학습, 윤리 교육, 보고서 작성, 그리고 교사의 평가까지 하나의 플랫폼에서 이루어지는 올인원 솔루션입니다.</p>
              </div>
            </div>
          </section>

        </div>
        <div className="p-6 border-t border-white/10 bg-black/40 flex gap-4 justify-between items-center">
          <button 
            onClick={handleHideForever}
            className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-2 group"
          >
            <div className="w-4 h-4 border border-white/30 rounded flex items-center justify-center group-hover:border-white transition-colors"></div>
            이 창 다시 보지 않기
          </button>
          <button 
            onClick={handleClose}
            className="px-10 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl shadow-blue-500/30"
          >
            본격적으로 시작하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
