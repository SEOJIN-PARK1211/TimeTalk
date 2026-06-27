import { useState } from 'react'
import LegalModal from './LegalModal'

export default function Footer() {
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null)

  return (
    <>
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            
            {/* 카피라이트 및 정보관리책임자 */}
            <div className="flex flex-col text-center md:text-left gap-1">
              <p className="font-semibold text-slate-600">© 2026 TimeTalk. All rights reserved.</p>
              <p>개인정보보호책임자: 박서진 교사 (서울잠동초등학교)</p>
            </div>

            {/* 약관 링크 */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setModalType('terms')}
                className="hover:text-blue-600 hover:underline transition-colors font-medium"
              >
                이용약관
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => setModalType('privacy')}
                className="hover:text-blue-600 hover:underline transition-colors font-bold"
              >
                개인정보처리방침
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 팝업 렌더링 */}
      {modalType && (
        <LegalModal type={modalType} onClose={() => setModalType(null)} />
      )}
    </>
  )
}
