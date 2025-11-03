"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyJobCounts } from "@/lib/hooks/useMetrics";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface UsageChartProps {
  period?: number;
}

/**
 * 일별 사용량 차트 컴포넌트
 *
 * 최근 30일간의 작업 생성 수를 라인 차트로 표시합니다.
 */
export default function UsageChart({ period = 30 }: UsageChartProps) {
  const { data, isLoading, error } = useDailyJobCounts(period);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">오류</CardTitle>
          <CardDescription>차트를 불러올 수 없습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = data.daily_counts.map((item) => ({
    date: new Date(item.date).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    }),
    count: item.count,
  }));

  const periodText = period === 7 ? "최근 7일" : period === 30 ? "최근 30일" : `최근 ${period}일`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>일별 작업 수</CardTitle>
        <CardDescription>{periodText}간의 작업 생성 추이</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs text-muted-foreground"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              className="text-xs text-muted-foreground"
              tick={{ fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--primary))" }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
              name="작업 수"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
