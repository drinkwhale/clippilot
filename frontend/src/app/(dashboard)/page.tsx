"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Video, Youtube, Layout } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { useJobs } from "@/lib/hooks/useJobs";

export default function DashboardPage() {
  const router = useRouter();
  const { isOnboardingCompleted, isLoading, completeOnboarding } = useOnboarding();
  const { jobs } = useJobs({ status: undefined });
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 첫 로그인 시 온보딩 모달 표시
  useEffect(() => {
    if (!isLoading && !isOnboardingCompleted) {
      // 온보딩이 완료되지 않은 경우 모달 표시
      setShowOnboarding(true);
    }
  }, [isOnboardingCompleted, isLoading]);

  const handleOnboardingComplete = async () => {
    try {
      await completeOnboarding.mutateAsync(true);
      setShowOnboarding(false);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  };

  const handleOnboardingSkip = async () => {
    try {
      await completeOnboarding.mutateAsync(true);
      setShowOnboarding(false);
    } catch (error) {
      console.error("Failed to skip onboarding:", error);
    }
  };

  const handleRestartOnboarding = () => {
    setShowOnboarding(true);
  };

  const recentJobs = jobs?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground mt-2">
            ClipPilot에 오신 것을 환영합니다! AI로 숏폼 영상을 자동으로 만들어보세요.
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/projects/new")} size="lg">
          <Sparkles className="mr-2 h-5 w-5" />
          새 프로젝트
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push("/dashboard/projects/new")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">새 프로젝트 생성</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              AI로 스크립트, 자막, 영상을 자동 생성
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push("/dashboard/projects")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">내 프로젝트</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              생성한 프로젝트 {jobs?.length || 0}개
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push("/dashboard/templates")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">템플릿 관리</CardTitle>
            <Layout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              브랜드 템플릿 생성 및 관리
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>최근 프로젝트</CardTitle>
          <CardDescription>
            최근 생성한 프로젝트를 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="text-center py-12">
              <Video className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">아직 프로젝트가 없습니다</h3>
              <p className="text-sm text-muted-foreground mt-2">
                첫 프로젝트를 만들어보세요
              </p>
              <Button
                onClick={() => router.push("/dashboard/projects/new")}
                className="mt-4"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                프로젝트 생성하기
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/projects/${job.id}`)}
                >
                  <div className="flex-1">
                    <p className="font-medium">{job.prompt.substring(0, 60)}...</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      상태: {job.status} · {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    보기
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/dashboard/projects")}
              >
                모든 프로젝트 보기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onboarding Restart Button (설정에서 재시작 가능) */}
      {isOnboardingCompleted && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestartOnboarding}
            className="text-muted-foreground"
          >
            온보딩 다시 보기
          </Button>
        </div>
      )}

      {/* Onboarding Modal */}
      <OnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </div>
  );
}
