/**
 * API Keys 관리 클라이언트
 */

import { apiClient } from './client';
import type { APIKey, APIKeyWithSecret, APIKeyCreateRequest, ServiceName } from '@/lib/types/api-keys';

/**
 * 사용자의 모든 API 키 목록 조회
 */
export async function listAPIKeys(): Promise<APIKey[]> {
  const response = await apiClient.get<APIKey[]>('/api/v1/api-keys');
  return response.data;
}

/**
 * 특정 서비스의 API 키 조회
 */
export async function getAPIKey(serviceName: ServiceName): Promise<APIKey> {
  const response = await apiClient.get<APIKey>(`/api/v1/api-keys/${serviceName}`);
  return response.data;
}

/**
 * API 키 생성 또는 업데이트
 *
 * @returns 생성된 API 키 (평문 포함, 한 번만 조회 가능)
 */
export async function createAPIKey(payload: APIKeyCreateRequest): Promise<APIKeyWithSecret> {
  const response = await apiClient.post<APIKeyWithSecret>('/api/v1/api-keys', payload);
  return response.data;
}

/**
 * API 키 삭제
 */
export async function deleteAPIKey(serviceName: ServiceName): Promise<void> {
  await apiClient.delete(`/api/v1/api-keys/${serviceName}`);
}

/**
 * API 키 설정 여부 확인 (여러 서비스를 한번에)
 */
export async function checkAPIKeysStatus(serviceNames: ServiceName[]): Promise<Record<ServiceName, boolean>> {
  const keys = await listAPIKeys();
  const keyMap = new Map(keys.map(key => [key.service_name, true]));

  return serviceNames.reduce((acc, serviceName) => {
    acc[serviceName] = keyMap.has(serviceName);
    return acc;
  }, {} as Record<ServiceName, boolean>);
}
