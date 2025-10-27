# Quickstart: ClipPilot MVP 개발 시작하기

**Feature**: ClipPilot MVP - AI 숏폼 크리에이터 자동화 SaaS
**Date**: 2025-10-27
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)
**Data Model**: [data-model.md](./data-model.md)
**API Contract**: [contracts/api-v1.yaml](./contracts/api-v1.yaml)

## 목차

1. [개발 환경 설정](#개발-환경-설정)
2. [프로젝트 구조 생성](#프로젝트-구조-생성)
3. [Supabase 설정](#supabase-설정)
4. [Backend 설정](#backend-설정)
5. [Worker 설정](#worker-설정)
6. [Frontend 설정](#frontend-설정)
7. [로컬 실행](#로컬-실행)
8. [테스트 실행](#테스트-실행)
9. [다음 단계](#다음-단계)

---

## 개발 환경 설정

### 필수 도구 설치

```bash
# 1. Node.js 18+ 설치
node --version  # v18.0.0 이상 확인

# 2. Python 3.11 설치
python --version  # 3.11.0 이상 확인

# 3. Go 1.21 설치
go version  # go1.21 이상 확인

# 4. FFmpeg 설치
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# 확인
ffmpeg -version

# 5. Docker 설치 (선택)
docker --version
```

### 외부 서비스 계정 준비

- **Supabase**: https://supabase.com (무료 계정)
- **OpenAI**: https://platform.openai.com (API Key 필요)
- **Stripe**: https://stripe.com (Test mode)
- **Pexels**: https://www.pexels.com/api (API Key 필요)
- **Google Cloud**: https://console.cloud.google.com (YouTube Data API 활성화)

---

## 프로젝트 구조 생성

```bash
# 1. 저장소 클론 (이미 완료된 경우 skip)
cd clippilot

# 2. 디렉토리 생성
mkdir -p frontend backend worker shared/contracts shared/types infra/docker infra/scripts

# 3. Git 브랜치 확인
git branch
# * 001-clippilot-mvp (현재 브랜치)
```

---

## Supabase 설정

### 1. Supabase 프로젝트 생성

1. https://supabase.com 에서 새 프로젝트 생성
2. Project name: `clippilot-dev`
3. Database password 설정 및 저장
4. Region: `Northeast Asia (Seoul)` 선택

### 2. 데이터베이스 마이그레이션

```sql
-- Supabase SQL Editor에서 실행

-- Extensions 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMs 생성
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'agency');
CREATE TYPE job_status AS ENUM ('queued', 'generating', 'rendering', 'uploading', 'done', 'failed');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'unpaid');

-- Users 테이블 (Supabase Auth와 연동)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  plan plan_type NOT NULL DEFAULT 'free',
  oauth_provider VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Channels 테이블
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  yt_channel_id VARCHAR(255) NOT NULL UNIQUE,
  channel_name VARCHAR(255) NOT NULL,
  channel_thumbnail TEXT,
  access_token_meta JSONB NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Templates 테이블
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  brand_config_json JSONB NOT NULL DEFAULT '{}',
  is_system_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs 테이블
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  status job_status NOT NULL DEFAULT 'queued',
  prompt TEXT NOT NULL,
  video_length_sec INT NOT NULL DEFAULT 60,
  tone VARCHAR(50) NOT NULL DEFAULT 'informative',
  script TEXT,
  srt TEXT,
  metadata_json JSONB,
  output_video_url TEXT,
  output_thumbnail_url TEXT,
  youtube_video_id VARCHAR(255),
  error_message TEXT,
  render_started_at TIMESTAMPTZ,
  render_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions 테이블
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan plan_type NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  provider_customer_id VARCHAR(255),
  provider_subscription_id VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UsageLogs 테이블
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  tokens_in INT,
  tokens_out INT,
  render_duration_sec INT,
  api_cost_usd DECIMAL(10,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Webhooks 테이블
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  payload_json JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX users_plan_idx ON users(plan);
CREATE INDEX channels_user_id_idx ON channels(user_id);
CREATE INDEX templates_user_id_idx ON templates(user_id);
CREATE INDEX templates_is_system_default_idx ON templates(is_system_default);
CREATE INDEX jobs_user_id_status_created_at_idx ON jobs(user_id, status, created_at);
CREATE INDEX jobs_status_created_at_idx ON jobs(status, created_at);
CREATE INDEX jobs_youtube_video_id_idx ON jobs(youtube_video_id);
CREATE INDEX subscriptions_status_idx ON subscriptions(status);
CREATE INDEX subscriptions_provider_customer_id_idx ON subscriptions(provider_customer_id);
CREATE INDEX usage_logs_user_id_created_at_idx ON usage_logs(user_id, created_at);
CREATE INDEX usage_logs_job_id_idx ON usage_logs(job_id);
CREATE INDEX webhooks_type_processed_created_at_idx ON webhooks(type, processed, created_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own channels" ON channels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own channels" ON channels FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view templates" ON templates FOR SELECT USING (auth.uid() = user_id OR is_system_default = true);
CREATE POLICY "Users can manage own templates" ON templates FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own jobs" ON jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own jobs" ON jobs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own usage logs" ON usage_logs FOR SELECT USING (auth.uid() = user_id);

-- 시스템 기본 템플릿 3개 삽입 (FR-031)
INSERT INTO templates (user_id, name, brand_config_json, is_system_default) VALUES
  (NULL, '리뷰 스타일', '{"subtitle": {"font_family": "Pretendard", "font_size": 24, "color": "#FFFFFF", "background_color": "#000000", "position": "bottom"}}', true),
  (NULL, '뉴스 스타일', '{"subtitle": {"font_family": "Noto Sans KR", "font_size": 20, "color": "#FFFFFF", "background_color": "#1E3A8A", "position": "bottom"}}', true),
  (NULL, '교육 스타일', '{"subtitle": {"font_family": "Nanum Gothic", "font_size": 22, "color": "#000000", "background_color": "#F3F4F6", "position": "bottom"}}', true);
```

### 3. Supabase Storage 버킷 생성

Supabase Dashboard → Storage → Create Bucket:
- `videos` (public, 5GB limit)
- `thumbnails` (public, 100MB limit)
- `templates` (public, 500MB limit)

### 4. 환경 변수 저장

```bash
# Supabase Dashboard → Settings → API
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_ANON_KEY="eyJ..."
export SUPABASE_SERVICE_KEY="eyJ..."
```

---

## Backend 설정

### 1. 프로젝트 초기화

```bash
cd backend

# Python 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# requirements.txt 내용:
# fastapi==0.109.0
# uvicorn[standard]==0.27.0
# pydantic==2.5.0
# pydantic-settings==2.1.0
# supabase==2.3.0
# openai==1.10.0
# google-api-python-client==2.115.0
# google-auth-httplib2==0.2.0
# google-auth-oauthlib==1.2.0
# stripe==7.11.0
# celery[redis]==5.3.6
# redis==5.0.1
# httpx==0.26.0
# pytest==7.4.4
# pytest-asyncio==0.23.3
```

### 2. 환경 변수 설정

`backend/.env` 파일 생성:

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# YouTube
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:8000/v1/channels/oauth/youtube/callback

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_AGENCY=price_xxx

# Pexels
PEXELS_API_KEY=xxx

# Redis
REDIS_URL=redis://localhost:6379/0

# App
APP_ENV=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000
```

### 3. Alembic 설정 (DB 마이그레이션)

```bash
# Alembic 초기화
alembic init alembic

# alembic.ini 수정
sqlalchemy.url = postgresql://...

# 첫 마이그레이션 생성
alembic revision --autogenerate -m "Initial migration"

# 마이그레이션 적용
alembic upgrade head
```

---

## Worker 설정

### 1. 프로젝트 초기화

```bash
cd worker

# Go 모듈 초기화
go mod init github.com/yourusername/clippilot/worker

# 의존성 설치
go get github.com/redis/go-redis/v9
go get github.com/google/uuid
go get github.com/supabase-community/supabase-go
```

### 2. 환경 변수 설정

`worker/.env` 파일 생성:

```bash
REDIS_URL=redis://localhost:6379/0
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
FFMPEG_PATH=/usr/local/bin/ffmpeg
LOG_LEVEL=info
WORKER_CONCURRENCY=4
```

---

## Frontend 설정

### 1. 프로젝트 생성

```bash
cd frontend

# Next.js 프로젝트 생성
npx create-next-app@14 . --typescript --tailwind --app --use-npm

# 의존성 설치
npm install @supabase/supabase-js@2
npm install @tanstack/react-query@5
npm install zustand
npm install axios
npm install date-fns
npm install lucide-react

# shadcn/ui 초기화
npx shadcn-ui@latest init

# 주요 컴포넌트 추가
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add table
npx shadcn-ui@latest add toast
```

### 2. 환경 변수 설정

`frontend/.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://localhost:8000/v1
```

---

## 로컬 실행

### 1. Redis 시작

```bash
# Docker 사용
docker run -d -p 6379:6379 redis:7-alpine

# 또는 로컬 설치
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

### 2. Backend 실행

```bash
cd backend
source venv/bin/activate

# API 서버 시작
uvicorn src.main:app --reload --port 8000

# Celery 워커 시작 (별도 터미널)
celery -A src.workers worker --loglevel=info
```

### 3. Worker 실행

```bash
cd worker
go run cmd/worker/main.go
```

### 4. Frontend 실행

```bash
cd frontend
npm run dev
```

### 5. 접속

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 테스트 실행

### Backend 테스트

```bash
cd backend

# 전체 테스트
pytest

# 단위 테스트만
pytest tests/unit

# 커버리지 포함
pytest --cov=src --cov-report=html
```

### Worker 테스트

```bash
cd worker

# 전체 테스트
go test ./...

# 커버리지 포함
go test -cover ./...
```

### Frontend 테스트

```bash
cd frontend

# 단위 테스트
npm test

# E2E 테스트
npm run test:e2e
```

---

## 다음 단계

### Phase 2: Tasks 생성

```bash
# /speckit.tasks 명령어 실행
# tasks.md 파일 생성 (Phase 0~1 참고)
```

### Phase 3: Implementation

```bash
# 구현 순서 (우선순위 기반):
# 1. User Story 0 (P0): 인증/회원가입
# 2. User Story 1 (P0): 콘텐츠 생성
# 3. User Story 6 (P0): YouTube 연동
# 4. User Story 2 (P0): 영상 렌더링/업로드
# 5. User Story 4 (P1): 결제
# 6. User Story 3 (P1): 템플릿
# 7. User Story 7 (P1): 온보딩
# 8. User Story 5 (P2): 대시보드
```

---

## 문제 해결

### 일반적인 문제

**Q: Supabase 연결 실패**
```bash
# RLS 정책 확인
# Service Key 사용 확인
# CORS 설정 확인 (Supabase Dashboard → Authentication → URL Configuration)
```

**Q: FFmpeg 오류**
```bash
# FFmpeg 경로 확인
which ffmpeg

# 권한 확인
ffmpeg -version
```

**Q: Redis 연결 실패**
```bash
# Redis 실행 확인
redis-cli ping  # 응답: PONG

# 포트 확인
netstat -an | grep 6379
```

**Q: OpenAI API 오류**
```bash
# API Key 확인
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# 크레딧 확인 (https://platform.openai.com/usage)
```

---

## 유용한 명령어

```bash
# Backend
# API 서버 로그 확인
tail -f logs/app.log

# Celery 작업 모니터링
celery -A src.workers flower  # http://localhost:5555

# Worker
# 렌더링 큐 확인
redis-cli LLEN render_queue

# Frontend
# 빌드 확인
npm run build
npm start

# 타입 체크
npm run type-check

# Lint
npm run lint
```

---

## 참고 자료

- **Spec**: [spec.md](./spec.md) - 전체 요구사항
- **Data Model**: [data-model.md](./data-model.md) - 데이터베이스 스키마
- **API Contract**: [contracts/api-v1.yaml](./contracts/api-v1.yaml) - REST API 명세
- **Research**: [research.md](./research.md) - 기술 선택 근거

---

**작성자**: Claude (AI Assistant)
**버전**: 1.0.0
**최종 수정일**: 2025-10-27
