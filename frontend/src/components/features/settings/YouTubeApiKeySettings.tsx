/**
 * YouTube API 키 설정 컴포넌트
 */

"use client";

import { useState } from "react";
import { useApiKeysStore } from "@/lib/stores/api-keys-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Check, AlertCircle, ExternalLink } from "lucide-react";

export function YouTubeApiKeySettings() {
  const { youtubeApiKey, setYoutubeApiKey, clearYoutubeApiKey, _hasHydrated } =
    useApiKeysStore();
  const [inputKey, setInputKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Zustand persist 재수화 대기
  if (!_hasHydrated) {
    return null;
  }

  const handleSave = () => {
    if (inputKey.trim()) {
      setYoutubeApiKey(inputKey.trim());
      setIsSaved(true);
      setInputKey("");
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleClear = () => {
    clearYoutubeApiKey();
    setInputKey("");
    setIsSaved(false);
  };

  const maskedKey = youtubeApiKey
    ? `${youtubeApiKey.substring(0, 8)}${"*".repeat(
        Math.max(0, youtubeApiKey.length - 12)
      )}${youtubeApiKey.substring(youtubeApiKey.length - 4)}`
    : null;

  return (
    <div className="space-y-4">
      {/* 안내 메시지 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          YouTube Data API v3 키가 필요합니다.{" "}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Google Cloud Console
            <ExternalLink className="h-3 w-3" />
          </a>
          에서 발급받으세요.
        </AlertDescription>
      </Alert>

      {/* 현재 저장된 키 */}
      {youtubeApiKey && (
        <div className="space-y-2">
          <Label>저장된 API 키</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">
              {showKey ? youtubeApiKey : maskedKey}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* API 키 입력 */}
      <div className="space-y-2">
        <Label htmlFor="youtube-api-key">
          {youtubeApiKey ? "새 API 키로 변경" : "YouTube API 키"}
        </Label>
        <div className="flex gap-2">
          <Input
            id="youtube-api-key"
            type="password"
            placeholder="AIzaSy..."
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSave} disabled={!inputKey.trim()}>
            {isSaved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                저장됨
              </>
            ) : (
              "저장"
            )}
          </Button>
          {youtubeApiKey && (
            <Button variant="outline" onClick={handleClear}>
              삭제
            </Button>
          )}
        </div>
      </div>

      {/* API 키 발급 안내 */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="font-medium">API 키 발급 방법:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Google Cloud Console에서 새 프로젝트 생성</li>
          <li>YouTube Data API v3 활성화</li>
          <li>사용자 인증 정보 &gt; API 키 생성</li>
          <li>생성된 API 키를 복사하여 위에 입력</li>
        </ol>
      </div>

      {/* 주의사항 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          API 키는 브라우저 로컬 스토리지에 저장됩니다. 공용 컴퓨터에서는
          사용을 권장하지 않습니다.
        </AlertDescription>
      </Alert>
    </div>
  );
}
