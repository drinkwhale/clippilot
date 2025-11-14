"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function YouTubeOAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [errorReason, setErrorReason] = useState<string>("");

  useEffect(() => {
    // URL 파라미터에서 상태 확인
    const success = searchParams.get("success");
    const reason = searchParams.get("reason");

    if (success === "true") {
      setStatus("success");
      // 3초 후 자동으로 대시보드로 이동
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } else if (success === "false") {
      setStatus("error");
      setErrorReason(reason || "unknown");
    }
  }, [searchParams, router]);

  const getErrorMessage = (reason: string) => {
    switch (reason) {
      case "ownership":
        return "이미 다른 계정에 연결된 채널입니다. 채널 소유권을 확인해주세요.";
      case "token":
        return "YouTube 인증 중 오류가 발생했습니다. 다시 시도해주세요.";
      default:
        return "알 수 없는 오류가 발생했습니다. 다시 시도해주세요.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <Card className="w-full max-w-md p-8">
        <div className="text-center space-y-6">
          {status === "processing" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">YouTube 채널 연결 중...</h2>
                <p className="text-muted-foreground mt-2">
                  잠시만 기다려주세요
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                  연결 완료!
                </h2>
                <p className="text-muted-foreground mt-2">
                  YouTube 채널이 성공적으로 연결되었습니다.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  3초 후 자동으로 이동합니다...
                </p>
              </div>
              <Button
                onClick={() => router.push("/dashboard")}
                size="lg"
                className="w-full"
              >
                대시보드로 이동
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
                  연결 실패
                </h2>
                <p className="text-muted-foreground mt-2">
                  {getErrorMessage(errorReason)}
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push("/onboarding")}
                  size="lg"
                  className="w-full"
                >
                  다시 시도
                </Button>
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="ghost"
                  size="lg"
                  className="w-full"
                >
                  대시보드로 이동
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
