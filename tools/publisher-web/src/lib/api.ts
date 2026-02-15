import type { Platform, PlatformInfo, LoginResult, PublishResult, Task, AccountStatus, APIResponse, PublishContent, HotTopic, HotSource, Pagination, CrossPlatformAnalysis, AIAnalysisResult } from '@/types/api'

const API_BASE = '/api/v1'
const HOT_API_BASE = '/api/hot-topics'

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

// =====================================================
// 热点监控 API
// =====================================================

// 热点列表查询参数
export interface HotTopicsParams {
  page?: number
  limit?: number
  category?: string
  search?: string
  minHeat?: number
  maxHeat?: number
  sortBy?: 'heat' | 'createdAt' | 'publishedAt' | 'suitability'
  sortOrder?: 'asc' | 'desc'
}

// 获取热点列表
export async function getHotTopics(params: HotTopicsParams = {}): Promise<{ success: boolean; data: HotTopic[]; pagination: Pagination }> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', params.page.toString())
  if (params.limit) query.set('limit', params.limit.toString())
  if (params.category) query.set('category', params.category)
  if (params.search) query.set('search', params.search)
  if (params.minHeat !== undefined) query.set('minHeat', params.minHeat.toString())
  if (params.maxHeat !== undefined) query.set('maxHeat', params.maxHeat.toString())
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)

  const response = await fetch(`${HOT_API_BASE}?${query}`)
  return response.json()
}

// 获取热点详情
export async function getHotTopic(id: string): Promise<{ success: boolean; data?: HotTopic; message?: string }> {
  const response = await fetch(`${HOT_API_BASE}/${id}`)
  return response.json()
}

// 获取数据源列表
export async function getHotSources(): Promise<{ success: boolean; data: HotSource[] }> {
  const response = await fetch(`${HOT_API_BASE}/sources`)
  return response.json()
}

// 从 NewsNow 抓取热点
export async function fetchHotTopics(sources?: string[], maxItems = 20): Promise<{ success: boolean; data: { fetched: number; saved: number; topics: HotTopic[] } }> {
  const response = await fetch(`${HOT_API_BASE}/fetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sources, maxItems }),
  })
  return response.json()
}

// 从指定数据源抓取热点
export async function fetchHotTopicsFromSource(sourceId: string, maxItems = 20): Promise<{ success: boolean; data: { source: string; sourceName: string; count: number; topics: HotTopic[] } }> {
  const response = await fetch(`${HOT_API_BASE}/fetch/${sourceId}?maxItems=${maxItems}`)
  return response.json()
}

// 刷新热点数据
export async function refreshHotTopics(): Promise<{ success: boolean; message: string; data?: { count: number; topics: HotTopic[] } }> {
  const response = await fetch(`${HOT_API_BASE}/update`, { method: 'POST' })
  return response.json()
}

// 获取新增热点
export async function getNewHotTopics(hours = 24): Promise<{ success: boolean; data: HotTopic[] }> {
  const response = await fetch(`${HOT_API_BASE}/trends/new?hours=${hours}`)
  return response.json()
}

// 获取热点趋势
export async function getHotTopicTrend(id: string, days = 7): Promise<{ success: boolean; data: { topic: HotTopic; trend: { date: string; heat: number; rank: number }[] } }> {
  const response = await fetch(`${HOT_API_BASE}/trends/timeline/${id}?days=${days}`)
  return response.json()
}

// 获取跨平台分析
export async function getCrossPlatformAnalysis(title: string): Promise<{ success: boolean; data: CrossPlatformAnalysis }> {
  const response = await fetch(`${HOT_API_BASE}/trends/cross-platform/${encodeURIComponent(title)}`)
  return response.json()
}

// AI 分析热点
export async function analyzeHotTopics(topics: HotTopic[], options?: { provider?: string; focus?: string }): Promise<{ success: boolean; data?: AIAnalysisResult; message?: string }> {
  const response = await fetch(`${HOT_API_BASE}/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topics, options }),
  })
  return response.json()
}

// 生成热点简报
export async function generateHotTopicsBrief(topics: HotTopic[], maxLength = 300): Promise<{ success: boolean; data?: { brief: string }; message?: string }> {
  const response = await fetch(`${HOT_API_BASE}/ai/briefing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topics, maxLength }),
  })
  return response.json()
}
