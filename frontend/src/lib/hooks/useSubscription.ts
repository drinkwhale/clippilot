/**
 * 구독 관리 Hook
 *
 * Stripe를 통한 구독 정보 조회, 업그레이드, 포털 접근 기능을 제공합니다.
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

/**
 * 플랜 타입
 */
export enum PlanType {
  FREE = 'free',
  PRO = 'pro',
  AGENCY = 'agency',
}

/**
 * 구독 상태
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
}

/**
 * 구독 정보 타입
 */
export interface SubscriptionInfo {
  plan: PlanType;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  usage_current: number;
  usage_limit: number;
  usage_percentage: number;
}

/**
 * Checkout 요청
 */
export interface CheckoutRequest {
  plan: PlanType;
  success_url?: string;
  cancel_url?: string;
}

/**
 * Checkout 응답
 */
export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

/**
 * Portal 요청
 */
export interface PortalRequest {
  return_url?: string;
}

/**
 * Portal 응답
 */
export interface PortalResponse {
  portal_url: string;
}

/**
 * 구독 관리 Hook
 */
export function useSubscription() {
  const queryClient = useQueryClient();

  /**
   * 구독 정보 조회
   */
  const {
    data: subscription,
    isLoading: isLoadingSubscription,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useQuery<SubscriptionInfo>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await apiClient.get('/billing/subscription');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5분
    refetchOnWindowFocus: true,
  });

  /**
   * Checkout Session 생성 (플랜 업그레이드)
   */
  const createCheckout = useMutation<CheckoutResponse, Error, CheckoutRequest>({
    mutationFn: async (request: CheckoutRequest) => {
      const response = await apiClient.post('/billing/checkout', request);
      return response.data;
    },
    onSuccess: (data) => {
      // Checkout 페이지로 이동
      window.location.href = data.checkout_url;
    },
    onError: (error: any) => {
      console.error('Checkout 생성 실패:', error);
      throw error;
    },
  });

  /**
   * Customer Portal Session 생성
   */
  const createPortal = useMutation<PortalResponse, Error, PortalRequest>({
    mutationFn: async (request: PortalRequest) => {
      const response = await apiClient.post('/billing/portal', request);
      return response.data;
    },
    onSuccess: (data) => {
      // Customer Portal로 이동
      window.location.href = data.portal_url;
    },
    onError: (error: any) => {
      console.error('Portal 생성 실패:', error);
      throw error;
    },
  });

  /**
   * 플랜 업그레이드 헬퍼 함수
   */
  const upgradeToPro = () => {
    createCheckout.mutate({
      plan: PlanType.PRO,
      success_url: `${window.location.origin}/dashboard/settings/billing?success=true`,
      cancel_url: `${window.location.origin}/dashboard/settings/billing?canceled=true`,
    });
  };

  const upgradeToAgency = () => {
    createCheckout.mutate({
      plan: PlanType.AGENCY,
      success_url: `${window.location.origin}/dashboard/settings/billing?success=true`,
      cancel_url: `${window.location.origin}/dashboard/settings/billing?canceled=true`,
    });
  };

  /**
   * Customer Portal 열기
   */
  const openPortal = () => {
    createPortal.mutate({
      return_url: `${window.location.origin}/dashboard/settings/billing`,
    });
  };

  /**
   * 사용량 체크
   */
  const isQuotaExceeded = subscription ? subscription.usage_current >= subscription.usage_limit : false;
  const isNearQuota = subscription ? subscription.usage_percentage >= 80 : false;

  /**
   * 플랜 정보
   */
  const planInfo = {
    [PlanType.FREE]: {
      name: 'Free',
      price: '₩0',
      limit: 20,
      features: [
        '월 20개 콘텐츠 생성',
        '기본 템플릿',
        'YouTube 자동 업로드',
        '커뮤니티 지원',
      ],
    },
    [PlanType.PRO]: {
      name: 'Pro',
      price: '₩29,000',
      limit: 500,
      features: [
        '월 500개 콘텐츠 생성',
        '모든 템플릿',
        '우선 렌더링',
        '이메일 지원',
        '고급 분석',
      ],
    },
    [PlanType.AGENCY]: {
      name: 'Agency',
      price: '₩99,000',
      limit: 999999,
      features: [
        '무제한 콘텐츠 생성',
        '커스텀 템플릿',
        '최우선 렌더링',
        '전담 지원',
        '고급 분석 + API',
        '팀 관리',
      ],
    },
  };

  return {
    // 구독 정보
    subscription,
    isLoadingSubscription,
    subscriptionError,
    refetchSubscription,

    // 업그레이드
    upgradeToPro,
    upgradeToAgency,
    isUpgrading: createCheckout.isPending,
    upgradeError: createCheckout.error,

    // Customer Portal
    openPortal,
    isOpeningPortal: createPortal.isPending,
    portalError: createPortal.error,

    // 사용량
    isQuotaExceeded,
    isNearQuota,

    // 플랜 정보
    planInfo,
  };
}
