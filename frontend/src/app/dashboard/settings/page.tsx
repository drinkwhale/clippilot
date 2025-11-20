"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { YouTubeApiKeySettings } from "@/components/features/settings/YouTubeApiKeySettings";
import { APIKeysSettings } from "@/components/features/settings/APIKeysSettings";
import { Settings, User, Bell, Lock, Key } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();

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
          <h1 className="text-3xl font-bold mb-4">설정</h1>
          <p className="text-muted-foreground mb-8">
            계정 및 애플리케이션 설정을 관리하세요.
          </p>

          <div className="grid gap-6">
            {/* 계정 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  계정 정보
                </CardTitle>
                <CardDescription>
                  이메일 및 프로필 정보를 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">이메일</label>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API 키 관리 (통합) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API 키 관리
                </CardTitle>
                <CardDescription>
                  YouTube, OpenAI, Pexels 등 외부 서비스 API 키를 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <APIKeysSettings />
              </CardContent>
            </Card>

            {/* 알림 설정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  알림 설정
                </CardTitle>
                <CardDescription>
                  작업 완료 및 중요 이벤트 알림을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  알림 설정 기능은 준비 중입니다.
                </div>
              </CardContent>
            </Card>

            {/* 보안 설정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  보안 설정
                </CardTitle>
                <CardDescription>
                  비밀번호 및 2단계 인증을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  보안 설정 기능은 준비 중입니다.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
