/**
 * useTemplates hook
 * Handles template creation, fetching, updating, and deletion
 */

'use client'

import { useCallback } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'

import { useAuthStore } from '@/lib/stores/auth-store'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// API Response Types
export interface BrandColors {
  primary: string
  secondary?: string
  accent?: string
  background?: string
  text?: string
}

export interface BrandFonts {
  title: string
  body: string
  subtitle?: string
}

export interface BrandConfig {
  colors: BrandColors
  fonts: BrandFonts
  intro_video_url?: string
  outro_video_url?: string
  watermark_url?: string
  watermark_position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  watermark_opacity?: number
}

export interface TemplateApiResponse {
  id: string
  user_id: string | null
  name: string
  description: string | null
  brand_config_json: BrandConfig
  is_system_default: boolean
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  userId: string | null
  name: string
  description: string | null
  brandConfig: BrandConfig
  isSystemDefault: boolean
  createdAt: string
  updatedAt: string
}

interface TemplateListApiResponse {
  templates: Template[]
  total: number
}

interface TemplateCreateInput {
  name: string
  description?: string
  brand_config_json: BrandConfig
}

interface TemplateUpdateInput {
  name?: string
  description?: string
  brand_config_json?: BrandConfig
}

/**
 * Map API response to Template
 */
const mapTemplate = (template: TemplateApiResponse): Template => ({
  id: template.id,
  userId: template.user_id,
  name: template.name,
  description: template.description,
  brandConfig: template.brand_config_json,
  isSystemDefault: template.is_system_default,
  createdAt: template.created_at,
  updatedAt: template.updated_at,
})

/**
 * Fetch templates from the API
 */
async function fetchTemplates(
  token: string | null,
  includeSystem: boolean = true
): Promise<TemplateListApiResponse> {
  if (!token) {
    throw new Error('인증 토큰이 없습니다')
  }

  const url = new URL(`${API_BASE_URL}/api/v1/templates`)
  url.searchParams.set('include_system', includeSystem.toString())

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message || '템플릿 목록 조회에 실패했습니다')
  }

  const data = await response.json()
  return {
    templates: data.templates.map(mapTemplate),
    total: data.total,
  }
}

/**
 * Create a new template
 */
async function createTemplate(
  token: string | null,
  data: TemplateCreateInput
): Promise<Template> {
  if (!token) {
    throw new Error('인증 토큰이 없습니다')
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/templates`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message || '템플릿 생성에 실패했습니다')
  }

  return response.json()
}

/**
 * Update an existing template
 */
async function updateTemplate(
  token: string | null,
  templateId: string,
  data: TemplateUpdateInput
): Promise<Template> {
  if (!token) {
    throw new Error('인증 토큰이 없습니다')
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/templates/${templateId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message || '템플릿 수정에 실패했습니다')
  }

  return response.json()
}

/**
 * Delete a template
 */
async function deleteTemplate(
  token: string | null,
  templateId: string
): Promise<void> {
  if (!token) {
    throw new Error('인증 토큰이 없습니다')
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/templates/${templateId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message || '템플릿 삭제에 실패했습니다')
  }
}

/**
 * useTemplates hook
 */
export function useTemplates(includeSystem: boolean = true) {
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)

  // Fetch templates query
  const templatesQuery: UseQueryResult<TemplateListApiResponse, Error> = useQuery({
    queryKey: ['templates', includeSystem],
    queryFn: () => fetchTemplates(token, includeSystem),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: false,
  })

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: TemplateCreateInput) => createTemplate(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: TemplateUpdateInput }) =>
      updateTemplate(token, templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => deleteTemplate(token, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  // Callback functions
  const createNewTemplate = useCallback(
    async (data: TemplateCreateInput) => {
      return createTemplateMutation.mutateAsync(data)
    },
    [createTemplateMutation]
  )

  const updateExistingTemplate = useCallback(
    async (templateId: string, data: TemplateUpdateInput) => {
      return updateTemplateMutation.mutateAsync({ templateId, data })
    },
    [updateTemplateMutation]
  )

  const deleteExistingTemplate = useCallback(
    async (templateId: string) => {
      return deleteTemplateMutation.mutateAsync(templateId)
    },
    [deleteTemplateMutation]
  )

  return {
    // Query data
    templates: templatesQuery.data?.templates ?? [],
    total: templatesQuery.data?.total ?? 0,

    // Query state
    isLoading: templatesQuery.isLoading,
    isError: templatesQuery.isError,
    error: templatesQuery.error,
    refetch: templatesQuery.refetch,

    // Mutations
    createTemplate: createNewTemplate,
    updateTemplate: updateExistingTemplate,
    deleteTemplate: deleteExistingTemplate,

    // Mutation states
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
  }
}
