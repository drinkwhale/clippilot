# Tasks: ClipPilot MVP - AI 숏폼 크리에이터 자동화 SaaS

**Input**: Design documents from `/specs/001-clippilot-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-v1.yaml, quickstart.md

**Tests**: 테스트는 명세서에서 명시적으로 요청되지 않았으므로 생략합니다. TDD가 필요한 경우 각 User Story에 테스트 태스크를 추가하세요.

**Organization**: 태스크는 User Story별로 그룹화되어 각 스토리를 독립적으로 구현하고 테스트할 수 있습니다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 태스크가 속한 User Story (예: US0, US1, US2...)
- 설명에 정확한 파일 경로 포함

## Path Conventions

이 프로젝트는 Web Application 구조를 사용합니다:
- **Frontend**: `frontend/src/`
- **Backend**: `backend/src/`
- **Worker**: `worker/`
- **Shared**: `shared/`

---

## Phase 1: Setup (프로젝트 초기화)

**Purpose**: 프로젝트 구조 생성 및 기본 설정

- [x] T001 Create project directory structure per plan.md (frontend/, backend/, worker/, shared/, infra/)
- [x] T002 [P] Initialize frontend Next.js 14 project with TypeScript in frontend/
- [x] T003 [P] Initialize backend FastAPI project with Python 3.11 in backend/
- [x] T004 [P] Initialize worker Go 1.21 project in worker/
- [ ] T005 [P] Setup Supabase project and save credentials to .env files
- [x] T006 [P] Configure ESLint and Prettier for frontend in frontend/.eslintrc.json
- [x] T007 [P] Configure Black and isort for backend in backend/pyproject.toml
- [x] T008 [P] Setup Docker configuration in infra/docker/ (backend.Dockerfile, worker.Dockerfile)
- [x] T009 Create shared OpenAPI contract file in shared/contracts/api-v1.yaml (copy from specs/001-clippilot-mvp/contracts/)
- [x] T010 [P] Setup environment variable templates (.env.example) in each service directory

---

## Phase 2: Foundational (필수 기반 인프라)

**Purpose**: 모든 User Story 구현 전 완료되어야 하는 핵심 인프라

**⚠️ CRITICAL**: 이 Phase가 완료되기 전까지 User Story 작업 불가

- [x] T011 Run Supabase SQL migration from data-model.md (create tables, indexes, RLS policies)
- [x] T012 Setup Supabase Storage buckets (videos, thumbnails, templates) per quickstart.md
- [x] T013 [P] Create base Pydantic schemas in backend/src/schemas/base.py (BaseModel, TimestampMixin)
- [x] T014 [P] Create SQLAlchemy base model in backend/src/models/base.py with updated_at trigger
- [x] T015 [P] Setup Supabase client wrapper in backend/src/core/supabase.py
- [x] T016 [P] Implement OpenAI client wrapper in backend/src/core/ai/openai_client.py
- [x] T017 [P] Setup Redis connection pool in backend/src/core/redis_client.py
- [x] T018 [P] Setup Celery app configuration in backend/src/workers/celery_app.py
- [x] T019 [P] Create FastAPI app with CORS middleware in backend/src/main.py
- [x] T020 [P] Implement rate limiting middleware in backend/src/middleware/rate_limit.py (60 req/min per user, NFR-017)
- [x] T021 [P] Implement logging middleware with request ID in backend/src/middleware/logging.py (NFR-012)
- [x] T022 [P] Implement error handler middleware in backend/src/middleware/error_handler.py (한국어 메시지, FR-030)
- [x] T023 [P] Create Next.js API client wrapper in frontend/src/lib/api/client.ts
- [x] T024 [P] Setup TanStack Query provider in frontend/src/app/providers.tsx
- [x] T025 [P] Create Supabase client for frontend in frontend/src/lib/supabase.ts
- [x] T026 [P] Setup Go Redis queue listener in worker/internal/queue/listener.go
- [x] T027 [P] Create FFmpeg wrapper in worker/internal/renderer/ffmpeg.go

**Checkpoint**: Foundation ready - User Story 구현을 병렬로 시작 가능

---

## Phase 3: User Story 0 - 사용자 인증 및 회원가입 (Priority: P0) 🎯

**Goal**: 이메일/비밀번호 기반 회원가입, 로그인, 비밀번호 재설정 기능 제공

**Independent Test**: 사용자가 회원가입 후 로그인하여 대시보드에 접근 가능한지 확인

### Backend Implementation (US0)

- [x] T028 [P] [US0] Create User model in backend/src/models/user.py (id, email, plan, oauth_provider)
- [x] T029 [P] [US0] Create Subscription model in backend/src/models/subscription.py (user_id, plan, status)
- [x] T030 [P] [US0] Create User Pydantic schemas in backend/src/schemas/user.py (UserCreate, UserResponse)
- [x] T031 [P] [US0] Create auth schemas in backend/src/schemas/auth.py (SignupRequest, LoginRequest, TokenResponse)
- [x] T032 [US0] Implement AuthService in backend/src/services/auth_service.py (signup, login, reset_password)
- [x] T033 [US0] Implement auth middleware in backend/src/middleware/auth.py (JWT 검증, user 주입)
- [x] T034 [US0] Implement /auth/signup endpoint in backend/src/api/v1/auth.py (FR-021, FR-022)
- [x] T035 [US0] Implement /auth/login endpoint in backend/src/api/v1/auth.py (FR-023, 3회 실패 잠금)
- [x] T036 [US0] Implement /auth/reset-password endpoint in backend/src/api/v1/auth.py (FR-024)
- [x] T037 [US0] Implement /account DELETE endpoint in backend/src/api/v1/auth.py (FR-025, 30일 삭제)

### Frontend Implementation (US0)

- [x] T038 [P] [US0] Create auth store with Zustand in frontend/src/lib/stores/auth-store.ts
- [x] T039 [P] [US0] Create useAuth hook in frontend/src/lib/hooks/useAuth.ts
- [x] T040 [P] [US0] Create Signup page in frontend/src/app/(auth)/signup/page.tsx
- [x] T041 [P] [US0] Create Login page in frontend/src/app/(auth)/login/page.tsx
- [x] T042 [P] [US0] Create Password Reset page in frontend/src/app/(auth)/reset-password/page.tsx
- [x] T043 [US0] Create auth middleware for Next.js in frontend/src/middleware.ts (protect /dashboard routes)
- [x] T044 [US0] Add login attempt tracking and 15-minute lockout UI in frontend/src/app/(auth)/login/page.tsx

**Checkpoint**: 사용자가 회원가입, 로그인, 비밀번호 재설정을 완료할 수 있음 ✅

---

## Phase 4: User Story 6 - YouTube 채널 연동 및 OAuth 인증 (Priority: P0)

**Goal**: Google OAuth로 YouTube 채널을 안전하게 연결하여 영상 업로드 준비

**Independent Test**: 사용자가 YouTube 채널을 연결하고, 채널 정보가 대시보드에 표시되는지 확인

### Backend Implementation (US6)

- [x] T045 [P] [US6] Create Channel model in backend/src/models/channel.py (yt_channel_id, access_token_meta 암호화)
- [x] T046 [P] [US6] Create Channel schemas in backend/src/schemas/channel.py (ChannelCreate, ChannelResponse)
- [x] T047 [US6] Implement YouTubeService in backend/src/core/youtube/youtube_service.py (OAuth flow, token 관리)
- [x] T048 [US6] Implement /channels/oauth/youtube GET endpoint in backend/src/api/v1/channels.py (OAuth 시작, FR-012)
- [x] T049 [US6] Implement /channels/oauth/youtube/callback GET endpoint in backend/src/api/v1/channels.py (토큰 저장)
- [x] T050 [US6] Implement /channels GET endpoint in backend/src/api/v1/channels.py (연결된 채널 목록)
- [x] T051 [US6] Implement /channels/{id} DELETE endpoint in backend/src/api/v1/channels.py (채널 연결 해제)
- [x] T052 [US6] Add token expiry check and refresh logic in backend/src/core/youtube/youtube_service.py (FR-013)

### Frontend Implementation (US6)

- [x] T053 [P] [US6] Create useChannels hook in frontend/src/lib/hooks/useChannels.ts
- [x] T054 [P] [US6] Create ChannelList component in frontend/src/components/dashboard/ChannelList.tsx
- [x] T055 [US6] Create Connect YouTube Channel button in frontend/src/components/dashboard/ConnectChannelButton.tsx
- [x] T056 [US6] Add channel settings page in frontend/src/app/(dashboard)/settings/channels/page.tsx
- [x] T057 [US6] Add token expiry warning UI in frontend/src/components/dashboard/ChannelList.tsx (FR-013)

**Checkpoint**: 사용자가 YouTube 채널을 연결하고 관리할 수 있음 ✅

---

## Phase 5: User Story 1 - 프롬프트 기반 콘텐츠 자동 생성 (Priority: P0) 🎯 MVP CORE

**Goal**: 키워드 입력으로 스크립트, 자막(SRT), 썸네일 카피를 자동 생성

**Independent Test**: 사용자가 프롬프트를 입력하고 30초 이내에 완성된 스크립트, 자막, 썸네일 카피가 화면에 표시되는지 확인

### Backend Implementation (US1)

- [x] T058 [P] [US1] Create Job model in backend/src/models/job.py (prompt, status, script, srt, metadata_json)
- [x] T059 [P] [US1] Create UsageLog model in backend/src/models/usage_log.py (user_id, job_id, tokens, api_cost)
- [x] T060 [P] [US1] Create Job schemas in backend/src/schemas/job.py (JobCreate, JobResponse, JobUpdate)
- [x] T061 [US1] Implement ScriptGenerationService in backend/src/core/ai/script_service.py (OpenAI GPT-4o 연동, FR-001)
- [x] T062 [US1] Implement SubtitleService in backend/src/core/ai/subtitle_service.py (SRT 생성, FR-002)
- [x] T063 [US1] Implement MetadataService in backend/src/core/ai/metadata_service.py (제목, 설명, 태그 생성)
- [x] T064 [US1] Implement usage quota check in backend/src/services/quota_service.py (FR-008: Free 20회, Pro 500회)
- [x] T065 [US1] Implement Celery task for content generation in backend/src/workers/generate.py (queued → generating)
- [x] T066 [US1] Implement /jobs POST endpoint in backend/src/api/v1/jobs.py (프롬프트 검증, 큐 등록, FR-001)
- [x] T067 [US1] Implement /jobs GET endpoint in backend/src/api/v1/jobs.py (pagination, status filter, FR-010)
- [x] T068 [US1] Implement /jobs/{id} GET endpoint in backend/src/api/v1/jobs.py (상세 조회, FR-020)
- [x] T069 [US1] Implement /jobs/{id} PATCH endpoint in backend/src/api/v1/jobs.py (스크립트/자막 수정, FR-019)
- [x] T070 [US1] Add content filtering for 부적절한 콘텐츠 in backend/src/core/ai/script_service.py (FR-014)
- [x] T071 [US1] Add usage logging after generation in backend/src/workers/generate.py (tokens, cost tracking)

### Frontend Implementation (US1)

- [x] T072 [P] [US1] Create useJobs hook in frontend/src/lib/hooks/useJobs.ts
- [x] T073 [P] [US1] Create Project Create form in frontend/src/app/(dashboard)/projects/new/page.tsx
- [x] T074 [P] [US1] Create Script Editor component in frontend/src/components/editor/ScriptEditor.tsx
- [x] T075 [P] [US1] Create Subtitle Editor component in frontend/src/components/editor/SubtitleEditor.tsx
- [x] T076 [P] [US1] Create Metadata Editor component in frontend/src/components/editor/MetadataEditor.tsx
- [x] T077 [US1] Create Project List page in frontend/src/app/(dashboard)/projects/page.tsx (상태별 필터)
- [x] T078 [US1] Create Project Detail page in frontend/src/app/(dashboard)/projects/[id]/page.tsx
- [x] T079 [US1] Add real-time job status polling in frontend/src/lib/hooks/useJobStatus.ts (이미 useJob에 구현됨)
- [x] T080 [US1] Add quota exceeded warning UI in frontend/src/components/dashboard/QuotaWarning.tsx (FR-008)

**Checkpoint**: 사용자가 프롬프트로 콘텐츠를 생성하고 편집할 수 있음 ✅

---

## Phase 6: User Story 2 - 영상 렌더링 및 YouTube 자동 업로드 (Priority: P0) 🎯 MVP CORE

**Goal**: 생성된 콘텐츠를 영상으로 렌더링하고 YouTube에 1클릭 업로드

**Independent Test**: 생성된 콘텐츠를 선택하고 "YouTube 업로드" 버튼 클릭 시 3분 이내에 렌더링 완료 및 YouTube에 초안 업로드 확인

### Backend Implementation (US2)

- [x] T081 [US2] Implement MediaService for Pexels API in backend/src/core/media/pexels_service.py (스톡 영상/이미지 검색, FR-003)
- [x] T082 [US2] Implement Celery task for render request in backend/src/workers/render.py (Redis 큐에 렌더링 작업 전송)
- [x] T083 [US2] Implement Celery task for YouTube upload in backend/src/workers/upload.py (YouTube Data API 업로드, FR-005)
- [x] T084 [US2] Implement /jobs/{id}/retry POST endpoint in backend/src/api/v1/jobs.py (FR-011, FR-029)
- [x] T085 [US2] Implement /jobs/{id}/download GET endpoint in backend/src/api/v1/jobs.py (Supabase Storage 리디렉트, FR-029)
- [x] T086 [US2] Add retry logic with exponential backoff in backend/src/workers/upload.py (NFR-007, FR-011)
- [x] T087 [US2] Add YouTube API quota management in backend/src/core/youtube/youtube_service.py (Edge Case: 할당량 초과)
- [x] T088 [US2] Implement upload status tracking (draft/public/scheduled) in backend/src/workers/upload.py (FR-006)

### Worker Implementation (US2)

- [x] T089 [P] [US2] Create rendering job model in worker/internal/models/render_job.go
- [x] T090 [US2] Implement Redis queue consumer in worker/cmd/worker/main.go (listen to render_queue)
- [x] T091 [US2] Implement video composition logic in worker/internal/renderer/composer.go (FFmpeg 명령어 생성)
- [x] T092 [US2] Implement subtitle overlay in worker/internal/renderer/subtitle.go (SRT → FFmpeg filter)
- [x] T093 [US2] Implement intro/outro merging in worker/internal/renderer/intro_outro.go
- [x] T094 [US2] Implement watermark overlay in worker/internal/renderer/watermark.go
- [x] T095 [US2] Implement progress tracking in worker/internal/renderer/progress.go (stderr 파싱, FR-020)
- [x] T096 [US2] Upload rendered video to Supabase Storage in worker/internal/storage/uploader.go
- [x] T097 [US2] Add timeout handling (3-minute limit) in worker/internal/renderer/composer.go (NFR-002)
- [x] T098 [US2] Add error logging and Sentry integration in worker/internal/renderer/error_handler.go

### Frontend Implementation (US2)

- [x] T099 [P] [US2] Create Render & Upload button in frontend/src/components/editor/RenderButton.tsx
- [x] T100 [P] [US2] Create rendering progress bar in frontend/src/components/dashboard/RenderProgress.tsx (FR-020)
- [x] T101 [P] [US2] Create upload settings modal in frontend/src/components/editor/UploadSettingsModal.tsx (channel, privacy, schedule)
- [x] T102 [US2] Add error display with retry option in frontend/src/components/dashboard/JobErrorCard.tsx (FR-028, FR-029)
- [x] T103 [US2] Add video download button in frontend/src/components/dashboard/JobDetailCard.tsx (FR-029)
- [x] T104 [US2] Add YouTube video link after upload in frontend/src/components/dashboard/JobDetailCard.tsx

**Checkpoint**: 사용자가 콘텐츠를 영상으로 렌더링하고 YouTube에 업로드할 수 있음 ✅

---

## Phase 7: User Story 3 - 템플릿 및 브랜드 프리셋 관리 (Priority: P1)

**Goal**: 브랜드 아이덴티티를 템플릿으로 저장하고 재사용

**Independent Test**: 사용자가 템플릿을 생성/저장하고, 새 프로젝트에서 템플릿을 불러왔을 때 모든 브랜드 설정이 적용되는지 확인

### Backend Implementation (US3)

- [x] T105 [P] [US3] Create Template model in backend/src/models/template.py (brand_config_json, is_system_default)
- [x] T106 [P] [US3] Create Template schemas in backend/src/schemas/template.py (TemplateCreate, TemplateResponse)
- [x] T107 [US3] Implement TemplateService in backend/src/services/template_service.py (CRUD, validation)
- [x] T108 [US3] Implement /templates GET endpoint in backend/src/api/v1/templates.py (사용자 + 시스템 기본, FR-031)
- [x] T109 [US3] Implement /templates POST endpoint in backend/src/api/v1/templates.py (FR-007, FR-032)
- [x] T110 [US3] Implement /templates/{id} PUT endpoint in backend/src/api/v1/templates.py (FR-007)
- [x] T111 [US3] Implement /templates/{id} DELETE endpoint in backend/src/api/v1/templates.py (FR-007)
- [x] T112 [US3] Seed 3 system default templates in Supabase (리뷰, 뉴스, 교육, FR-031)

### Frontend Implementation (US3)

- [x] T113 [P] [US3] Create useTemplates hook in frontend/src/lib/hooks/useTemplates.ts
- [x] T114 [P] [US3] Create Template List component in frontend/src/components/templates/TemplateList.tsx
- [x] T115 [P] [US3] Create Template Editor modal in frontend/src/components/templates/TemplateEditor.tsx
- [x] T116 [US3] Create Templates page in frontend/src/app/(dashboard)/templates/page.tsx
- [x] T117 [US3] Add template selector to Project Create form in frontend/src/app/(dashboard)/projects/new/page.tsx
- [x] T118 [US3] Add template preview in frontend/src/components/templates/TemplatePreview.tsx

**Checkpoint**: 사용자가 템플릿을 생성, 저장, 재사용할 수 있음 ✅

---

## Phase 8: User Story 4 - 결제 및 플랜 관리 (Priority: P1)

**Goal**: Free → Pro/Agency 업그레이드, 플랜 변경, 해지 기능 제공

**Independent Test**: 사용자가 플랜 업그레이드를 완료하고 즉시 업그레이드된 한도가 적용되는지 확인

### Backend Implementation (US4)

- [x] T119 [P] [US4] Create Webhook model in backend/src/models/webhook.py (type, provider, payload_json)
- [x] T120 [P] [US4] Create billing schemas in backend/src/schemas/billing.py (CheckoutRequest, SubscriptionResponse)
- [x] T121 [US4] Implement StripeService in backend/src/core/billing/stripe_service.py (checkout, webhook)
- [x] T122 [US4] Implement /billing/checkout POST endpoint in backend/src/api/v1/billing.py (FR-009, FR-017)
- [x] T123 [US4] Implement /billing/portal POST endpoint in backend/src/api/v1/billing.py (Customer Portal)
- [x] T124 [US4] Implement /billing/subscription GET endpoint in backend/src/api/v1/billing.py
- [x] T125 [US4] Implement /billing/webhook POST endpoint in backend/src/api/v1/billing.py (signature 검증, FR-017)
- [x] T126 [US4] Add subscription status sync logic in backend/src/services/subscription_service.py (webhook 처리)
- [x] T127 [US4] Add plan upgrade immediate activation in backend/src/services/subscription_service.py (FR-009)
- [x] T128 [US4] Add plan downgrade at period end in backend/src/services/subscription_service.py (FR-009)

### Frontend Implementation (US4)

- [x] T129 [P] [US4] Create useSubscription hook in frontend/src/lib/hooks/useSubscription.ts
- [x] T130 [P] [US4] Create Pricing cards in frontend/src/components/billing/PricingCards.tsx
- [x] T131 [P] [US4] Create Subscription status card in frontend/src/components/dashboard/SubscriptionCard.tsx
- [x] T132 [US4] Create Billing settings page in frontend/src/app/(dashboard)/settings/billing/page.tsx
- [x] T133 [US4] Add upgrade CTA when quota exceeded in frontend/src/components/dashboard/QuotaWarning.tsx (FR-008)
- [x] T134 [US4] Add plan cancellation UI in frontend/src/app/(dashboard)/settings/billing/page.tsx

**Checkpoint**: 사용자가 플랜을 업그레이드, 변경, 해지할 수 있음 ✅

---

## Phase 9: User Story 7 - 신규 사용자 온보딩 (Priority: P1)

**Goal**: 회원가입 후 3단계 가이드로 YouTube 연결, 템플릿 선택, 첫 프로젝트 생성 안내

**Independent Test**: 신규 사용자가 회원가입부터 첫 프로젝트 완료까지 5분 이내에 완료할 수 있는지 확인

### Backend Implementation (US7)

- [x] T135 [US7] Add onboarding_completed field to User model in backend/src/models/user.py
- [x] T136 [US7] Implement onboarding status check endpoint /users/me/onboarding GET in backend/src/api/v1/users.py
- [x] T137 [US7] Implement onboarding completion endpoint /users/me/onboarding PUT in backend/src/api/v1/users.py (FR-037, FR-038)

### Frontend Implementation (US7)

- [x] T138 [P] [US7] Create OnboardingModal component in frontend/src/components/onboarding/OnboardingModal.tsx
- [x] T139 [P] [US7] Create Step 1: Connect YouTube in frontend/src/components/onboarding/Step1ConnectYouTube.tsx
- [x] T140 [P] [US7] Create Step 2: Select Template in frontend/src/components/onboarding/Step2SelectTemplate.tsx (기본 템플릿 3개 미리보기)
- [x] T141 [P] [US7] Create Step 3: First Project in frontend/src/components/onboarding/Step3FirstProject.tsx (샘플 프롬프트 미리 채움)
- [ ] T142 [US7] Add onboarding trigger on first login in frontend/src/app/(dashboard)/page.tsx
- [ ] T143 [US7] Add "Skip" and "Restart Onboarding" options in frontend/src/components/onboarding/OnboardingModal.tsx (FR-038)

**Checkpoint**: 신규 사용자가 온보딩을 통해 첫 프로젝트를 쉽게 생성할 수 있음 ✅

---

## Phase 10: User Story 5 - 대시보드 및 사용 현황 추적 (Priority: P2)

**Goal**: 생성 기록, 성공률, 렌더링 시간, 사용량을 한눈에 확인

**Independent Test**: 사용자가 대시보드에 접속했을 때 최근 30일간의 통계가 정확히 표시되는지 확인

### Backend Implementation (US5)

- [ ] T144 [US5] Implement MetricsService in backend/src/services/metrics_service.py (통계 집계 로직)
- [ ] T145 [US5] Implement /metrics/dashboard GET endpoint in backend/src/api/v1/metrics.py (7d/30d/90d, FR-015)
- [ ] T146 [US5] Implement /metrics/usage GET endpoint in backend/src/api/v1/metrics.py (월간 사용량, FR-033, FR-034)
- [ ] T147 [US5] Add usage alert logic (80% → 배너, 100% → 이메일) in backend/src/services/alert_service.py (FR-033, FR-034)

### Frontend Implementation (US5)

- [ ] T148 [P] [US5] Create useMetrics hook in frontend/src/lib/hooks/useMetrics.ts
- [ ] T149 [P] [US5] Create Dashboard Stats cards in frontend/src/components/dashboard/StatsCards.tsx (총 생성, 성공률, 평균 시간)
- [ ] T150 [P] [US5] Create Usage chart in frontend/src/components/dashboard/UsageChart.tsx (최근 30일)
- [ ] T151 [P] [US5] Create Job History table in frontend/src/components/dashboard/JobHistoryTable.tsx (상세 정보)
- [ ] T152 [US5] Create main Dashboard page in frontend/src/app/(dashboard)/page.tsx (위젯 조합)
- [ ] T153 [US5] Add 80% usage banner in frontend/src/components/dashboard/UsageBanner.tsx (FR-033)
- [ ] T154 [US5] Add channel filter for Agency users in frontend/src/components/dashboard/ChannelFilter.tsx

**Checkpoint**: 사용자가 대시보드에서 모든 통계를 확인할 수 있음 ✅

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: 전체 시스템 품질 향상 및 마무리

- [ ] T155 [P] Add Sentry error tracking to backend in backend/src/main.py
- [ ] T156 [P] Add Sentry error tracking to frontend in frontend/src/app/layout.tsx
- [ ] T157 [P] Implement structured logging across all services (NFR-012)
- [ ] T158 [P] Add OpenTelemetry tracing to critical paths in backend/src/middleware/tracing.py (NFR-012)
- [ ] T159 [P] Setup Grafana dashboard for metrics (NFR-013)
- [ ] T160 [P] Configure alert rules for error rate and queue length (NFR-014)
- [ ] T161 [P] Implement accessibility features (keyboard navigation, alt text, WCAG 2.1 AA) in frontend/ (NFR-019~021)
- [ ] T162 [P] Add API documentation to /docs endpoint using FastAPI auto-generated OpenAPI
- [ ] T163 [P] Create deployment scripts in infra/scripts/ (deploy-backend.sh, deploy-worker.sh)
- [ ] T164 [P] Setup GitHub Actions CI/CD in .github/workflows/ (test, lint, deploy)
- [ ] T165 Optimize database queries with connection pooling in backend/src/core/supabase.py
- [ ] T166 Add Redis caching for user plan and quota in backend/src/services/cache_service.py (10분 TTL)
- [ ] T167 Run security audit (dependency scan, OWASP checks)
- [ ] T168 Perform load testing (1,000 concurrent users, NFR-004)
- [ ] T169 Validate quickstart.md by following all steps in fresh environment
- [ ] T170 Write final README.md with project overview and setup instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 - 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 필요 - **모든 User Story를 블록**
- **User Stories (Phase 3~10)**: Foundational 완료 필요
  - 충분한 인력이 있으면 병렬 진행 가능
  - 또는 우선순위 순서대로 순차 진행 (P0 → P1 → P2)
- **Polish (Phase 11)**: 원하는 User Stories 완료 후

### User Story Dependencies

- **US0 (P0) 인증**: Foundational 완료 후 시작 - 다른 스토리와 독립
- **US6 (P0) YouTube 연동**: US0 완료 후 시작 (인증 필요) - 다른 스토리와 독립
- **US1 (P0) 콘텐츠 생성**: US0 완료 후 시작 - US2와 독립 (렌더링 전 단계)
- **US2 (P0) 렌더링/업로드**: US1, US6 완료 후 시작 (콘텐츠 + 채널 필요)
- **US3 (P1) 템플릿**: US0 완료 후 시작 - 다른 스토리와 독립
- **US4 (P1) 결제**: US0 완료 후 시작 - 다른 스토리와 독립
- **US7 (P1) 온보딩**: US0, US6, US1 완료 후 시작 (온보딩이 이들을 안내)
- **US5 (P2) 대시보드**: US1, US2 완료 후 시작 (통계 데이터 필요)

**핵심 경로** (MVP 최소):
```
Setup → Foundational → US0 → US6 → US1 → US2
```

### Parallel Opportunities

- **Setup (Phase 1)**: T002, T003, T004, T006, T007, T008, T010 병렬 가능 (다른 서비스)
- **Foundational (Phase 2)**: T013~T027 대부분 병렬 가능 (다른 파일)
- **User Story 내부**:
  - Models 태스크 ([P] 마크) 병렬 가능
  - Frontend components ([P] 마크) 병렬 가능
  - Services는 models 완료 후 순차
- **User Story 간**:
  - US0, US1, US3, US4는 서로 독립적이므로 병렬 진행 가능
  - US6는 US0 완료 후
  - US2는 US1, US6 완료 후
  - US7은 US0, US1, US6 완료 후
  - US5는 US1, US2 완료 후

---

## Parallel Example: User Story 1 (콘텐츠 생성)

```bash
# Models를 병렬로 생성:
Task T058: "Create Job model in backend/src/models/job.py"
Task T059: "Create UsageLog model in backend/src/models/usage_log.py"
Task T060: "Create Job schemas in backend/src/schemas/job.py"

# Services를 순차적으로 (models 의존):
Task T061: "Implement ScriptGenerationService in backend/src/core/ai/script_service.py"
Task T062: "Implement SubtitleService in backend/src/core/ai/subtitle_service.py"
Task T063: "Implement MetadataService in backend/src/core/ai/metadata_service.py"

# Frontend components를 병렬로:
Task T072: "Create useJobs hook in frontend/src/lib/hooks/useJobs.ts"
Task T073: "Create Project Create form in frontend/src/app/(dashboard)/projects/new/page.tsx"
Task T074: "Create Script Editor component in frontend/src/components/editor/ScriptEditor.tsx"
Task T075: "Create Subtitle Editor component in frontend/src/components/editor/SubtitleEditor.tsx"
Task T076: "Create Metadata Editor component in frontend/src/components/editor/MetadataEditor.tsx"
```

---

## Implementation Strategy

### MVP First (Minimum Viable Product)

**핵심 경로만 구현**:
1. Complete Phase 1: Setup (T001~T010)
2. Complete Phase 2: Foundational (T011~T027) ← CRITICAL BLOCKER
3. Complete Phase 3: US0 인증 (T028~T044)
4. Complete Phase 4: US6 YouTube 연동 (T045~T057)
5. Complete Phase 5: US1 콘텐츠 생성 (T058~T080)
6. Complete Phase 6: US2 렌더링/업로드 (T081~T104)
7. **STOP and VALIDATE**: 전체 워크플로우 테스트 (회원가입 → 콘텐츠 생성 → 업로드)
8. Deploy/Demo if ready

**MVP 범위**: US0 + US6 + US1 + US2 = **프롬프트로 YouTube 영상 자동 생성 및 업로드**

### Incremental Delivery

1. **Foundation** (Setup + Foundational) → 기반 인프라 완성
2. **MVP** (US0 + US6 + US1 + US2) → 핵심 가치 제공 ✅
3. **Enhancement 1** (US3 템플릿) → 브랜드 일관성 추가 ✅
4. **Enhancement 2** (US4 결제) → 수익화 시작 ✅
5. **Enhancement 3** (US7 온보딩) → 사용자 경험 개선 ✅
6. **Enhancement 4** (US5 대시보드) → 분석 기능 추가 ✅

각 단계마다 독립적으로 테스트, 배포, 데모 가능

### Parallel Team Strategy

**3명의 개발자가 있다면**:

1. **Week 1**: 모두 함께 Setup + Foundational 완료 (T001~T027)
2. **Week 2-3**: 병렬 작업
   - Developer A: US0 인증 + US6 YouTube (T028~T057)
   - Developer B: US1 콘텐츠 생성 (T058~T080)
   - Developer C: US2 렌더링 워커 (T089~T098)
3. **Week 4**: 통합 및 US2 Backend/Frontend (T081~T104)
4. **Week 5**: MVP 테스트 및 배포

---

## Task Summary

- **Total Tasks**: 170개
- **Setup (Phase 1)**: 10개
- **Foundational (Phase 2)**: 17개 ⚠️ BLOCKER
- **US0 인증 (P0)**: 17개
- **US6 YouTube (P0)**: 13개
- **US1 콘텐츠 생성 (P0)**: 23개 ← MVP CORE
- **US2 렌더링/업로드 (P0)**: 24개 ← MVP CORE
- **US3 템플릿 (P1)**: 14개
- **US4 결제 (P1)**: 16개
- **US7 온보딩 (P1)**: 9개
- **US5 대시보드 (P2)**: 11개
- **Polish (Final)**: 16개

**MVP 태스크 수**: T001~T104 = **104개 태스크**

**병렬 기회**: ~60% 태스크가 [P] 마크로 병렬 가능

---

## Validation Checklist

모든 태스크가 다음 형식을 준수합니다:

✅ Checkbox 형식: `- [ ]`
✅ Task ID 포함: `T001`, `T002`, ...
✅ [P] 마크: 병렬 가능 태스크만 표시
✅ [Story] 레이블: User Story 태스크만 표시 (US0, US1, ...)
✅ 명확한 설명: 정확한 파일 경로 포함
✅ User Story별 조직화: 독립적 구현 및 테스트 가능

---

## Notes

- **[P] 태스크**: 다른 파일, 의존성 없음 → 병렬 실행 가능
- **[Story] 레이블**: 태스크를 User Story에 매핑하여 추적성 확보
- **각 User Story는 독립적으로 완료 및 테스트 가능**
- **Checkpoint마다 검증**: 각 Phase 완료 후 독립적으로 테스트
- **각 태스크 또는 논리적 그룹 후 커밋**
- **모호한 태스크, 동일 파일 충돌, 스토리 간 의존성 회피**
- **테스트 생략**: 명세서에서 TDD를 명시적으로 요청하지 않음

---

**Generated by**: `/speckit.tasks` command
**Date**: 2025-10-27
**Branch**: `001-clippilot-mvp`
