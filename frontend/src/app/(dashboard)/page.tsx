"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Video, Youtube, Layout } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { useJobs } from "@/lib/hooks/useJobs";
import StatsCards from "@/components/dashboard/StatsCards";
import UsageChart from "@/components/dashboard/UsageChart";
import JobHistoryTable from "@/components/dashboard/JobHistoryTable";
import UsageBanner from "@/components/dashboard/UsageBanner";
import ChannelFilter from "@/components/dashboard/ChannelFilter";

export default function DashboardPage() {
  const router = useRouter();
  const { isOnboardingCompleted, isLoading, completeOnboarding } = useOnboarding();
  const { jobs } = useJobs({ status: undefined });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [period, setPeriod] = useState(30); // 통계 집계 기간 (일)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

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
        <div className="flex items-center gap-4">
          <ChannelFilter onChannelChange={setSelectedChannel} />
          <Button onClick={() => router.push("/dashboard/projects/new")} size="lg">
            <Sparkles className="mr-2 h-5 w-5" />
            새 프로젝트
          </Button>
        </div>
      </div>

      {/* Usage Alert Banner */}
      <UsageBanner />

      {/* Dashboard Statistics */}
      <StatsCards period={period} />

      {/* Usage Chart */}
      <UsageChart period={period} />

      {/* Job History Table */}
      <JobHistoryTable limit={10} />

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
