"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();

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
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">대시보드</h1>
        <p className="text-muted-foreground mb-8">
          환영합니다, {user?.email}님!
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">총 작업</h3>
            <p className="text-3xl font-bold">0</p>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">완료된 작업</h3>
            <p className="text-3xl font-bold">0</p>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">연결된 채널</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
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
