"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Step1ConnectYouTube } from "@/components/onboarding/Step1ConnectYouTube";
import { Step2SelectTemplate } from "@/components/onboarding/Step2SelectTemplate";
import { Step3FirstProject } from "@/components/onboarding/Step3FirstProject";
import { useOnboarding } from "@/lib/hooks/useOnboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await completeOnboarding.mutateAsync(true);
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  };

  const handleSkip = async () => {
    try {
      await completeOnboarding.mutateAsync(true);
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to skip onboarding:", error);
      // 인증 오류인 경우 로그인 페이지로 리디렉션
      if (error instanceof Error && error.message.includes("인증")) {
        router.push("/login?redirect=/onboarding");
      }
    }
  };

  const progress = (currentStep / totalSteps) * 100;

  const stepTitles = [
    "YouTube 채널 연결",
    "템플릿 선택",
    "첫 프로젝트 생성",
  ];

  const stepDescriptions = [
    "YouTube 채널을 연결하여 자동으로 영상을 업로드할 수 있습니다",
    "브랜드에 맞는 템플릿을 선택하여 일관된 스타일의 영상을 만드세요",
    "첫 프로젝트를 생성하고 AI가 자동으로 영상을 만드는 과정을 경험해보세요",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">ClipPilot 시작하기</h1>
              <p className="text-sm text-muted-foreground">
                {stepDescriptions[currentStep - 1]}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            건너뛰기
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl py-12">
        {/* Progress Section */}
        <div className="mb-12 space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              단계 {currentStep} / {totalSteps}
            </span>
            <span>{stepTitles[currentStep - 1]}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="mb-12 min-h-[500px]">
          {currentStep === 1 && <Step1ConnectYouTube onNext={handleNext} />}
          {currentStep === 2 && <Step2SelectTemplate onNext={handleNext} />}
          {currentStep === 3 && <Step3FirstProject onComplete={handleComplete} />}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            이전
          </Button>
          <Button onClick={handleNext} size="lg">
            {currentStep === totalSteps ? "완료" : "다음"}
          </Button>
        </div>
      </div>
    </div>
  );
}
