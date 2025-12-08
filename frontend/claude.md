# 모듈: Frontend (Next.js)

## 역할
사용자 인터페이스 및 클라이언트 사이드 로직을 담당하는 Next.js 16 기반 React 애플리케이션

## 기술 스택

- **언어**: TypeScript 5.9.3
- **프레임워크**: Next.js 16 (App Router), React 19.2
- **스타일링**: Tailwind CSS 3.4, shadcn/ui
- **상태 관리**: TanStack Query 5.56, Zustand 5.0
- **테스트**: Jest 30.2, Playwright 1.56
- **패키지 매니저**: pnpm 10.16

## 디렉토리 구조

```
frontend/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── (auth)/            # 인증 라우트 그룹 (로그인, 회원가입)
│   │   ├── dashboard/         # 대시보드 라우트
│   │   │   ├── page.tsx       # 메인 대시보드
│   │   │   ├── youtube-search/ # YouTube 검색 페이지
│   │   │   ├── channels/      # 채널 관리
│   │   │   ├── jobs/          # 작업 관리
│   │   │   ├── templates/     # 템플릿 관리
│   │   │   └── settings/      # 설정
│   │   └── api/               # API 라우트
│   │
│   ├── components/
│   │   ├── ui/                # shadcn/ui 기본 컴포넌트
│   │   └── features/          # 기능별 컴포넌트
│   │       ├── youtube/       # YouTube 검색 관련
│   │       │   └── filters/   # 개별 필터 컴포넌트
│   │       ├── dashboard/     # 대시보드 컴포넌트
│   │       └── settings/      # 설정 컴포넌트
│   │
│   ├── lib/
│   │   ├── api/               # API 클라이언트 함수
│   │   │   ├── client.ts      # axios 인스턴스
│   │   │   └── youtube.ts     # YouTube API 클라이언트
│   │   ├── utils/             # 유틸리티 함수
│   │   │   └── format.ts      # 포맷팅 유틸리티
│   │   └── supabase.ts        # Supabase 클라이언트
│   │
│   └── hooks/                 # 커스텀 훅
│       └── useYouTubeSearch.ts
│
└── public/                    # 정적 파일
```

## 핵심 파일

### 인증
- **`src/app/(auth)/login/page.tsx`**: 로그인 페이지
- **`src/app/(auth)/signup/page.tsx`**: 회원가입 페이지

### 대시보드
- **`src/app/dashboard/page.tsx`**: 메인 대시보드
- **`src/app/dashboard/youtube-search/page.tsx`**: YouTube 검색 페이지
- **`src/components/features/dashboard/`**: 대시보드 관련 컴포넌트

### YouTube 검색 (002-youtube-search)
- **`src/components/features/youtube/`**: YouTube 검색 관련 컴포넌트
  - `SearchBar.tsx`: 검색 입력 폼
  - `SearchFilters.tsx`: 고급 필터링 UI (통합)
  - `VideoCard.tsx`: 영상 카드 컴포넌트
  - `VideoGrid.tsx`: 영상 그리드 레이아웃
  - `filters/`: 개별 필터 컴포넌트
    - `VideoTypeFilter.tsx`: 쇼츠/롱폼 필터
    - `UploadPeriodFilter.tsx`: 업로드 기간 필터
    - `RegionSelector.tsx`: 국가 선택
    - `ViewCountFilter.tsx`: 조회수 필터
    - `SubscriberFilter.tsx`: 구독자 수 필터

### API 클라이언트
- **`src/lib/api/client.ts`**: axios 인스턴스 설정 (인증 헤더 자동 추가)
- **`src/lib/api/youtube.ts`**: YouTube API 클라이언트 함수
  - `searchVideos()`: 영상 검색
  - `getVideoDetails()`: 영상 상세 조회

### 커스텀 훅
- **`src/hooks/useYouTubeSearch.ts`**: YouTube 검색 훅 (TanStack Query)
  - `useSearchVideos()`: 검색 쿼리
  - `useVideoDetails()`: 영상 상세 쿼리

### 유틸리티
- **`src/lib/utils/format.ts`**: 포맷팅 유틸리티
  - `formatDuration()`: ISO 8601 duration → "MM:SS"
  - `formatViewCount()`: 조회수 포맷팅 (1.2M, 3.4K)
  - `formatDate()`: 날짜 포맷팅

## 개발 규칙

### 1. API 호출 규칙
- **모든 API 호출은 `src/lib/api/` 디렉토리의 클라이언트 함수를 사용할 것**
- 직접 fetch나 axios를 사용하지 말 것
- TanStack Query 훅을 통해 API 호출 (캐싱, 재시도 자동 처리)

**Good**:
```typescript
import { useSearchVideos } from '@/hooks/useYouTubeSearch';

const { data, isLoading } = useSearchVideos({ keyword: 'react' });
```

**Bad**:
```typescript
// 직접 fetch 사용 금지
const response = await fetch('/api/v1/youtube/search');
```

### 2. 컴포넌트 스타일 가이드
- **모든 UI 컴포넌트는 shadcn/ui 스타일 가이드를 따를 것**
- `components/ui/`의 기본 컴포넌트를 활용
- Tailwind CSS 유틸리티 클래스 사용
- `cn()` 헬퍼로 클래스 조합

**Example**:
```typescript
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

<Button className={cn("w-full", isActive && "bg-primary")}>
  Submit
</Button>
```

### 3. 인증 상태 관리
- **Supabase Auth의 세션 관리 사용**
- 인증 상태 확인: Supabase 클라이언트를 통해 세션 조회
- 보호된 라우트: 대시보드는 인증 필수

### 4. 타입 안전성
- **모든 API 응답에 TypeScript 인터페이스 정의**
- `src/lib/api/`에 타입 정의 포함
- any 타입 사용 금지

**Example**:
```typescript
// src/lib/api/youtube.ts
export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  // ...
}

export const searchVideos = async (
  params: SearchParams
): Promise<YouTubeSearchResult[]> => {
  // ...
};
```

### 5. 에러 처리
- **TanStack Query의 에러 상태를 UI에 반영**
- 사용자 친화적인 에러 메시지 표시
- 네트워크 에러, API 에러 구분

**Example**:
```typescript
const { data, isLoading, error } = useSearchVideos({ keyword });

if (error) {
  return <ErrorMessage message="검색 중 오류가 발생했습니다." />;
}
```

### 6. 성능 최적화
- **이미지 최적화**: Next.js Image 컴포넌트 사용
- **코드 스플리팅**: 동적 import 활용
- **메모이제이션**: React.memo, useMemo, useCallback 적절히 사용

### 7. 접근성 (a11y)
- **시맨틱 HTML 사용**
- **키보드 내비게이션 지원**
- **ARIA 속성 적절히 사용**

## 개발 명령어

```bash
# 개발 서버 실행
pnpm dev                 # http://localhost:3000

# 테스트
pnpm test                # 단위 테스트
pnpm test:watch          # Watch 모드
pnpm test:coverage       # 커버리지 포함

# 빌드
pnpm build               # 프로덕션 빌드
pnpm start               # 빌드된 앱 실행

# 린팅
pnpm lint                # ESLint 실행
```

## 환경 변수

`.env.local` 파일에 다음 변수 설정:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 주요 의존성

### UI 라이브러리
- `@radix-ui/react-*`: Headless UI 컴포넌트 (shadcn/ui 기반)
- `tailwindcss`: 유틸리티 CSS 프레임워크
- `lucide-react`: 아이콘 라이브러리

### 상태 관리
- `@tanstack/react-query`: 서버 상태 관리
- `zustand`: 클라이언트 상태 관리 (필요 시)

### HTTP 클라이언트
- `axios`: HTTP 요청 라이브러리

### 폼 관리
- React Hook Form (필요 시 추가)

## 코드 스타일

- **ESLint + Prettier** (Airbnb 스타일 가이드)
- **파일명**: kebab-case (예: `search-bar.tsx`)
- **컴포넌트명**: PascalCase (예: `SearchBar`)
- **함수명**: camelCase (예: `handleSubmit`)
- **상수명**: UPPER_SNAKE_CASE (예: `API_BASE_URL`)

## 테스트 전략

### 단위 테스트 (Jest)
- 비즈니스 로직이 포함된 함수
- 유틸리티 함수 (format.ts 등)
- 커스텀 훅

### 컴포넌트 테스트 (React Testing Library)
- 사용자 인터랙션 테스트
- 조건부 렌더링 테스트
- Props 기반 동작 테스트

### E2E 테스트 (Playwright) - 향후 추가 예정
- 주요 사용자 플로우
- 인증 플로우
- YouTube 검색 플로우

## 주의사항

### 현재 구현 상태
- ✅ Phase 1-4 완료: 기본 검색, 고급 필터링
- 🔜 Phase 5 대기: CII 계산 및 필터링
- 🔜 Phase 6 대기: 자막 수집
- 🔜 Phase 7 대기: 영상 미리보기 및 저장

### 개발 시 주의사항
1. **API 엔드포인트**: Backend는 http://localhost:8000에서 실행
2. **CORS**: 로컬 개발 시 CORS 이슈 주의 (Backend에서 설정)
3. **인증 토큰**: Supabase 세션 토큰을 Authorization 헤더에 자동 포함
4. **Rate Limiting**: YouTube API는 10 req/min 제한

### 트러블슈팅
- **CORS 에러**: Backend의 CORS 설정 확인
- **인증 에러**: Supabase 세션 유효성 확인
- **빌드 에러**: `pnpm install` 재실행, node_modules 삭제 후 재설치

## 참고 문서

- [Next.js 공식 문서](https://nextjs.org/docs)
- [shadcn/ui 문서](https://ui.shadcn.com/)
- [TanStack Query 문서](https://tanstack.com/query/latest)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
