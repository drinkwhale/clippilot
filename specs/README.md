# ClipPilot 기능 명세 및 설계 문서

프로젝트의 요구사항, 설계, 구현 계획을 관리하는 디렉토리입니다.

## 📁 디렉토리 구조

```
specs/
└── 001-clippilot-mvp/          # MVP 기능 명세
    ├── spec.md                 # 요구사항 명세서 (User Stories, FR, NFR)
    ├── plan.md                 # 구현 계획 (Phase별 우선순위)
    ├── research.md             # 기술 선정 문서 (아키텍처, 스택)
    ├── data-model.md           # 데이터베이스 스키마 (ERD, RLS)
    ├── tasks.md                # 구현 태스크 목록 (170개)
    ├── quickstart.md           # 개발 환경 가이드
    └── contracts/
        └── api-v1.yaml         # OpenAPI 3.1 스펙 (23개 엔드포인트)
```

## 📄 문서 개요

### 1. [spec.md](001-clippilot-mvp/spec.md) - 요구사항 명세서

**목적**: 프로젝트의 비즈니스 요구사항과 기술 요구사항을 정의합니다.

**내용:**
- **User Stories**: 8개의 주요 사용자 스토리
  - US0: 사용자 인증 및 회원가입 ✅ (Phase 3 완료)
  - US1: AI 콘텐츠 생성
  - US2: 비디오 렌더링 및 YouTube 업로드
  - US3: 브랜드 템플릿 관리
  - US4: 구독 및 결제
  - US5: 대시보드 및 사용량 분석
  - US6: YouTube OAuth 연동
  - US7: 사용자 온보딩
- **Functional Requirements (FR)**: 40개의 기능 요구사항
- **Non-Functional Requirements (NFR)**: 21개의 비기능 요구사항

**사용 시기**: 새 기능 추가 시 요구사항 확인

---

### 2. [plan.md](001-clippilot-mvp/plan.md) - 구현 계획

**목적**: MVP 개발 단계별 우선순위와 리스크를 관리합니다.

**내용:**
- **Phase 1**: Setup ✅ (완료)
- **Phase 2**: Foundational Infrastructure ✅ (완료)
- **Phase 3**: US0 Authentication ✅ (완료)
- **Phase 4**: US6 YouTube OAuth (진행 예정)
- **Phase 5**: US1 Content Generation (MVP CORE)
- **Phase 6**: US2 Rendering & Upload (MVP CORE)
- **Phase 7-11**: Post-MVP 기능들

**사용 시기**: 개발 우선순위 결정 및 진행 상황 파악

---

### 3. [research.md](001-clippilot-mvp/research.md) - 기술 선정 문서

**목적**: 기술 스택 선정 근거와 아키텍처 설계를 문서화합니다.

**내용:**
- **아키텍처**: 3-tier 아키텍처 (Frontend, Backend API, Rendering Worker)
- **기술 스택**: Next.js, FastAPI, Go, Supabase, Redis, FFmpeg
- **외부 API**: OpenAI GPT-4o, YouTube Data API v3, Pexels API
- **인프라**: Vercel, Render, Fly.io, Stripe

**사용 시기**: 새 기술 도입 또는 아키텍처 변경 시 참고

---

### 4. [data-model.md](001-clippilot-mvp/data-model.md) - 데이터베이스 스키마

**목적**: 데이터베이스 테이블 구조와 관계를 정의합니다.

**내용:**
- **테이블**: 7개 (users, channels, templates, jobs, subscriptions, usage_logs, webhooks)
- **ERD**: 테이블 간 관계 다이어그램
- **RLS (Row Level Security)**: Supabase 보안 정책
- **인덱스**: 성능 최적화 인덱스

**사용 시기**: 데이터베이스 스키마 변경 또는 쿼리 최적화 시 참고

---

### 5. [tasks.md](001-clippilot-mvp/tasks.md) - 구현 태스크 목록

**목적**: MVP 개발의 170개 구체적인 구현 태스크를 관리합니다.

**내용:**
- **Phase별 그룹화**: Phase 1-11 (104개 MVP 태스크)
- **태스크 상태**: `[x]` 완료, `[ ]` 미완료
- **병렬 실행 표시**: `[P]` 표시로 독립적 태스크 구분
- **파일 경로**: 각 태스크에 구체적인 파일 경로 명시

**사용 시기**: 개발 작업 진행 시 참고 (자동화 스크립트로 처리 가능)

**현재 진행률:**
- Phase 1: 10/10 완료 ✅
- Phase 2: 17/17 완료 ✅
- Phase 3: 17/17 완료 ✅ (US0 Authentication)
- Phase 4: 0/13 (US6 YouTube OAuth - 진행 예정)
- Phase 5: 0/23 (US1 Content Generation - MVP CORE)
- Phase 6: 0/24 (US2 Rendering & Upload - MVP CORE)

---

### 6. [quickstart.md](001-clippilot-mvp/quickstart.md) - 개발 환경 가이드

**목적**: 로컬 개발 환경 설정 방법을 안내합니다.

**내용:**
- **필수 요구사항**: Node.js, Python, Go, Redis, FFmpeg 설치
- **Supabase 설정**: 테이블 생성, RLS 정책, Storage 버킷
- **환경 변수**: API 키 및 연결 정보 설정
- **서버 실행**: 통합 스크립트 또는 수동 실행 방법

**사용 시기**: 처음 개발 환경을 설정할 때 또는 새 개발자 온보딩 시

---

### 7. [contracts/api-v1.yaml](001-clippilot-mvp/contracts/api-v1.yaml) - OpenAPI 스펙

**목적**: REST API 엔드포인트를 OpenAPI 3.1 형식으로 정의합니다.

**내용:**
- **23개 엔드포인트**: 인증, 작업, 템플릿, 채널, 결제 API
- **요청/응답 스키마**: Pydantic 스키마와 일치
- **에러 응답**: 한국어 에러 메시지 정의
- **인증**: Bearer JWT 토큰 방식

**사용 시기**: API 개발 또는 프론트엔드 연동 시 참고

**주요 엔드포인트:**
- `/api/v1/auth/signup` - 회원가입 ✅
- `/api/v1/auth/login` - 로그인 ✅
- `/api/v1/jobs` - 작업 생성/조회
- `/api/v1/channels/oauth` - YouTube 인증
- `/api/v1/billing/webhook` - Stripe 웹훅

---

## 🎯 문서 활용 가이드

### 새 기능 추가 시 워크플로우

1. **spec.md** 확인: 요구사항 파악
2. **data-model.md** 확인: 필요한 테이블/컬럼 확인
3. **api-v1.yaml** 확인: API 엔드포인트 설계 파악
4. **tasks.md** 확인: 구체적인 구현 작업 확인
5. **plan.md** 확인: 우선순위 및 의존성 파악

### 문서 업데이트 규칙

1. **요구사항 변경 시**: spec.md → data-model.md → api-v1.yaml → tasks.md 순서로 업데이트
2. **기술 스택 변경 시**: research.md 업데이트 후 관련 문서 동기화
3. **태스크 완료 시**: tasks.md에 `[x]` 체크
4. **새 Phase 시작 시**: plan.md의 체크포인트 확인

### 개발 우선순위 (2025-11-03 기준)

**현재 완료:**
- ✅ Phase 1: Setup (T001-T010)
- ✅ Phase 2: Foundational Infrastructure (T011-T027)
- ✅ Phase 3: US0 Authentication (T028-T044)

**다음 작업:**
- 🔜 Phase 4: US6 YouTube OAuth (T045-T057) - P0
- 🔜 Phase 5: US1 Content Generation (T058-T080) - P0 **MVP CORE**
- 🔜 Phase 6: US2 Rendering & Upload (T081-T104) - P0 **MVP CORE**

**MVP 경로 (104 tasks):**
```
Setup → Foundational → US0 → US6 → US1 → US2
  ✅       ✅           ✅     🔜    🔜    🔜
```

---

## 📞 문서 관련 문의

- **이슈 트래커**: [GitHub Issues](https://github.com/drinkwhale/clippilot/issues)
- **Pull Requests**: [GitHub PRs](https://github.com/drinkwhale/clippilot/pulls)

---

**작성일**: 2025-11-03
**버전**: Phase 3 (US0 Authentication) 완료 기준
