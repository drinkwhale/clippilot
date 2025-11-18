/**
 * 영상 수집 수 선택 컴포넌트
 */

"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CollectionCountSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export function CollectionCountSelector({
  value,
  onChange,
}: CollectionCountSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <Label htmlFor="collection-count" className="text-sm font-medium">
        영상 수집 수
      </Label>
      <Select
        value={value.toString()}
        onValueChange={(val) => onChange(Number(val))}
      >
        <SelectTrigger id="collection-count" className="w-[120px]">
          <SelectValue placeholder="25개" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="25">25개</SelectItem>
          <SelectItem value="30">30개</SelectItem>
          <SelectItem value="35">35개</SelectItem>
          <SelectItem value="40">40개</SelectItem>
          <SelectItem value="45">45개</SelectItem>
          <SelectItem value="50">50개</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
