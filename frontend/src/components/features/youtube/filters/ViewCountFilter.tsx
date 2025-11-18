"use client";

import { FC } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ViewCountFilterProps {
  value: number;
  onChange: (value: number) => void;
}

/**
 * 최소 조회수 필터 컴포넌트
 */
export const ViewCountFilter: FC<ViewCountFilterProps> = ({
  value,
  onChange,
}) => {
  const presetValues = [
    { label: "제한 없음", value: 0 },
    { label: "1,000회 이상", value: 1000 },
    { label: "10,000회 이상", value: 10000 },
    { label: "100,000회 이상", value: 100000 },
    { label: "1,000,000회 이상", value: 1000000 },
    { label: "직접 입력", value: -1 },
  ];

  const handlePresetChange = (presetValue: string) => {
    const numValue = parseInt(presetValue, 10);
    if (numValue >= 0) {
      onChange(numValue);
    }
  };

  const isCustom = !presetValues.some((preset) => preset.value === value);
  const selectValue = isCustom ? "-1" : value.toString();

  return (
    <div className="space-y-2">
      <Label htmlFor="view-count">최소 조회수</Label>
      <Select value={selectValue} onValueChange={handlePresetChange}>
        <SelectTrigger id="view-count">
          <SelectValue placeholder="제한 없음" />
        </SelectTrigger>
        <SelectContent>
          {presetValues.map((preset) => (
            <SelectItem key={preset.value} value={preset.value.toString()}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(isCustom || selectValue === "-1") && (
        <Input
          type="number"
          min={0}
          value={value === -1 ? "" : value}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
          placeholder="직접 입력"
          className="mt-2"
        />
      )}
    </div>
  );
};
