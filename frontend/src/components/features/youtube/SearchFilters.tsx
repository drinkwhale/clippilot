"use client";

import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoTypeFilter } from "./filters/VideoTypeFilter";
import { UploadPeriodFilter } from "./filters/UploadPeriodFilter";
import { RegionSelector } from "./filters/RegionSelector";
import { ViewCountFilter } from "./filters/ViewCountFilter";
import { SubscriberFilter } from "./filters/SubscriberFilter";
import { Filter, X } from "lucide-react";

export interface SearchFiltersState {
  videoDuration: string;
  uploadPeriod: string;
  regionCode: string;
  minViewCount: number;
  minSubscriberCount: number;
}

interface SearchFiltersProps {
  filters: SearchFiltersState;
  onChange: (filters: SearchFiltersState) => void;
  onReset: () => void;
}

/**
 * 검색 필터 통합 컴포넌트
 * 모든 필터를 하나의 카드로 묶어서 관리
 */
export const SearchFilters: FC<SearchFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const hasActiveFilters =
    filters.videoDuration !== "any" ||
    filters.uploadPeriod !== "all" ||
    filters.regionCode !== "" ||
    filters.minViewCount > 0 ||
    filters.minSubscriberCount > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Filter className="h-4 w-4" />
          고급 필터
        </CardTitle>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-2 text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            초기화
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <VideoTypeFilter
          value={filters.videoDuration}
          onChange={(videoDuration) => onChange({ ...filters, videoDuration })}
        />

        <UploadPeriodFilter
          value={filters.uploadPeriod}
          onChange={(uploadPeriod) => onChange({ ...filters, uploadPeriod })}
        />

        <RegionSelector
          value={filters.regionCode}
          onChange={(regionCode) => onChange({ ...filters, regionCode })}
        />

        <ViewCountFilter
          value={filters.minViewCount}
          onChange={(minViewCount) => onChange({ ...filters, minViewCount })}
        />

        <SubscriberFilter
          value={filters.minSubscriberCount}
          onChange={(minSubscriberCount) =>
            onChange({ ...filters, minSubscriberCount })
          }
        />
      </CardContent>
    </Card>
  );
};
