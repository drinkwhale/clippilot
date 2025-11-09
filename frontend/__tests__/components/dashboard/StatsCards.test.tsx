/**
 * StatsCards 컴포넌트 단위 테스트
 *
 * 테스트 범위:
 * - 로딩 스켈레톤 표시
 * - 에러 상태 표시
 * - 정상 데이터 렌더링
 * - success_rate 계산 정확성
 * - 실패율 계산 정확성
 * - 평균 렌더링 시간 표시
 * - 데이터 없음 상태 처리
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsCards from '@/components/dashboard/StatsCards';
import { useDashboardMetrics } from '@/lib/hooks/useMetrics';

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

const mockUseDashboardMetrics = useDashboardMetrics as jest.MockedFunction<typeof useDashboardMetrics>;

describe('StatsCards 컴포넌트', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('로딩 상태', () => {
    it('로딩 중일 때 스켈레톤 4개를 표시해야 함', () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { container } = render(<StatsCards />);

      // 스켈레톤이 표시되는지 확인 (4개의 카드)
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('에러 상태', () => {
    it('에러 발생 시 에러 메시지를 표시해야 함', () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      } as any);

      render(<StatsCards />);

      expect(screen.getByText('오류')).toBeInTheDocument();
      expect(screen.getByText('통계를 불러올 수 없습니다.')).toBeInTheDocument();
    });

    it('데이터가 없을 때 에러 메시지를 표시해야 함', () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      render(<StatsCards />);

      expect(screen.getByText('오류')).toBeInTheDocument();
      expect(screen.getByText('통계를 불러올 수 없습니다.')).toBeInTheDocument();
    });
  });

  describe('정상 데이터 렌더링', () => {
    const mockMetrics = {
      total_jobs: 1000,
      successful_jobs: 800,
      failed_jobs: 200,
      success_rate: 80.0,
      avg_render_time_seconds: 180,
      total_tokens_used: 50000,
      total_api_cost: 5.0,
      period_days: 30,
    };

    beforeEach(() => {
      mockUseDashboardMetrics.mockReturnValue({
        data: mockMetrics,
        isLoading: false,
        error: null,
      } as any);
    });

    it('총 작업 수를 올바르게 표시해야 함', () => {
      render(<StatsCards />);

      expect(screen.getByText('총 작업 수')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('최근 30일')).toBeInTheDocument();
    });

    it('성공한 작업과 성공률을 올바르게 표시해야 함', () => {
      render(<StatsCards />);

      expect(screen.getByText('성공한 작업')).toBeInTheDocument();
      expect(screen.getByText('800')).toBeInTheDocument();
      expect(screen.getByText('성공률 80.0%')).toBeInTheDocument();
    });

    it('실패한 작업과 실패율을 올바르게 표시해야 함', () => {
      render(<StatsCards />);

      expect(screen.getByText('실패한 작업')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('전체의 20.0%')).toBeInTheDocument();
    });

    it('평균 렌더링 시간을 올바르게 표시해야 함 (초 및 분)', () => {
      render(<StatsCards />);

      expect(screen.getByText('평균 렌더링 시간')).toBeInTheDocument();
      expect(screen.getByText('180초')).toBeInTheDocument();
      expect(screen.getByText('약 3.0분')).toBeInTheDocument();
    });
  });

  describe('기간 텍스트 표시', () => {
    it('period=7일 때 "최근 7일" 텍스트를 표시해야 함', () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: {
          total_jobs: 10,
          successful_jobs: 8,
          failed_jobs: 2,
          success_rate: 80.0,
          avg_render_time_seconds: 120,
          total_tokens_used: 5000,
          total_api_cost: 0.5,
          period_days: 7,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<StatsCards period={7} />);

      expect(screen.getByText('최근 7일')).toBeInTheDocument();
    });

    it('period=30일 때 "최근 30일" 텍스트를 표시해야 함', () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: {
          total_jobs: 100,
          successful_jobs: 80,
          failed_jobs: 20,
          success_rate: 80.0,
          avg_render_time_seconds: 120,
          total_tokens_used: 50000,
          total_api_cost: 5.0,
          period_days: 30,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<StatsCards period={30} />);

      expect(screen.getByText('최근 30일')).toBeInTheDocument();
    });
  });

  describe('엣지 케이스 처리', () => {
    it('작업이 없을 때 (total_jobs=0) 올바르게 표시해야 함', () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: {
          total_jobs: 0,
          successful_jobs: 0,
          failed_jobs: 0,
          success_rate: 0.0,
          avg_render_time_seconds: null,
          total_tokens_used: 0,
          total_api_cost: 0.0,
          period_days: 30,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<StatsCards />);

      expect(screen.getByText('총 작업 수')).toBeInTheDocument();
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
      expect(screen.getAllByText('데이터 없음').length).toBeGreaterThan(0);
    });

    it('avg_render_time_seconds가 null일 때 "-"와 "데이터 없음"을 표시해야 함', () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: {
          total_jobs: 10,
          successful_jobs: 8,
          failed_jobs: 2,
          success_rate: 80.0,
          avg_render_time_seconds: null,
          total_tokens_used: 5000,
          total_api_cost: 0.5,
          period_days: 30,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<StatsCards />);

      expect(screen.getByText('-')).toBeInTheDocument();
      expect(screen.getByText('데이터 없음')).toBeInTheDocument();
    });

    it('큰 숫자를 올바르게 포맷팅해야 함 (천 단위 구분)', () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: {
          total_jobs: 123456,
          successful_jobs: 100000,
          failed_jobs: 23456,
          success_rate: 81.0,
          avg_render_time_seconds: 180,
          total_tokens_used: 5000000,
          total_api_cost: 500.0,
          period_days: 30,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<StatsCards />);

      expect(screen.getByText('123,456')).toBeInTheDocument();
      expect(screen.getByText('100,000')).toBeInTheDocument();
      expect(screen.getByText('23,456')).toBeInTheDocument();
    });
  });

  describe('성공률 계산 정확성', () => {
    it('100% 성공 시 "성공률 100.0%"를 표시해야 함', () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: {
          total_jobs: 50,
          successful_jobs: 50,
          failed_jobs: 0,
          success_rate: 100.0,
          avg_render_time_seconds: 120,
          total_tokens_used: 25000,
          total_api_cost: 2.5,
          period_days: 30,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<StatsCards />);

      expect(screen.getByText('성공률 100.0%')).toBeInTheDocument();
    });

    it('0% 성공 시 "성공률 0.0%"를 표시해야 함', () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: {
          total_jobs: 50,
          successful_jobs: 0,
          failed_jobs: 50,
          success_rate: 0.0,
          avg_render_time_seconds: 120,
          total_tokens_used: 25000,
          total_api_cost: 2.5,
          period_days: 30,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<StatsCards />);

      expect(screen.getByText('성공률 0.0%')).toBeInTheDocument();
    });

    it('소수점 성공률을 올바르게 표시해야 함', () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: {
          total_jobs: 75,
          successful_jobs: 50,
          failed_jobs: 25,
          success_rate: 66.67,
          avg_render_time_seconds: 120,
          total_tokens_used: 37500,
          total_api_cost: 3.75,
          period_days: 30,
        },
        isLoading: false,
        error: null,
      } as any);

      render(<StatsCards />);

      expect(screen.getByText('성공률 66.7%')).toBeInTheDocument();
    });
  });
});
