/**
 * UsageChart 컴포넌트 단위 테스트
 *
 * 테스트 범위:
 * - 로딩 스켈레톤 표시
 * - 에러 상태 표시
 * - 정상 데이터 렌더링
 * - 차트 데이터 포맷팅
 * - 기간 텍스트 표시
 * - 접근성 (ARIA 속성)
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UsageChart from '@/components/dashboard/UsageChart';
import { useDailyJobCounts } from '@/lib/hooks/useMetrics';

// Mock UI 컴포넌트
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={className} {...props}>
      {children}
    </h3>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p className={className} {...props}>
      {children}
    </p>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, ...props }: any) => (
    <div className={`animate-pulse ${className}`} {...props} />
  ),
}));

// Mock useMetrics hook
jest.mock('@/lib/hooks/useMetrics');

const mockUseDailyJobCounts = useDailyJobCounts as jest.MockedFunction<typeof useDailyJobCounts>;

// Mock recharts 컴포넌트 (실제 차트 렌더링 대신 간단한 div 렌더링)
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children, ...props }: any) => (
    <div {...props} data-testid="responsive-container">
      {children}
    </div>
  ),
  LineChart: ({ children, data, ...props }: any) => (
    <div {...props} data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: (props: any) => <div {...props} data-testid="line" />,
  XAxis: (props: any) => <div {...props} data-testid="x-axis" />,
  YAxis: (props: any) => <div {...props} data-testid="y-axis" />,
  CartesianGrid: (props: any) => <div {...props} data-testid="cartesian-grid" />,
  Tooltip: (props: any) => <div {...props} data-testid="tooltip" />,
}));

describe('UsageChart 컴포넌트', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('로딩 상태', () => {
    it('로딩 중일 때 스켈레톤을 표시해야 함', () => {
      mockUseDailyJobCounts.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { container } = render(<UsageChart />);

      // 스켈레톤이 표시되는지 확인
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('에러 상태', () => {
    it('에러 발생 시 에러 메시지를 표시해야 함', () => {
      mockUseDailyJobCounts.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      } as any);

      render(<UsageChart />);

      expect(screen.getByText('오류')).toBeInTheDocument();
      expect(screen.getByText('차트를 불러올 수 없습니다.')).toBeInTheDocument();
    });

    it('데이터가 없을 때 에러 메시지를 표시해야 함', () => {
      mockUseDailyJobCounts.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      render(<UsageChart />);

      expect(screen.getByText('오류')).toBeInTheDocument();
      expect(screen.getByText('차트를 불러올 수 없습니다.')).toBeInTheDocument();
    });
  });

  describe('정상 데이터 렌더링', () => {
    const mockDailyData = {
      daily_counts: [
        { date: '2025-11-01T00:00:00Z', count: 10 },
        { date: '2025-11-02T00:00:00Z', count: 15 },
        { date: '2025-11-03T00:00:00Z', count: 8 },
        { date: '2025-11-04T00:00:00Z', count: 12 },
        { date: '2025-11-05T00:00:00Z', count: 20 },
      ],
    };

    beforeEach(() => {
      mockUseDailyJobCounts.mockReturnValue({
        data: mockDailyData,
        isLoading: false,
        error: null,
      } as any);
    });

    it('차트 제목과 설명을 올바르게 표시해야 함', () => {
      render(<UsageChart />);

      expect(screen.getByText('일별 작업 수')).toBeInTheDocument();
      expect(screen.getByText('최근 30일간의 작업 생성 추이')).toBeInTheDocument();
    });

    it('차트 컴포넌트들이 렌더링되어야 함', () => {
      render(<UsageChart />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('차트 데이터를 올바르게 포맷팅해야 함', () => {
      render(<UsageChart />);

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

      expect(chartData).toHaveLength(5);
      expect(chartData[0]).toHaveProperty('date');
      expect(chartData[0]).toHaveProperty('count');
      expect(chartData[0].count).toBe(10);
      expect(chartData[4].count).toBe(20);
    });
  });

  describe('기간 텍스트 표시', () => {
    it('period=7일 때 "최근 7일" 텍스트를 표시해야 함', () => {
      mockUseDailyJobCounts.mockReturnValue({
        data: {
          daily_counts: [
            { date: '2025-11-01T00:00:00Z', count: 5 },
            { date: '2025-11-02T00:00:00Z', count: 8 },
          ],
        },
        isLoading: false,
        error: null,
      } as any);

      render(<UsageChart period={7} />);

      expect(screen.getByText('최근 7일간의 작업 생성 추이')).toBeInTheDocument();
    });

    it('period=30일 때 "최근 30일" 텍스트를 표시해야 함', () => {
      mockUseDailyJobCounts.mockReturnValue({
        data: {
          daily_counts: [
            { date: '2025-11-01T00:00:00Z', count: 10 },
          ],
        },
        isLoading: false,
        error: null,
      } as any);

      render(<UsageChart period={30} />);

      expect(screen.getByText('최근 30일간의 작업 생성 추이')).toBeInTheDocument();
    });
  });

  describe('접근성 (Accessibility)', () => {
    beforeEach(() => {
      mockUseDailyJobCounts.mockReturnValue({
        data: {
          daily_counts: [
            { date: '2025-11-01T00:00:00Z', count: 10 },
            { date: '2025-11-02T00:00:00Z', count: 15 },
            { date: '2025-11-03T00:00:00Z', count: 20 },
          ],
        },
        isLoading: false,
        error: null,
      } as any);
    });

    it('ResponsiveContainer에 role="img"가 설정되어야 함', () => {
      render(<UsageChart />);

      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveAttribute('role', 'img');
    });

    it('ResponsiveContainer에 aria-label이 설정되어야 함', () => {
      render(<UsageChart />);

      const container = screen.getByTestId('responsive-container');
      const ariaLabel = container.getAttribute('aria-label');

      expect(ariaLabel).toContain('최근 30일간 일별 작업 수 추이 차트');
      expect(ariaLabel).toContain('총');
      expect(ariaLabel).toContain('일평균');
    });

    it('스크린 리더용 차트 설명이 포함되어야 함', () => {
      render(<UsageChart />);

      // sr-only 클래스가 적용된 요소 확인
      const srOnlyElements = document.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);

      // 텍스트 내용 확인
      const srText = Array.from(srOnlyElements)
        .map((el) => el.textContent)
        .join(' ');

      expect(srText).toContain('최근 30일간');
      expect(srText).toContain('총');
      expect(srText).toContain('일평균');
    });
  });

  describe('차트 데이터 계산', () => {
    it('총 작업 수를 올바르게 계산해야 함', () => {
      mockUseDailyJobCounts.mockReturnValue({
        data: {
          daily_counts: [
            { date: '2025-11-01T00:00:00Z', count: 10 },
            { date: '2025-11-02T00:00:00Z', count: 20 },
            { date: '2025-11-03T00:00:00Z', count: 30 },
          ],
        },
        isLoading: false,
        error: null,
      } as any);

      render(<UsageChart />);

      const container = screen.getByTestId('responsive-container');
      const ariaLabel = container.getAttribute('aria-label');

      // 총합: 10 + 20 + 30 = 60
      expect(ariaLabel).toContain('총 60개');
    });

    it('일평균을 올바르게 계산해야 함', () => {
      mockUseDailyJobCounts.mockReturnValue({
        data: {
          daily_counts: [
            { date: '2025-11-01T00:00:00Z', count: 10 },
            { date: '2025-11-02T00:00:00Z', count: 20 },
            { date: '2025-11-03T00:00:00Z', count: 30 },
          ],
        },
        isLoading: false,
        error: null,
      } as any);

      render(<UsageChart />);

      const container = screen.getByTestId('responsive-container');
      const ariaLabel = container.getAttribute('aria-label');

      // 일평균: 60 / 3 = 20.0
      expect(ariaLabel).toContain('일평균 20.0개');
    });

    it('작업이 없을 때 일평균 0을 표시해야 함', () => {
      mockUseDailyJobCounts.mockReturnValue({
        data: {
          daily_counts: [
            { date: '2025-11-01T00:00:00Z', count: 0 },
            { date: '2025-11-02T00:00:00Z', count: 0 },
          ],
        },
        isLoading: false,
        error: null,
      } as any);

      render(<UsageChart />);

      const container = screen.getByTestId('responsive-container');
      const ariaLabel = container.getAttribute('aria-label');

      expect(ariaLabel).toContain('총 0개');
      expect(ariaLabel).toContain('일평균 0개');
    });
  });

  describe('날짜 포맷팅', () => {
    it('날짜를 한국어 형식으로 포맷팅해야 함', () => {
      mockUseDailyJobCounts.mockReturnValue({
        data: {
          daily_counts: [
            { date: '2025-11-01T00:00:00Z', count: 10 },
            { date: '2025-11-15T00:00:00Z', count: 20 },
          ],
        },
        isLoading: false,
        error: null,
      } as any);

      render(<UsageChart />);

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '[]');

      // 한국어 형식으로 포맷팅되었는지 확인 (예: "11월 1일")
      expect(chartData[0].date).toMatch(/\d+월\s+\d+일/);
      expect(chartData[1].date).toMatch(/\d+월\s+\d+일/);
    });
  });
});
