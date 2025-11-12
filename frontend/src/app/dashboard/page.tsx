"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">대시보드</h1>
        <p className="text-muted-foreground mb-8">
          환영합니다, {user?.email}님!
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </div>
  );
}
