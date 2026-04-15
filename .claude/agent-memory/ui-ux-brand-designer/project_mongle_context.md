---
name: Mongle Project Context
description: 몽글 서비스의 브랜드, 기술 스택, 디자인 시스템 컨텍스트
type: project
---

몽글(mongle)은 감성 장소 큐레이션 웹 앱 (Next.js, 반응형)이다.

**브랜드 토큰:**
- Primary: --mongle-peach (피치 오렌지 계열)
- Light: --mongle-peach-light
- Dark: --mongle-peach-dark
- Background: --mongle-cream / --mongle-warm (#FFF8F3 베이스)
- Text: --mongle-brown
- Accent: --mongle-gold
- 폰트: Gowun Dodum (UI 전체), Jua (로고 워드마크 전용)

**현재 헤더 구조:**
- 높이 h-16, fixed top, max-w-7xl, px-4
- 좌: 로고(이미지+몽글 텍스트), 중: 동네선택하기 pill(flex-1 center), 우: 코스/장소 NavLink + 로그인 버튼
- 지역 선택 모달: 모바일 bottom sheet, 데스크탑 center modal

**현재 문제:**
- 모바일에서 헤더 콘텐츠 overflow — 동네선택하기 pill이 줄바꿈되어 헤더 밖으로 튀어나옴
- 헤더 아이템(로고 + pill + 코스 + 장소 + 로그인)이 h-16에 다 들어가지 않음

**타겟 사용자:** 20-30대 감성 중시 사용자
**플랫폼:** 웹 앱이지만 모바일 사용 비중이 높을 것으로 예상

**Why:** 서비스 초기 단계, 네이티브 앱 전환 전 웹 앱으로 검증 중
**How to apply:** 모바일 UX를 우선 고려하되, 웹 앱 제약(PWA 아님, 브라우저 chrome 존재) 안에서 설계
