# Supabase 프로젝트 설정 가이드

**Last Updated**: 2025-11-09
**Priority**: P0 Critical

## 개요

ClipPilot은 Supabase를 다음 용도로 사용합니다:
- **인증 (Auth)**: 사용자 회원가입/로그인
- **데이터베이스 (PostgreSQL)**: 비즈니스 데이터 저장
- **스토리지 (Storage)**: 생성된 비디오 파일 저장

## 1. Supabase 프로젝트 생성

### 1.1 새 프로젝트 생성

1. https://supabase.com 접속 및 로그인
2. **New Project** 클릭
3. 프로젝트 정보 입력:
   - **Project name**: `clippilot-dev` (개발용) 또는 `clippilot-prod` (프로덕션)
   - **Database password**: 강력한 비밀번호 설정 (저장 필수!)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 사용자 대상)
   - **Pricing plan**: Free tier (개발용) 또는 Pro (프로덕션)

4. **Create new project** 클릭 후 약 2분 대기

### 1.2 API Keys 확인

프로젝트 생성 완료 후:
1. 좌측 메뉴 **Settings** > **API** 이동
2. 다음 정보 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (⚠️ 주의: 절대 클라이언트에 노출 금지!)

## 2. 데이터베이스 설정

### 2.1 Extensions 활성화

**Supabase Dashboard** > **Database** > **Extensions** 이동 후 활성화:

```sql
-- 또는 SQL Editor에서 직접 실행
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

- `uuid-ossp`: UUID 생성 함수 제공
- `pgcrypto`: 암호화 함수 제공 (YouTube OAuth 토큰 암호화용)

### 2.2 스키마 마이그레이션

**Supabase Dashboard** > **SQL Editor** > **New query** 클릭 후 다음 SQL 실행:

#### Step 1: ENUMs 생성

```sql
-- 사용자 요금제 타입
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'agency');

-- 작업 상태
CREATE TYPE job_status AS ENUM ('queued', 'generating', 'rendering', 'uploading', 'done', 'failed');

-- 구독 상태
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'unpaid');
```

#### Step 2: 테이블 생성

전체 스키마는 `specs/001-clippilot-mvp/data-model.md` 참고.

주요 테이블:
- `users`: 사용자 정보 (Supabase Auth와 연동)
- `channels`: YouTube 채널 연동 정보
- `templates`: 비디오 템플릿
- `jobs`: 비디오 생성 작업
- `subscriptions`: Stripe 구독 정보
- `usage_logs`: 사용량 추적
- `webhooks`: Stripe/YouTube 웹훅 이벤트

#### Step 3: RLS (Row Level Security) 정책 설정

⚠️ **중요**: 모든 테이블에 RLS를 활성화하여 데이터 보안 강화

```sql
-- 예시: users 테이블 RLS 정책
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 정보만 조회 가능
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- 사용자는 자신의 정보만 수정 가능
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid() = id);

-- 다른 테이블도 동일한 패턴으로 RLS 정책 설정
-- 전체 정책은 data-model.md 참고
```

#### Step 4: Performance Indexes 추가 (P0 Critical)

```sql
-- Migration: Add performance indexes
-- 파일: backend/migrations/001_add_performance_indexes.sql

-- Jobs 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_jobs_user_created
ON jobs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_status
ON jobs(status);

-- Usage logs 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created
ON usage_logs(user_id, created_at DESC);

-- 테이블 통계 업데이트
ANALYZE jobs;
ANALYZE usage_logs;
```

## 3. Storage 설정

### 3.1 Bucket 생성

**Supabase Dashboard** > **Storage** > **Create bucket** 클릭:

1. **Bucket name**: `videos`
2. **Public bucket**: ❌ (비공개)
3. **File size limit**: 500 MB (설정 필요 시 조정)
4. **Allowed MIME types**: `video/*` (비디오 파일만 허용)

### 3.2 Storage Policy 설정

```sql
-- 사용자는 자신의 비디오만 업로드 가능
CREATE POLICY "Users can upload own videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 사용자는 자신의 비디오만 읽기 가능
CREATE POLICY "Users can read own videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 사용자는 자신의 비디오만 삭제 가능
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## 4. 환경 변수 설정

### 4.1 `.env` 파일 생성

프로젝트 루트에 `.env` 파일 생성:

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co  # 프로젝트 URL
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # anon public key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # service_role key

# Database URL (Settings > Database > Connection string > URI)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

### 4.2 Frontend `.env.local` 파일

`frontend/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **주의**: `NEXT_PUBLIC_` prefix가 있는 환경 변수만 클라이언트에서 접근 가능

## 5. 검증

### 5.1 데이터베이스 연결 확인

```bash
cd backend
python -c "from src.core.supabase import get_supabase_client; print('Supabase connected:', get_supabase_client())"
```

### 5.2 Storage 연결 확인

Supabase Dashboard > Storage > videos bucket에서 수동으로 파일 업로드 테스트

## 6. 프로덕션 체크리스트

프로덕션 배포 전 확인사항:

- [ ] RLS 정책이 모든 테이블에 활성화되었는지 확인
- [ ] Performance indexes가 추가되었는지 확인
- [ ] Storage bucket이 비공개(private)로 설정되었는지 확인
- [ ] Database password가 강력한지 확인 (최소 16자, 특수문자 포함)
- [ ] `service_role` key가 절대 클라이언트 코드에 노출되지 않는지 확인
- [ ] 백업 설정 확인 (Supabase Pro 이상 필요)
- [ ] Database 연결 풀 크기 조정 (기본: 15, 필요 시 증가)

## 7. 문제 해결

### 7.1 "relation does not exist" 오류

**원인**: 테이블이 생성되지 않음
**해결**: Section 2.2의 스키마 마이그레이션 재실행

### 7.2 "permission denied for table" 오류

**원인**: RLS 정책 누락
**해결**: Section 2.2 Step 3의 RLS 정책 재확인

### 7.3 "invalid JWT token" 오류

**원인**: 환경 변수의 API key가 잘못됨
**해결**: Supabase Dashboard에서 API keys 재확인 및 `.env` 파일 업데이트

### 7.4 Storage 업로드 실패

**원인**: Storage policy 미설정
**해결**: Section 3.2의 Storage policy 재실행

## 8. 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Row Level Security (RLS) 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Policy 가이드](https://supabase.com/docs/guides/storage/security/access-control)
- ClipPilot 스키마: `specs/001-clippilot-mvp/data-model.md`

---

**Checklist Summary**:

- [ ] 1. Supabase 프로젝트 생성
- [ ] 2. API Keys 확인 및 `.env` 파일 설정
- [ ] 3. Extensions 활성화 (uuid-ossp, pgcrypto)
- [ ] 4. ENUMs 생성 (plan_type, job_status, subscription_status)
- [ ] 5. 테이블 생성 (users, channels, templates, jobs, subscriptions, usage_logs, webhooks)
- [ ] 6. RLS 정책 설정 (모든 테이블)
- [ ] 7. Performance indexes 추가 (P0 Critical)
- [ ] 8. Storage bucket 생성 (videos)
- [ ] 9. Storage policy 설정
- [ ] 10. 연결 테스트 (Database, Storage)
