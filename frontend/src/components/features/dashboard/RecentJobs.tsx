"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileVideo, Clock, CheckCircle2, XCircle, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { mockJobs } from "@/lib/mocks/dashboard";
import type { Job, JobStatus } from "@/lib/types/dashboard";
import { isMockApi, waitFor } from "@/lib/config";

/**
 * 클라이언트 전용 시간 표시 컴포넌트 (hydration 에러 방지)
 */
function TimeAgo({ date }: { date: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="text-xs text-muted-foreground">잠시 전</span>;
  }

  return (
    <span className="text-xs text-muted-foreground">
      {formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: ko,
      })}
    </span>
  );
}

/**
 * 작업 상태별 배지 컴포넌트
 */
function JobStatusBadge({ status }: { status: JobStatus }) {
  const statusConfig: Record<JobStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    queued: {
      label: "대기 중",
      variant: "secondary",
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
    generating: {
      label: "스크립트 생성 중",
      variant: "default",
      icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />,
    },
    rendering: {
      label: "렌더링 중",
      variant: "default",
      icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />,
    },
    uploading: {
      label: "업로드 중",
      variant: "default",
      icon: <Upload className="h-3 w-3 mr-1" />,
    },
    done: {
      label: "완료",
      variant: "outline",
      icon: <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />,
    },
    failed: {
      label: "실패",
      variant: "destructive",
      icon: <XCircle className="h-3 w-3 mr-1" />,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="flex items-center w-fit">
      {config.icon}
      {config.label}
    </Badge>
  );
}

/**
 * 최근 작업 목록 컴포넌트
 */
export function RecentJobs() {
  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["recent-jobs", isMockApi],
    queryFn: async () => {
      if (isMockApi) {
        await waitFor(200);
        return mockJobs;
      }
      const response = await api.jobs.list({ page: 1, page_size: 5 });
      return response.data.jobs || [];
    },
    refetchInterval: isMockApi ? false : 10000, // 10초마다 자동 갱신 (진행 중인 작업 확인)
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>최근 작업</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>최근 작업</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileVideo className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">아직 작업이 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-4">
              YouTube 검색으로 영상을 찾아 작업을 생성해보세요.
            </p>
            <Link
              href="/dashboard/youtube-search"
              className="text-sm text-primary hover:underline"
            >
              YouTube 검색 시작하기 →
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 작업</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/dashboard/jobs/${job.id}`}
              className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center">
                  <FileVideo className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate mb-1">{job.prompt}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <JobStatusBadge status={job.status} />
                  <TimeAgo date={job.created_at} />
                </div>
                {job.status === "failed" && job.error_message && (
                  <p className="text-xs text-destructive mt-1">
                    {job.error_message}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
        {jobs.length >= 5 && (
          <Link
            href="/dashboard/jobs"
            className="block text-center text-sm text-primary hover:underline mt-4"
          >
            모든 작업 보기 →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
