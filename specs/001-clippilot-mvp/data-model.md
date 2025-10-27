# Data Model: ClipPilot MVP

**Feature**: ClipPilot MVP - AI 숏폼 크리에이터 자동화 SaaS
**Date**: 2025-10-27
**Spec**: [spec.md](./spec.md)
**Plan**: [plan.md](./plan.md)

## Overview

ClipPilot의 데이터 모델은 Supabase PostgreSQL을 사용하며, 사용자, 채널, 템플릿, 작업, 구독, 사용 로그, 웹훅을 관리합니다.

---

## Entities

### 1. User (사용자)

사용자 계정 정보를 저장합니다.

**Fields**:
| 필드 | 타입 | Null | 기본값 | 설명 |
|------|------|------|--------|------|
| id | UUID | No | gen_random_uuid() | Primary Key |
| email | VARCHAR(255) | No | - | 이메일 (유니크) |
| plan | ENUM('free', 'pro', 'agency') | No | 'free' | 현재 플랜 |
| oauth_provider | VARCHAR(50) | Yes | NULL | OAuth 제공자 (google) |
| created_at | TIMESTAMPTZ | No | NOW() | 가입일 |
| updated_at | TIMESTAMPTZ | No | NOW() | 수정일 |
| last_login_at | TIMESTAMPTZ | Yes | NULL | 마지막 로그인 |
| is_active | BOOLEAN | No | true | 계정 활성화 상태 |

**Indexes**:
- `users_pkey` (id) - Primary Key
- `users_email_key` (email) - Unique
- `users_plan_idx` (plan) - 플랜별 조회 최적화

**Relationships**:
- → `channels` (1:N): 한 사용자는 여러 채널 소유 가능
- → `templates` (1:N): 한 사용자는 여러 템플릿 소유 가능
- → `jobs` (1:N): 한 사용자는 여러 작업 생성 가능
- → `subscriptions` (1:1): 한 사용자는 하나의 구독 정보

**Validation Rules**:
- `email`: RFC 5322 이메일 형식, 소문자 변환 저장
- `plan`: 'free', 'pro', 'agency' 중 하나
- FR-021: 이메일 중복 검증

---

### 2. Channel (채널)

연결된 YouTube 채널 정보를 저장합니다.

**Fields**:
| 필드 | 타입 | Null | 기본값 | 설명 |
|------|------|------|--------|------|
| id | UUID | No | gen_random_uuid() | Primary Key |
| user_id | UUID | No | - | Foreign Key → users.id |
| yt_channel_id | VARCHAR(255) | No | - | YouTube 채널 ID (유니크) |
| channel_name | VARCHAR(255) | No | - | 채널명 |
| channel_thumbnail | TEXT | Yes | NULL | 채널 프로필 이미지 URL |
| access_token_meta | JSONB | No | - | OAuth 토큰 메타데이터 (암호화) |
| token_expires_at | TIMESTAMPTZ | No | - | 토큰 만료 시각 |
| is_active | BOOLEAN | No | true | 채널 활성화 상태 |
| created_at | TIMESTAMPTZ | No | NOW() | 연결일 |
| updated_at | TIMESTAMPTZ | No | NOW() | 수정일 |

**Indexes**:
- `channels_pkey` (id) - Primary Key
- `channels_user_id_idx` (user_id) - 사용자별 조회 최적화
- `channels_yt_channel_id_key` (yt_channel_id) - Unique

**Relationships**:
- ← `users` (N:1): 한 채널은 한 사용자에게 속함
- → `jobs` (1:N): 한 채널은 여러 작업에서 업로드 타겟이 될 수 있음

**Validation Rules**:
- `yt_channel_id`: YouTube 채널 ID 형식 (UC로 시작)
- `access_token_meta`: pgcrypto로 암호화 저장 (NFR-009)
- FR-012: OAuth 토큰은 암호화 저장
- FR-013: 토큰 만료 시 재인증 요청

**Security**:
- Row Level Security (RLS): `user_id = auth.uid()`로 본인 채널만 조회 가능

---

### 3. Template (템플릿)

사용자의 브랜드 프리셋을 저장합니다.

**Fields**:
| 필드 | 타입 | Null | 기본값 | 설명 |
|------|------|------|--------|------|
| id | UUID | No | gen_random_uuid() | Primary Key |
| user_id | UUID | No | - | Foreign Key → users.id |
| name | VARCHAR(255) | No | - | 템플릿 이름 |
| brand_config_json | JSONB | No | {} | 브랜드 설정 (폰트, 색상, 인트로/아웃로 등) |
| is_system_default | BOOLEAN | No | false | 시스템 기본 템플릿 여부 |
| created_at | TIMESTAMPTZ | No | NOW() | 생성일 |
| updated_at | TIMESTAMPTZ | No | NOW() | 수정일 |

**Indexes**:
- `templates_pkey` (id) - Primary Key
- `templates_user_id_idx` (user_id) - 사용자별 조회 최적화
- `templates_is_system_default_idx` (is_system_default) - 기본 템플릿 조회

**Relationships**:
- ← `users` (N:1): 한 템플릿은 한 사용자에게 속함
- → `jobs` (1:N): 한 템플릿은 여러 작업에서 사용될 수 있음

**brand_config_json Structure**:
```json
{
  "subtitle": {
    "font_family": "Pretendard",
    "font_size": 24,
    "color": "#FFFFFF",
    "background_color": "#000000",
    "position": "bottom"
  },
  "intro": {
    "duration_sec": 5,
    "video_url": "https://..."
  },
  "outro": {
    "duration_sec": 5,
    "video_url": "https://..."
  },
  "watermark": {
    "image_url": "https://...",
    "position": "top-right",
    "opacity": 0.8
  },
  "colors": {
    "primary": "#FF5722",
    "secondary": "#2196F3"
  }
}
```

**Validation Rules**:
- `name`: 1~100자
- `brand_config_json`: JSON schema 검증
- FR-031: 시스템 기본 템플릿 3개 제공 (리뷰, 뉴스, 교육)

---

### 4. Job (작업)

콘텐츠 생성 작업을 추적합니다.

**Fields**:
| 필드 | 타입 | Null | 기본값 | 설명 |
|------|------|------|--------|------|
| id | UUID | No | gen_random_uuid() | Primary Key |
| user_id | UUID | No | - | Foreign Key → users.id |
| channel_id | UUID | Yes | NULL | Foreign Key → channels.id (업로드 타겟) |
| template_id | UUID | Yes | NULL | Foreign Key → templates.id |
| status | ENUM | No | 'queued' | 작업 상태 |
| prompt | TEXT | No | - | 사용자 입력 프롬프트 |
| video_length_sec | INT | No | 60 | 영상 길이 (초) |
| tone | VARCHAR(50) | No | 'informative' | 톤 (informative, fun, emotional) |
| script | TEXT | Yes | NULL | 생성된 스크립트 |
| srt | TEXT | Yes | NULL | 생성된 SRT 자막 |
| metadata_json | JSONB | Yes | NULL | 메타데이터 (제목, 설명, 태그) |
| output_video_url | TEXT | Yes | NULL | 렌더링된 영상 URL (Supabase Storage) |
| output_thumbnail_url | TEXT | Yes | NULL | 썸네일 URL |
| youtube_video_id | VARCHAR(255) | Yes | NULL | YouTube 업로드 후 video ID |
| error_message | TEXT | Yes | NULL | 에러 메시지 (실패 시) |
| render_started_at | TIMESTAMPTZ | Yes | NULL | 렌더링 시작 시각 |
| render_completed_at | TIMESTAMPTZ | Yes | NULL | 렌더링 완료 시각 |
| created_at | TIMESTAMPTZ | No | NOW() | 작업 생성일 |
| updated_at | TIMESTAMPTZ | No | NOW() | 수정일 |

**Status Enum**: `'queued'`, `'generating'`, `'rendering'`, `'uploading'`, `'done'`, `'failed'`

**Indexes**:
- `jobs_pkey` (id) - Primary Key
- `jobs_user_id_status_created_at_idx` (user_id, status, created_at) - 복합 인덱스
- `jobs_status_created_at_idx` (status, created_at) - 큐 조회 최적화
- `jobs_youtube_video_id_idx` (youtube_video_id) - YouTube ID 조회

**Relationships**:
- ← `users` (N:1): 한 작업은 한 사용자에게 속함
- ← `channels` (N:1): 한 작업은 하나의 채널로 업로드
- ← `templates` (N:1): 한 작업은 하나의 템플릿 사용
- → `usage_logs` (1:N): 한 작업은 여러 사용 로그 생성 가능

**metadata_json Structure**:
```json
{
  "title": "스마트폰 리뷰 제목",
  "description": "영상 설명...",
  "tags": ["스마트폰", "리뷰", "기술"],
  "chapters": [
    {"time": "00:00", "title": "인트로"},
    {"time": "00:30", "title": "본론"}
  ]
}
```

**Validation Rules**:
- `prompt`: 5단어 이상 (Edge Case)
- `video_length_sec`: 15, 30, 60 중 하나
- `tone`: 'informative', 'fun', 'emotional' 중 하나
- FR-001, FR-002: 프롬프트 → 스크립트 → SRT/메타데이터

**State Transitions**:
```
queued → generating → rendering → uploading → done
                            ↓         ↓
                         failed    failed
```

---

### 5. Subscription (구독)

사용자의 결제 정보를 저장합니다.

**Fields**:
| 필드 | 타입 | Null | 기본값 | 설명 |
|------|------|------|--------|------|
| id | UUID | No | gen_random_uuid() | Primary Key |
| user_id | UUID | No | - | Foreign Key → users.id (Unique) |
| plan | ENUM('free', 'pro', 'agency') | No | 'free' | 플랜 |
| status | ENUM | No | 'active' | 구독 상태 |
| provider_customer_id | VARCHAR(255) | Yes | NULL | Stripe Customer ID |
| provider_subscription_id | VARCHAR(255) | Yes | NULL | Stripe Subscription ID |
| current_period_start | TIMESTAMPTZ | Yes | NULL | 현재 주기 시작일 |
| current_period_end | TIMESTAMPTZ | Yes | NULL | 현재 주기 종료일 |
| cancel_at_period_end | BOOLEAN | No | false | 주기 종료 시 해지 여부 |
| created_at | TIMESTAMPTZ | No | NOW() | 구독 생성일 |
| updated_at | TIMESTAMPTZ | No | NOW() | 수정일 |

**Status Enum**: `'active'`, `'cancelled'`, `'past_due'`, `'unpaid'`

**Indexes**:
- `subscriptions_pkey` (id) - Primary Key
- `subscriptions_user_id_key` (user_id) - Unique
- `subscriptions_status_idx` (status) - 상태별 조회
- `subscriptions_provider_customer_id_idx` (provider_customer_id) - Stripe 조회

**Relationships**:
- ← `users` (1:1): 한 구독은 한 사용자에게 속함

**Validation Rules**:
- `plan`: 'free', 'pro', 'agency' 중 하나
- FR-008: Free 20회, Pro 500회, Agency 2,000회/월
- FR-009: 결제 완료 즉시 플랜 전환
- FR-017: Stripe Webhook으로 상태 동기화

**Monthly Limits**:
| Plan | 월간 생성 한도 | 가격 |
|------|---------------|------|
| Free | 20회 | 0원 |
| Pro | 500회 | 19,000원 |
| Agency | 2,000회 | 79,000원 |

---

### 6. UsageLog (사용 로그)

사용자의 사용량과 비용을 추적합니다.

**Fields**:
| 필드 | 타입 | Null | 기본값 | 설명 |
|------|------|------|--------|------|
| id | UUID | No | gen_random_uuid() | Primary Key |
| user_id | UUID | No | - | Foreign Key → users.id |
| job_id | UUID | Yes | NULL | Foreign Key → jobs.id |
| action_type | VARCHAR(50) | No | - | 작업 유형 (generate, render, upload) |
| tokens_in | INT | Yes | NULL | 입력 토큰 수 (LLM) |
| tokens_out | INT | Yes | NULL | 출력 토큰 수 (LLM) |
| render_duration_sec | INT | Yes | NULL | 렌더링 소요 시간 (초) |
| api_cost_usd | DECIMAL(10,6) | Yes | NULL | API 비용 (USD) |
| created_at | TIMESTAMPTZ | No | NOW() | 로그 생성일 |

**Indexes**:
- `usage_logs_pkey` (id) - Primary Key
- `usage_logs_user_id_created_at_idx` (user_id, created_at) - 사용자별 시계열 조회
- `usage_logs_job_id_idx` (job_id) - 작업별 조회

**Relationships**:
- ← `users` (N:1): 한 로그는 한 사용자에게 속함
- ← `jobs` (N:1): 한 로그는 하나의 작업에 연결 (선택)

**Validation Rules**:
- `action_type`: 'generate', 'render', 'upload' 중 하나
- NFR-016: 일일 LLM 비용 알람

**Usage Calculation**:
- 월간 사용량 = `COUNT(DISTINCT job_id WHERE action_type='generate' AND created_at >= start_of_month)`
- FR-033~035: 80% 도달 시 배너, 100% 도달 시 이메일

---

### 7. Webhook (웹훅)

외부 서비스로부터의 이벤트를 기록합니다.

**Fields**:
| 필드 | 타입 | Null | 기본값 | 설명 |
|------|------|------|--------|------|
| id | UUID | No | gen_random_uuid() | Primary Key |
| type | VARCHAR(50) | No | - | 웹훅 타입 (payment, subscription) |
| provider | VARCHAR(50) | No | - | 제공자 (stripe, youtube) |
| payload_json | JSONB | No | - | 이벤트 페이로드 |
| processed | BOOLEAN | No | false | 처리 완료 여부 |
| processed_at | TIMESTAMPTZ | Yes | NULL | 처리 완료 시각 |
| error_message | TEXT | Yes | NULL | 에러 메시지 (처리 실패 시) |
| created_at | TIMESTAMPTZ | No | NOW() | 웹훅 수신일 |

**Indexes**:
- `webhooks_pkey` (id) - Primary Key
- `webhooks_type_processed_created_at_idx` (type, processed, created_at) - 미처리 웹훅 조회
- `webhooks_provider_idx` (provider) - 제공자별 조회

**Validation Rules**:
- `type`: 'payment', 'subscription', 'youtube_upload' 등
- FR-017: Stripe Webhook signature 검증

**Security**:
- Webhook signature 검증으로 위조 방지
- Idempotency key로 중복 처리 방지

---

## Relationships Diagram

```
users (1) ──< (N) channels
  │
  ├──< (N) templates
  │
  ├──< (N) jobs ──< (N) usage_logs
  │         │
  │         └──> (1) channels
  │         └──> (1) templates
  │
  └──> (1) subscriptions

webhooks (독립)
```

---

## Database Setup

### Supabase Configuration

**1. Enable Extensions**:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

**2. Create ENUMs**:
```sql
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'agency');
CREATE TYPE job_status AS ENUM ('queued', 'generating', 'rendering', 'uploading', 'done', 'failed');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'unpaid');
```

**3. Row Level Security (RLS)**:
```sql
-- users: 본인만 조회/수정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- channels: 본인 채널만 조회/수정
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own channels" ON channels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own channels" ON channels FOR ALL USING (auth.uid() = user_id);

-- templates: 본인 템플릿 + 시스템 기본 템플릿 조회
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own templates" ON templates FOR SELECT USING (auth.uid() = user_id OR is_system_default = true);
CREATE POLICY "Users can manage own templates" ON templates FOR ALL USING (auth.uid() = user_id);

-- jobs: 본인 작업만 조회/수정
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own jobs" ON jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own jobs" ON jobs FOR ALL USING (auth.uid() = user_id);

-- subscriptions: 본인 구독만 조회
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- usage_logs: 본인 로그만 조회
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage logs" ON usage_logs FOR SELECT USING (auth.uid() = user_id);
```

**4. Triggers**:
```sql
-- updated_at 자동 업데이트
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
```

---

## Data Retention Policy

**FR-025~027: 데이터 보관 및 삭제 정책**

### 1. 사용자 데이터 삭제 (계정 삭제 시)
- **30일 이내** 완전 삭제:
  - `users` 레코드
  - 관련 `channels`, `templates`, `jobs` (CASCADE)
  - OAuth 토큰 (암호화 키 삭제)

### 2. 결제 기록 보관
- **5년간 익명화 보관**:
  - `subscriptions` 레코드의 `user_id`를 NULL로 설정
  - `usage_logs`의 `user_id`를 NULL로 설정
  - `provider_customer_id`는 유지 (법적 요구사항)

### 3. 비활성 사용자 정리
- **90일 미로그인 Free 플랜 사용자**:
  - FR-027: 계정 삭제 안내 이메일 발송
  - 7일 후 응답 없으면 자동 삭제

---

## Performance Optimization

### 1. Indexing Strategy
- **Compound Index**: `(user_id, status, created_at)` - 가장 자주 사용되는 쿼리 최적화
- **Partial Index**: `WHERE status IN ('queued', 'generating')` - 진행 중인 작업만

### 2. Query Optimization
- **Pagination**: `LIMIT + OFFSET` 대신 Cursor-based (created_at 기준)
- **N+1 Problem**: JOIN으로 해결 (user + subscription)

### 3. Caching
- **Redis Cache**:
  - 사용자 플랜 정보 (TTL: 1시간)
  - 월간 사용량 (TTL: 10분)
  - 시스템 기본 템플릿 (TTL: 24시간)

---

## Migration Strategy

**Alembic으로 버전 관리**:

1. **Initial Migration** (v0.1.0):
   - 7개 테이블 생성
   - 인덱스 생성
   - RLS 정책 설정
   - 시스템 기본 템플릿 3개 삽입

2. **Future Migrations**:
   - 컬럼 추가/삭제 시 backward compatibility 유지
   - DOWN migration 항상 작성
   - Production 배포 전 Staging 테스트

---

## Security Considerations

### 1. Encryption
- **At Rest**: Supabase는 기본적으로 AES-256 암호화
- **OAuth Tokens**: `pgcrypto`로 추가 암호화 (NFR-009)
- **Environment Variables**: Supabase Vault 사용

### 2. Access Control
- **RLS**: 사용자별 데이터 격리
- **API Key**: Backend API만 데이터 접근 가능
- **Service Role**: Admin 작업만 사용

### 3. Audit Trail
- **FR-018**: 모든 보안 이벤트 로깅
- `webhooks` 테이블로 외부 이벤트 추적
- `usage_logs`로 사용자 행동 추적

---

## Testing Strategy

### 1. Unit Tests
- Model validation (Pydantic)
- CRUD operations

### 2. Integration Tests
- RLS 정책 검증
- Transaction 롤백 테스트
- Trigger 동작 검증

### 3. Performance Tests
- 1,000개 jobs 조회 성능
- Pagination 성능
- JOIN 쿼리 최적화 검증

---

## Next Steps

- ✅ Data Model 정의 완료
- ⏭️ **API Contracts 생성** (contracts/ 디렉토리)
- ⏭️ **Quickstart 문서 작성** (quickstart.md)
