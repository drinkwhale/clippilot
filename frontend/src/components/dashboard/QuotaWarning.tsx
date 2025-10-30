/**
 * Quota Warning Component
 * Displays usage quota warnings when user approaches or exceeds limits (FR-008, FR-033)
 */

'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Ban, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface QuotaWarningProps {
  plan: 'free' | 'pro' | 'agency'
  quotaLimit: number
  quotaUsed: number
  quotaResetAt: string
  className?: string
}

export function QuotaWarning({
  plan,
  quotaLimit,
  quotaUsed,
  quotaResetAt,
  className,
}: QuotaWarningProps) {
  const usagePercentage = (quotaUsed / quotaLimit) * 100
  const isExceeded = quotaUsed >= quotaLimit
  const isWarning = usagePercentage >= 80 && !isExceeded

  const resetDate = new Date(quotaResetAt)
  const formattedResetDate = resetDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Don't show if under 80% usage
  if (usagePercentage < 80) {
    return null
  }

  return (
    <Alert
      variant={isExceeded ? 'destructive' : 'default'}
      className={className}
    >
      <div className="flex items-start gap-3">
        {isExceeded ? (
          <Ban className="h-5 w-5 flex-shrink-0" />
        ) : (
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        )}

        <div className="flex-1 space-y-2">
          <AlertTitle className="mb-1">
            {isExceeded
              ? '월간 생성 한도 초과'
              : '월간 생성 한도 80% 도달'}
          </AlertTitle>

          <AlertDescription>
            {isExceeded ? (
              <p>
                이번 달 생성 한도 <strong>{quotaLimit}개</strong>를 모두
                사용했습니다. {formattedResetDate}에 한도가 초기화됩니다.
              </p>
            ) : (
              <p>
                이번 달 생성 한도의 <strong>{usagePercentage.toFixed(0)}%</strong>를
                사용했습니다. ({quotaUsed}/{quotaLimit})
              </p>
            )}
          </AlertDescription>

          <div className="space-y-2">
            <Progress value={usagePercentage} className="h-2" />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {quotaUsed} / {quotaLimit} 사용
              </span>
              <span>{formattedResetDate} 초기화</span>
            </div>
          </div>

          {plan === 'free' && (
            <div className="mt-3 rounded-lg border bg-background p-3">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 flex-shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold">Pro 플랜으로 업그레이드하세요</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    월 500개 생성 + 무제한 편집 + 우선 지원
                  </p>
                  <Button asChild size="sm" className="mt-3">
                    <Link href="/settings/billing">업그레이드</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {plan === 'pro' && isExceeded && (
            <div className="mt-3 rounded-lg border bg-background p-3">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 flex-shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="font-semibold">
                    Agency 플랜으로 업그레이드하세요
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    월 2,000개 생성 + 팀 기능 + 전담 지원
                  </p>
                  <Button asChild size="sm" className="mt-3">
                    <Link href="/settings/billing">업그레이드</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Alert>
  )
}
