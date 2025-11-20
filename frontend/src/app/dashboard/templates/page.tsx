"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TemplatesPage() {
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
          <h1 className="text-3xl font-bold mb-4">템플릿</h1>
          <p className="text-muted-foreground mb-8">
            영상 템플릿을 관리하고 재사용하세요.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5" />
                템플릿 목록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <LayoutTemplate className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg mb-2 text-muted-foreground">저장된 템플릿이 없습니다</p>
                <p className="text-sm text-muted-foreground mb-6">
                  자주 사용하는 설정을 템플릿으로 저장하여 빠르게 재사용하세요.
                </p>
                <Button>
                  새 템플릿 만들기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
