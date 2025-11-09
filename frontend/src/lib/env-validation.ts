/**
 * 환경 변수 검증 유틸리티
 *
 * 필수 환경 변수가 누락되었는지 체크하고 개발 환경에서 경고를 표시합니다.
 */

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 필수 환경 변수 목록
 */
const REQUIRED_ENV_VARS = {
  production: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_API_URL',
  ],
  development: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
};

/**
 * 선택적 환경 변수 (개발 환경에서는 경고만 표시)
 */
const OPTIONAL_ENV_VARS = [
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SENTRY_DSN',
];

/**
 * 환경 변수를 검증합니다
 */
export function validateEnvironmentVariables(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // 필수 환경 변수 체크
  const requiredVars = isProduction
    ? REQUIRED_ENV_VARS.production
    : REQUIRED_ENV_VARS.development;

  requiredVars.forEach((varName) => {
    const value = process.env[varName];
    if (!value || value === '') {
      errors.push(`${varName} is required but not set`);
    }
  });

  // Production 환경에서 추가 검증
  if (isProduction) {
    // API URL 검증
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1'))) {
      errors.push('NEXT_PUBLIC_API_URL should not point to localhost in production');
    }

    // Stripe 키 검증
    const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (stripeKey && stripeKey.startsWith('pk_test_')) {
      errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must use production key (pk_live_*) in production');
    }
  }

  // 선택적 환경 변수 경고 (개발 환경에서만)
  if (!isProduction) {
    OPTIONAL_ENV_VARS.forEach((varName) => {
      const value = process.env[varName];
      if (!value || value === '') {
        warnings.push(`${varName} is not set (optional)`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 환경 변수 검증 결과를 콘솔에 출력합니다
 */
export function logEnvironmentValidation(): void {
  const result = validateEnvironmentVariables();

  if (!result.isValid) {
    console.error('\n❌ 환경 변수 검증 실패:');
    result.errors.forEach((error) => {
      console.error(`  - ${error}`);
    });
    console.error('\n.env.local 파일을 확인하고 필수 환경 변수를 설정해주세요.\n');

    // Production 환경에서는 에러 발생
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Required environment variables are missing');
    }
  }

  if (result.warnings.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn('\n⚠️  환경 변수 경고:');
    result.warnings.forEach((warning) => {
      console.warn(`  - ${warning}`);
    });
    console.warn('');
  }

  if (result.isValid && result.warnings.length === 0) {
    console.log('✅ 환경 변수 검증 완료');
  }
}

/**
 * 특정 환경 변수의 값을 가져오고 없으면 에러를 발생시킵니다
 */
export function getRequiredEnvVar(varName: string): string {
  const value = process.env[varName];
  if (!value || value === '') {
    throw new Error(`Required environment variable ${varName} is not set`);
  }
  return value;
}

/**
 * 특정 환경 변수의 값을 가져오고 없으면 기본값을 반환합니다
 */
export function getOptionalEnvVar(varName: string, defaultValue: string = ''): string {
  return process.env[varName] || defaultValue;
}
