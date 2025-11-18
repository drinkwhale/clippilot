"use client";

import { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface VideoTypeBadgeProps {
  duration: number; // 초 단위
}

/**
 * 영상 타입 배지 컴포넌트
 * - 쇼츠: 60초 이하
 * - 중간: 60초 초과 ~ 20분 이하
 * - 롱폼: 20분 초과
 */
export const VideoTypeBadge: FC<VideoTypeBadgeProps> = ({ duration }) => {
  const getVideoType = () => {
    if (duration <= 60) {
      return { label: "쇼츠", variant: "secondary" as const };
    } else if (duration <= 1200) {
      // 20분
      return { label: "중간", variant: "outline" as const };
    } else {
      return { label: "롱폼", variant: "default" as const };
    }
  };

  const { label, variant } = getVideoType();

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Clock className="h-3 w-3" />
      {label}
    </Badge>
  );
};
