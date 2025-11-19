"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Navbar } from "@/components/layout/Navbar";
import { api } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileVideo, CheckCircle2, Youtube, TrendingUp } from "lucide-react";

interface DashboardStats {
  total_jobs: number;
  completed_jobs: number;
  connected_channels: number;
  monthly_usage: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();

  // 대시보드 통계 조회
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
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
      <Navbar />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">대시보드</h1>
        <p className="text-muted-foreground mb-8">
          환영합니다, {user?.email}님!
        </p>

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

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">빠른 메뉴</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <a
              href="/dashboard/youtube-search"
              className="p-6 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
            >
              <h3 className="font-semibold mb-2">YouTube 검색</h3>
              <p className="text-sm text-muted-foreground">
                키워드로 YouTube 영상을 검색하고 템플릿으로 저장하세요.
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
