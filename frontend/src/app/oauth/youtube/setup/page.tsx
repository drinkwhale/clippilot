"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Youtube, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function YouTubeOAuthSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: "Google Cloud Console 접속",
      description: "Google Cloud Console에 접속하여 프로젝트를 생성합니다",
      link: "https://console.cloud.google.com/",
      linkText: "Google Cloud Console 열기",
    },
    {
      title: "YouTube Data API v3 활성화",
      description:
        "API 및 서비스 > 라이브러리에서 YouTube Data API v3를 검색하고 활성화합니다",
      link: "https://console.cloud.google.com/apis/library/youtube.googleapis.com",
      linkText: "YouTube Data API 활성화",
    },
    {
      title: "OAuth 2.0 클라이언트 ID 생성",
      description: "API 및 서비스 > 사용자 인증 정보에서 OAuth 클라이언트 ID를 생성합니다",
      details: [
        "애플리케이션 유형: 웹 애플리케이션",
        "승인된 리디렉션 URI: http://localhost:8000/api/v1/channels/oauth/youtube/callback",
        "(프로덕션 환경에서는 실제 도메인을 사용하세요)",
      ],
      link: "https://console.cloud.google.com/apis/credentials",
      linkText: "OAuth 클라이언트 ID 생성",
    },
    {
      title: "클라이언트 ID와 비밀번호 복사",
      description:
        "생성된 OAuth 클라이언트의 클라이언트 ID와 클라이언트 비밀번호를 복사합니다",
    },
    {
      title: "환경 변수 설정",
      description:
        "백엔드 .env 파일에 YouTube OAuth 정보를 추가합니다",
      code: `# YouTube OAuth 설정
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_OAUTH_REDIRECT_URI=http://localhost:8000/api/v1/channels/oauth/youtube/callback
YOUTUBE_SUCCESS_REDIRECT=http://localhost:3000/oauth/youtube/callback?success=true
YOUTUBE_ERROR_REDIRECT=http://localhost:3000/oauth/youtube/callback?success=false`,
    },
    {
      title: "백엔드 서버 재시작",
      description:
        "환경 변수 변경 사항을 적용하기 위해 백엔드 서버를 재시작합니다",
      code: `# 백엔드 디렉토리에서
uvicorn src.main:app --reload`,
    },
  ];

  const currentStep = steps[step - 1];

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
              <Youtube className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">YouTube OAuth 설정</h1>
              <p className="text-sm text-muted-foreground">
                YouTube 채널 연동을 위한 OAuth 설정 가이드
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
          >
            나중에 하기
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-4xl py-12">
        <Alert className="mb-8">
          <AlertDescription>
            이 설정은 개발자 또는 관리자가 한 번만 수행하면 됩니다. 일반 사용자는 이미 설정된 OAuth로 YouTube 채널을 연결할 수 있습니다.
          </AlertDescription>
        </Alert>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>
              단계 {step} / {steps.length}
            </span>
            <span>{currentStep.title}</span>
          </div>
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full ${
                  index < step
                    ? "bg-primary"
                    : index === step - 1
                      ? "bg-primary/50"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8 mb-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{currentStep.title}</h2>
              <p className="text-muted-foreground">{currentStep.description}</p>
            </div>

            {currentStep.details && (
              <ul className="space-y-2">
                {currentStep.details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            )}

            {currentStep.code && (
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{currentStep.code}</code>
              </pre>
            )}

            {currentStep.link && (
              <Button asChild variant="outline" className="w-full">
                <a
                  href={currentStep.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  {currentStep.linkText}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            이전
          </Button>
          <Button
            onClick={() => {
              if (step < steps.length) {
                setStep(step + 1);
              } else {
                router.push("/onboarding");
              }
            }}
            size="lg"
          >
            {step === steps.length ? "설정 완료" : "다음"}
          </Button>
        </div>
      </div>
    </div>
  );
}
