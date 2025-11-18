"use client";

import { FC } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VideoTypeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * 영상 타입 필터 컴포넌트
 * - 쇼츠 (60초 이하)
 * - 롱폼 (60초 초과)
 * - 전체
 */
export const VideoTypeFilter: FC<VideoTypeFilterProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="video-type">영상 타입</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="video-type">
          <SelectValue placeholder="전체" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">전체</SelectItem>
          <SelectItem value="short">쇼츠 (60초 이하)</SelectItem>
          <SelectItem value="medium">중간 (4-20분)</SelectItem>
          <SelectItem value="long">롱폼 (20분 이상)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
