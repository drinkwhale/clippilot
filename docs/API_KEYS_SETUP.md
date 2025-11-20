# API 키 설정 가이드

ClipPilot에서 외부 서비스(YouTube, OpenAI, Pexels) API 키를 관리하는 방법을 설명합니다.

## 환경별 설정 방법

### 🔧 개발 환경 (Development)

개발 환경에서는 **두 가지 방법** 중 하나를 선택하여 API 키를 설정할 수 있습니다:

#### 방법 1: .env 파일 사용 (권장)

```bash
# backend/.env
YOUTUBE_API_KEY=your_youtube_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
PEXELS_API_KEY=your_pexels_api_key_here

# 암호화 키 (필수)
ENCRYPTION_KEY=your_32_byte_base64_encoded_key_here
```

암호화 키 생성 방법:
```python
# Python에서 실행
from cryptography.fernet import Fernet
key = Fernet.generate_key()
print(key.decode())
```

#### 방법 2: 대시보드 UI 사용

1. http://localhost:3000/dashboard 접속
2. 우측 상단 "API 키 설정" 버튼 클릭
3. 각 서비스별 API 키 입력 및 저장
4. **주의**: 이 방법은 localStorage에 저장되므로, 프로덕션에서는 사용하지 마세요

### 🚀 프로덕션 환경 (Production)

프로덕션 환경에서는 **Supabase에 암호화 저장** 방식만 사용됩니다:

1. **데이터베이스 마이그레이션 실행**
   ```bash
   # Supabase CLI로 마이그레이션 적용
   cd backend
   supabase db push

   # 또는 Supabase Dashboard에서 SQL 직접 실행
   # backend/migrations/create_api_keys_table.sql 내용 복사 & 실행
   ```

2. **암호화 키 설정**
   ```bash
   # 환경변수 설정 (Render, Vercel 등)
   ENCRYPTION_KEY=your_32_byte_base64_encoded_key_here
   ```

3. **대시보드에서 API 키 설정**
   - 프로덕션 URL: https://your-domain.com/dashboard/settings
   - "API 키 관리" 섹션에서 각 서비스별 키 입력
   - 저장 시 자동으로 Supabase에 암호화되어 저장됨

## API 키 발급 방법

### YouTube Data API v3

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 (또는 기존 프로젝트 선택)
3. "API 및 서비스" → "사용 설정된 API 및 서비스" → "+ API 및 서비스 사용 설정"
4. "YouTube Data API v3" 검색 및 사용 설정
5. "사용자 인증 정보" → "+ 사용자 인증 정보 만들기" → "API 키"
6. API 키 제한 설정 (권장):
   - HTTP 리퍼러 제한 (웹 앱)
   - API 제한: YouTube Data API v3만 허용

**무료 할당량**: 일일 10,000 units (검색 1회 = 100 units)

### OpenAI API

1. [OpenAI Platform](https://platform.openai.com/) 접속
2. 계정 생성 및 로그인
3. "API keys" 메뉴 클릭
4. "+ Create new secret key" 클릭
5. 키 이름 입력 후 생성
6. **중요**: 생성 직후 한 번만 표시되므로 안전한 곳에 저장

**요금제**:
- 사용한 만큼 과금 (Pay-as-you-go)
- GPT-4o: $5.00 / 1M input tokens, $15.00 / 1M output tokens
- 신규 계정 $5 크레딧 제공 (3개월 유효)

### Pexels API

1. [Pexels API](https://www.pexels.com/api/) 접속
2. 계정 생성 및 로그인
3. "Get Started" 클릭
4. 사용 약관 동의
5. API 키 즉시 발급됨

**무료 할당량**: 월 200회 요청 (개인/비상업적 사용)

## 보안 고려사항

### ✅ 권장 사항

1. **환경변수 사용**: `.env` 파일에 저장하고 `.gitignore`에 추가
2. **암호화 저장**: 프로덕션에서는 반드시 Supabase 암호화 저장 방식 사용
3. **API 키 제한**: 각 서비스에서 제공하는 IP/도메인 제한 기능 활성화
4. **정기적 갱신**: 3-6개월마다 API 키 갱신
5. **권한 최소화**: 필요한 권한만 부여 (예: YouTube API는 읽기 전용)

### ❌ 피해야 할 사항

1. **코드에 하드코딩**: Git 히스토리에 노출됨
2. **프론트엔드 노출**: 클라이언트 사이드 코드에 API 키 포함 금지
3. **공개 저장소 업로드**: GitHub 등에 .env 파일 업로드 금지
4. **로컬스토리지 저장**: 프로덕션에서는 localStorage 사용 금지

## 문제 해결

### API 키 저장 실패

**증상**: "API 키 저장 실패" 에러 발생

**해결 방법**:
1. `ENCRYPTION_KEY` 환경변수가 설정되었는지 확인
2. Backend 서버 재시작
3. 네트워크 연결 상태 확인
4. 브라우저 콘솔에서 에러 메시지 확인

### API 키 조회 실패

**증상**: 설정한 API 키를 불러올 수 없음

**해결 방법**:
1. Supabase `api_keys` 테이블이 생성되었는지 확인
2. RLS (Row Level Security) 정책이 올바른지 확인
3. 인증 토큰이 유효한지 확인 (로그아웃 후 재로그인)

### YouTube API 할당량 초과

**증상**: "Quota exceeded" 에러 발생

**해결 방법**:
1. [Google Cloud Console](https://console.cloud.google.com/) → "API 및 서비스" → "대시보드"에서 사용량 확인
2. 할당량 증가 요청 (유료 전환 필요)
3. 또는 다음날 00:00 PST에 할당량 리셋 대기

## 참고 자료

- [YouTube Data API 문서](https://developers.google.com/youtube/v3)
- [OpenAI API 문서](https://platform.openai.com/docs)
- [Pexels API 문서](https://www.pexels.com/api/documentation/)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Cryptography (Python) 문서](https://cryptography.io/en/latest/)
