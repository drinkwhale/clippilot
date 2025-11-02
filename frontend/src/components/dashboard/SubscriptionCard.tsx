/**
 * 구독 상태 카드 컴포넌트
 *
 * 대시보드에서 현재 구독 상태, 사용량, 다음 결제일 등을 표시합니다.
 */
'use client';

import React from 'react';
import { CreditCard, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription, PlanType, SubscriptionStatus } from '@/lib/hooks/useSubscription';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 구독 상태 카드 컴포넌트
 */
export function SubscriptionCard() {
  const {
    subscription,
    isLoadingSubscription,
    openPortal,
    isOpeningPortal,
    isQuotaExceeded,
    isNearQuota,
    planInfo,
  } = useSubscription();

  if (isLoadingSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>구독 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>구독 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">구독 정보를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const currentPlanInfo = planInfo[subscription.plan];
  const usagePercentage = subscription.usage_percentage;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              구독 정보
            </CardTitle>
            <CardDescription>현재 플랜 및 사용량</CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(subscription.status)}>
            {getStatusLabel(subscription.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 현재 플랜 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">현재 플랜</span>
            <span className="text-2xl font-bold">{currentPlanInfo.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>요금</span>
            <span className="font-semibold">{currentPlanInfo.price}/월</span>
          </div>
        </div>

        {/* 사용량 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">이번 달 사용량</span>
            <span className="text-sm font-semibold">
              {subscription.usage_current} / {subscription.usage_limit}
            </span>
          </div>
          <Progress
            value={usagePercentage}
            className={
              isQuotaExceeded
                ? 'bg-red-100 [&>div]:bg-red-500'
                : isNearQuota
                ? 'bg-yellow-100 [&>div]:bg-yellow-500'
                : ''
            }
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>{usagePercentage.toFixed(1)}% 사용 중</span>
          </div>
        </div>

        {/* 경고 메시지 */}
        {isQuotaExceeded && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-red-900">한도 초과</p>
              <p className="text-red-700">
                이번 달 사용량을 초과했습니다. 업그레이드하여 더 많은 콘텐츠를 생성하세요.
              </p>
            </div>
          </div>
        )}

        {isNearQuota && !isQuotaExceeded && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-900">한도 임박</p>
              <p className="text-yellow-700">
                이번 달 사용량이 80%를 초과했습니다. 업그레이드를 고려해보세요.
              </p>
            </div>
          </div>
        )}

        {/* 다음 결제일 */}
        {subscription.current_period_end && subscription.plan !== PlanType.FREE && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {subscription.cancel_at_period_end ? '구독 종료일' : '다음 결제일'}
                </span>
              </div>
              <span className="font-medium">
                {formatDistanceToNow(new Date(subscription.current_period_end), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>
            </div>
            {subscription.cancel_at_period_end && (
              <p className="text-xs text-muted-foreground">
                구독이 취소 예정입니다. 이 날짜 이후 Free 플랜으로 전환됩니다.
              </p>
            )}
          </div>
        )}

        {/* 관리 버튼 */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={openPortal}
            disabled={isOpeningPortal}
          >
            {isOpeningPortal ? '로딩 중...' : '구독 관리'}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Stripe Customer Portal에서 구독을 관리할 수 있습니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 구독 상태 배지 variant
 */
function getStatusBadgeVariant(
  status: SubscriptionStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
    case SubscriptionStatus.TRIALING:
      return 'default';
    case SubscriptionStatus.CANCELED:
    case SubscriptionStatus.INCOMPLETE_EXPIRED:
      return 'destructive';
    case SubscriptionStatus.PAST_DUE:
    case SubscriptionStatus.INCOMPLETE:
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * 구독 상태 레이블
 */
function getStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.ACTIVE]: '활성',
    [SubscriptionStatus.CANCELED]: '취소됨',
    [SubscriptionStatus.PAST_DUE]: '결제 지연',
    [SubscriptionStatus.TRIALING]: '체험 중',
    [SubscriptionStatus.INCOMPLETE]: '미완료',
    [SubscriptionStatus.INCOMPLETE_EXPIRED]: '만료됨',
  };
  return labels[status] || '알 수 없음';
}
