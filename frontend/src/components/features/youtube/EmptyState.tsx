/**
 * 검색 결과 없음 컴포넌트
 */

"use client";

import { SearchX } from "lucide-react";

interface EmptyStateProps {
  message?: string;
  description?: string;
}

export function EmptyState({
  message = "검색 결과가 없습니다",
  description = "다른 키워드로 검색해보세요.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <SearchX className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{message}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
