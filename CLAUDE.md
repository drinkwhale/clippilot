# ClipPilot Development Guidelines

AI 숏폼 비디오 자동 생성 & YouTube 업로드 SaaS 플랫폼

Auto-generated from all feature plans. Last updated: 2025-10-27

---

## 1. 프로젝트 한 줄 요약

TypeScript/Next.js, Python/FastAPI, Go로 만든 AI 기반 숏폼 비디오 자동 생성 및 YouTube 업로드 SaaS 플랫폼

## 2. 현재 최우선 목표 (Current Goal)

**MVP 개발**: Setup → Foundational → US0 → US6 → US1 → US2 (104 tasks)
- Phase 2 (Foundational Infrastructure) 완료: 인증, 오류 처리, 로깅, 속도 제한 등 공통 인프라
- Phase 3 (US0 Authentication) 시작 예정

## 3. 기술 스택 (Tech Stack)

### Frontend
- **언어**: TypeScript 5.x
- **프레임워크**: Next.js 14 (App Router), React 18
- **스타일링**: Tailwind CSS, shadcn/ui
- **상태 관리**: TanStack Query
- **배포**: Vercel

### Backend API
- **언어**: Python 3.11
- **프레임워크**: FastAPI 0.109
- **ORM**: SQLAlchemy
- **작업 큐**: Celery + Redis
- **배포**: Render / Fly.io

### Rendering Worker
- **언어**: Go 1.21
- **비디오 처리**: FFmpeg 6.0
- **큐**: Redis
- **배포**: Render / Fly.io

### Infrastructure
- **데이터베이스**: Supabase PostgreSQL (Row Level Security)
- **인증**: Supabase Auth
- **스토리지**: Supabase Storage
- **결제**: Stripe
- **모니터링**: Sentry

### External APIs
- **AI**: OpenAI GPT-4o
- **동영상 업로드**: YouTube Data API v3
- **스톡 미디어**: Pexels API

### 테스트
- **Frontend**: Jest + React Testing Library + Playwright
- **Backend**: pytest + pytest-asyncio
- **Worker**: Go testing package
- **패키지 매니저**: npm (Frontend), pip (Backend), go mod (Worker)

## 4. 핵심 디렉토리 구조 (Core Directory Structure)

```text
clippilot/
├── frontend/                 # Next.js 웹 애플리케이션
│   ├── src/
│   │   ├── app/              # Next.js 14 App Router
│   │   │   ├── (auth)/       # 인증 라우트 그룹
│   │   │   ├── dashboard/    # 대시보드
│   │   │   └── api/          # API 라우트
│   │   ├── components/       # 재사용 UI 컴포넌트
│   │   │   ├── ui/           # shadcn/ui 컴포넌트
│   │   │   └── features/     # 기능별 컴포넌트
│   │   └── lib/              # 유틸리티 및 헬퍼
│   └── public/               # 정적 파일
│
├── backend/                  # FastAPI 백엔드 API
│   ├── src/
│   │   ├── api/v1/          # API 라우터
│   │   │   ├── auth.py      # 인증 엔드포인트
│   │   │   ├── jobs.py      # 작업 관리
│   │   │   ├── templates.py # 템플릿 관리
│   │   │   ├── channels.py  # YouTube 채널 관리
│   │   │   └── billing.py   # 결제 관리
│   │   ├── core/            # 핵심 비즈니스 로직
│   │   │   ├── ai/          # AI 서비스 (스크립트, 메타데이터 생성)
│   │   │   └── youtube/     # YouTube API 연동
│   │   ├── models/          # SQLAlchemy 모델
│   │   ├── workers/         # Celery 태스크
│   │   ├── middleware/      # FastAPI 미들웨어
│   │   └── config.py        # 설정 관리
│   └── tests/               # pytest 테스트
│
├── worker/                   # Go 렌더링 워커
│   ├── cmd/worker/          # 워커 진입점
│   ├── internal/
│   │   ├── renderer/        # FFmpeg 렌더링 로직
│   │   ├── queue/           # Redis 큐 연동
│   │   └── storage/         # Supabase Storage 업로드
│   └── pkg/                 # 공용 패키지
│
├── specs/001-clippilot-mvp/ # 기능 명세 및 설계 문서
│   ├── spec.md              # 요구사항 명세서
│   ├── plan.md              # 구현 계획
│   ├── research.md          # 기술 선정 문서
│   ├── data-model.md        # 데이터베이스 스키마
│   ├── tasks.md             # 구현 태스크 목록 (170개)
│   ├── quickstart.md        # 개발 환경 가이드
│   └── contracts/api-v1.yaml # OpenAPI 3.1 스펙
│
└── docs/                     # 문서
    └── clippilot.md         # 원본 기획 문서
```

## 5. 주요 로직 및 파일 (Key Logic & Files)

### Frontend (Next.js)
- **`frontend/src/app/(auth)/login/page.tsx`**: 로그인 페이지
- **`frontend/src/app/dashboard/page.tsx`**: 대시보드 메인
- **`frontend/src/components/features/JobCreator.tsx`**: 작업 생성 폼 컴포넌트
- **`frontend/src/lib/supabase.ts`**: Supabase 클라이언트 초기화

### Backend (FastAPI)
- **`backend/src/api/v1/jobs.py`**: 작업 생성/조회/수정 API 엔드포인트
- **`backend/src/core/ai/script_service.py`**: OpenAI GPT-4o 스크립트 생성 로직
  - `generate_script()`: 프롬프트 → 스크립트 생성 핵심 함수
- **`backend/src/core/youtube/upload_service.py`**: YouTube 업로드 로직
  - `upload_video()`: YouTube Data API v3 연동
- **`backend/src/workers/render_task.py`**: Celery 렌더링 작업 큐잉
- **`backend/src/middleware/auth.py`**: Supabase JWT 인증 미들웨어
- **`backend/src/models/job.py`**: Job 모델 (상태: queued → generating → rendering → uploading → done/failed)

### Worker (Go)
- **`worker/internal/renderer/ffmpeg.go`**: FFmpeg 비디오 렌더링 핵심 로직
  - `RenderVideo()`: 스크립트 + 스톡 영상 → 최종 영상 합성
- **`worker/internal/queue/consumer.go`**: Redis 큐에서 렌더링 작업 수신

### Specs & Docs
- **`specs/001-clippilot-mvp/spec.md`**: 8개 User Story, 40개 FR, 21개 NFR
- **`specs/001-clippilot-mvp/data-model.md`**: 7개 테이블 스키마 (users, channels, templates, jobs, subscriptions, usage_logs, webhooks)
- **`specs/001-clippilot-mvp/contracts/api-v1.yaml`**: 23개 API 엔드포인트 OpenAPI 스펙
- **`specs/001-clippilot-mvp/tasks.md`**: 170개 구현 태스크

## 6. 로컬 실행 및 테스트 방법 (How to Run & Test)

### 필수 준비사항
- Node.js 20.x, Python 3.11, Go 1.21, Redis, FFmpeg 설치
- Supabase 프로젝트 생성 및 테이블 스키마 적용 (`data-model.md` 참고)
- `.env` 파일 설정 (OpenAI, YouTube, Pexels, Stripe API 키)

### 로컬 실행
```bash
# Redis 실행
redis-server

# Backend API 실행
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000

# Celery Worker 실행
cd backend
celery -A src.workers.celery_app worker --loglevel=info

# Rendering Worker 실행
cd worker
go run cmd/worker/main.go

# Frontend 실행
cd frontend
npm install
npm run dev
```

### 테스트 실행
```bash
# Frontend 테스트
cd frontend
npm test                 # 단위 테스트
npm run test:e2e        # E2E 테스트

# Backend 테스트
cd backend
pytest                   # 전체 테스트
pytest tests/test_jobs.py  # 특정 테스트

# Worker 테스트
cd worker
go test ./...
```

### API 문서 확인
- Swagger UI: http://localhost:8000/docs
- OpenAPI Spec: `specs/001-clippilot-mvp/contracts/api-v1.yaml`

## 7. 중요 규칙 및 제약사항 (Rules & Constraints)

### 데이터베이스
- **RLS (Row Level Security) 필수**: 모든 테이블에 `auth.uid()` 기반 정책 적용
- **스키마 변경 시**: `data-model.md` 문서 업데이트 필수
- **OAuth 토큰 저장**: `pgcrypto` 확장으로 `access_token_meta` 암호화

### API 설계
- **모든 엔드포인트**: OpenAPI 3.1 스펙 (`api-v1.yaml`)과 일치해야 함
- **에러 응답 형식**: `{"error": {"code": "string", "message": "한국어 메시지"}}` (FR-030)
- **속도 제한**: 사용자당 60 req/min (NFR-017)
- **인증**: 모든 엔드포인트는 Supabase JWT Bearer 토큰 필수

### 성능 요구사항
- **NFR-001**: 콘텐츠 생성 API는 3초 이내 응답 (큐 처리 제외)
- **NFR-002**: 60초 영상 렌더링은 평균 3분 이내 완료
- **NFR-003**: 대시보드는 1초 이내 로드

### 코드 스타일
- **Frontend**: ESLint + Prettier (Airbnb 스타일 가이드)
- **Backend**: Black + isort + flake8 (PEP 8)
- **Worker**: gofmt + golangci-lint

### Git Workflow
- **브랜치 전략**: Feature Branch Workflow
  - `main`: 프로덕션
  - `001-clippilot-mvp`: MVP 개발
  - `feature/T{task-id}`: 개별 태스크 브랜치
- **커밋 메시지**: Conventional Commits 형식 (`feat:`, `fix:`, `docs:`, etc.)

### 보안
- **NFR-008**: 모든 API 통신은 HTTPS
- **NFR-009**: YouTube OAuth 토큰은 암호화 저장
- **NFR-010**: 비밀번호는 bcrypt 해싱 (Supabase Auth 자동 처리)

## 8. 모듈별 가이드 (claude.md 중첩 사용 규칙)

**중요**: 특정 서브디렉토리의 파일을 사용하거나 읽어야 할 때, 작업을 시작하기 전 해당 디렉토리 내 `claude.md` 파일을 먼저 확인하고 그 컨텍스트를 최우선으로 적용할 것.

### 예시: `frontend/claude.md`
```markdown
# 모듈: Frontend (Next.js)
- **역할**: 사용자 인터페이스 및 클라이언트 사이드 로직
- **규칙 1**: 모든 API 호출은 `src/lib/api.ts`의 래퍼 함수를 사용할 것
- **규칙 2**: 컴포넌트는 shadcn/ui 스타일 가이드를 따를 것
- **규칙 3**: 인증 상태는 Supabase Auth의 `useUser()` 훅 사용
```

### 예시: `backend/claude.md`
```markdown
# 모듈: Backend API
- **역할**: 비즈니스 로직 및 외부 API 연동
- **규칙 1**: 모든 라우터는 `src/api/v1/`에 위치하며 `/api/v1` prefix 사용
- **규칙 2**: 비즈니스 로직은 `src/core/`의 서비스 클래스로 분리
- **규칙 3**: 에러 처리는 `src/core/exceptions.py`의 커스텀 예외 사용
```

## 9. Task 구현 자동화 (Task Implementation Agent)

**중요**: 사용자가 "T{번호}까지 진행해줘", "Phase {번호} 진행해줘", "다음 작업 진행해줘"라고 요청하면, 반드시 `~/.claude/prompts/task-implementation-agent.md` 파일을 읽고 그 내용에 따라 작업을 수행할 것.

### Task 구현 자동화 프로세스 개요

1. **작업 시작 전 확인**
   - `tasks.md` 파일 위치 확인 (`specs/001-clippilot-mvp/tasks.md`)
   - 다음 작업할 Task 확인 (현재: Phase 2 Foundational)
   - Phase 브랜치 확인/생성

2. **Task별 반복 워크플로우**
   - **Step 1**: 브랜치 준비 (Phase 브랜치 → Task 브랜치 생성)
   - **Step 2**: 구현 (tasks.md에 명시된 파일에 코드 작성)
   - **Step 3**: tasks.md 업데이트 (`[ ]` → `[x]`)
   - **Step 4**: Commit & Push (HEREDOC 사용)
   - **Step 5**: Phase 브랜치로 Merge

3. **완료 보고**
   - 구현된 Task 목록
   - 총 구현 내역
   - 다음 단계 안내

### 사용 예시
```bash
# 사용자 요청
"T027까지 진행해줘"   # Phase 2 완료
"Phase 3 진행해줘"    # US0 Authentication 전체 구현
"다음 작업 진행해줘"   # 현재 미완료 Task 중 다음 작업
```

### MVP 경로 (104 tasks)
```
Phase 1: Setup (T001-T010) ✅
  ↓
Phase 2: Foundational (T011-T027) ⚠️ CRITICAL BLOCKER [현재 진행 중]
  ↓
Phase 3: US0 Authentication (T028-T044) - P0
  ↓
Phase 4: US6 YouTube OAuth (T045-T057) - P0
  ↓
Phase 5: US1 Content Generation (T058-T080) - P0 MVP CORE
  ↓
Phase 6: US2 Rendering/Upload (T081-T104) - P0 MVP CORE
```

## Active Technologies

- **Frontend**: Next.js 14, TypeScript 5.x, React 18, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend**: FastAPI, Python 3.11, Celery, Redis, SQLAlchemy, Pydantic
- **Worker**: Go 1.21, FFmpeg 6.0
- **Infrastructure**: Supabase (Auth, PostgreSQL, Storage), Stripe, Sentry
- **External APIs**: OpenAI GPT-4o, YouTube Data API v3, Pexels API

## Commands

### Development
```bash
# Frontend
npm run dev              # 개발 서버 실행 (http://localhost:3000)
npm test                 # 단위 테스트
npm run test:e2e         # E2E 테스트
npm run build            # 프로덕션 빌드
npm run lint             # ESLint 실행

# Backend
uvicorn src.main:app --reload --port 8000  # 개발 서버
pytest                                      # 테스트 실행
black .                                     # 코드 포맷팅
flake8 .                                    # 린팅

# Worker
go run cmd/worker/main.go  # 워커 실행
go test ./...              # 테스트 실행
gofmt -w .                 # 코드 포맷팅
```

### Task Management
```bash
# Task 구현 자동화
"T027까지 진행해줘"     # 특정 Task까지 구현
"Phase 2 진행해줘"      # 특정 Phase 전체 구현
"다음 작업 진행해줘"     # 다음 미완료 Task 구현
```

## Code Style

- **Frontend**: ESLint + Prettier (Airbnb 스타일 가이드)
- **Backend**: Black + isort + flake8 (PEP 8)
- **Worker**: gofmt + golangci-lint
- **Git**: Conventional Commits 형식

## Recent Changes

- 2025-10-27: 001-clippilot-mvp 브랜치 생성 및 전체 스펙 문서 완료
- 2025-10-27: spec.md, plan.md, research.md, data-model.md, tasks.md, api-v1.yaml 생성
- 2025-10-27: README.md 추가 및 CLAUDE.md 업데이트

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
