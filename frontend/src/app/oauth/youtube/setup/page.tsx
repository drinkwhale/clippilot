"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Youtube, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api/client";

export default function YouTubeOAuthSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState(
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}/api/v1/channels/oauth/youtube/callback`
      : "http://localhost:8000/api/v1/channels/oauth/youtube/callback"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!clientId || !clientSecret) {
      setError("클라이언트 ID와 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      await apiClient.post("/api/v1/admin/oauth/youtube", {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "OAuth 설정 저장에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

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
        `승인된 리디렉션 URI: ${redirectUri}`,
        "(프로덕션 환경에서는 실제 도메인을 사용하세요)",
      ],
      link: "https://console.cloud.google.com/apis/credentials",
      linkText: "OAuth 클라이언트 ID 생성",
    },
    {
      title: "OAuth 정보 입력",
      description: "생성된 OAuth 클라이언트의 클라이언트 ID와 비밀번호를 입력합니다",
      isForm: true,
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

        {success ? (
          <Card className="p-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                  설정 완료!
                </h2>
                <p className="text-muted-foreground mt-2">
                  YouTube OAuth 설정이 저장되었습니다.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  잠시 후 자동으로 이동합니다...
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <>
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
                        <span className="text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {currentStep.isForm && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientId">Google Client ID</Label>
                      <Input
                        id="clientId"
                        type="text"
                        placeholder="123456789-abcdefg.apps.googleusercontent.com"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientSecret">Google Client Secret</Label>
                      <Input
                        id="clientSecret"
                        type="password"
                        placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxx"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="redirectUri">Redirect URI</Label>
                      <Input
                        id="redirectUri"
                        type="text"
                        value={redirectUri}
                        onChange={(e) => setRedirectUri(e.target.value)}
                        disabled={isSaving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Google Cloud Console에 등록한 리디렉션 URI와 동일해야 합니다.
                      </p>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
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
                disabled={step === 1 || isSaving}
              >
                이전
              </Button>
              {currentStep.isForm ? (
                <Button onClick={handleSave} size="lg" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    "저장하고 완료"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setStep(step + 1)}
                  size="lg"
                  disabled={isSaving}
                >
                  다음
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
