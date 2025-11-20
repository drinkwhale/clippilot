# API 키 관리 기능 추가 (Changelog)

## 2025-11-21

### 🎉 새로운 기능

#### 1. API 키 관리 시스템
- **통합 API 키 관리**: YouTube, OpenAI, Pexels API 키를 한 곳에서 관리
- **이중 저장 방식**:
  - **Dev 환경**: `.env` 파일 또는 localStorage 사용
  - **Production 환경**: Supabase에 암호화 저장 (Fernet 암호화)

#### 2. Backend 구현

##### 데이터베이스 스키마
- `api_keys` 테이블 생성
  - `id`, `user_id`, `service_name`, `api_key_encrypted`, `created_at`, `updated_at`, `last_used_at`
  - RLS (Row Level Security) 정책 적용
  - 사용자당 서비스별 1개 키 제한 (UNIQUE 제약)

##### API 엔드포인트
- `GET /api/v1/api-keys` - 사용자의 모든 API 키 목록 조회
- `GET /api/v1/api-keys/{service_name}` - 특정 서비스 API 키 조회
- `POST /api/v1/api-keys` - API 키 생성 또는 업데이트
- `DELETE /api/v1/api-keys/{service_name}` - API 키 삭제
- `GET /api/v1/api-keys/{service_name}/decrypt` - 복호화 (내부 서비스용)

##### 암호화 서비스
- `src/core/encryption.py` - Fernet 기반 암호화/복호화
- 환경변수 `ENCRYPTION_KEY` 필수

#### 3. Frontend 구현

##### 상태 관리
- **Zustand Store** (`useApiKeysStore`):
  - Dev 환경용 localStorage 키 (하위 호환성)
  - Production 환경용 Supabase 키
  - 키 추가/삭제/조회 액션

##### React Query 훅
- `useAPIKeys()` - 전체 키 목록 조회
- `useAPIKey(serviceName)` - 특정 서비스 키 조회
- `useCreateAPIKey()` - 키 생성/업데이트
- `useDeleteAPIKey()` - 키 삭제
- `useAPIKeysStatus(serviceNames)` - 설정 상태 확인

##### UI 컴포넌트
1. **Settings 페이지** (`/dashboard/settings`)
   - `APIKeysSettings.tsx` - 통합 API 키 관리 UI
   - YouTube, OpenAI, Pexels 각 서비스별 설정
   - 마지막 사용 시간 표시
   - API 키 발급 링크 제공

2. **Dashboard Quick Settings**
   - `QuickSettings.tsx` - 드롭다운 메뉴
   - API 키 설정 상태 빠른 확인 (✅/❌ 아이콘)
   - 미설정 키 개수 Badge 표시
   - Settings 페이지 바로가기

#### 4. 문서화
- **API 키 설정 가이드** (`docs/API_KEYS_SETUP.md`)
  - 환경별 설정 방법 (Dev/Production)
  - API 키 발급 방법 (YouTube, OpenAI, Pexels)
  - 보안 고려사항
  - 문제 해결 가이드

- **.env 파일 업데이트**
  - `backend/.env.example` - 암호화 키 추가
  - `frontend/.env.local.example` - API 키 설정 안내

### 📁 파일 변경 사항

#### Backend
```
backend/
├── migrations/
│   └── create_api_keys_table.sql (NEW)
├── src/
│   ├── api/v1/
│   │   ├── __init__.py (MODIFIED)
│   │   └── api_keys.py (NEW)
│   ├── core/
│   │   └── encryption.py (NEW)
│   └── models/
│       └── api_key.py (NEW)
└── .env.example (MODIFIED)
```

#### Frontend
```
frontend/
├── src/
│   ├── app/dashboard/
│   │   ├── page.tsx (MODIFIED)
│   │   └── settings/
│   │       └── page.tsx (MODIFIED)
│   ├── components/features/
│   │   ├── dashboard/
│   │   │   └── QuickSettings.tsx (NEW)
│   │   └── settings/
│   │       └── APIKeysSettings.tsx (NEW)
│   ├── lib/
│   │   ├── api/
│   │   │   └── api-keys.ts (NEW)
│   │   ├── hooks/
│   │   │   └── useAPIKeys.ts (NEW)
│   │   ├── stores/
│   │   │   └── api-keys-store.ts (MODIFIED)
│   │   └── types/
│   │       └── api-keys.ts (NEW)
└── .env.local.example (MODIFIED)
```

#### 문서
```
docs/
├── API_KEYS_SETUP.md (NEW)
└── CHANGELOG_API_KEYS.md (NEW)
```

### 🔐 보안 개선
- Fernet 대칭키 암호화로 API 키 안전하게 저장
- RLS 정책으로 사용자별 데이터 격리
- 프론트엔드에서 암호화된 키 노출 방지
- 생성 직후에만 평문 키 반환 (이후 조회 불가)

### 📊 사용 통계 추적
- `last_used_at` 필드로 각 API 키 사용 이력 기록
- 미사용 키 식별 가능

### 🎨 UX 개선
- Dashboard에 설정 상태 빠른 확인 기능
- 미설정 키 개수 Badge로 시각적 피드백
- Settings 페이지에서 통합 관리
- API 키 발급 링크 제공

### 🐛 알려진 제한사항
- 암호화 키 분실 시 복구 불가 (백업 권장)
- 한 사용자당 서비스별 1개 키만 저장 가능
- API 키 갱신 시 이전 키는 자동 삭제

### 📝 다음 단계
- [ ] API 키 사용량 모니터링 대시보드
- [ ] 여러 개의 API 키 로테이션 기능
- [ ] API 키 만료 알림
- [ ] Audit Log (API 키 변경 이력)
