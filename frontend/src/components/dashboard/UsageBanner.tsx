"use client";

import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useUsageAlert } from "@/lib/hooks/useMetrics";
import { AlertTriangle, AlertCircle } from "lucide-react";

/**
 * 사용량 알림 배너 컴포넌트
 *
 * 80% 이상 사용 시 경고 배너를 표시합니다.
 */
export default function UsageBanner() {
  const { data: alert, isLoading } = useUsageAlert();

  // 로딩 중이거나 배너를 표시할 필요가 없으면 null 반환
  if (isLoading || !alert || !alert.should_show_banner) {
    return null;
  }

  // 100% 도달 시 critical, 80% 이상 시 warning
  const variant = alert.usage_percentage >= 100 ? "destructive" : "default";
  const Icon = alert.usage_percentage >= 100 ? AlertCircle : AlertTriangle;

  return (
    <Alert variant={variant} className="mb-6">
      <Icon className="h-4 w-4" />
      <AlertTitle>
        {alert.usage_percentage >= 100 ? "할당량 초과" : "할당량 부족"}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="mb-2">{alert.message}</p>
          <p className="text-sm">
            현재 사용량: {alert.current_count} / {alert.quota_limit}
          </p>
        </div>
        <Button asChild variant={variant === "destructive" ? "outline" : "default"}>
          <Link href="/dashboard/settings/billing">플랜 업그레이드</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
