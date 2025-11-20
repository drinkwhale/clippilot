/**
 * Mock authentication data for local development and testing
 */

export const mockUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "test@example.com",
  name: "Test User",
  plan: "free" as const,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  onboarding_completed: true,
};

export const mockAuthToken = {
  access_token: "mock-jwt-token-for-development",
  token_type: "bearer" as const,
  user: mockUser,
};

/**
 * Mock login function
 * Accepts any credentials and returns mock token
 */
export async function mockLogin(email: string, password: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Accept any credentials for mock mode
  if (email && password) {
    return mockAuthToken;
  }

  throw new Error("이메일과 비밀번호를 입력해주세요");
}

/**
 * Mock signup function
 */
export async function mockSignup(email: string, password: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (email && password && password.length >= 8) {
    return mockAuthToken;
  }

  throw new Error("비밀번호는 최소 8자 이상이어야 합니다");
}
