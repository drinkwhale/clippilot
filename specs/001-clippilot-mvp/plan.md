# Implementation Plan: ClipPilot MVP - AI 숏폼 크리에이터 자동화 SaaS

**Branch**: `001-clippilot-mvp` | **Date**: 2025-10-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-clippilot-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

ClipPilot은 1인 크리에이터가 키워드 입력만으로 스크립트, 자막, 썸네일, 영상을 자동 생성하고 YouTube에 1클릭 업로드하는 SaaS 플랫폼입니다. 핵심 가치는 콘텐츠 생성 시간 80% 단축과 완전 자동화된 업로드 워크플로우입니다.

**기술 접근**:
- **프론트엔드**: Next.js (React) + Tailwind CSS로 SPA 구현
- **백엔드 API**: FastAPI (Python)로 비즈니스 로직 및 LLM 연동
- **렌더링 워커**: Go + FFmpeg로 고성능 영상 합성
- **작업 큐**: Redis + Celery로 비동기 작업 처리
- **데이터베이스**: Supabase (PostgreSQL + Auth + Storage)
- **외부 연동**: OpenAI API, YouTube Data API, Pexels API, Stripe

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.x + Next.js 14
- Backend API: Python 3.11 + FastAPI 0.109
- Rendering Worker: Go 1.21

**Primary Dependencies**:
- **Frontend**: Next.js, React 18, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend**: FastAPI, Pydantic, OpenAI Python SDK, google-api-python-client
- **Worker**: Go, FFmpeg, go-redis
- **Infrastructure**: Supabase (Auth, Postgres, Storage), Redis, Celery, Stripe SDK
- **External APIs**: OpenAI GPT-4o, YouTube Data API v3, Pexels API, Stripe

**Storage**:
- **Database**: Supabase PostgreSQL (users, channels, templates, jobs, subscriptions, usage_logs, webhooks)
- **Object Storage**: Supabase Storage (렌더링된 영상, 썸네일, 템플릿 assets)
- **Cache**: Redis (세션, 작업 큐, 속도 제한)

**Testing**:
- **Frontend**: Jest + React Testing Library
- **Backend**: pytest + pytest-asyncio + httpx
- **Worker**: Go testing package
- **E2E**: Playwright
- **Contract**: OpenAPI schema validation

**Target Platform**:
- **Frontend**: Vercel (Edge Functions + SSR)
- **Backend**: Render.com or Fly.io (Docker containers)
- **Worker**: Render.com or Fly.io (Background workers)
- **Browser**: Chrome/Safari/Firefox (최신 2버전)

**Project Type**: Web (Frontend + Backend API + Background Workers)

**Performance Goals**:
- API 응답: <3초 (NFR-001)
- 대시보드 로드: <1초 (NFR-003)
- 60초 영상 렌더링: 평균 3분 이내 (NFR-002)
- 동시 사용자: 1,000명 (NFR-004)
- 시스템 가용성: 99.5% (NFR-006)

**Constraints**:
- 월 인프라 비용: ≤10만원 (초기) (NFR-015)
- API Rate Limit: 60 req/min per user (NFR-017)
- YouTube API 할당량: 일일 10,000 units
- LLM 비용 모니터링: 일일 알람 (NFR-016)

**Scale/Scope**:
- 90일 목표: 160명 유료 사용자, MRR 300만원
- 플랜별 한도: Free 20회/월, Pro 500회/월, Agency 2,000회/월
- 데이터 보관: 사용자 데이터 30일, 결제 기록 5년(익명화)
- 초기 기능: 8개 User Stories (P0 4개, P1 3개, P2 1개)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (Constitution 파일이 템플릿 상태이므로 기본 원칙 적용)

프로젝트 Constitution이 아직 정의되지 않았으므로, 다음 기본 원칙들을 적용하여 검증합니다:

### I. 모듈화 및 관심사 분리
- ✅ Frontend, Backend API, Rendering Worker가 명확히 분리됨
- ✅ 각 계층이 독립적으로 배포 가능 (Vercel, Render/Fly.io)
- ✅ 계약 기반 통신 (REST API, Message Queue)

### II. 테스트 가능성
- ✅ 각 계층별 테스트 전략 정의 (Jest, pytest, Go test, Playwright)
- ✅ Contract 테스트를 통한 API 검증 계획
- ⚠️ TDD 적용 여부는 구현 시 확인 필요

### III. 관측성 (Observability)
- ✅ NFR-012~014: 구조화 로그, 메트릭, 알람 요구사항 명시
- ✅ 요청ID, 사용자ID, 작업ID 추적 가능
- ✅ 에러율, 렌더링 시간 등 실시간 모니터링 계획

### IV. 보안
- ✅ NFR-008~011: HTTPS, OAuth 토큰 암호화, 비밀번호 해시, 환경 변수 관리
- ✅ 최소 권한 원칙 (YouTube OAuth)
- ✅ GDPR/개인정보보호법 준수 (FR-025~027)

### V. 비용 효율성
- ✅ NFR-015~016: 월 10만원 이하, LLM 비용 모니터링
- ✅ 워커 자동 확장/축소 (NFR-005)
- ✅ Redis 캐싱으로 외부 API 호출 최소화

### VI. 확장성
- ✅ 큐 기반 비동기 처리 (Celery + Redis)
- ✅ 수평 확장 가능한 아키텍처 (Stateless API, Worker pool)
- ✅ CDN 활용 (Vercel Edge)

**재검증 시점**: Phase 1 Design 완료 후

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
clippilot/
├── frontend/                 # Next.js 웹 애플리케이션
│   ├── src/
│   │   ├── app/              # Next.js 14 App Router
│   │   │   ├── (auth)/       # 인증 관련 페이지 (login, signup)
│   │   │   ├── (dashboard)/  # 대시보드 레이아웃
│   │   │   │   ├── page.tsx  # 메인 대시보드
│   │   │   │   ├── projects/ # 프로젝트 목록/상세
│   │   │   │   ├── templates/# 템플릿 관리
│   │   │   │   └── settings/ # 설정 (채널, 플랜, 계정)
│   │   │   └── layout.tsx    # 루트 레이아웃
│   │   ├── components/       # 재사용 UI 컴포넌트
│   │   │   ├── ui/           # shadcn/ui 기본 컴포넌트
│   │   │   ├── auth/         # 인증 폼
│   │   │   ├── dashboard/    # 대시보드 위젯
│   │   │   ├── editor/       # 스크립트/자막 편집기
│   │   │   └── onboarding/   # 온보딩 모달
│   │   ├── lib/              # 유틸리티 및 헬퍼
│   │   │   ├── api/          # API 클라이언트
│   │   │   ├── hooks/        # Custom React Hooks
│   │   │   └── utils/        # 공통 유틸
│   │   └── types/            # TypeScript 타입 정의
│   ├── public/               # 정적 파일
│   └── tests/                # Frontend 테스트
│       ├── unit/
│       ├── integration/
│       └── e2e/
│
├── backend/                  # FastAPI 백엔드 API
│   ├── src/
│   │   ├── api/              # API 라우터
│   │   │   ├── v1/
│   │   │   │   ├── auth.py         # 인증 엔드포인트
│   │   │   │   ├── jobs.py         # 작업 생성/조회
│   │   │   │   ├── templates.py    # 템플릿 CRUD
│   │   │   │   ├── billing.py      # 결제/플랜
│   │   │   │   ├── channels.py     # YouTube 채널 관리
│   │   │   │   └── metrics.py      # 사용 통계
│   │   ├── core/             # 핵심 비즈니스 로직
│   │   │   ├── ai/           # LLM 연동 (OpenAI)
│   │   │   ├── youtube/      # YouTube API 연동
│   │   │   ├── media/        # 스톡 미디어 연동 (Pexels)
│   │   │   └── billing/      # Stripe 연동
│   │   ├── models/           # SQLAlchemy 모델
│   │   ├── schemas/          # Pydantic 스키마
│   │   ├── services/         # 서비스 레이어
│   │   ├── workers/          # Celery 태스크
│   │   │   ├── generate.py   # 콘텐츠 생성 태스크
│   │   │   ├── render.py     # 렌더링 요청 전송
│   │   │   └── upload.py     # YouTube 업로드
│   │   ├── middleware/       # 인증, 로깅, Rate Limiting
│   │   ├── config/           # 설정 파일
│   │   └── main.py           # FastAPI 앱 진입점
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── contract/
│   └── alembic/              # DB 마이그레이션
│
├── worker/                   # Go 렌더링 워커
│   ├── cmd/
│   │   └── worker/
│   │       └── main.go       # 워커 진입점
│   ├── internal/
│   │   ├── renderer/         # FFmpeg 래퍼
│   │   ├── queue/            # Redis 큐 리스너
│   │   ├── storage/          # Supabase Storage 연동
│   │   └── models/           # 데이터 모델
│   ├── pkg/                  # 재사용 패키지
│   └── tests/
│
├── shared/                   # 공유 리소스
│   ├── contracts/            # API 계약 (OpenAPI)
│   └── types/                # 공유 타입 정의
│
└── infra/                    # 인프라 설정
    ├── docker/
    │   ├── backend.Dockerfile
    │   └── worker.Dockerfile
    └── scripts/              # 배포 스크립트
```

**Structure Decision**:

**Web Application 구조 선택 (Option 2 기반 확장)**

1. **Frontend (Next.js)**: Vercel에 배포되는 SPA/SSR 하이브리드
   - App Router로 파일 기반 라우팅
   - Server Components로 초기 로드 최적화
   - TanStack Query로 서버 상태 관리

2. **Backend (FastAPI)**: Render/Fly.io에 Docker로 배포
   - REST API 제공
   - Celery로 백그라운드 작업 위임
   - Supabase Auth와 통합

3. **Worker (Go)**: Render/Fly.io에 독립 서비스로 배포
   - Redis 큐에서 렌더링 작업 소비
   - FFmpeg로 영상 합성
   - 결과를 Supabase Storage에 업로드

4. **Shared**: 계약과 타입을 공유하여 일관성 보장

5. **Infra**: Docker 및 배포 스크립트 집중 관리

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: N/A (위반 사항 없음)

모든 아키텍처 결정이 Constitution Check를 통과했습니다. 복잡도가 정당화되는 영역:

1. **3-Tier 아키텍처 (Frontend + Backend + Worker)**:
   - **이유**: 렌더링은 CPU 집약적이며 API와 분리 필수
   - **대안 거부**: 단일 서비스로는 렌더링 중 API 응답 지연 발생

2. **Celery + Redis 큐**:
   - **이유**: 비동기 작업 처리 및 재시도 메커니즘 필요
   - **대안 거부**: 동기 처리는 사용자 대기 시간 증가 및 타임아웃 위험

3. **Go Worker (Python 대신)**:
   - **이유**: FFmpeg 제어 및 성능, Go 동시성 모델이 렌더링에 적합
   - **대안 거부**: Python은 GIL로 인해 CPU 바운드 작업에 비효율적
