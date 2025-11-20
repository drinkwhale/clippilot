/**
 * API Keys 관리 React Query 훅
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiKeysStore } from '@/lib/stores/api-keys-store';
import * as apiKeysApi from '@/lib/api/api-keys';
import type { APIKeyCreateRequest, ServiceName } from '@/lib/types/api-keys';
import { toast } from 'sonner';

const QUERY_KEY = ['api-keys'];

/**
 * API 키 목록 조회 훅
 */
export function useAPIKeys() {
  const setKeys = useApiKeysStore((state) => state.setKeys);
  const setLoading = useApiKeysStore((state) => state.setLoading);
  const setError = useApiKeysStore((state) => state.setError);

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      setLoading(true);
      try {
        const keys = await apiKeysApi.listAPIKeys();
        setKeys(keys);
        setError(null);
        return keys;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'API 키 목록 조회 실패';
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 특정 서비스 API 키 조회 훅
 */
export function useAPIKey(serviceName: ServiceName) {
  return useQuery({
    queryKey: [...QUERY_KEY, serviceName],
    queryFn: () => apiKeysApi.getAPIKey(serviceName),
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * API 키 생성/업데이트 훅
 */
export function useCreateAPIKey() {
  const queryClient = useQueryClient();
  const addKey = useApiKeysStore((state) => state.addKey);

  return useMutation({
    mutationFn: (payload: APIKeyCreateRequest) => apiKeysApi.createAPIKey(payload),
    onSuccess: (data) => {
      // Store 업데이트
      addKey(data);

      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });

      toast.success(`${data.service_name} API 키가 저장되었습니다.`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'API 키 저장 실패';
      toast.error(message);
    },
  });
}

/**
 * API 키 삭제 훅
 */
export function useDeleteAPIKey() {
  const queryClient = useQueryClient();
  const removeKey = useApiKeysStore((state) => state.removeKey);

  return useMutation({
    mutationFn: (serviceName: ServiceName) => apiKeysApi.deleteAPIKey(serviceName),
    onSuccess: (_, serviceName) => {
      // Store 업데이트
      removeKey(serviceName);

      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });

      toast.success(`${serviceName} API 키가 삭제되었습니다.`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'API 키 삭제 실패';
      toast.error(message);
    },
  });
}

/**
 * API 키 설정 상태 확인 훅
 */
export function useAPIKeysStatus(serviceNames: ServiceName[]) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'status', ...serviceNames],
    queryFn: () => apiKeysApi.checkAPIKeysStatus(serviceNames),
    staleTime: 1000 * 60 * 5, // 5분
  });
}
