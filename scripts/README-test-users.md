# 테스트 사용자 생성 가이드

ClipPilot 개발 환경에서 이메일 확인 없이 즉시 사용 가능한 테스트 계정을 생성하는 방법입니다.

## 🎯 추천 방법: Node.js 스크립트 사용

### 1단계: Service Role Key 확인

1. **Supabase Dashboard** 접속
2. **Settings → API** 이동
3. **Service Role Key** 복사 (⚠️ **절대 공개하지 마세요!**)

### 2단계: 환경 변수 추가

`frontend/.env.local` 파일에 추가:

```bash
# 기존 환경 변수
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 새로 추가 (테스트용)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **주의**: Service Role Key는 `.env.local`에만 저장하고 Git에 커밋하지 마세요!

### 3단계: 스크립트 실행

```bash
# frontend 디렉토리에서 실행
cd frontend
node ../scripts/create-test-users.js
```

### 생성되는 테스트 계정

| 이메일 | 비밀번호 | 역할 | 온보딩 완료 |
|--------|----------|------|------------|
| admin@clippilot.test | Admin1234!@ | 관리자 | ✅ |
| test@clippilot.test | Test1234!@ | 일반 사용자 | ❌ |
| jackslash@naver.com | Rlawjdtlr1234!@ | 개발자 | ❌ |

## 📊 대안 방법 1: Supabase Dashboard

가장 간단하지만 수동으로 해야 합니다:

1. **Dashboard → Authentication → Users**
2. **"Add user"** 클릭
3. 이메일/비밀번호 입력
4. **✅ "Auto Confirm User" 체크**
5. 생성

## 🗃️ 대안 방법 2: SQL 직접 실행

Supabase SQL Editor에서 실행:

```bash
# SQL 파일 확인
cat scripts/create-test-user.sql
```

**Dashboard → SQL Editor**에서 복사/붙여넣기 후 실행

## 🔧 대안 방법 3: 이메일 확인 비활성화 (개발 전용)

**⚠️ 프로덕션에서는 절대 사용하지 마세요!**

1. **Dashboard → Authentication → Settings**
2. **Email Auth** 섹션
3. **"Enable email confirmations" OFF**

이렇게 하면 모든 회원가입이 이메일 확인 없이 즉시 활성화됩니다.

## 🧪 테스트 확인

```bash
# 브라우저에서
http://localhost:3000/login

# 로그인 테스트
이메일: admin@clippilot.test
비밀번호: Admin1234!@
```

## 🗑️ 테스트 계정 삭제

```bash
# Supabase Dashboard
Authentication → Users → 해당 사용자 선택 → Delete User
```

## 💡 팁

- **개발 환경**: 방법 3 (이메일 확인 비활성화) 권장
- **스테이징 환경**: 방법 1 (스크립트) 또는 방법 2 (SQL) 권장
- **프로덕션**: 이메일 확인 필수! 테스트 계정은 Dashboard에서 수동 생성

## 🔒 보안 주의사항

1. ⚠️ **Service Role Key는 절대 공개하지 마세요**
2. ⚠️ **`.env.local`은 Git에 커밋하지 마세요**
3. ⚠️ **프로덕션에서는 이메일 확인을 반드시 활성화하세요**
4. ⚠️ **테스트 계정은 개발 환경에서만 사용하세요**
