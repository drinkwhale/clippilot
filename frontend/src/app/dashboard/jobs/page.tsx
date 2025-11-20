"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileVideo } from "lucide-react";

export default function JobsPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [_hasHydrated, isAuthenticated, router]);

  if (!_hasHydrated || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar />
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-4">작업 관리</h1>
          <p className="text-muted-foreground mb-8">
            생성된 영상 작업을 관리하고 진행 상태를 확인하세요.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="h-5 w-5" />
                작업 목록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg mb-2">아직 작업이 없습니다</p>
                <p className="text-sm">새로운 작업을 생성하여 시작해보세요.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
