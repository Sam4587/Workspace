import type { Platform, PlatformInfo, LoginResult, PublishResult, Task, AccountStatus, APIResponse, PublishContent } from '@/types/api'

const API_BASE = '/api/v1'

// 平台列表响应类型
interface PlatformsResponse {
  count: number
  platforms: string[]
}

// 通用请求方法
async function request<T>(url: string, options?: RequestInit): Promise<APIResponse<T>> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  const data = await response.json()
  return data as APIResponse<T>
}

// 获取平台列表
export async function getPlatforms(): Promise<APIResponse<PlatformsResponse>> {
  return request<PlatformsResponse>(`${API_BASE}/platforms`)
}

// 获取平台信息
export async function getPlatformInfo(platform: Platform): Promise<APIResponse<PlatformInfo>> {
  return request<PlatformInfo>(`${API_BASE}/platforms/${platform}`)
}

// 登录
export async function login(platform: Platform): Promise<APIResponse<LoginResult>> {
  return request<LoginResult>(`${API_BASE}/platforms/${platform}/login`, {
    method: 'POST',
  })
}

// 检查登录状态
export async function checkLogin(platform: Platform): Promise<APIResponse<AccountStatus>> {
  return request<AccountStatus>(`${API_BASE}/platforms/${platform}/check`)
}

// 发布内容
export async function publish(content: PublishContent): Promise<APIResponse<PublishResult>> {
  return request<PublishResult>(`${API_BASE}/publish`, {
    method: 'POST',
    body: JSON.stringify(content),
  })
}

// 异步发布
export async function publishAsync(content: PublishContent): Promise<APIResponse<{ task_id: string }>> {
  return request<{ task_id: string }>(`${API_BASE}/publish/async`, {
    method: 'POST',
    body: JSON.stringify(content),
  })
}

// 获取任务列表
export async function getTasks(status?: string, platform?: string, limit = 20): Promise<APIResponse<Task[]>> {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (platform) params.set('platform', platform)
  params.set('limit', limit.toString())

  return request<Task[]>(`${API_BASE}/tasks?${params}`)
}

// 获取任务详情
export async function getTask(taskId: string): Promise<APIResponse<Task>> {
  return request<Task>(`${API_BASE}/tasks/${taskId}`)
}

// 取消任务
export async function cancelTask(taskId: string): Promise<APIResponse<void>> {
  return request<void>(`${API_BASE}/tasks/${taskId}/cancel`, {
    method: 'POST',
  })
}
