/**
 * API Keys 타입 정의
 */

export type ServiceName = 'youtube' | 'openai' | 'pexels';

export interface APIKey {
  id: string;
  service_name: ServiceName;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

export interface APIKeyWithSecret extends APIKey {
  api_key: string; // 평문 API 키 (생성 직후에만 반환)
}

export interface APIKeyCreateRequest {
  service_name: ServiceName;
  api_key: string;
}

export interface APIKeyStatus {
  service_name: ServiceName;
  display_name: string;
  description: string;
  is_configured: boolean;
  last_used_at: string | null;
  get_key_url?: string; // API 키 발급 URL
}
