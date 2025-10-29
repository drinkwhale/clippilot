# 🎯 ClipPilot Phase 3 완료 데모 시나리오

Phase 3 (US0 Authentication) 완료 상태에서 테스트 가능한 기능을 시연하는 가이드입니다.

---

## 🚀 시작 전 준비

### 1. 서비스 실행

```bash
# 프로젝트 루트에서 실행
./scripts/dev-start.sh
```

**예상 출력:**
```
========================================
  ClipPilot 개발 서버 시작
========================================

[1/3] Redis 상태 확인...
✓ Redis 실행 완료

[2/3] Backend API 실행...
✓ Backend API 실행 완료 (PID: 12346)
  URL: http://localhost:8000
  Docs: http://localhost:8000/docs

[3/3] Frontend 실행...
✓ Frontend 실행 완료 (PID: 12347)
  URL: http://localhost:3000

========================================
  ✓ 모든 서비스가 실행되었습니다!
========================================
```

### 2. 상태 확인

```bash
./scripts/dev-status.sh
```

**모든 서비스가 ● 실행 중** 상태인지 확인합니다.

---

## 📝 테스트 시나리오

### 시나리오 1: 회원가입 플로우 ✅

#### 1-1. Frontend에서 회원가입

1. **회원가입 페이지 접속**
   ```
   http://localhost:3000/signup
   ```

2. **회원 정보 입력**
   - 이메일: `test@example.com`
   - 비밀번호: `password123!` (8자 이상)
   - 비밀번호 확인: `password123!`

3. **회원가입 버튼 클릭**

4. **예상 결과**
   - ✅ 회원가입 성공 메시지 표시
   - ✅ 로그인 페이지로 자동 리다이렉트
   - ✅ Supabase Auth에 사용자 생성됨

#### 1-2. API로 직접 회원가입 테스트

1. **Swagger UI 접속**
   ```
   http://localhost:8000/docs
   ```

2. **`POST /api/v1/auth/signup` 엔드포인트 찾기**

3. **"Try it out" 클릭 후 요청 본문 입력**
   ```json
   {
     "email": "api-test@example.com",
     "password": "password123!"
   }
   ```

4. **"Execute" 클릭**

5. **예상 응답 (200 OK)**
   ```json
   {
     "user": {
       "id": "123e4567-e89b-12d3-a456-426614174000",
       "email": "api-test@example.com",
       "created_at": "2025-10-29T12:00:00Z"
     },
     "session": {
       "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "refresh_token": "...",
       "expires_in": 3600
     }
   }
   ```

---

### 시나리오 2: 로그인 플로우 ✅

#### 2-1. Frontend에서 로그인

1. **로그인 페이지 접속**
   ```
   http://localhost:3000/login
   ```

2. **로그인 정보 입력**
   - 이메일: `test@example.com`
   - 비밀번호: `password123!`

3. **로그인 버튼 클릭**

4. **예상 결과**
   - ✅ 로그인 성공 메시지 표시
   - ✅ 대시보드로 자동 리다이렉트 (`/dashboard`)
   - ✅ 쿠키에 JWT 토큰 저장됨

#### 2-2. API로 직접 로그인 테스트

1. **Swagger UI에서 `POST /api/v1/auth/login` 엔드포인트 찾기**

2. **요청 본문 입력**
   ```json
   {
     "email": "api-test@example.com",
     "password": "password123!"
   }
   ```

3. **예상 응답 (200 OK)**
   ```json
   {
     "user": {
       "id": "123e4567-e89b-12d3-a456-426614174000",
       "email": "api-test@example.com"
     },
     "session": {
       "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "refresh_token": "...",
       "expires_in": 3600
     }
   }
   ```

---

### 시나리오 3: 인증 상태 확인 ✅

#### 3-1. 로그인 없이 대시보드 접근

1. **시크릿 모드 또는 로그아웃 상태에서 대시보드 접속**
   ```
   http://localhost:3000/dashboard
   ```

2. **예상 결과**
   - ✅ 로그인 페이지로 자동 리다이렉트
   - ✅ 에러 메시지: "로그인이 필요합니다"

#### 3-2. 로그인 후 대시보드 접근

1. **로그인 완료 상태에서 대시보드 접속**
   ```
   http://localhost:3000/dashboard
   ```

2. **예상 결과**
   - ✅ 대시보드 페이지 정상 표시
   - ✅ 사용자 정보 표시 (이메일)
   - ✅ "로그아웃" 버튼 표시

---

### 시나리오 4: 비밀번호 재설정 ✅

#### 4-1. 비밀번호 재설정 요청

1. **비밀번호 재설정 페이지 접속**
   ```
   http://localhost:3000/reset-password
   ```

2. **이메일 입력**
   - 이메일: `test@example.com`

3. **"비밀번호 재설정 링크 전송" 버튼 클릭**

4. **예상 결과**
   - ✅ 성공 메시지: "이메일로 재설정 링크를 전송했습니다"
   - ✅ Supabase에서 비밀번호 재설정 이메일 발송됨

#### 4-2. API로 비밀번호 재설정 테스트

1. **Swagger UI에서 `POST /api/v1/auth/reset-password` 엔드포인트 찾기**

2. **요청 본문 입력**
   ```json
   {
     "email": "test@example.com"
   }
   ```

3. **예상 응답 (200 OK)**
   ```json
   {
     "message": "비밀번호 재설정 링크를 이메일로 전송했습니다."
   }
   ```

---

### 시나리오 5: 로그아웃 ✅

#### 5-1. Frontend에서 로그아웃

1. **대시보드에서 로그아웃 버튼 클릭**
   ```
   http://localhost:3000/dashboard
   ```

2. **예상 결과**
   - ✅ 로그아웃 성공 메시지 표시
   - ✅ 로그인 페이지로 자동 리다이렉트
   - ✅ 쿠키에서 JWT 토큰 삭제됨

#### 5-2. API로 로그아웃 테스트

1. **Swagger UI에서 `POST /api/v1/auth/logout` 엔드포인트 찾기**

2. **"Authorize" 버튼 클릭 후 JWT 토큰 입력**
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **`POST /api/v1/auth/logout` 실행**

4. **예상 응답 (200 OK)**
   ```json
   {
     "message": "로그아웃되었습니다."
   }
   ```

---

## 🔍 추가 테스트

### Health Check API

```bash
curl http://localhost:8000/health
```

**예상 응답:**
```json
{
  "status": "healthy",
  "redis": "healthy"
}
```

### Root API

```bash
curl http://localhost:8000
```

**예상 응답:**
```json
{
  "message": "ClipPilot API",
  "version": "1.0.0",
  "docs": "/docs"
}
```

### OpenAPI Schema

```bash
curl http://localhost:8000/openapi.json
```

**예상 응답:**
```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "ClipPilot API",
    "version": "1.0.0",
    ...
  }
}
```

---

## 🐛 문제 해결

### 회원가입이 실패하는 경우

1. **Backend 로그 확인**
   ```bash
   ./scripts/dev-logs.sh backend
   ```

2. **일반적인 원인**
   - Supabase 설정 오류 (`.env` 파일 확인)
   - 이메일 중복 (다른 이메일로 시도)
   - 비밀번호 정책 위반 (8자 이상 필수)

### 로그인이 실패하는 경우

1. **Backend 로그 확인**
   ```bash
   ./scripts/dev-logs.sh backend
   ```

2. **일반적인 원인**
   - 이메일 또는 비밀번호 오류
   - 이메일 인증 미완료 (Supabase 설정 확인)
   - Supabase Auth 연결 실패

### 대시보드 접근이 안 되는 경우

1. **Frontend 로그 확인**
   ```bash
   ./scripts/dev-logs.sh frontend
   ```

2. **일반적인 원인**
   - JWT 토큰 만료 (재로그인 필요)
   - 쿠키 설정 오류
   - Frontend-Backend 연결 실패

---

## 📊 성공 기준

다음 모든 시나리오가 성공하면 Phase 3 완료 상태입니다:

- ✅ **회원가입**: Frontend 및 API 모두 정상 작동
- ✅ **로그인**: Frontend 및 API 모두 정상 작동
- ✅ **인증 상태**: 로그인 전/후 대시보드 접근 제어 정상
- ✅ **비밀번호 재설정**: 이메일 발송 정상
- ✅ **로그아웃**: 세션 종료 및 리다이렉트 정상
- ✅ **API 문서**: Swagger UI 정상 표시

---

## 🎉 다음 단계

Phase 3 테스트가 완료되면 다음 Phase로 진행할 수 있습니다:

### Phase 4: YouTube OAuth 연동 (T045-T057)
```bash
"Phase 4 진행해줘"
```

**구현될 기능:**
- YouTube 채널 OAuth 연동
- 채널 목록 조회
- 채널 연결 해제

### Phase 5: 콘텐츠 생성 (T058-T080) 🔥 핵심 기능
```bash
"Phase 5까지 진행해줘"
```

**구현될 기능:**
- AI 스크립트 생성 (OpenAI GPT-4o)
- 자막(SRT) 자동 생성
- 썸네일 메타데이터 생성
- 생성된 콘텐츠 편집

---

**작성일**: 2025-10-29
**버전**: Phase 3 (US0 Authentication) 완료 기준
