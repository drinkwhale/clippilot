# Linear Theme System

Linear.app의 디자인 시스템을 기반으로 한 테마 시스템입니다.

## 📁 파일 구조

```
src/lib/theme/
├── linear-theme.json      # 테마 데이터 (색상, 타이포그래피, 스페이싱 등)
├── types.ts              # TypeScript 타입 정의
├── theme-loader.ts       # 테마 로더 및 유틸리티 함수
└── README.md            # 사용 가이드 (이 파일)

src/styles/
└── linear-theme.css      # 글로벌 CSS 변수

src/components/
├── providers/
│   └── ThemeProvider.tsx # 테마 프로바이더
└── ui/
    ├── Button.tsx        # 버튼 컴포넌트 예시
    ├── Card.tsx          # 카드 컴포넌트 예시
    └── Input.tsx         # 입력 필드 컴포넌트 예시
```

## 🚀 빠른 시작

### 1. 테마 적용 (Next.js App Router)

`app/layout.tsx`에서 CSS 파일을 import하고 ThemeProvider를 추가하세요:

```tsx
import '../styles/linear-theme.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. CSS 변수 사용

```css
/* 색상 */
.my-element {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}

/* 타이포그래피 */
.my-heading {
  font-size: var(--font-size-title2);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-title2);
  letter-spacing: var(--letter-spacing-title2);
}

/* 애니메이션 */
.my-button {
  transition: all var(--animation-speed-quick) var(--animation-easing-out-quad);
}
```

### 3. Tailwind CSS 클래스 사용

```tsx
export function MyComponent() {
  return (
    <div className="bg-background-primary text-foreground-primary p-6 rounded-lg">
      <h1 className="text-title2 font-semibold mb-4">제목</h1>
      <p className="text-regular text-foreground-secondary">내용</p>
      <button className="bg-brand text-brand-text px-4 py-2 rounded-lg hover:bg-accent-hover transition-quick">
        클릭
      </button>
    </div>
  );
}
```

### 4. 유틸리티 CSS 클래스 사용

```tsx
export function TypographyExample() {
  return (
    <div>
      <h1 className="title-1">제목 1</h1>
      <h2 className="title-2">제목 2</h2>
      <h3 className="title-3">제목 3</h3>
      <p className="text-regular">본문 텍스트</p>
      <p className="text-small">작은 텍스트</p>
      <p className="text-large">큰 텍스트</p>
    </div>
  );
}
```

## 🎨 테마 구성 요소

### 색상 시스템

```typescript
// Background
--color-bg-primary       #08090a  (메인 배경)
--color-bg-secondary     #1c1c1f  (카드, 패널)
--color-bg-tertiary      #232326  (호버 상태)

// Text & Foreground
--color-text-primary     #f7f8f8  (주요 텍스트)
--color-text-secondary   #d0d6e0  (보조 텍스트)
--color-text-tertiary    #8a8f98  (비활성 텍스트)

// Brand & Accent
--color-brand-primary    #5e6ad2  (브랜드 색상)
--color-accent-primary   #7170ff  (강조 색상)
--color-accent-hover     #828fff  (호버 상태)

// Status
--color-status-red       #eb5757  (에러)
--color-status-green     #4cb782  (성공)
--color-status-yellow    #f2c94c  (경고)
--color-status-blue      #4ea7fc  (정보)
```

### 타이포그래피

```typescript
// 폰트 패밀리
--font-family-regular    "Inter Variable", -apple-system, ...
--font-family-monospace  "Berkeley Mono", ui-monospace, ...
--font-family-serif      "Tiempos Headline", ui-serif, ...

// 폰트 크기 (9단계)
--font-size-micro        0.6875rem  (11px)
--font-size-tiny         0.625rem   (10px)
--font-size-mini         0.75rem    (12px)
--font-size-small        0.8125rem  (13px)
--font-size-regular      0.9375rem  (15px)
--font-size-large        1.125rem   (18px)
--font-size-title1       1.0625rem  (17px)
--font-size-title2       1.3125rem  (21px)
--font-size-title3       1.5rem     (24px)
--font-size-title4       2rem       (32px)
--font-size-title5       2.5rem     (40px)
--font-size-title6       3rem       (48px)
--font-size-title7       3.5rem     (56px)
--font-size-title8       4rem       (64px)
--font-size-title9       4.5rem     (72px)

// 폰트 굵기
--font-weight-light      300
--font-weight-normal     400
--font-weight-medium     510
--font-weight-semibold   590
--font-weight-bold       680
```

### 스페이싱

```typescript
--spacing-header-height      64px
--spacing-page-padding-inline 24px
--spacing-page-padding-block  64px
--spacing-page-max-width      1024px
--spacing-prose-max-width     624px
```

### 애니메이션

```typescript
// 속도
--animation-speed-quick      0.1s
--animation-speed-regular    0.25s

// Easing (18가지)
--animation-easing-out-quad   cubic-bezier(0.25, 0.46, 0.45, 0.94)
--animation-easing-out-cubic  cubic-bezier(0.215, 0.61, 0.355, 1)
--animation-easing-out-quart  cubic-bezier(0.165, 0.84, 0.44, 1)
--animation-easing-out-expo   cubic-bezier(0.19, 1, 0.22, 1)
// ... (더 많은 easing 함수)
```

## 🔧 JavaScript/TypeScript API

### 테마 데이터 가져오기

```typescript
import {
  linearTheme,
  getColorPalette,
  getTypography
} from '@/lib/theme/theme-loader';

// 전체 테마 객체
console.log(linearTheme);

// 색상 팔레트만
const colors = getColorPalette();
console.log(colors.brand.primary); // "#5e6ad2"

// 타이포그래피 설정만
const typography = getTypography();
console.log(typography.fontSize.title2); // "1.3125rem"
```

### CSS 변수 동적 변경

```typescript
import { applyLinearTheme, getCSSVariable } from '@/lib/theme/theme-loader';

// 테마 재적용
applyLinearTheme();

// 특정 CSS 변수 값 가져오기
const brandColor = getCSSVariable('--color-brand-primary');
console.log(brandColor); // "#5e6ad2"
```

### Tailwind 테마 객체 생성

```typescript
import { generateTailwindTheme } from '@/lib/theme/theme-loader';

const tailwindTheme = generateTailwindTheme(linearTheme);
// tailwind.config.ts에서 사용 가능
```

## 📦 컴포넌트 예시

### Button

```tsx
import { Button } from '@/components/ui/Button';

export function ButtonExample() {
  return (
    <div className="flex gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  );
}
```

### Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function CardExample() {
  return (
    <Card variant="bordered">
      <CardHeader>
        <CardTitle>프로젝트 제목</CardTitle>
        <CardDescription>프로젝트 설명이 여기에 들어갑니다</CardDescription>
      </CardHeader>
      <CardContent>
        <p>카드 내용</p>
      </CardContent>
      <CardFooter>
        <Button variant="primary">확인</Button>
        <Button variant="ghost">취소</Button>
      </CardFooter>
    </Card>
  );
}
```

### Input

```tsx
import { Input } from '@/components/ui/Input';

export function InputExample() {
  return (
    <div className="space-y-4">
      <Input
        label="이메일"
        type="email"
        placeholder="name@example.com"
        helperText="로그인에 사용할 이메일을 입력하세요"
      />
      <Input
        label="비밀번호"
        type="password"
        error="비밀번호는 8자 이상이어야 합니다"
      />
    </div>
  );
}
```

## 🎯 디자인 원칙

Linear.app의 디자인 시스템은 다음 원칙을 따릅니다:

1. **일관성**: 모든 UI 요소가 통일된 디자인 언어를 사용
2. **명확성**: 높은 대비의 색상과 명확한 타이포그래피
3. **속도**: 빠른 애니메이션과 즉각적인 피드백
4. **완성도**: 세밀한 디테일과 정교한 인터랙션

## 🔍 개발자 도구

브라우저 개발자 도구에서 `:root` 요소를 검사하면 모든 CSS 변수를 확인할 수 있습니다:

```css
:root {
  --color-bg-primary: #08090a;
  --color-text-primary: #f7f8f8;
  /* ... 모든 변수 목록 */
}
```

## 📚 참고 자료

- [Linear.app](https://linear.app) - 원본 디자인 시스템
- [Inter Font](https://rsms.me/inter/) - 사용 폰트
- [Tailwind CSS](https://tailwindcss.com) - CSS 프레임워크

## 📝 라이선스

이 테마는 Linear.app의 디자인을 기반으로 하며, 교육 및 학습 목적으로만 사용해야 합니다.
