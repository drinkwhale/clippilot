"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

interface OnboardingStatus {
  onboarding_completed: boolean;
  user: {
    id: string;
    email: string;
    plan: string;
    oauth_provider: string;
    is_active: boolean;
    email_verified: boolean;
    last_login_at: string | null;
    onboarding_completed: boolean;
    created_at: string;
    updated_at: string;
  };
}

/**
 * 온보딩 상태 관리 훅
 */
export function useOnboarding() {
  const queryClient = useQueryClient();

  // 온보딩 상태 조회
  const {
    data: onboardingStatus,
    isLoading,
    error,
  } = useQuery<OnboardingStatus>({
    queryKey: ["onboarding", "status"],
    queryFn: async () => {
      const response = await apiClient.get("/v1/users/me/onboarding");
      return response.data;
    },
  });

  // 온보딩 완료 처리
  const completeOnboarding = useMutation({
    mutationFn: async (completed: boolean = true) => {
      const response = await apiClient.put("/v1/users/me/onboarding", {
        onboarding_completed: completed,
      });
      return response.data;
    },
    onSuccess: () => {
      // 온보딩 상태 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"] });
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });

  // 온보딩 재시작 (완료 상태를 false로 설정)
  const restartOnboarding = useMutation({
    mutationFn: async () => {
      const response = await apiClient.put("/v1/users/me/onboarding", {
        onboarding_completed: false,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", "status"] });
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });

  return {
    onboardingStatus,
    isOnboardingCompleted: onboardingStatus?.onboarding_completed ?? false,
    isLoading,
    error,
    completeOnboarding,
    restartOnboarding,
  };
}
