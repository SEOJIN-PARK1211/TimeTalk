# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",

⏳ 타임토크(TimeTalk) 서비스 소개
"역사적 인물과 대화하며 스스로 완성하는 주도적 탐구 학습 플랫폼"

🌟 주요 기능 (Key Features)
👨‍🎓 학생용 주요 기능
AI 가상 역사 인터뷰
자신이 선택한 역사적 인물(예: 광개토대왕, 세종대왕)과 직접 1:1 대화를 나누며 시대상을 탐구합니다.
구조화된 보고서 초안 자동 생성 (AI)
대화가 끝나면, 나눈 대화를 바탕으로 AI가 [인물 소개 / 정치 / 경제 / 문화] 4가지 항목으로 나누어 보고서 초안을 자동으로 작성해 줍니다.
주도적 보완 및 최종 제출 (수정 필수)
AI가 모두 써주지 않습니다! 학생은 가장 중요한 **[인상 깊었던 내용]**과 **[나의 느낀 점]**을 직접 작성해야 하며, AI 초안을 스스로 읽고 수정해야만 제출 버튼이 활성화됩니다.
👨‍🏫 교사용 주요 기능
실시간 학급 대시보드
수업 중 학생들이 어느 단계(인터뷰 중, 초안 작성, 제출 완료 등)에 있는지 실시간으로 모니터링할 수 있습니다.
AI 역사 인물 커스텀 등록
수업 진도에 맞춰 원하는 역사적 인물을 교사가 직접 등록하고, 성격(프롬프트)과 추천 질문을 설정할 수 있습니다.
AI 보조 피드백 & 팩트체크
학생이 제출한 보고서를 검토할 때, AI가 역사적 오류가 없는지 1차 팩트체크를 돕고, 따뜻한 피드백 초안을 생성해 주어 교사의 업무를 크게 줄여줍니다.
⚠️ 사용 방법 및 주의사항 (Precautions)
1. 질문 횟수 10회 제한 🎯
학생들의 질문 집중도를 높이고 깊이 있는 탐구를 유도하기 위해, 한 인물당 최대 10번까지만 질문할 수 있습니다. (남은 횟수 화면 표기)
2. 수업 범위 이탈(딴소리) 방지 🛑
학생이 장난을 치거나 역사와 무관한 질문을 할 경우, AI가 답변하지 않고 "오늘 수업 내용과 관련 있는 내용에만 답할 수 있습니다." 라며 학습을 올바른 방향으로 유도합니다.
3. 무임승차(단순 클릭 제출) 방지 🚫
AI가 써준 초안을 읽지도 않고 그대로 제출하는 것을 막기 위해, 학생이 편집기에서 단 한 글자라도 직접 수정·추가해야만 최종 제출이 가능하게 설계되었습니다.
4. 실명 기반 구글 로그인 🔐
장난스러운 닉네임 사용을 막고 학급 관리를 명확히 하기 위해, 학생과 교사 모두 개인 Google 계정을 통한 실명 로그인을 원칙으로 합니다.
5. 교사의 최종 권한 부여 👑
AI는 학생의 초안과 교사의 피드백을 '보조'할 뿐입니다. 학생의 최종 제출물에 대한 재수정 요청 및 최종 평가는 모두 교사의 대시보드를 통해서만 이루어집니다.

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
