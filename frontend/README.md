# ClipPilot Frontend

Next.js 14 기반 ClipPilot 웹 애플리케이션

## 🛠 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **UI Library**: React 18
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + TanStack Query
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 인증 관련 라우트 그룹
│   │   │   ├── login/          # 로그인 페이지
│   │   │   ├── signup/         # 회원가입 페이지
│   │   │   └── reset-password/ # 비밀번호 재설정
│   │   ├── dashboard/          # 대시보드 (인증 필요)
│   │   ├── api/                # API 라우트
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   └── page.tsx            # 홈 페이지
│   ├── components/             # 재사용 가능한 컴포넌트
│   │   ├── ui/                 # shadcn/ui 기본 컴포넌트
│   │   └── features/           # 기능별 컴포넌트
│   └── lib/                    # 유틸리티 및 헬퍼
│       ├── api/                # API 클라이언트
│       ├── hooks/              # 커스텀 훅
│       ├── stores/             # Zustand 스토어
│       └── supabase.ts         # Supabase 클라이언트
├── public/                     # 정적 파일
├── .env.local                  # 환경 변수 (로컬)
└── middleware.ts               # Next.js 미들웨어 (인증 보호)
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 http://localhost:3000 으로 접속하세요.

## 📜 주요 스크립트

```bash
pnpm dev          # 개발 서버 실행 (http://localhost:3000)
pnpm build        # 프로덕션 빌드
pnpm start        # 프로덕션 서버 실행
pnpm lint         # ESLint 실행
pnpm format       # Prettier 포맷팅
```

## 🎨 UI 컴포넌트

shadcn/ui를 사용하여 재사용 가능한 컴포넌트를 제공합니다.

**설치된 컴포넌트:**
- Button
- Input
- Card
- Form
- Label
- Toast

**컴포넌트 추가:**
```bash
npx shadcn-ui@latest add [component-name]
```

## 🔐 인증 (Phase 3 완료)

### 구현된 기능

- ✅ 회원가입 (`/signup`)
- ✅ 로그인 (`/login`)
- ✅ 비밀번호 재설정 (`/reset-password`)
- ✅ 대시보드 보호 (`/dashboard` - 인증 필요)
- ✅ JWT 토큰 관리
- ✅ 로그인 실패 제한 (3회)

### 사용 방법

**인증 훅 사용:**
```typescript
import { useAuth } from '@/lib/hooks/useAuth';

function MyComponent() {
  const { user, isLoading, signIn, signUp, signOut } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;

  return <div>Welcome, {user.email}!</div>;
}
```

**API 클라이언트 사용:**
```typescript
import { apiClient } from '@/lib/api/client';

// 인증된 요청
const response = await apiClient.get('/api/v1/jobs');

// 인증 토큰 자동 포함됨
```

## 🎯 개발 가이드

### 새 페이지 추가

1. `src/app/` 아래에 폴더 생성
2. `page.tsx` 파일 생성
3. 인증이 필요한 경우 `middleware.ts`에 경로 추가

**예시:**
```typescript
// src/app/my-page/page.tsx
export default function MyPage() {
  return <div>My Page</div>;
}
```

### 새 컴포넌트 추가

1. `src/components/features/` 아래에 파일 생성
2. TypeScript로 컴포넌트 작성
3. 필요한 경우 `src/components/ui/`의 기본 컴포넌트 활용

**예시:**
```typescript
// src/components/features/MyComponent.tsx
import { Button } from '@/components/ui/button';

export function MyComponent() {
  return <Button>Click me</Button>;
}
```

### API 호출 추가

1. `src/lib/api/client.ts`의 `apiClient` 사용
2. TanStack Query로 상태 관리
3. 에러 처리 포함

**예시:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => apiClient.get('/api/v1/jobs'),
  });
}
```

## 🧪 테스트

```bash
# 단위 테스트 (예정)
pnpm test

# E2E 테스트 (예정)
pnpm test:e2e
```

## 📦 빌드 & 배포

### 프로덕션 빌드

```bash
pnpm build
```

빌드 결과는 `.next/` 디렉토리에 생성됩니다.

### Vercel 배포

1. GitHub 저장소 연결
2. 환경 변수 설정 (Vercel 대시보드)
3. 자동 배포

## 🔧 문제 해결

### 개발 서버 실행 실패

**원인**: `.env.local` 파일 없음

**해결:**
```bash
cp .env.local.example .env.local
# Supabase URL과 Anon Key를 입력하세요
```

### 빌드 오류

**원인**: `node_modules` 손상

**해결:**
```bash
rm -rf node_modules .next
pnpm install
pnpm build
```

### 스타일 적용 안 됨

**원인**: Tailwind CSS 설정 오류

**해결:**
```bash
# tailwind.config.ts 확인
# postcss.config.mjs 확인
pnpm dev
```

## 📚 참고 자료

- [Next.js 문서](https://nextjs.org/docs)
- [shadcn/ui 문서](https://ui.shadcn.com/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [TanStack Query 문서](https://tanstack.com/query)
- [Supabase 문서](https://supabase.com/docs)

## 🤝 기여하기

1. 코드 스타일: ESLint + Prettier (Airbnb 가이드)
2. 커밋 메시지: Conventional Commits 형식
3. PR 전 린터 실행: `pnpm lint`

---

**작성일**: 2025-11-03
**버전**: Phase 3 (US0 Authentication) 완료 기준
