"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChannelsPage() {
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
          <h1 className="text-3xl font-bold mb-4">채널 관리</h1>
          <p className="text-muted-foreground mb-8">
            YouTube 채널을 연결하고 관리하세요.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5" />
                연결된 채널
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Youtube className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg mb-2 text-muted-foreground">연결된 채널이 없습니다</p>
                <p className="text-sm text-muted-foreground mb-6">
                  YouTube 채널을 연결하여 영상을 자동으로 업로드하세요.
                </p>
                <Button>
                  YouTube 채널 연결하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
