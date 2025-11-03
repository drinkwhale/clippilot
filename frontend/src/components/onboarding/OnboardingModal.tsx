"use client";

import { useState } from "react";
import { X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { Step1ConnectYouTube } from "./Step1ConnectYouTube";
import { Step2SelectTemplate } from "./Step2SelectTemplate";
import { Step3FirstProject } from "./Step3FirstProject";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingModal({
  open,
  onOpenChange,
  onComplete,
  onSkip,
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                ClipPilot 시작하기
              </DialogTitle>
              <DialogDescription className="mt-2">
                {stepDescriptions[currentStep - 1]}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                단계 {currentStep} / {totalSteps}
              </span>
              <span>{stepTitles[currentStep - 1]}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 1 && <Step1ConnectYouTube onNext={handleNext} />}
            {currentStep === 2 && <Step2SelectTemplate onNext={handleNext} />}
            {currentStep === 3 && <Step3FirstProject onComplete={onComplete} />}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              건너뛰기
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                이전
              </Button>
              <Button onClick={handleNext}>
                {currentStep === totalSteps ? "완료" : "다음"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
