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

interface RegionSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * 국가/지역 선택 컴포넌트
 */
export const RegionSelector: FC<RegionSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="region">국가/지역</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="region">
          <SelectValue placeholder="전체" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">전체</SelectItem>
          <SelectItem value="KR">🇰🇷 대한민국</SelectItem>
          <SelectItem value="US">🇺🇸 미국</SelectItem>
          <SelectItem value="JP">🇯🇵 일본</SelectItem>
          <SelectItem value="GB">🇬🇧 영국</SelectItem>
          <SelectItem value="CN">🇨🇳 중국</SelectItem>
          <SelectItem value="DE">🇩🇪 독일</SelectItem>
          <SelectItem value="FR">🇫🇷 프랑스</SelectItem>
          <SelectItem value="ES">🇪🇸 스페인</SelectItem>
          <SelectItem value="IT">🇮🇹 이탈리아</SelectItem>
          <SelectItem value="BR">🇧🇷 브라질</SelectItem>
          <SelectItem value="IN">🇮🇳 인도</SelectItem>
          <SelectItem value="RU">🇷🇺 러시아</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
