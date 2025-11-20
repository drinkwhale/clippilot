"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { RecentJobs } from "@/components/features/dashboard/RecentJobs";
import { YouTubeSearchPreview } from "@/components/features/dashboard/YouTubeSearchPreview";
import { QuickSettings } from "@/components/features/dashboard/QuickSettings";
import { api } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileVideo, CheckCircle2, Youtube, TrendingUp } from "lucide-react";
import { isMockApi, waitFor } from "@/lib/config";
import { mockDashboardStats } from "@/lib/mocks/dashboard";
import type { DashboardStats } from "@/lib/types/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();

  // 대시보드 통계 조회
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", isMockApi],
    queryFn: async () => {
      if (isMockApi) {
        await waitFor(300);
        return mockDashboardStats;
      }
      const response = await api.dashboard.stats();
      return response.data;
    },
    enabled: isAuthenticated && _hasHydrated,
  });

  useEffect(() => {
    // Zustand persist 재수화가 완료된 후에만 인증 상태 확인
    if (_hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // 재수화가 완료되지 않았거나 인증되지 않은 경우 로딩 표시
  if (!_hasHydrated || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar />
        <div className="container py-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">대시보드</h1>
              <p className="text-muted-foreground mt-2">
                환영합니다, {user?.email}님!
              </p>
            </div>
            <QuickSettings />
          </div>

          {/* 통계 카드 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 작업</CardTitle>
                <FileVideo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.total_jobs || 0}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">완료된 작업</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.completed_jobs || 0}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">연결된 채널</CardTitle>
                <Youtube className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.connected_channels || 0}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">이번 달 생성</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.monthly_usage || 0}</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 메인 콘텐츠 그리드 */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <RecentJobs />
            <YouTubeSearchPreview />
          </div>
        </div>
      </div>
    </div>
  );
}
