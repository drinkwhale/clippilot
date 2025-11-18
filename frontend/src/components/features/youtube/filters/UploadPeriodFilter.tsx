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

interface UploadPeriodFilterProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * 업로드 기간 필터 컴포넌트
 * - 1시간 이내
 * - 오늘
 * - 이번 주
 * - 이번 달
 * - 올해
 * - 전체
 */
export const UploadPeriodFilter: FC<UploadPeriodFilterProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="upload-period">업로드 기간</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="upload-period">
          <SelectValue placeholder="전체" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="hour">1시간 이내</SelectItem>
          <SelectItem value="today">오늘</SelectItem>
          <SelectItem value="week">이번 주</SelectItem>
          <SelectItem value="month">이번 달</SelectItem>
          <SelectItem value="year">올해</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
