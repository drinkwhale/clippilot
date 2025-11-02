/**
 * 결제 및 구독 관리 페이지
 *
 * 플랜 업그레이드, 구독 관리, 결제 내역 확인 기능을 제공합니다.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { PricingCards } from '@/components/billing/PricingCards';
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard';
import { useSubscription, PlanType } from '@/lib/hooks/useSubscription';

/**
 * 결제 설정 페이지
 */
export default function BillingSettingsPage() {
  const searchParams = useSearchParams();
  const { subscription, openPortal, isOpeningPortal } = useSubscription();

  // 결제 성공/취소 상태
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'canceled' | null>(null);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      setPaymentStatus('success');
    } else if (canceled === 'true') {
      setPaymentStatus('canceled');
    }

    // 3초 후 알림 제거
    if (success || canceled) {
      const timer = setTimeout(() => {
        setPaymentStatus(null);
        // URL에서 쿼리 파라미터 제거
        window.history.replaceState({}, '', window.location.pathname);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <div className="container max-w-7xl py-8 space-y-8">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold">결제 및 구독 관리</h1>
        <p className="text-muted-foreground mt-2">
          플랜을 업그레이드하거나 구독을 관리하세요.
        </p>
      </div>

      {/* 결제 상태 알림 */}
      {paymentStatus === 'success' && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <AlertTitle>결제 성공</AlertTitle>
          <AlertDescription>
            구독이 성공적으로 업그레이드되었습니다. 새로운 플랜이 즉시 적용됩니다.
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === 'canceled' && (
        <Alert className="border-red-500 bg-red-50">
          <XCircle className="h-5 w-5 text-red-500" />
          <AlertTitle>결제 취소</AlertTitle>
          <AlertDescription>
            결제가 취소되었습니다. 언제든지 다시 시도하실 수 있습니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 현재 구독 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <SubscriptionCard />
        </div>

        {/* 추가 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 구독 관리 */}
          <Card>
            <CardHeader>
              <CardTitle>구독 관리</CardTitle>
              <CardDescription>
                Stripe Customer Portal에서 구독을 관리할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Customer Portal에서 할 수 있는 작업:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>플랜 변경 및 업그레이드</li>
                  <li>구독 취소 (다운그레이드)</li>
                  <li>결제 수단 변경</li>
                  <li>인보이스 확인 및 다운로드</li>
                  <li>결제 내역 조회</li>
                </ul>
              </div>

              <Button
                onClick={openPortal}
                disabled={isOpeningPortal || subscription?.plan === PlanType.FREE}
                className="w-full"
              >
                {isOpeningPortal ? (
                  '로딩 중...'
                ) : (
                  <>
                    Customer Portal 열기
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {subscription?.plan === PlanType.FREE && (
                <p className="text-xs text-muted-foreground text-center">
                  Free 플랜 사용자는 Customer Portal을 사용할 수 없습니다.
                  아래에서 플랜을 업그레이드하세요.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 플랜 취소 안내 (T134) */}
          {subscription?.plan !== PlanType.FREE && (
            <Card>
              <CardHeader>
                <CardTitle>구독 취소</CardTitle>
                <CardDescription>구독을 취소하면 다음과 같이 처리됩니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>즉시 취소:</strong> 구독이 현재 기간 종료 시점에 자동으로 취소됩니다.
                    기간 종료 전까지는 현재 플랜의 모든 기능을 계속 사용할 수 있습니다.
                  </p>
                  <p>
                    <strong>Free 플랜 전환:</strong> 기간 종료 후 Free 플랜으로 자동 전환되며,
                    Free 플랜의 한도가 적용됩니다 (월 20개 콘텐츠).
                  </p>
                  <p>
                    <strong>환불 정책:</strong> 이미 결제된 금액은 환불되지 않으며, 남은 기간 동안
                    계속 사용하실 수 있습니다.
                  </p>
                </div>

                <Alert>
                  <AlertDescription>
                    구독을 취소하려면 위의 Customer Portal에서 직접 취소하실 수 있습니다.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Separator />

      {/* 플랜 가격 카드 */}
      <div>
        <h2 className="text-2xl font-bold mb-6">플랜 선택</h2>
        <PricingCards highlightCurrentPlan />
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>자주 묻는 질문</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Q. 플랜을 변경하면 언제 적용되나요?</h4>
            <p className="text-sm text-muted-foreground">
              <strong>업그레이드:</strong> 즉시 적용됩니다. 업그레이드 비용은 남은 기간에 대해
              일할 계산됩니다.
              <br />
              <strong>다운그레이드:</strong> 현재 구독 기간이 종료된 후 적용됩니다.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Q. 사용량은 언제 초기화되나요?</h4>
            <p className="text-sm text-muted-foreground">
              매월 1일에 자동으로 초기화됩니다. (구독 시작일과 무관)
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Q. 결제는 어떻게 이루어지나요?</h4>
            <p className="text-sm text-muted-foreground">
              Stripe를 통해 안전하게 결제됩니다. 신용카드, 체크카드 등 다양한 결제 수단을
              지원합니다.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Q. 환불이 가능한가요?</h4>
            <p className="text-sm text-muted-foreground">
              일반적으로 환불은 제공되지 않지만, 특별한 사유가 있는 경우
              support@clippilot.com으로 문의해주세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
