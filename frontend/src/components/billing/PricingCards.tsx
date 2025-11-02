/**
 * 플랜 가격 카드 컴포넌트
 *
 * Free, Pro, Agency 플랜의 가격과 기능을 표시하고 업그레이드를 유도합니다.
 */
'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSubscription, PlanType } from '@/lib/hooks/useSubscription';
import { cn } from '@/lib/utils';

interface PricingCardsProps {
  /**
   * 현재 플랜 강조 여부
   */
  highlightCurrentPlan?: boolean;
}

/**
 * 플랜 가격 카드 컴포넌트
 */
export function PricingCards({ highlightCurrentPlan = true }: PricingCardsProps) {
  const { subscription, upgradeToPro, upgradeToAgency, isUpgrading, planInfo } = useSubscription();

  const currentPlan = subscription?.plan || PlanType.FREE;

  const plans = [
    {
      type: PlanType.FREE,
      info: planInfo[PlanType.FREE],
      action: null, // Free 플랜은 업그레이드 버튼 없음
    },
    {
      type: PlanType.PRO,
      info: planInfo[PlanType.PRO],
      action: upgradeToPro,
      popular: true, // 인기 플랜 표시
    },
    {
      type: PlanType.AGENCY,
      info: planInfo[PlanType.AGENCY],
      action: upgradeToAgency,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
      {plans.map((plan) => {
        const isCurrent = currentPlan === plan.type;
        const isDowngrade = getPlanRank(currentPlan) > getPlanRank(plan.type);

        return (
          <Card
            key={plan.type}
            className={cn(
              'relative',
              highlightCurrentPlan && isCurrent && 'border-primary border-2',
              plan.popular && 'border-blue-500 border-2 shadow-lg'
            )}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                  인기
                </span>
              </div>
            )}

            {isCurrent && highlightCurrentPlan && (
              <div className="absolute -top-4 right-4">
                <span className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-1 rounded-full">
                  현재 플랜
                </span>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-2xl">{plan.info.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">{plan.info.price}</span>
                {plan.type !== PlanType.FREE && <span className="text-muted-foreground">/월</span>}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.info.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              {isCurrent ? (
                <Button variant="outline" className="w-full" disabled>
                  현재 사용 중
                </Button>
              ) : isDowngrade ? (
                <Button variant="ghost" className="w-full" disabled>
                  다운그레이드 (포털에서 취소)
                </Button>
              ) : plan.action ? (
                <Button
                  onClick={plan.action}
                  className="w-full"
                  disabled={isUpgrading}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {isUpgrading ? '처리 중...' : `${plan.info.name}으로 업그레이드`}
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  무료 시작
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * 플랜 순위 (다운그레이드 체크용)
 */
function getPlanRank(plan: PlanType): number {
  const ranks = {
    [PlanType.FREE]: 0,
    [PlanType.PRO]: 1,
    [PlanType.AGENCY]: 2,
  };
  return ranks[plan] || 0;
}
