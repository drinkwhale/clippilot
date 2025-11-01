"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";

interface UploadSettingsModalProps {
  jobId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadStart?: () => void;
}

/**
 * Upload Settings Modal
 *
 * YouTube 업로드 설정 모달 (채널, 공개 상태, 예약 시간)
 */
export function UploadSettingsModal({
  jobId,
  open,
  onOpenChange,
  onUploadStart,
}: UploadSettingsModalProps) {
  const [channel, setChannel] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState("draft");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    try {
      setIsUploading(true);

      const response = await fetch(`/api/jobs/${jobId}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel_id: channel,
          privacy_status: privacyStatus,
          scheduled_time: scheduledTime || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "업로드 실패");
      }

      onUploadStart?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to upload:", error);
      alert(
        error instanceof Error ? error.message : "업로드 중 오류가 발생했습니다"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>YouTube 업로드 설정</DialogTitle>
          <DialogDescription>
            영상을 업로드할 채널과 공개 설정을 선택하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="channel">채널</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger id="channel">
                <SelectValue placeholder="채널 선택" />
              </SelectTrigger>
              <SelectContent>
                {/* TODO: 실제 채널 목록 가져오기 */}
                <SelectItem value="channel1">내 채널</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="privacy">공개 상태</Label>
            <Select value={privacyStatus} onValueChange={setPrivacyStatus}>
              <SelectTrigger id="privacy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">초안</SelectItem>
                <SelectItem value="private">비공개</SelectItem>
                <SelectItem value="unlisted">일부 공개</SelectItem>
                <SelectItem value="public">공개</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {privacyStatus === "private" && (
            <div className="space-y-2">
              <Label htmlFor="scheduled">예약 시간 (선택사항)</Label>
              <input
                id="scheduled"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleUpload} disabled={!channel || isUploading}>
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "업로드 중..." : "업로드"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
