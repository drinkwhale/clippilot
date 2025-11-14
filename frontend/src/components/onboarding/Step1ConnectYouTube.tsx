"use client";

import { useState } from "react";
import { Youtube, CheckCircle2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useChannels } from "@/lib/hooks/useChannels";

interface Step1ConnectYouTubeProps {
  onNext: () => void;
}

export function Step1ConnectYouTube({ onNext }: Step1ConnectYouTubeProps) {
  const { channels, isLoading, connectYouTubeChannel } = useChannels();
  const [isConnecting, setIsConnecting] = useState(false);

  const hasConnectedChannel = channels && channels.length > 0;

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      await connectYouTubeChannel();
    } catch (error) {
      console.error("Failed to connect YouTube:", error);
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20">
          <Youtube className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">YouTube 채널 연결</h3>
          <p className="text-sm text-muted-foreground mt-2">
            생성한 영상을 자동으로 YouTube에 업로드하려면 채널을 연결해주세요
          </p>
          <Button
            variant="link"
            size="sm"
            className="text-xs"
            onClick={() => window.open("/oauth/youtube/setup", "_blank")}
          >
            OAuth 설정이 필요하신가요?
          </Button>
        </div>
      </div>

      <Card className="p-6">
        {hasConnectedChannel ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                YouTube 채널이 성공적으로 연결되었습니다!
              </AlertDescription>
            </Alert>

            {channels.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
              >
                <Youtube className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium">{channel.yt_channel_id}</p>
                  <p className="text-sm text-muted-foreground">
                    연결됨 · {new Date(channel.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}

            <Button onClick={onNext} className="w-full" size="lg">
              다음 단계로
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">자동 업로드</p>
                  <p className="text-sm text-muted-foreground">
                    완성된 영상을 클릭 한 번으로 YouTube에 업로드
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">안전한 연동</p>
                  <p className="text-sm text-muted-foreground">
                    Google OAuth를 통한 안전한 인증 방식
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">예약 발행</p>
                  <p className="text-sm text-muted-foreground">
                    원하는 시간에 자동으로 영상 공개 설정
                  </p>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                YouTube 채널 연결은 나중에도 설정에서 할 수 있습니다.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                onClick={handleConnect}
                disabled={isConnecting || isLoading}
                className="w-full"
                size="lg"
              >
                {isConnecting ? "연결 중..." : "YouTube 채널 연결하기"}
              </Button>
              <Button
                onClick={onNext}
                variant="ghost"
                className="w-full"
                size="lg"
              >
                나중에 연결하기
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
