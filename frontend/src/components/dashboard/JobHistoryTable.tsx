"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobs } from "@/lib/hooks/useJobs";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_COLORS = {
  queued: "bg-gray-500",
  generating: "bg-blue-500",
  rendering: "bg-purple-500",
  uploading: "bg-orange-500",
  done: "bg-green-500",
  failed: "bg-red-500",
} as const;

const STATUS_LABELS = {
  queued: "대기 중",
  generating: "생성 중",
  rendering: "렌더링 중",
  uploading: "업로드 중",
  done: "완료",
  failed: "실패",
} as const;

interface JobHistoryTableProps {
  limit?: number;
}

/**
 * 작업 히스토리 테이블 컴포넌트
 *
 * 사용자의 작업 목록을 테이블 형태로 표시합니다.
 */
export default function JobHistoryTable({ limit = 10 }: JobHistoryTableProps) {
  const [page, setPage] = useState(1);
  const { jobs, total, isLoading, error } = useJobs({ page, pageSize: limit });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">오류</CardTitle>
          <CardDescription>작업 목록을 불러올 수 없습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>작업 히스토리</CardTitle>
        <CardDescription>
          최근 작업 {total.toLocaleString()}개
        </CardDescription>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">아직 작업이 없습니다.</p>
            <Button asChild>
              <Link href="/dashboard/projects/new">첫 프로젝트 생성하기</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>프롬프트</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>생성일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium max-w-md">
                        <div className="truncate">{job.prompt}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={STATUS_COLORS[job.status as keyof typeof STATUS_COLORS]}
                        >
                          {STATUS_LABELS[job.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(job.createdAt).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/projects/${job.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  페이지 {page} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={!hasPrev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    이전
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!hasNext}
                  >
                    다음
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
