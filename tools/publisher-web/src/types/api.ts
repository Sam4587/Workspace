// API 类型定义

// 平台类型
export type Platform = 'douyin' | 'toutiao' | 'xiaohongshu'

// 平台信息
export interface PlatformInfo {
  name: string
  display_name: string
  icon?: string
  limits: {
    title_max_length: number
    body_max_length: number
    max_images: number
    max_video_size: number
    allowed_video_formats: string[]
    allowed_image_formats: string[]
  }
}

// 登录结果
export interface LoginResult {
  success: boolean
  qrcode_url?: string
  error?: string
  expires_at?: string
}

// 发布状态
export type PublishStatus = 'pending' | 'processing' | 'success' | 'failed'

// 发布内容
export interface PublishContent {
  platform: Platform
  type: 'images' | 'video'
  title: string
  body: string
  images?: string[]
  video?: string
  tags?: string[]
}

// 发布结果
export interface PublishResult {
  task_id: string
  status: PublishStatus
  platform: string
  post_id?: string
  post_url?: string
  error?: string
  created_at: string
  finished_at?: string
}

// 任务
export interface Task {
  id: string
  type: string
  status: PublishStatus
  platform: string
  payload: Record<string, unknown>
  result?: Record<string, unknown>
  error?: string
  progress: number
  created_at: string
  started_at?: string
  finished_at?: string
}

// 账号状态
export interface AccountStatus {
  platform: Platform
  logged_in: boolean
  account_name?: string
  avatar?: string
  last_check?: string
}

// API 响应
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  error_code?: string
  timestamp: number
}
