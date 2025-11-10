# ClipPilot MVP 테스트 전략

**작성일**: 2025-11-10
**기준 문서**: `specs/001-clippilot-mvp/tasks.md`
**목적**: 구현된 Phase별 기능에 대한 체계적인 테스트 계획 수립

---

## 📋 테스트 개요

### 테스트 범위
- **Phase 1 (Setup)**: ✅ 완료 - 프로젝트 구조 검증
- **Phase 2 (Foundational)**: ✅ 완료 - 공통 인프라 테스트
- **Phase 3 (US0 Authentication)**: ✅ 완료 - 인증 시스템 테스트
- **Phase 4 (US6 YouTube OAuth)**: ✅ 완료 - YouTube 연동 테스트
- **Phase 5 (US1 Content Generation)**: ✅ 완료 - 콘텐츠 생성 테스트
- **Phase 6 (US2 Rendering/Upload)**: ✅ 완료 - 렌더링/업로드 테스트
- **Phase 7 (US3 Templates)**: ✅ 완료 - 템플릿 관리 테스트
- **Phase 8 (US4 Billing)**: ✅ 완료 - 결제 시스템 테스트
- **Phase 9 (US7 Onboarding)**: ✅ 완료 - 온보딩 플로우 테스트
- **Phase 10 (US5 Dashboard)**: ✅ 완료 - 대시보드 테스트

### 테스트 전략
- **단위 테스트 (Unit Tests)**: 개별 함수/컴포넌트 검증
- **통합 테스트 (Integration Tests)**: API 엔드포인트 및 서비스 간 연동
- **E2E 테스트 (End-to-End Tests)**: 사용자 여정 전체 플로우
- **성능 테스트 (Performance Tests)**: NFR 요구사항 검증

---

## 🧪 Phase별 테스트 계획

### Phase 1: Setup (프로젝트 초기화)

**목적**: 프로젝트 구조 및 기본 설정 검증

#### 체크리스트
- [ ] **디렉토리 구조 검증**
  - `frontend/`, `backend/`, `worker/`, `shared/`, `infra/` 디렉토리 존재
  - 각 디렉토리 내 필수 파일 존재 확인

- [ ] **의존성 설치 확인**
  - Frontend: `npm install` 성공 여부
  - Backend: `pip install -r requirements.txt` 성공 여부
  - Worker: `go mod download` 성공 여부

- [ ] **환경 변수 템플릿 검증**
  - `.env.example` 파일 존재 및 필수 변수 포함 여부

- [ ] **Docker 설정 검증**
  - `infra/docker/backend.Dockerfile` 빌드 성공
  - `infra/docker/worker.Dockerfile` 빌드 성공

- [ ] **OpenAPI 스펙 검증**
  - `shared/contracts/api-v1.yaml` 파일 유효성 검증

#### 테스트 명령어
```bash
# 구조 검증
ls -la frontend/ backend/ worker/ shared/ infra/

# 의존성 설치 테스트
cd frontend && npm install && cd ..
cd backend && pip install -r requirements.txt && cd ..
cd worker && go mod download && cd ..

# Docker 빌드 테스트
docker build -f infra/docker/backend.Dockerfile -t backend:test .
docker build -f infra/docker/worker.Dockerfile -t worker:test .
```

---

### Phase 2: Foundational (필수 기반 인프라)

**목적**: 모든 User Story 구현 전 핵심 인프라 검증

#### Backend Infrastructure Tests

##### 1. Database & Models (T011-T014)
- [ ] **Supabase 연결 테스트**
  ```python
  # tests/test_core_supabase.py
  def test_supabase_client_connection():
      """Supabase 클라이언트 연결 성공"""
      pass

  def test_supabase_storage_buckets():
      """videos, thumbnails, templates 버킷 존재 확인"""
      pass
  ```

- [ ] **Base Models 검증**
  ```python
  # tests/test_models_base.py
  def test_base_model_timestamps():
      """TimestampMixin created_at/updated_at 자동 생성"""
      pass

  def test_updated_at_trigger():
      """updated_at 자동 업데이트 트리거 작동"""
      pass
  ```

##### 2. Core Services (T015-T018)
- [ ] **OpenAI Client 테스트**
  ```python
  # tests/test_core_ai_openai.py
  def test_openai_client_initialization():
      """OpenAI 클라이언트 초기화"""
      pass

  def test_openai_api_call():
      """GPT-4o API 호출 성공 (Mock)"""
      pass
  ```

- [ ] **Redis 연결 테스트**
  ```python
  # tests/test_core_redis.py
  def test_redis_connection_pool():
      """Redis 연결 풀 생성 성공"""
      pass

  def test_redis_set_get():
      """Redis SET/GET 작동"""
      pass
  ```

- [ ] **Celery 설정 테스트**
  ```python
  # tests/test_workers_celery_app.py
  def test_celery_app_initialization():
      """Celery 앱 초기화"""
      pass

  def test_celery_task_registration():
      """Celery 태스크 등록 확인"""
      pass
  ```

##### 3. Middleware (T019-T022)
- [ ] **Rate Limiting 테스트**
  ```python
  # tests/test_middleware_rate_limit.py
  def test_rate_limit_enforcement():
      """60 req/min 제한 적용 (NFR-017)"""
      pass

  def test_rate_limit_reset():
      """1분 경과 후 카운터 리셋"""
      pass
  ```

- [ ] **Logging Middleware 테스트**
  ```python
  # tests/test_middleware_logging.py
  def test_request_id_injection():
      """모든 요청에 request_id 주입 (NFR-012)"""
      pass

  def test_log_format():
      """로그 포맷 검증"""
      pass
  ```

- [ ] **Error Handler 테스트**
  ```python
  # tests/test_middleware_error_handler.py
  def test_error_response_format():
      """에러 응답 형식: {"error": {"code", "message"}} (FR-030)"""
      pass

  def test_korean_error_messages():
      """한국어 에러 메시지 반환"""
      pass
  ```

#### Frontend Infrastructure Tests

##### 4. API Client & Providers (T023-T025)
- [ ] **API Client 테스트**
  ```typescript
  // tests/lib/api/client.test.ts
  describe('API Client', () => {
    it('should initialize with base URL', () => {});
    it('should attach auth token to requests', () => {});
    it('should handle 401 errors', () => {});
  });
  ```

- [ ] **TanStack Query Provider 테스트**
  ```typescript
  // tests/app/providers.test.tsx
  describe('QueryProvider', () => {
    it('should wrap app with QueryClientProvider', () => {});
    it('should configure default query options', () => {});
  });
  ```

- [ ] **Supabase Client 테스트**
  ```typescript
  // tests/lib/supabase.test.ts
  describe('Supabase Client', () => {
    it('should create client with credentials', () => {});
    it('should handle auth state changes', () => {});
  });
  ```

#### Worker Infrastructure Tests

##### 5. Queue & FFmpeg (T026-T027)
- [ ] **Redis Queue Listener 테스트**
  ```go
  // worker/internal/queue/listener_test.go
  func TestQueueListener(t *testing.T) {
      // Redis 큐에서 작업 수신 테스트
  }
  ```

- [ ] **FFmpeg Wrapper 테스트**
  ```go
  // worker/internal/renderer/ffmpeg_test.go
  func TestFFmpegVersion(t *testing.T) {
      // FFmpeg 버전 확인
  }

  func TestFFmpegBasicCommand(t *testing.T) {
      // 기본 FFmpeg 명령어 실행
  }
  ```

#### 통합 테스트
- [ ] **Foundational Infrastructure Integration**
  ```bash
  # 전체 인프라 통합 테스트
  pytest tests/integration/test_infrastructure.py
  npm run test:integration
  go test ./tests/integration/...
  ```

---

### Phase 3: User Story 0 - 사용자 인증 및 회원가입

**Goal**: 이메일/비밀번호 기반 회원가입, 로그인, 비밀번호 재설정 검증

#### Backend Tests (T028-T037)

##### 1. Models & Schemas (T028-T031)
- [ ] **User Model 테스트**
  ```python
  # tests/test_models_user.py
  def test_user_creation():
      """User 모델 생성 (id, email, plan, oauth_provider)"""
      pass

  def test_user_plan_default():
      """기본 플랜은 'free'"""
      pass
  ```

- [ ] **Subscription Model 테스트**
  ```python
  # tests/test_models_subscription.py
  def test_subscription_creation():
      """Subscription 모델 생성 (user_id, plan, status)"""
      pass

  def test_subscription_user_relationship():
      """User와 Subscription 관계"""
      pass
  ```

- [ ] **Schemas 검증**
  ```python
  # tests/test_schemas_auth.py
  def test_signup_request_validation():
      """SignupRequest 스키마 검증"""
      pass

  def test_login_request_validation():
      """LoginRequest 스키마 검증"""
      pass

  def test_token_response_format():
      """TokenResponse 형식 검증"""
      pass
  ```

##### 2. AuthService Tests (T032)
- [ ] **AuthService 로직 테스트**
  ```python
  # tests/test_services_auth.py
  def test_signup_success():
      """회원가입 성공 (FR-021, FR-022)"""
      pass

  def test_signup_duplicate_email():
      """중복 이메일 가입 방지"""
      pass

  def test_login_success():
      """로그인 성공"""
      pass

  def test_login_invalid_credentials():
      """잘못된 자격증명 처리"""
      pass

  def test_reset_password():
      """비밀번호 재설정 (FR-024)"""
      pass
  ```

##### 3. Auth Middleware Tests (T033)
- [ ] **JWT 검증 테스트**
  ```python
  # tests/test_middleware_auth.py
  def test_valid_jwt_passes():
      """유효한 JWT 통과"""
      pass

  def test_invalid_jwt_rejected():
      """유효하지 않은 JWT 거부"""
      pass

  def test_missing_jwt_rejected():
      """JWT 누락 시 401 반환"""
      pass

  def test_user_injection():
      """인증된 사용자 정보 주입"""
      pass
  ```

##### 4. Auth API Endpoints (T034-T037)
- [ ] **POST /auth/signup**
  ```python
  # tests/test_api_auth.py
  def test_signup_endpoint():
      """회원가입 엔드포인트 (FR-021, FR-022)"""
      pass

  def test_signup_validation_errors():
      """입력 검증 오류 처리"""
      pass
  ```

- [ ] **POST /auth/login**
  ```python
  def test_login_endpoint():
      """로그인 엔드포인트 (FR-023)"""
      pass

  def test_login_rate_limiting():
      """3회 실패 시 15분 잠금"""
      pass
  ```

- [ ] **POST /auth/reset-password**
  ```python
  def test_reset_password_endpoint():
      """비밀번호 재설정 엔드포인트 (FR-024)"""
      pass

  def test_reset_password_token_expiry():
      """재설정 토큰 만료 처리"""
      pass
  ```

- [ ] **DELETE /account**
  ```python
  def test_account_deletion():
      """계정 삭제 엔드포인트 (FR-025)"""
      pass

  def test_account_deletion_30day_wait():
      """30일 후 완전 삭제 확인"""
      pass
  ```

#### Frontend Tests (T038-T044)

##### 5. Auth Store & Hooks (T038-T039)
- [ ] **Zustand Auth Store 테스트**
  ```typescript
  // tests/lib/stores/auth-store.test.ts
  describe('Auth Store', () => {
    it('should initialize with null user', () => {});
    it('should update user on login', () => {});
    it('should clear user on logout', () => {});
  });
  ```

- [ ] **useAuth Hook 테스트**
  ```typescript
  // tests/lib/hooks/useAuth.test.ts
  describe('useAuth Hook', () => {
    it('should return auth state', () => {});
    it('should provide login function', () => {});
    it('should provide logout function', () => {});
  });
  ```

##### 6. Auth Pages (T040-T042)
- [ ] **Signup Page 테스트**
  ```typescript
  // tests/app/(auth)/signup/page.test.tsx
  describe('Signup Page', () => {
    it('should render signup form', () => {});
    it('should validate email format', () => {});
    it('should call signup API on submit', () => {});
    it('should show error on failure', () => {});
  });
  ```

- [ ] **Login Page 테스트**
  ```typescript
  // tests/app/(auth)/login/page.test.tsx
  describe('Login Page', () => {
    it('should render login form', () => {});
    it('should call login API on submit', () => {});
    it('should show lockout message after 3 failures', () => {});
    it('should redirect to dashboard on success', () => {});
  });
  ```

- [ ] **Password Reset Page 테스트**
  ```typescript
  // tests/app/(auth)/reset-password/page.test.tsx
  describe('Password Reset Page', () => {
    it('should render reset form', () => {});
    it('should send reset email', () => {});
    it('should show success message', () => {});
  });
  ```

##### 7. Auth Middleware (T043-T044)
- [ ] **Next.js Middleware 테스트**
  ```typescript
  // tests/middleware.test.ts
  describe('Auth Middleware', () => {
    it('should redirect unauthenticated users to login', () => {});
    it('should allow authenticated users to dashboard', () => {});
    it('should allow public routes', () => {});
  });
  ```

#### E2E Tests (User Journey)
- [ ] **회원가입 → 로그인 → 대시보드 접근**
  ```typescript
  // tests/e2e/auth-flow.spec.ts
  describe('Authentication Flow', () => {
    it('complete signup and login journey', async () => {
      // 1. 회원가입 페이지 접속
      // 2. 이메일/비밀번호 입력 및 제출
      // 3. 로그인 페이지로 이동
      // 4. 로그인 수행
      // 5. 대시보드 접근 확인
    });
  });
  ```

---

### Phase 4: User Story 6 - YouTube 채널 연동 및 OAuth 인증

**Goal**: Google OAuth로 YouTube 채널을 안전하게 연결하여 영상 업로드 준비

#### Backend Tests (T045-T052)

##### 1. Channel Model & Schemas (T045-T046)
- [ ] **Channel Model 테스트**
  ```python
  # tests/test_models_channel.py
  def test_channel_creation():
      """Channel 모델 생성 (yt_channel_id, access_token_meta)"""
      pass

  def test_channel_token_encryption():
      """access_token_meta 암호화 저장 (pgcrypto)"""
      pass
  ```

- [ ] **Channel Schemas 검증**
  ```python
  # tests/test_schemas_channel.py
  def test_channel_create_schema():
      """ChannelCreate 스키마 검증"""
      pass

  def test_channel_response_schema():
      """ChannelResponse 형식 검증"""
      pass
  ```

##### 2. YouTubeService Tests (T047, T052)
- [ ] **OAuth Flow 테스트**
  ```python
  # tests/test_core_youtube_service.py
  def test_oauth_authorization_url():
      """OAuth 인증 URL 생성 (FR-012)"""
      pass

  def test_oauth_token_exchange():
      """인증 코드 → 토큰 교환"""
      pass

  def test_token_refresh():
      """토큰 만료 시 자동 갱신 (FR-013)"""
      pass

  def test_token_expiry_check():
      """토큰 만료 체크 로직"""
      pass
  ```

##### 3. Channel API Endpoints (T048-T051)
- [ ] **GET /channels/oauth/youtube**
  ```python
  # tests/test_api_channels.py
  def test_oauth_start():
      """OAuth 시작 엔드포인트 (FR-012)"""
      pass

  def test_oauth_redirect_url():
      """올바른 Google OAuth URL 리디렉트"""
      pass
  ```

- [ ] **GET /channels/oauth/youtube/callback**
  ```python
  def test_oauth_callback():
      """OAuth 콜백 처리"""
      pass

  def test_token_storage():
      """토큰 암호화 저장 확인"""
      pass
  ```

- [ ] **GET /channels**
  ```python
  def test_list_channels():
      """연결된 채널 목록 조회"""
      pass

  def test_empty_channels_list():
      """채널 없을 때 빈 배열 반환"""
      pass
  ```

- [ ] **DELETE /channels/{id}**
  ```python
  def test_delete_channel():
      """채널 연결 해제"""
      pass

  def test_delete_nonexistent_channel():
      """존재하지 않는 채널 삭제 시 404"""
      pass
  ```

#### Frontend Tests (T053-T057)

##### 4. Channel Hooks & Components (T053-T055)
- [ ] **useChannels Hook 테스트**
  ```typescript
  // tests/lib/hooks/useChannels.test.ts
  describe('useChannels Hook', () => {
    it('should fetch channels list', () => {});
    it('should handle empty channels', () => {});
    it('should delete channel', () => {});
  });
  ```

- [ ] **ChannelList Component 테스트**
  ```typescript
  // tests/components/dashboard/ChannelList.test.tsx
  describe('ChannelList Component', () => {
    it('should render channels', () => {});
    it('should show token expiry warning (FR-013)', () => {});
    it('should call delete on remove', () => {});
  });
  ```

- [ ] **ConnectChannelButton 테스트**
  ```typescript
  // tests/components/dashboard/ConnectChannelButton.test.tsx
  describe('ConnectChannelButton', () => {
    it('should render connect button', () => {});
    it('should redirect to OAuth URL on click', () => {});
  });
  ```

##### 5. Channel Settings Page (T056-T057)
- [ ] **Channel Settings Page 테스트**
  ```typescript
  // tests/app/(dashboard)/settings/channels/page.test.tsx
  describe('Channel Settings Page', () => {
    it('should render channel list', () => {});
    it('should show connect button', () => {});
    it('should display token expiry warnings', () => {});
  });
  ```

#### E2E Tests (User Journey)
- [ ] **YouTube 채널 연결 전체 플로우**
  ```typescript
  // tests/e2e/youtube-oauth.spec.ts
  describe('YouTube OAuth Flow', () => {
    it('complete YouTube channel connection', async () => {
      // 1. 대시보드 접속
      // 2. "YouTube 채널 연결" 버튼 클릭
      // 3. Google OAuth 페이지로 이동
      // 4. (Mock) 인증 완료 및 콜백
      // 5. 채널 정보 대시보드에 표시 확인
    });
  });
  ```

---

### Phase 5: User Story 1 - 프롬프트 기반 콘텐츠 자동 생성

**Goal**: 키워드 입력으로 스크립트, 자막(SRT), 썸네일 카피를 자동 생성

#### Backend Tests (T058-T071)

##### 1. Job & UsageLog Models (T058-T060)
- [ ] **Job Model 테스트**
  ```python
  # tests/test_models_job.py
  def test_job_creation():
      """Job 모델 생성 (prompt, status, script, srt, metadata_json)"""
      pass

  def test_job_status_transitions():
      """상태 전환: queued → generating → rendering → done/failed"""
      pass
  ```

- [ ] **UsageLog Model 테스트**
  ```python
  # tests/test_models_usage_log.py
  def test_usage_log_creation():
      """UsageLog 생성 (user_id, job_id, tokens, api_cost)"""
      pass
  ```

##### 2. AI Services Tests (T061-T063)
- [ ] **ScriptGenerationService 테스트**
  ```python
  # tests/test_core_ai_script_service.py
  def test_generate_script():
      """GPT-4o 스크립트 생성 (FR-001)"""
      pass

  def test_script_length_validation():
      """스크립트 길이 검증 (60초 기준)"""
      pass

  def test_content_filtering():
      """부적절한 콘텐츠 필터링 (FR-014)"""
      pass
  ```

- [ ] **SubtitleService 테스트**
  ```python
  # tests/test_core_ai_subtitle_service.py
  def test_generate_srt():
      """SRT 자막 생성 (FR-002)"""
      pass

  def test_srt_format_validation():
      """SRT 포맷 검증"""
      pass
  ```

- [ ] **MetadataService 테스트**
  ```python
  # tests/test_core_ai_metadata_service.py
  def test_generate_metadata():
      """제목, 설명, 태그 생성"""
      pass

  def test_metadata_schema():
      """메타데이터 스키마 검증"""
      pass
  ```

##### 3. Quota Service Tests (T064)
- [ ] **Quota Check 테스트**
  ```python
  # tests/test_services_quota_service.py
  def test_free_plan_quota():
      """Free 플랜 20회 제한 (FR-008)"""
      pass

  def test_pro_plan_quota():
      """Pro 플랜 500회 제한"""
      pass

  def test_quota_exceeded():
      """할당량 초과 시 오류 반환"""
      pass
  ```

##### 4. Celery Tasks Tests (T065, T071)
- [ ] **Content Generation Task 테스트**
  ```python
  # tests/test_workers_generate.py
  def test_generate_task():
      """Celery 콘텐츠 생성 태스크"""
      pass

  def test_task_status_update():
      """queued → generating 상태 업데이트"""
      pass

  def test_usage_logging():
      """사용량 로깅 (tokens, cost)"""
      pass
  ```

##### 5. Job API Endpoints (T066-T070)
- [ ] **POST /jobs**
  ```python
  # tests/test_api_jobs.py
  def test_create_job():
      """작업 생성 엔드포인트 (FR-001)"""
      pass

  def test_prompt_validation():
      """프롬프트 검증 (최소 길이 등)"""
      pass

  def test_quota_enforcement():
      """할당량 체크"""
      pass
  ```

- [ ] **GET /jobs**
  ```python
  def test_list_jobs():
      """작업 목록 조회 (pagination, FR-010)"""
      pass

  def test_status_filter():
      """상태별 필터링"""
      pass
  ```

- [ ] **GET /jobs/{id}**
  ```python
  def test_get_job():
      """작업 상세 조회 (FR-020)"""
      pass

  def test_job_not_found():
      """존재하지 않는 작업 404"""
      pass
  ```

- [ ] **PATCH /jobs/{id}**
  ```python
  def test_update_job():
      """스크립트/자막 수정 (FR-019)"""
      pass

  def test_update_unauthorized():
      """타인 작업 수정 방지"""
      pass
  ```

#### Frontend Tests (T072-T080)

##### 6. Job Hooks & Components (T072-T076)
- [ ] **useJobs Hook 테스트**
  ```typescript
  // tests/lib/hooks/useJobs.test.ts
  describe('useJobs Hook', () => {
    it('should fetch jobs list', () => {});
    it('should create new job', () => {});
    it('should handle pagination', () => {});
  });
  ```

- [ ] **Project Create Form 테스트**
  ```typescript
  // tests/app/(dashboard)/projects/new/page.test.tsx
  describe('Project Create Form', () => {
    it('should render form fields', () => {});
    it('should validate prompt input', () => {});
    it('should submit job creation', () => {});
  });
  ```

- [ ] **Editor Components 테스트**
  ```typescript
  // tests/components/editor/ScriptEditor.test.tsx
  describe('ScriptEditor', () => {
    it('should render script content', () => {});
    it('should allow editing', () => {});
    it('should save changes', () => {});
  });

  // tests/components/editor/SubtitleEditor.test.tsx
  describe('SubtitleEditor', () => {
    it('should parse SRT format', () => {});
    it('should display timeline', () => {});
    it('should save SRT changes', () => {});
  });

  // tests/components/editor/MetadataEditor.test.tsx
  describe('MetadataEditor', () => {
    it('should show title, description, tags', () => {});
    it('should validate metadata', () => {});
  });
  ```

##### 7. Job Pages & Polling (T077-T079)
- [ ] **Project List Page 테스트**
  ```typescript
  // tests/app/(dashboard)/projects/page.test.tsx
  describe('Project List Page', () => {
    it('should render jobs list', () => {});
    it('should filter by status', () => {});
    it('should show pagination', () => {});
  });
  ```

- [ ] **Project Detail Page 테스트**
  ```typescript
  // tests/app/(dashboard)/projects/[id]/page.test.tsx
  describe('Project Detail Page', () => {
    it('should show job details', () => {});
    it('should render editors', () => {});
    it('should poll job status', () => {});
  });
  ```

- [ ] **QuotaWarning Component 테스트**
  ```typescript
  // tests/components/dashboard/QuotaWarning.test.tsx
  describe('QuotaWarning', () => {
    it('should show warning at 80% usage', () => {});
    it('should show upgrade CTA at 100%', () => {});
  });
  ```

#### E2E Tests (User Journey)
- [ ] **콘텐츠 생성 전체 플로우**
  ```typescript
  // tests/e2e/content-generation.spec.ts
  describe('Content Generation Flow', () => {
    it('create content from prompt to completion', async () => {
      // 1. 프로젝트 생성 페이지 접속
      // 2. 프롬프트 입력 ("리뷰 영상 생성")
      // 3. 작업 큐 등록
      // 4. 상태 폴링 (queued → generating)
      // 5. 스크립트/자막 생성 완료 확인
      // 6. 편집 페이지에서 내용 수정
      // 7. 저장 성공
    });
  });
  ```

---

### Phase 6: User Story 2 - 영상 렌더링 및 YouTube 자동 업로드

**Goal**: 생성된 콘텐츠를 영상으로 렌더링하고 YouTube에 1클릭 업로드

#### Backend Tests (T081-T088)

##### 1. MediaService Tests (T081)
- [ ] **Pexels API 테스트**
  ```python
  # tests/test_core_media_pexels_service.py
  def test_search_videos():
      """Pexels 스톡 영상 검색 (FR-003)"""
      pass

  def test_search_images():
      """Pexels 이미지 검색"""
      pass

  def test_api_rate_limiting():
      """Pexels API 속도 제한 처리"""
      pass
  ```

##### 2. Celery Tasks Tests (T082-T083, T086)
- [ ] **Render Task 테스트**
  ```python
  # tests/test_workers_render.py
  def test_render_task():
      """렌더링 작업 Redis 큐 전송"""
      pass

  def test_render_timeout():
      """3분 타임아웃 처리 (NFR-002)"""
      pass
  ```

- [ ] **Upload Task 테스트**
  ```python
  # tests/test_workers_upload.py
  def test_upload_task():
      """YouTube 업로드 태스크 (FR-005)"""
      pass

  def test_upload_retry():
      """exponential backoff 재시도 (NFR-007, FR-011)"""
      pass

  def test_youtube_quota_management():
      """YouTube API 할당량 관리"""
      pass
  ```

##### 3. Job Retry & Download (T084-T085)
- [ ] **POST /jobs/{id}/retry**
  ```python
  # tests/test_api_jobs_retry.py
  def test_retry_failed_job():
      """실패한 작업 재시도 (FR-011, FR-029)"""
      pass

  def test_retry_completed_job():
      """완료된 작업 재시도 방지"""
      pass
  ```

- [ ] **GET /jobs/{id}/download**
  ```python
  # tests/test_api_jobs_download.py
  def test_download_video():
      """Supabase Storage 리디렉트 (FR-029)"""
      pass

  def test_download_not_ready():
      """렌더링 미완료 시 오류"""
      pass
  ```

##### 4. Upload Status Tracking (T088)
- [ ] **Upload Status 테스트**
  ```python
  # tests/test_workers_upload_status.py
  def test_draft_upload():
      """초안 업로드 (FR-006)"""
      pass

  def test_public_upload():
      """공개 업로드"""
      pass

  def test_scheduled_upload():
      """예약 업로드"""
      pass
  ```

#### Worker Tests (T089-T098)

##### 5. Rendering Core Tests (T089-T097)
- [ ] **Render Job Model 테스트**
  ```go
  // worker/internal/models/render_job_test.go
  func TestRenderJobDeserialization(t *testing.T) {
      // Redis 큐에서 받은 JSON 파싱
  }
  ```

- [ ] **Redis Queue Consumer 테스트**
  ```go
  // worker/cmd/worker/main_test.go
  func TestRedisQueueConsumer(t *testing.T) {
      // render_queue에서 작업 수신
  }
  ```

- [ ] **Video Composition 테스트**
  ```go
  // worker/internal/renderer/composer_test.go
  func TestFFmpegCommandGeneration(t *testing.T) {
      // FFmpeg 명령어 생성
  }

  func TestVideoComposition(t *testing.T) {
      // 영상 합성 (Mock FFmpeg)
  }
  ```

- [ ] **Subtitle Overlay 테스트**
  ```go
  // worker/internal/renderer/subtitle_test.go
  func TestSRTToFFmpegFilter(t *testing.T) {
      // SRT → FFmpeg subtitles filter
  }
  ```

- [ ] **Intro/Outro Merging 테스트**
  ```go
  // worker/internal/renderer/intro_outro_test.go
  func TestIntroOutroMerge(t *testing.T) {
      // 인트로/아웃로 병합
  }
  ```

- [ ] **Watermark Overlay 테스트**
  ```go
  // worker/internal/renderer/watermark_test.go
  func TestWatermarkOverlay(t *testing.T) {
      // 워터마크 오버레이
  }
  ```

- [ ] **Progress Tracking 테스트**
  ```go
  // worker/internal/renderer/progress_test.go
  func TestProgressParsing(t *testing.T) {
      // FFmpeg stderr 파싱 (FR-020)
  }
  ```

##### 6. Storage & Error Handling (T096, T098)
- [ ] **Supabase Storage Upload 테스트**
  ```go
  // worker/internal/storage/uploader_test.go
  func TestVideoUpload(t *testing.T) {
      // 렌더링된 영상 Supabase Storage 업로드
  }
  ```

- [ ] **Error Handling & Sentry 테스트**
  ```go
  // worker/internal/renderer/error_handler_test.go
  func TestErrorLogging(t *testing.T) {
      // Sentry 에러 로깅
  }
  ```

#### Frontend Tests (T099-T104)

##### 7. Render & Upload UI (T099-T104)
- [ ] **RenderButton Component 테스트**
  ```typescript
  // tests/components/editor/RenderButton.test.tsx
  describe('RenderButton', () => {
    it('should trigger rendering', () => {});
    it('should disable during rendering', () => {});
  });
  ```

- [ ] **RenderProgress Component 테스트**
  ```typescript
  // tests/components/dashboard/RenderProgress.test.tsx
  describe('RenderProgress', () => {
    it('should show progress bar (FR-020)', () => {});
    it('should update progress in real-time', () => {});
  });
  ```

- [ ] **UploadSettingsModal 테스트**
  ```typescript
  // tests/components/editor/UploadSettingsModal.test.tsx
  describe('UploadSettingsModal', () => {
    it('should render channel selector', () => {});
    it('should render privacy options', () => {});
    it('should render schedule picker', () => {});
  });
  ```

- [ ] **JobErrorCard 테스트**
  ```typescript
  // tests/components/dashboard/JobErrorCard.test.tsx
  describe('JobErrorCard', () => {
    it('should display error message (FR-028)', () => {});
    it('should show retry button (FR-029)', () => {});
  });
  ```

- [ ] **JobDetailCard 테스트**
  ```typescript
  // tests/components/dashboard/JobDetailCard.test.tsx
  describe('JobDetailCard', () => {
    it('should show download button (FR-029)', () => {});
    it('should show YouTube link after upload', () => {});
  });
  ```

#### E2E Tests (User Journey)
- [ ] **렌더링 & 업로드 전체 플로우**
  ```typescript
  // tests/e2e/render-upload.spec.ts
  describe('Render and Upload Flow', () => {
    it('complete render and YouTube upload', async () => {
      // 1. 생성된 콘텐츠 페이지 접속
      // 2. "렌더링 & 업로드" 버튼 클릭
      // 3. 업로드 설정 모달 (채널, 공개 여부, 예약)
      // 4. 렌더링 시작 (상태: generating → rendering)
      // 5. 진행률 표시 확인
      // 6. 렌더링 완료 (3분 이내)
      // 7. YouTube 업로드 시작 (상태: uploading)
      // 8. 업로드 완료 (상태: done)
      // 9. YouTube 링크 표시 확인
    });
  });
  ```

---

### Phase 7: User Story 3 - 템플릿 및 브랜드 프리셋 관리

**Goal**: 브랜드 아이덴티티를 템플릿으로 저장하고 재사용

#### Backend Tests (T105-T112)

##### 1. Template Model & Service (T105-T107)
- [ ] **Template Model 테스트**
  ```python
  # tests/test_models_template.py
  def test_template_creation():
      """Template 모델 (brand_config_json, is_system_default)"""
      pass

  def test_template_brand_config():
      """brand_config_json 스키마 검증"""
      pass
  ```

- [ ] **TemplateService 테스트**
  ```python
  # tests/test_services_template_service.py
  def test_create_template():
      """템플릿 생성 (FR-007, FR-032)"""
      pass

  def test_validate_brand_config():
      """브랜드 설정 검증"""
      pass
  ```

##### 2. Template API (T108-T111)
- [ ] **GET /templates**
  ```python
  # tests/test_api_templates.py
  def test_list_templates():
      """사용자 + 시스템 기본 템플릿 (FR-031)"""
      pass

  def test_system_default_templates():
      """시스템 기본 템플릿 3개 포함 확인"""
      pass
  ```

- [ ] **POST /templates**
  ```python
  def test_create_template():
      """템플릿 생성 (FR-007, FR-032)"""
      pass
  ```

- [ ] **PUT /templates/{id}**
  ```python
  def test_update_template():
      """템플릿 수정 (FR-007)"""
      pass

  def test_update_system_template():
      """시스템 템플릿 수정 방지"""
      pass
  ```

- [ ] **DELETE /templates/{id}**
  ```python
  def test_delete_template():
      """템플릿 삭제 (FR-007)"""
      pass

  def test_delete_system_template():
      """시스템 템플릿 삭제 방지"""
      pass
  ```

##### 3. System Templates Seeding (T112)
- [ ] **시스템 템플릿 Seed 테스트**
  ```python
  # tests/test_seed_templates.py
  def test_seed_system_templates():
      """리뷰, 뉴스, 교육 템플릿 3개 생성 (FR-031)"""
      pass
  ```

#### Frontend Tests (T113-T118)

##### 4. Template Hooks & Components (T113-T117)
- [ ] **useTemplates Hook 테스트**
  ```typescript
  // tests/lib/hooks/useTemplates.test.ts
  describe('useTemplates Hook', () => {
    it('should fetch templates', () => {});
    it('should create template', () => {});
    it('should update template', () => {});
    it('should delete template', () => {});
  });
  ```

- [ ] **TemplateList Component 테스트**
  ```typescript
  // tests/components/templates/TemplateList.test.tsx
  describe('TemplateList', () => {
    it('should render user templates', () => {});
    it('should render system templates', () => {});
    it('should show edit/delete actions', () => {});
  });
  ```

- [ ] **TemplateEditor Modal 테스트**
  ```typescript
  // tests/components/templates/TemplateEditor.test.tsx
  describe('TemplateEditor', () => {
    it('should render brand config fields', () => {});
    it('should validate inputs', () => {});
    it('should save template', () => {});
  });
  ```

- [ ] **Templates Page 테스트**
  ```typescript
  // tests/app/(dashboard)/templates/page.test.tsx
  describe('Templates Page', () => {
    it('should show templates list', () => {});
    it('should open editor on create', () => {});
  });
  ```

- [ ] **Template Selector 테스트**
  ```typescript
  // tests/app/(dashboard)/projects/new/page.test.tsx
  describe('Template Selector in Project Create', () => {
    it('should show template dropdown', () => {});
    it('should apply template to project', () => {});
  });
  ```

- [ ] **TemplatePreview Component 테스트**
  ```typescript
  // tests/components/templates/TemplatePreview.test.tsx
  describe('TemplatePreview', () => {
    it('should show brand colors', () => {});
    it('should show font settings', () => {});
  });
  ```

#### E2E Tests (User Journey)
- [ ] **템플릿 생성 → 재사용 플로우**
  ```typescript
  // tests/e2e/template-management.spec.ts
  describe('Template Management Flow', () => {
    it('create and reuse template', async () => {
      // 1. 템플릿 페이지 접속
      // 2. "새 템플릿" 버튼 클릭
      // 3. 브랜드 설정 입력 (색상, 폰트 등)
      // 4. 저장
      // 5. 새 프로젝트 생성 페이지 이동
      // 6. 템플릿 드롭다운에서 방금 생성한 템플릿 선택
      // 7. 브랜드 설정이 자동 적용되는지 확인
    });
  });
  ```

---

### Phase 8: User Story 4 - 결제 및 플랜 관리

**Goal**: Free → Pro/Agency 업그레이드, 플랜 변경, 해지 기능 제공

#### Backend Tests (T119-T128)

##### 1. Webhook Model & Schemas (T119-T120)
- [ ] **Webhook Model 테스트**
  ```python
  # tests/test_models_webhook.py
  def test_webhook_creation():
      """Webhook 모델 (type, provider, payload_json)"""
      pass
  ```

- [ ] **Billing Schemas 검증**
  ```python
  # tests/test_schemas_billing.py
  def test_checkout_request_schema():
      """CheckoutRequest 스키마"""
      pass

  def test_subscription_response_schema():
      """SubscriptionResponse 형식"""
      pass
  ```

##### 2. StripeService Tests (T121)
- [ ] **Stripe 통합 테스트**
  ```python
  # tests/test_core_billing_stripe_service.py
  def test_create_checkout_session():
      """Stripe Checkout 세션 생성 (FR-009, FR-017)"""
      pass

  def test_webhook_signature_verification():
      """Webhook 서명 검증"""
      pass
  ```

##### 3. Billing API (T122-T125)
- [ ] **POST /billing/checkout**
  ```python
  # tests/test_api_billing.py
  def test_checkout_endpoint():
      """결제 체크아웃 (FR-009, FR-017)"""
      pass

  def test_checkout_plan_validation():
      """플랜 검증 (free/pro/agency)"""
      pass
  ```

- [ ] **POST /billing/portal**
  ```python
  def test_customer_portal():
      """Stripe Customer Portal 리디렉트"""
      pass
  ```

- [ ] **GET /billing/subscription**
  ```python
  def test_get_subscription():
      """현재 구독 정보 조회"""
      pass
  ```

- [ ] **POST /billing/webhook**
  ```python
  def test_webhook_endpoint():
      """Stripe Webhook 처리 (signature 검증, FR-017)"""
      pass

  def test_webhook_events():
      """checkout.session.completed, invoice.paid 등 이벤트 처리"""
      pass
  ```

##### 4. Subscription Service (T126-T128)
- [ ] **Subscription Sync 테스트**
  ```python
  # tests/test_services_subscription_service.py
  def test_subscription_sync():
      """Webhook 데이터로 구독 상태 동기화"""
      pass

  def test_plan_upgrade_immediate():
      """업그레이드 즉시 활성화 (FR-009)"""
      pass

  def test_plan_downgrade_period_end():
      """다운그레이드는 기간 종료 시 (FR-009)"""
      pass
  ```

#### Frontend Tests (T129-T134)

##### 5. Subscription Hooks & Components (T129-T131)
- [ ] **useSubscription Hook 테스트**
  ```typescript
  // tests/lib/hooks/useSubscription.test.ts
  describe('useSubscription Hook', () => {
    it('should fetch subscription data', () => {});
    it('should upgrade plan', () => {});
    it('should downgrade plan', () => {});
  });
  ```

- [ ] **PricingCards Component 테스트**
  ```typescript
  // tests/components/billing/PricingCards.test.tsx
  describe('PricingCards', () => {
    it('should render free plan', () => {});
    it('should render pro plan', () => {});
    it('should render agency plan', () => {});
    it('should show current plan badge', () => {});
  });
  ```

- [ ] **SubscriptionCard Component 테스트**
  ```typescript
  // tests/components/dashboard/SubscriptionCard.test.tsx
  describe('SubscriptionCard', () => {
    it('should show current plan', () => {});
    it('should show billing cycle', () => {});
    it('should show next billing date', () => {});
  });
  ```

##### 6. Billing Settings & Quota Warning (T132-T134)
- [ ] **Billing Settings Page 테스트**
  ```typescript
  // tests/app/(dashboard)/settings/billing/page.test.tsx
  describe('Billing Settings Page', () => {
    it('should show subscription details', () => {});
    it('should show upgrade options', () => {});
    it('should show cancellation UI', () => {});
  });
  ```

- [ ] **QuotaWarning 업그레이드 CTA 테스트**
  ```typescript
  // tests/components/dashboard/QuotaWarning.test.tsx
  describe('QuotaWarning with Upgrade CTA', () => {
    it('should show upgrade CTA at quota limit (FR-008)', () => {});
    it('should redirect to billing page', () => {});
  });
  ```

#### E2E Tests (User Journey)
- [ ] **플랜 업그레이드 전체 플로우**
  ```typescript
  // tests/e2e/billing.spec.ts
  describe('Plan Upgrade Flow', () => {
    it('complete plan upgrade from free to pro', async () => {
      // 1. 할당량 초과 경고 표시
      // 2. "업그레이드" 버튼 클릭
      // 3. 요금제 선택 페이지
      // 4. Pro 플랜 선택
      // 5. Stripe Checkout 페이지로 이동 (Mock)
      // 6. 결제 완료 (Mock Webhook)
      // 7. 대시보드로 돌아와 Pro 플랜 표시 확인
      // 8. 할당량 500회로 증가 확인
    });
  });
  ```

---

### Phase 9: User Story 7 - 신규 사용자 온보딩

**Goal**: 회원가입 후 3단계 가이드로 YouTube 연결, 템플릿 선택, 첫 프로젝트 생성 안내

#### Backend Tests (T135-T137)

##### 1. Onboarding Status (T135-T137)
- [ ] **User Model onboarding_completed 테스트**
  ```python
  # tests/test_models_user_onboarding.py
  def test_onboarding_completed_default():
      """onboarding_completed 기본값 false"""
      pass
  ```

- [ ] **GET /users/me/onboarding**
  ```python
  # tests/test_api_users_onboarding.py
  def test_get_onboarding_status():
      """온보딩 상태 조회"""
      pass
  ```

- [ ] **PUT /users/me/onboarding**
  ```python
  def test_complete_onboarding():
      """온보딩 완료 처리 (FR-037, FR-038)"""
      pass

  def test_skip_onboarding():
      """온보딩 건너뛰기"""
      pass
  ```

#### Frontend Tests (T138-T143)

##### 2. Onboarding Modal & Steps (T138-T141)
- [ ] **OnboardingModal Component 테스트**
  ```typescript
  // tests/components/onboarding/OnboardingModal.test.tsx
  describe('OnboardingModal', () => {
    it('should render modal on first login', () => {});
    it('should show 3 steps', () => {});
    it('should allow navigation between steps', () => {});
  });
  ```

- [ ] **Step 1: Connect YouTube 테스트**
  ```typescript
  // tests/components/onboarding/Step1ConnectYouTube.test.tsx
  describe('Step1ConnectYouTube', () => {
    it('should render connect button', () => {});
    it('should redirect to OAuth', () => {});
    it('should show success after connection', () => {});
  });
  ```

- [ ] **Step 2: Select Template 테스트**
  ```typescript
  // tests/components/onboarding/Step2SelectTemplate.test.tsx
  describe('Step2SelectTemplate', () => {
    it('should show 3 default templates (리뷰, 뉴스, 교육)', () => {});
    it('should preview template', () => {});
    it('should select template', () => {});
  });
  ```

- [ ] **Step 3: First Project 테스트**
  ```typescript
  // tests/components/onboarding/Step3FirstProject.test.tsx
  describe('Step3FirstProject', () => {
    it('should pre-fill sample prompt', () => {});
    it('should submit first project', () => {});
    it('should complete onboarding', () => {});
  });
  ```

##### 3. Onboarding Triggers (T142-T143)
- [ ] **Dashboard Onboarding Trigger 테스트**
  ```typescript
  // tests/app/(dashboard)/page.test.tsx
  describe('Dashboard Onboarding Trigger', () => {
    it('should open modal on first login', () => {});
    it('should not show modal after completion', () => {});
  });
  ```

- [ ] **Skip & Restart 테스트**
  ```typescript
  // tests/components/onboarding/OnboardingModal.test.tsx
  describe('Onboarding Skip and Restart', () => {
    it('should allow skip (FR-038)', () => {});
    it('should allow restart from settings', () => {});
  });
  ```

#### E2E Tests (User Journey)
- [ ] **신규 사용자 온보딩 전체 플로우**
  ```typescript
  // tests/e2e/onboarding.spec.ts
  describe('New User Onboarding Flow', () => {
    it('complete onboarding from signup to first project', async () => {
      // 1. 회원가입
      // 2. 로그인
      // 3. 대시보드 접속 → 온보딩 모달 자동 표시
      // 4. Step 1: YouTube 채널 연결
      // 5. Step 2: 템플릿 선택 (리뷰 템플릿)
      // 6. Step 3: 첫 프로젝트 생성 (샘플 프롬프트 사용)
      // 7. 프로젝트 생성 성공
      // 8. onboarding_completed = true 확인
    });
  });
  ```

---

### Phase 10: User Story 5 - 대시보드 및 사용 현황 추적

**Goal**: 생성 기록, 성공률, 렌더링 시간, 사용량을 한눈에 확인

#### Backend Tests (T144-T147)

##### 1. MetricsService Tests (T144)
- [ ] **MetricsService 로직 테스트**
  ```python
  # tests/test_services_metrics_service.py
  def test_calculate_success_rate():
      """성공률 집계"""
      pass

  def test_calculate_average_render_time():
      """평균 렌더링 시간 계산"""
      pass

  def test_aggregate_usage():
      """사용량 집계"""
      pass
  ```

##### 2. Metrics API (T145-T146)
- [ ] **GET /metrics/dashboard**
  ```python
  # tests/test_api_metrics.py
  def test_dashboard_metrics():
      """대시보드 통계 (7d/30d/90d, FR-015)"""
      pass

  def test_metrics_date_range():
      """기간별 필터링"""
      pass
  ```

- [ ] **GET /metrics/usage**
  ```python
  def test_usage_metrics():
      """월간 사용량 (FR-033, FR-034)"""
      pass

  def test_usage_by_plan():
      """플랜별 사용량"""
      pass
  ```

##### 3. Alert Service (T147)
- [ ] **Usage Alert 테스트**
  ```python
  # tests/test_services_alert_service.py
  def test_usage_80_percent_banner():
      """80% 사용 시 배너 표시 (FR-033)"""
      pass

  def test_usage_100_percent_email():
      """100% 사용 시 이메일 발송 (FR-034)"""
      pass
  ```

#### Frontend Tests (T148-T154)

##### 4. Metrics Hooks & Dashboard Components (T148-T151)
- [ ] **useMetrics Hook 테스트**
  ```typescript
  // tests/lib/hooks/useMetrics.test.ts
  describe('useMetrics Hook', () => {
    it('should fetch dashboard metrics', () => {});
    it('should fetch usage metrics', () => {});
    it('should handle date range', () => {});
  });
  ```

- [ ] **StatsCards Component 테스트**
  ```typescript
  // tests/components/dashboard/StatsCards.test.tsx
  describe('StatsCards', () => {
    it('should show total generations', () => {});
    it('should show success rate', () => {});
    it('should show average render time', () => {});
  });
  ```

- [ ] **UsageChart Component 테스트**
  ```typescript
  // tests/components/dashboard/UsageChart.test.tsx
  describe('UsageChart', () => {
    it('should render chart for last 30 days', () => {});
    it('should show daily usage', () => {});
  });
  ```

- [ ] **JobHistoryTable Component 테스트**
  ```typescript
  // tests/components/dashboard/JobHistoryTable.test.tsx
  describe('JobHistoryTable', () => {
    it('should render jobs list', () => {});
    it('should show job status', () => {});
    it('should show job details', () => {});
  });
  ```

##### 5. Main Dashboard & Alerts (T152-T154)
- [ ] **Main Dashboard Page 테스트**
  ```typescript
  // tests/app/(dashboard)/page.test.tsx
  describe('Main Dashboard Page', () => {
    it('should render all widgets', () => {});
    it('should show stats cards', () => {});
    it('should show usage chart', () => {});
    it('should show job history', () => {});
  });
  ```

- [ ] **UsageBanner Component 테스트**
  ```typescript
  // tests/components/dashboard/UsageBanner.test.tsx
  describe('UsageBanner', () => {
    it('should show at 80% usage (FR-033)', () => {});
    it('should link to billing page', () => {});
  });
  ```

- [ ] **ChannelFilter Component 테스트**
  ```typescript
  // tests/components/dashboard/ChannelFilter.test.tsx
  describe('ChannelFilter', () => {
    it('should show channel dropdown for Agency users', () => {});
    it('should filter metrics by channel', () => {});
  });
  ```

#### E2E Tests (User Journey)
- [ ] **대시보드 통계 확인 플로우**
  ```typescript
  // tests/e2e/dashboard.spec.ts
  describe('Dashboard Statistics Flow', () => {
    it('view dashboard statistics', async () => {
      // 1. 대시보드 접속
      // 2. 통계 카드 확인 (총 생성, 성공률, 평균 시간)
      // 3. 사용량 차트 확인 (최근 30일)
      // 4. 작업 히스토리 테이블 확인
      // 5. 80% 사용 시 배너 표시 확인
    });
  });
  ```

---

## 🔬 성능 테스트 (NFR 검증)

### NFR-001: API 응답 시간 (3초 이내)
```python
# tests/performance/test_api_response_time.py
import time

def test_job_creation_response_time():
    """POST /jobs 응답 시간 3초 이내"""
    start = time.time()
    response = client.post("/api/v1/jobs", json={"prompt": "테스트"})
    elapsed = time.time() - start
    assert elapsed < 3.0
    assert response.status_code == 201
```

### NFR-002: 렌더링 시간 (60초 영상 → 3분 이내)
```python
# tests/performance/test_rendering_time.py
def test_rendering_performance():
    """60초 영상 렌더링 3분 이내 완료"""
    job = create_test_job()
    start = time.time()
    render_result = trigger_render(job.id)
    elapsed = time.time() - start
    assert elapsed < 180.0  # 3분
    assert render_result.status == "done"
```

### NFR-003: 대시보드 로드 시간 (1초 이내)
```typescript
// tests/performance/dashboard-load.spec.ts
describe('Dashboard Load Performance', () => {
  it('should load within 1 second', async () => {
    const start = Date.now();
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="dashboard-stats"]');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000); // 1초
  });
});
```

### NFR-004: 동시 사용자 부하 테스트 (1,000명)
```python
# tests/performance/test_load.py
from locust import HttpUser, task, between

class ClipPilotUser(HttpUser):
    wait_time = between(1, 5)

    @task
    def create_job(self):
        """작업 생성 부하 테스트"""
        self.client.post("/api/v1/jobs", json={"prompt": "테스트"})

    @task
    def list_jobs(self):
        """작업 목록 조회 부하 테스트"""
        self.client.get("/api/v1/jobs")

# 실행: locust -f test_load.py --host=http://localhost:8000 --users=1000
```

---

## 🛡️ 보안 테스트

### 인증/인가 테스트
```python
# tests/security/test_authentication.py
def test_unauthenticated_request():
    """인증 없이 보호된 엔드포인트 접근 시 401"""
    response = client.get("/api/v1/jobs")
    assert response.status_code == 401

def test_unauthorized_job_access():
    """타인의 작업 접근 시 403"""
    job = create_job_for_user(user_id="other_user")
    response = client.get(f"/api/v1/jobs/{job.id}", headers={"Authorization": f"Bearer {current_user_token}"})
    assert response.status_code == 403
```

### RLS (Row Level Security) 테스트
```python
# tests/security/test_rls.py
def test_rls_job_isolation():
    """Supabase RLS로 사용자별 작업 격리"""
    user1_jobs = supabase.table("jobs").select("*").eq("user_id", user1.id).execute()
    user2_jobs = supabase.table("jobs").select("*").eq("user_id", user2.id).execute()
    assert user1_jobs.data[0]["user_id"] == user1.id
    assert user2_jobs.data[0]["user_id"] == user2.id
```

### 토큰 암호화 테스트
```python
# tests/security/test_token_encryption.py
def test_youtube_token_encryption():
    """YouTube OAuth 토큰 암호화 저장 (NFR-009)"""
    channel = create_channel_with_token("encrypted_token_value")
    raw_db_row = supabase.table("channels").select("access_token_meta").eq("id", channel.id).execute()
    assert raw_db_row.data[0]["access_token_meta"] != "plain_text_token"  # 암호화 확인
```

---

## 📊 테스트 커버리지 목표

### Backend (Python)
- **목표**: 80% 이상 커버리지
```bash
# 커버리지 측정
pytest --cov=backend/src --cov-report=html
open htmlcov/index.html
```

### Frontend (TypeScript)
- **목표**: 70% 이상 커버리지
```bash
# 커버리지 측정
npm run test:coverage
open coverage/lcov-report/index.html
```

### Worker (Go)
- **목표**: 75% 이상 커버리지
```bash
# 커버리지 측정
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

---

## 🚀 테스트 실행 전략

### 로컬 개발 환경
```bash
# 1. 개별 Phase 테스트
pytest tests/test_api_auth.py  # Phase 3 (US0) 테스트
npm run test:auth              # Frontend 인증 테스트

# 2. 전체 단위 테스트
pytest                         # Backend 전체
npm test                       # Frontend 전체
go test ./...                  # Worker 전체

# 3. E2E 테스트
npm run test:e2e               # Playwright E2E 테스트
```

### CI/CD 파이프라인
```yaml
# .github/workflows/test.yml
name: Test Pipeline

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: pytest --cov=backend/src --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      - name: Run tests
        run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  worker-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      - name: Run tests
        run: |
          cd worker
          go test -coverprofile=coverage.out ./...

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e
```

---

## 📝 테스트 우선순위

### Critical (P0) - MVP 핵심 기능
- **Phase 3 (US0 Authentication)**: 회원가입, 로그인, 인증 미들웨어
- **Phase 5 (US1 Content Generation)**: 콘텐츠 생성 API, AI 서비스
- **Phase 6 (US2 Rendering/Upload)**: 렌더링, YouTube 업로드

### High (P1) - 주요 기능
- **Phase 4 (US6 YouTube OAuth)**: YouTube 채널 연동
- **Phase 7 (US3 Templates)**: 템플릿 관리
- **Phase 8 (US4 Billing)**: 결제 시스템

### Medium (P2) - 부가 기능
- **Phase 9 (US7 Onboarding)**: 온보딩 플로우
- **Phase 10 (US5 Dashboard)**: 대시보드 통계

### Low (P3) - 인프라/폴리싱
- **Phase 2 (Foundational)**: 공통 인프라 (이미 구현 완료)
- **Phase 11 (Polish)**: 로깅, 모니터링, 최적화

---

## 🎯 다음 단계

### 1. 테스트 환경 설정 (우선)
- [ ] pytest, Jest, Playwright 설치 및 설정
- [ ] Mock 데이터 및 Fixture 준비
- [ ] CI/CD 파이프라인 구성

### 2. Phase별 테스트 구현 (순차)
- [ ] **Phase 3 (US0)**: 인증 테스트 우선 구현
- [ ] **Phase 4 (US6)**: YouTube OAuth 테스트
- [ ] **Phase 5 (US1)**: 콘텐츠 생성 테스트
- [ ] **Phase 6 (US2)**: 렌더링/업로드 테스트
- [ ] **Phase 7~10**: 나머지 User Story 테스트

### 3. E2E 테스트 구현
- [ ] 주요 사용자 여정 시나리오 작성
- [ ] Playwright E2E 테스트 구현

### 4. 성능 & 보안 테스트
- [ ] NFR 검증 테스트 구현
- [ ] 부하 테스트 (Locust)
- [ ] 보안 감사

---

## 📚 참고 자료

- **tasks.md**: `specs/001-clippilot-mvp/tasks.md` (170개 구현 태스크)
- **spec.md**: `specs/001-clippilot-mvp/spec.md` (요구사항 명세)
- **api-v1.yaml**: `specs/001-clippilot-mvp/contracts/api-v1.yaml` (API 스펙)
- **data-model.md**: `specs/001-clippilot-mvp/data-model.md` (데이터베이스 스키마)

---

**작성**: Claude (SuperClaude Framework)
**최종 업데이트**: 2025-11-10
