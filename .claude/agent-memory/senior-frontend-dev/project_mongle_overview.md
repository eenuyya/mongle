---
name: 몽글 프로젝트 개요
description: 몽글 서비스의 기술 스택, 디자인 토큰, 프로젝트 구조에 대한 핵심 정보
type: project
---

몽글은 서울 핵심 동네(성수, 연남, 서촌, 한남, 익선동 등)의 감성 장소와 코스를 큐레이션하는 웹 서비스입니다.

**기술 스택**
- Next.js 16.2.1 (App Router, Turbopack)
- React 19.2.4
- TypeScript (strict 모드)
- Tailwind CSS v4 (v3와 문법 다름: `@theme` 블록, CSS 변수 기반)
- shadcn/ui (base-ui 기반, 일반 shadcn과 다름)
- pnpm 패키지 매니저
- Supabase (DB/인증), TanStack Query, Zustand

**디자인 토큰** (globals.css에 CSS 변수로 정의됨)
- `--mongle-peach: #FF8C69` — 메인 액션 버튼, CTA
- `--mongle-peach-light: #FFCDB8` — 태그 배경
- `--mongle-peach-dark: #E0613A` — 버튼 hover
- `--mongle-cream: #FFF8F3` — 페이지 배경
- `--mongle-warm: #FFF0E6` — 카드/섹션 배경
- `--mongle-brown: #5C3D2E` — 주요 텍스트
- `--mongle-gold: #FFD166` — 강조 배지, 별점
- `--radius: 0.875rem` — 둥글둥글한 느낌

**Tailwind v4 커스텀 컬러** (globals.css @theme 블록에서 매핑됨)
- `bg-mongle-peach`, `text-mongle-brown` 등 사용 가능
- 또는 인라인 style로 `var(--mongle-peach)` 직접 참조

**컴포넌트 구조**
- `components/ui/button.tsx` — @base-ui/react/button 기반 Button (일반 shadcn/ui와 다름)
- `components/home/` — 홈페이지 전용 섹션 컴포넌트들

**애니메이션 방식**
- 외부 라이브러리(framer-motion 등) 없이 CSS transitions + Intersection Observer만 사용
- globals.css에 커스텀 @keyframes 정의: fadeUp, slideInLeft, heartBounce, tagPop, heroFloat
- `.animate-on-scroll` / `.is-visible` 클래스 패턴으로 스크롤 진입 애니메이션 처리
- `.stagger-1` ~ `.stagger-8` 딜레이 클래스로 순차 진입 효과

**Why:** 서비스 타겟이 20-30대 감성 유저이므로 따뜻하고 말랑한 UI 톤이 핵심.
**How to apply:** 새 컴포넌트 작성 시 디자인 토큰 CSS 변수 직접 사용, 차가운 색상(블루/그레이) 지양.
