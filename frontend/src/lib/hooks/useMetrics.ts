"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

/**
 * 대시보드 메트릭 타입
 */
export interface DashboardMetrics {
  total_jobs: number;
  successful_jobs: number;
  failed_jobs: number;
  success_rate: number;
  avg_render_time_seconds: number | null;
  total_tokens_used: number;
  total_api_cost: string;
  period_days: number;
}

/**
 * 사용량 메트릭 타입
 */
export interface UsageMetrics {
  current_count: number;
  quota_limit: number;
  usage_percentage: number;
  period_start: string;
  period_end: string;
}

/**
 * 일별 작업 수 타입
 */
export interface DailyJobCount {
  date: string;
  count: number;
}

/**
 * 사용량 알림 타입
 */
export interface UsageAlert {
  should_show_banner: boolean;
  should_send_email: boolean;
  usage_percentage: number;
  current_count: number;
  quota_limit: number;
  message: string | null;
}

/**
 * 대시보드 메트릭 조회 Hook
 *
 * @param period - 집계 기간 (일)
 * @returns Query result with dashboard metrics
 */
export function useDashboardMetrics(period: number = 30) {
  return useQuery<DashboardMetrics>({
    queryKey: ["metrics", "dashboard", period],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/metrics/dashboard?period=${period}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5분
    refetchInterval: 1000 * 60 * 5, // 5분마다 자동 갱신
  });
}

/**
 * 월간 사용량 메트릭 조회 Hook
 *
 * @returns Query result with usage metrics
 */
export function useUsageMetrics() {
  return useQuery<UsageMetrics>({
    queryKey: ["metrics", "usage"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/metrics/usage");
      return response.data;
    },
    staleTime: 1000 * 60 * 1, // 1분
    refetchInterval: 1000 * 60 * 1, // 1분마다 자동 갱신
  });
}

/**
 * 일별 작업 수 통계 조회 Hook
 *
 * @param period - 집계 기간 (일)
 * @returns Query result with daily job counts
 */
export function useDailyJobCounts(period: number = 30) {
  return useQuery<{ daily_counts: DailyJobCount[] }>({
    queryKey: ["metrics", "daily-jobs", period],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/metrics/daily-jobs?period=${period}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 사용량 알림 체크 Hook
 *
 * @returns Query result with usage alert
 */
export function useUsageAlert() {
  return useQuery<UsageAlert>({
    queryKey: ["metrics", "usage-alert"],
    queryFn: async () => {
      const response = await apiClient.get("/api/v1/metrics/usage-alert");
      return response.data;
    },
    staleTime: 1000 * 60 * 1, // 1분
    refetchInterval: 1000 * 60 * 1, // 1분마다 자동 갱신
  });
}
