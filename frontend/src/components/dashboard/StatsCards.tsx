"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardMetrics } from "@/lib/hooks/useMetrics";
import { TrendingUp, CheckCircle2, XCircle, Clock } from "lucide-react";

interface StatsCardsProps {
  period?: number;
}

/**
 * 대시보드 통계 카드 컴포넌트
 *
 * 총 생성, 성공률, 평균 렌더링 시간을 표시합니다.
 */
export default function StatsCards({ period = 30 }: StatsCardsProps) {
  const { data: metrics, isLoading, error } = useDashboardMetrics(period);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">오류</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">통계를 불러올 수 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const periodText = period === 7 ? "최근 7일" : period === 30 ? "최근 30일" : `최근 ${period}일`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 총 작업 수 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 작업 수</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.total_jobs.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">{periodText}</p>
        </CardContent>
      </Card>

      {/* 성공한 작업 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">성공한 작업</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.successful_jobs.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            성공률 {metrics.success_rate.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      {/* 실패한 작업 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">실패한 작업</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.failed_jobs.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.total_jobs > 0
              ? `전체의 ${((metrics.failed_jobs / metrics.total_jobs) * 100).toFixed(1)}%`
              : "데이터 없음"}
          </p>
        </CardContent>
      </Card>

      {/* 평균 렌더링 시간 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">평균 렌더링 시간</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.avg_render_time_seconds
              ? `${Math.round(metrics.avg_render_time_seconds)}초`
              : "-"}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.avg_render_time_seconds
              ? `약 ${(metrics.avg_render_time_seconds / 60).toFixed(1)}분`
              : "데이터 없음"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
