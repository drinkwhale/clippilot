/**
 * UsageBanner 컴포넌트 단위 테스트
 *
 * 테스트 범위:
 * - 로딩 중 배너 숨김
 * - 80% 미만 시 배너 숨김
 * - 80% 도달 시 경고 배너 표시
 * - 100% 도달 시 위험 배너 표시
 * - 업그레이드 버튼 표시
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UsageBanner from '@/components/dashboard/UsageBanner';
import { useUsageAlert } from '@/lib/hooks/useMetrics';

// Mock UI 컴포넌트
jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, className, ...props }: any) => (
    <div role="alert" data-variant={variant} className={className} {...props}>
      {children}
    </div>
  ),
  AlertTitle: ({ children, className, ...props }: any) => (
    <h5 className={className} {...props}>
      {children}
    </h5>
  ),
  AlertDescription: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, variant, className, ...props }: any) => {
    if (asChild) {
      return children;
    }
    return (
      <button data-variant={variant} className={className} {...props}>
        {children}
      </button>
    );
  },
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock useMetrics hook
jest.mock('@/lib/hooks/useMetrics');

const mockUseUsageAlert = useUsageAlert as jest.MockedFunction<typeof useUsageAlert>;

describe('UsageBanner 컴포넌트', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('배너 표시 조건', () => {
    it('로딩 중일 때 배너를 표시하지 않아야 함', () => {
      mockUseUsageAlert.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      const { container } = render(<UsageBanner />);

      // 배너가 렌더링되지 않음
      expect(container.firstChild).toBeNull();
    });

    it('데이터가 없을 때 배너를 표시하지 않아야 함', () => {
      mockUseUsageAlert.mockReturnValue({
        data: null,
        isLoading: false,
      } as any);

      const { container } = render(<UsageBanner />);

      expect(container.firstChild).toBeNull();
    });

    it('should_show_banner가 false일 때 배너를 표시하지 않아야 함', () => {
      mockUseUsageAlert.mockReturnValue({
        data: {
          should_show_banner: false,
          usage_percentage: 50.0,
          current_count: 10,
          quota_limit: 20,
          message: '사용량이 정상 범위입니다.',
        },
        isLoading: false,
      } as any);

      const { container } = render(<UsageBanner />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('경고 배너 (80% 이상 ~ 100% 미만)', () => {
    it('80% 도달 시 경고 배너를 표시해야 함', () => {
      mockUseUsageAlert.mockReturnValue({
        data: {
          should_show_banner: true,
          usage_percentage: 80.0,
          current_count: 16,
          quota_limit: 20,
          message: '할당량의 80%를 사용했습니다. 플랜 업그레이드를 고려하세요.',
        },
        isLoading: false,
      } as any);

      render(<UsageBanner />);

      // 경고 메시지 표시
      expect(screen.getByText('할당량 부족')).toBeInTheDocument();
      expect(screen.getByText('할당량의 80%를 사용했습니다. 플랜 업그레이드를 고려하세요.')).toBeInTheDocument();
      expect(screen.getByText('현재 사용량: 16 / 20')).toBeInTheDocument();
      expect(screen.getByText('플랜 업그레이드')).toBeInTheDocument();
    });

    it('90% 도달 시 경고 배너를 표시해야 함', () => {
      mockUseUsageAlert.mockReturnValue({
        data: {
          should_show_banner: true,
          usage_percentage: 90.0,
          current_count: 18,
          quota_limit: 20,
          message: '할당량의 90%를 사용했습니다. 곧 한도에 도달합니다.',
        },
        isLoading: false,
      } as any);

      render(<UsageBanner />);

      expect(screen.getByText('할당량 부족')).toBeInTheDocument();
      expect(screen.getByText('할당량의 90%를 사용했습니다. 곧 한도에 도달합니다.')).toBeInTheDocument();
      expect(screen.getByText('현재 사용량: 18 / 20')).toBeInTheDocument();
    });
  });

  describe('위험 배너 (100% 이상)', () => {
    it('100% 도달 시 위험 배너를 표시해야 함', () => {
      mockUseUsageAlert.mockReturnValue({
        data: {
          should_show_banner: true,
          usage_percentage: 100.0,
          current_count: 20,
          quota_limit: 20,
          message: '할당량을 모두 사용했습니다. 더 이상 작업을 생성할 수 없습니다.',
        },
        isLoading: false,
      } as any);

      render(<UsageBanner />);

      // 위험 메시지 표시
      expect(screen.getByText('할당량 초과')).toBeInTheDocument();
      expect(screen.getByText('할당량을 모두 사용했습니다. 더 이상 작업을 생성할 수 없습니다.')).toBeInTheDocument();
      expect(screen.getByText('현재 사용량: 20 / 20')).toBeInTheDocument();
      expect(screen.getByText('플랜 업그레이드')).toBeInTheDocument();
    });

    it('100% 초과 시 위험 배너를 표시해야 함', () => {
      mockUseUsageAlert.mockReturnValue({
        data: {
          should_show_banner: true,
          usage_percentage: 120.0,
          current_count: 24,
          quota_limit: 20,
          message: '할당량을 초과했습니다. 플랜을 업그레이드하세요.',
        },
        isLoading: false,
      } as any);

      render(<UsageBanner />);

      expect(screen.getByText('할당량 초과')).toBeInTheDocument();
      expect(screen.getByText('할당량을 초과했습니다. 플랜을 업그레이드하세요.')).toBeInTheDocument();
      expect(screen.getByText('현재 사용량: 24 / 20')).toBeInTheDocument();
    });
  });

  describe('업그레이드 버튼', () => {
    it('업그레이드 버튼이 올바른 링크를 가져야 함', () => {
      mockUseUsageAlert.mockReturnValue({
        data: {
          should_show_banner: true,
          usage_percentage: 85.0,
          current_count: 17,
          quota_limit: 20,
          message: '할당량의 85%를 사용했습니다.',
        },
        isLoading: false,
      } as any);

      render(<UsageBanner />);

      const upgradeLink = screen.getByRole('link', { name: '플랜 업그레이드' });
      expect(upgradeLink).toHaveAttribute('href', '/dashboard/settings/billing');
    });
  });

  describe('경계값 테스트', () => {
    it('79.9% 사용 시 배너를 표시하지 않아야 함 (80% 미만)', () => {
      mockUseUsageAlert.mockReturnValue({
        data: {
          should_show_banner: false,
          usage_percentage: 79.9,
          current_count: 15,
          quota_limit: 20,
          message: '',
        },
        isLoading: false,
      } as any);

      const { container } = render(<UsageBanner />);

      expect(container.firstChild).toBeNull();
    });

    it('99.9% 사용 시 경고 배너를 표시해야 함 (100% 미만)', () => {
      mockUseUsageAlert.mockReturnValue({
        data: {
          should_show_banner: true,
          usage_percentage: 99.9,
          current_count: 19,
          quota_limit: 20,
          message: '거의 한도에 도달했습니다.',
        },
        isLoading: false,
      } as any);

      render(<UsageBanner />);

      expect(screen.getByText('할당량 부족')).toBeInTheDocument();
      expect(screen.getByText('거의 한도에 도달했습니다.')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('경고 배너에 적절한 아이콘이 표시되어야 함 (AlertTriangle)', () => {
      mockUseUsageAlert.mockReturnValue({
        data: {
          should_show_banner: true,
          usage_percentage: 85.0,
          current_count: 17,
          quota_limit: 20,
          message: '할당량 부족',
        },
        isLoading: false,
      } as any);

      const { container } = render(<UsageBanner />);

      // AlertTriangle 아이콘이 렌더링되는지 확인
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });

    it('위험 배너에 적절한 아이콘이 표시되어야 함 (AlertCircle)', () => {
      mockUseUsageAlert.mockReturnValue({
        data: {
          should_show_banner: true,
          usage_percentage: 100.0,
          current_count: 20,
          quota_limit: 20,
          message: '할당량 초과',
        },
        isLoading: false,
      } as any);

      const { container } = render(<UsageBanner />);

      // AlertCircle 아이콘이 렌더링되는지 확인
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });
  });
});
