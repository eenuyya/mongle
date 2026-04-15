---
name: Next.js 16 주의사항
description: 이 프로젝트의 Next.js 버전 특이사항 및 AGENTS.md 지시사항
type: feedback
---

AGENTS.md에 명시: "This is NOT the Next.js you know — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code."

코드 작성 전 `node_modules/next/dist/docs/01-app/` 아래 관련 문서를 먼저 확인해야 함.

**Why:** Next.js 16에는 Breaking Change가 있어 훈련 데이터와 다를 수 있음.
**How to apply:** 새로운 Next.js 기능(라우팅, 이미지 최적화, 폰트, 캐싱 등) 사용 시 docs 먼저 확인.
