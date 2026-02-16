import axios from 'axios';
import { mockHotTopics, mockVideoTemplates, mockTrendData, mockCrossPlatformData } from './mockData';

const USE_MOCK = false;
// 优先使用环境变量，否则使用相对路径 /api（通过 Vite proxy 代理到后端）
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }

        const message = error.response?.data?.message || error.message || '请求失败';
        return Promise.reject(new Error(message));
      }
    );
  }

  // 热点话题相关
  async getHotTopics(params = {}) {
    if (USE_MOCK) {
      return {
        success: true,
        data: mockHotTopics,
        pagination: {
          page: 1,
          limit: 20,
          total: mockHotTopics.length,
          pages: 1
        }
      };
    }
    try {
      const query = new URLSearchParams(params).toString();
      const response = await this.client.get(`/hot-topics?${query}`);
      return {
        success: true,
        data: response.data || [],
        pagination: response.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 1
        }
      };
    } catch (error) {
      console.error('获取热点话题失败:', error);
      return {
        success: true,
        data: mockHotTopics,
        pagination: {
          page: 1,
          limit: 20,
          total: mockHotTopics.length,
          pages: 1
        }
      };
    }
  }

  async getHotTopic(id) {
    try {
      return await this.client.get(`/hot-topics/${id}`);
    } catch (error) {
      console.error('获取热点话题详情失败:', error);
      return {
        success: false,
        message: '获取热点话题详情失败'
      };
    }
  }

  async updateHotTopics() {
    try {
      return await this.client.post('/hot-topics/update');
    } catch (error) {
      console.error('更新热点数据失败:', error);
      return {
        success: false,
        message: '更新热点数据失败'
      };
    }
  }

  async invalidateCache(source = 'all') {
    try {
      return await this.client.post('/hot-topics/invalidate-cache', { source });
    } catch (error) {
      console.error('清除缓存失败:', error);
      return {
        success: false,
        message: '清除缓存失败'
      };
    }
  }

  // 趋势分析相关
  async getNewTopics(hours = 24) {
    if (USE_MOCK) {
      return {
        success: true,
        data: mockHotTopics.slice(0, 3)
      };
    }
    try {
      const response = await this.client.get(`/hot-topics/trends/new?hours=${hours}`);
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('获取新增热点失败:', error);
      return {
        success: true,
        data: mockHotTopics.slice(0, 3)
      };
    }
  }

  async getTopicTrend(id, days = 7) {
    if (USE_MOCK) {
      return {
        success: true,
        data: mockTrendData
      };
    }
    try {
      const response = await this.client.get(`/hot-topics/trends/timeline/${id}?days=${days}`);
      return {
        success: true,
        data: response.data || mockTrendData
      };
    } catch (error) {
      console.error('获取热点趋势失败:', error);
      return {
        success: true,
        data: mockTrendData
      };
    }
  }

  async getCrossPlatformAnalysis(title) {
    if (USE_MOCK) {
      return {
        success: true,
        data: mockCrossPlatformData
      };
    }
    try {
      const response = await this.client.get(`/hot-topics/trends/cross-platform/${encodeURIComponent(title)}`);
      return {
        success: true,
        data: response.data || mockCrossPlatformData
      };
    } catch (error) {
      console.error('获取跨平台分析失败:', error);
      return {
        success: true,
        data: mockCrossPlatformData
      };
    }
  }

  async recordTopicSnapshot(topics) {
    try {
      return await this.client.post('/hot-topics/trends/snapshot', { topics });
    } catch (error) {
      console.error('记录趋势快照失败:', error);
      return {
        success: false,
        message: '记录趋势快照失败'
      };
    }
  }

  // RSS 订阅源相关
  async getRSSFeeds() {
    try {
      return await this.client.get('/hot-topics/rss/feeds');
    } catch (error) {
      console.error('获取 RSS 源状态失败:', error);
      return {
        success: false,
        message: '获取 RSS 源状态失败'
      };
    }
  }

  async fetchRSSContent(url, keywords = []) {
    try {
      return await this.client.post('/hot-topics/rss/fetch', { url, keywords });
    } catch (error) {
      console.error('获取 RSS 内容失败:', error);
      return {
        success: false,
        message: '获取 RSS 内容失败'
      };
    }
  }

  // 推送通知相关
  async getNotificationChannels() {
    try {
      return await this.client.get('/hot-topics/notifications/channels');
    } catch (error) {
      console.error('获取推送渠道状态失败:', error);
      return {
        success: false,
        message: '获取推送渠道状态失败'
      };
    }
  }

  async sendNotification(topics, channels = ['wework']) {
    try {
      return await this.client.post('/hot-topics/notifications/send', { topics, channels });
    } catch (error) {
      console.error('发送通知失败:', error);
      return {
        success: false,
        message: '发送通知失败'
      };
    }
  }

  async testNotification(channel) {
    try {
      return await this.client.post('/hot-topics/notifications/test', { channel });
    } catch (error) {
      console.error('测试通知失败:', error);
      return {
        success: false,
        message: '测试通知失败'
      };
    }
  }

  // AI 分析相关
  async analyzeTopics(topics, options = {}) {
    try {
      return await this.client.post('/hot-topics/ai/analyze', { topics, options });
    } catch (error) {
      console.error('AI 分析失败:', error);
      return {
        success: false,
        message: 'AI 分析失败'
      };
    }
  }

  async generateBrief(topics, maxLength = 300, focus = 'important') {
    try {
      return await this.client.post('/hot-topics/ai/briefing', { topics, maxLength, focus });
    } catch (error) {
      console.error('生成简报失败:', error);
      return {
        success: false,
        message: '生成简报失败'
      };
    }
  }

  async checkAIHealth(provider) {
    try {
      const query = provider ? `?provider=${provider}` : '';
      return await this.client.get(`/hot-topics/ai/health${query}`);
    } catch (error) {
      console.error('AI 健康检查失败:', error);
      return {
        success: false,
        message: 'AI 健康检查失败'
      };
    }
  }

  async getAIProviders() {
    try {
      return await this.client.get('/hot-topics/ai/providers');
    } catch (error) {
      console.error('获取 AI 提供商列表失败:', error);
      return {
        success: false,
        message: '获取 AI 提供商列表失败'
      };
    }
  }

  async setDefaultAIProvider(providerId) {
    try {
      return await this.client.post('/hot-topics/ai/providers/default', { providerId });
    } catch (error) {
      console.error('设置默认提供商失败:', error);
      return {
        success: false,
        message: '设置默认提供商失败'
      };
    }
  }

  async translateContent(content, targetLanguage = 'English', provider) {
    try {
      return await this.client.post('/hot-topics/ai/translate', { content, targetLanguage, provider });
    } catch (error) {
      console.error('AI 翻译失败:', error);
      return {
        success: false,
        message: 'AI 翻译失败'
      };
    }
  }

  // Prompt 模板管理相关
  async getPromptTemplates(filters = {}) {
    try {
      const query = new URLSearchParams(filters).toString();
      return await this.client.get(`/hot-topics/prompts/templates?${query}`);
    } catch (error) {
      console.error('获取 Prompt 模板列表失败:', error);
      return {
        success: false,
        message: '获取 Prompt 模板列表失败'
      };
    }
  }

  async getPromptTemplate(id) {
    try {
      return await this.client.get(`/hot-topics/prompts/templates/${id}`);
    } catch (error) {
      console.error('获取 Prompt 模板失败:', error);
      return {
        success: false,
        message: '获取 Prompt 模板失败'
      };
    }
  }

  async createPromptTemplate(data) {
    try {
      return await this.client.post('/hot-topics/prompts/templates', data);
    } catch (error) {
      console.error('创建 Prompt 模板失败:', error);
      return {
        success: false,
        message: '创建 Prompt 模板失败'
      };
    }
  }

  async updatePromptTemplate(id, data) {
    try {
      return await this.client.put(`/hot-topics/prompts/templates/${id}`, data);
    } catch (error) {
      console.error('更新 Prompt 模板失败:', error);
      return {
        success: false,
        message: '更新 Prompt 模板失败'
      };
    }
  }

  async deletePromptTemplate(id) {
    try {
      return await this.client.delete(`/hot-topics/prompts/templates/${id}`);
    } catch (error) {
      console.error('删除 Prompt 模板失败:', error);
      return {
        success: false,
        message: '删除 Prompt 模板失败'
      };
    }
  }

  async renderPromptTemplate(id, variables) {
    try {
      return await this.client.post(`/hot-topics/prompts/templates/${id}/render`, { variables });
    } catch (error) {
      console.error('渲染 Prompt 模板失败:', error);
      return {
        success: false,
        message: '渲染 Prompt 模板失败'
      };
    }
  }

  async getPromptTemplateHistory(id, limit = 50) {
    try {
      return await this.client.get(`/hot-topics/prompts/templates/${id}/history?limit=${limit}`);
    } catch (error) {
      console.error('获取 Prompt 使用历史失败:', error);
      return {
        success: false,
        message: '获取 Prompt 使用历史失败'
      };
    }
  }

  async getPromptStats(days = 7) {
    try {
      return await this.client.get(`/hot-topics/prompts/stats?days=${days}`);
    } catch (error) {
      console.error('获取 Prompt 使用统计失败:', error);
      return {
        success: false,
        message: '获取 Prompt 使用统计失败'
      };
    }
  }

  async getPromptTags() {
    try {
      return await this.client.get('/hot-topics/prompts/tags');
    } catch (error) {
      console.error('获取 Prompt 标签列表失败:', error);
      return {
        success: false,
        message: '获取 Prompt 标签列表失败'
      };
    }
  }

  async getPromptCategories() {
    try {
      return await this.client.get('/hot-topics/prompts/categories');
    } catch (error) {
      console.error('获取 Prompt 分类列表失败:', error);
      return {
        success: false,
        message: '获取 Prompt 分类列表失败'
      };
    }
  }

  // 关键词匹配相关
  async validateKeywords(keywords) {
    try {
      return await this.client.post('/hot-topics/keywords/validate', { keywords });
    } catch (error) {
      console.error('关键词验证失败:', error);
      return {
        success: false,
        message: '关键词验证失败'
      };
    }
  }

  // 内容生成相关
  async generateContent(formData, type) {
    try {
      return await this.client.post('/content/generate', { formData, type });
    } catch (error) {
      console.error('生成内容失败:', error);
      return {
        success: false,
        message: '生成内容失败'
      };
    }
  }

  async getContents(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      return await this.client.get(`/content?${query}`);
    } catch (error) {
      console.error('获取内容列表失败:', error);
      return {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 1
        }
      };
    }
  }

  async getContent(id) {
    try {
      return await this.client.get(`/content/${id}`);
    } catch (error) {
      console.error('获取内容详情失败:', error);
      return {
        success: false,
        message: '获取内容详情失败'
      };
    }
  }

  async updateContent(id, data) {
    try {
      return await this.client.put(`/content/${id}`, data);
    } catch (error) {
      console.error('更新内容失败:', error);
      return {
        success: false,
        message: '更新内容失败'
      };
    }
  }

  async deleteContent(id) {
    try {
      return await this.client.delete(`/content/${id}`);
    } catch (error) {
      console.error('删除内容失败:', error);
      return {
        success: false,
        message: '删除内容失败'
      };
    }
  }

  // 数据分析相关 - 增加错误处理和默认值
  async getAnalyticsOverview() {
    try {
      const response = await this.client.get('/analytics/overview');
      // 确保返回数据格式正确
      return {
        success: true,
        data: response.data || {
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          avgEngagement: 0,
          growthRate: 0,
          todayTopics: 0,
          generatedContent: 0,
          publishedContent: 0,
          successRate: 0
        }
      };
    } catch (error) {
      console.error('获取分析概览失败:', error);
      // 返回默认数据而不是抛出错误
      return {
        success: true,
        data: {
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          avgEngagement: 0,
          growthRate: 0,
          todayTopics: 0,
          generatedContent: 0,
          publishedContent: 0,
          successRate: 0
        }
      };
    }
  }

  async getViewsTrend(days = 7) {
    try {
      const response = await this.client.get(`/analytics/views-trend?days=${days}`);
      // 确保返回数组格式
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('获取浏览量趋势失败:', error);
      return {
        success: true,
        data: []
      };
    }
  }

  async getContentTypeDistribution() {
    try {
      const response = await this.client.get('/analytics/content-types');
      // 确保返回数组格式
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('获取内容类型分布失败:', error);
      return {
        success: true,
        data: []
      };
    }
  }

  async getTopContent(limit = 10) {
    try {
      const response = await this.client.get(`/analytics/top-content?limit=${limit}`);
      // 确保返回数组格式
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('获取热门内容失败:', error);
      return {
        success: true,
        data: []
      };
    }
  }

  // 推荐机制相关API
  async getRecommendationInsights(contentId) {
    try {
      const response = await this.client.get(`/analytics/recommendation-insights?contentId=${contentId}`);
      return {
        success: true,
        data: response.data || {
          coldStartPerformance: 0,
          userEngagement: 0,
          contentQuality: 0,
          recommendationScore: 0,
          insights: []
        }
      };
    } catch (error) {
      console.error('获取推荐洞察失败:', error);
      return {
        success: true,
        data: {
          coldStartPerformance: 0,
          userEngagement: 0,
          contentQuality: 0,
          recommendationScore: 0,
          insights: []
        }
      };
    }
  }

  async getContentOptimizationSuggestions(contentId) {
    try {
      const response = await this.client.get(`/analytics/optimization-suggestions?contentId=${contentId}`);
      return {
        success: true,
        data: response.data || {
          titleOptimization: [],
          contentOptimization: [],
          timingOptimization: [],
          audienceOptimization: []
        }
      };
    } catch (error) {
      console.error('获取优化建议失败:', error);
      return {
        success: true,
        data: {
          titleOptimization: [],
          contentOptimization: [],
          timingOptimization: [],
          audienceOptimization: []
        }
      };
    }
  }

  // 认证相关
  async login(username, password) {
    try {
      const response = await this.client.post('/auth/login', { username, password });
      if (response.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response;
    } catch (error) {
      console.error('登录失败:', error);
      return {
        success: false,
        message: '登录失败'
      };
    }
  }

  async getMe() {
    try {
      return await this.client.get('/auth/me');
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        success: false,
        message: '获取用户信息失败'
      };
    }
  }

  logout() {
    localStorage.removeItem('token');
  }

  // 视频生成相关
  async getVideoTemplates() {
    if (USE_MOCK) {
      return {
        success: true,
        data: mockVideoTemplates
      };
    }
    try {
      const response = await this.client.get('/video/templates');
      return {
        success: true,
        data: response.data?.data || []
      };
    } catch (error) {
      console.error('获取视频模板失败:', error);
      return {
        success: true,
        data: mockVideoTemplates
      };
    }
  }

  async renderVideo(config) {
    if (USE_MOCK) {
      return {
        success: true,
        data: {
          taskId: 'mock-task-' + Date.now(),
          status: 'pending'
        }
      };
    }
    try {
      const response = await this.client.post('/video/render', config);
      return {
        success: true,
        data: response.data?.data
      };
    } catch (error) {
      console.error('提交渲染任务失败:', error);
      return {
        success: false,
        message: '提交渲染任务失败'
      };
    }
  }

  async getRenderStatus(taskId) {
    if (USE_MOCK) {
      return {
        success: true,
        data: {
          status: 'completed',
          progress: 100,
          videoUrl: 'https://example.com/mock-video.mp4'
        }
      };
    }
    try {
      const response = await this.client.get(`/video/render/${taskId}`);
      return {
        success: true,
        data: response.data?.data
      };
    } catch (error) {
      console.error('获取渲染状态失败:', error);
      return {
        success: false,
        message: '获取渲染状态失败'
      };
    }
  }

  // 工作流相关API
  async getWorkflows() {
    try {
      const response = await this.client.get('/contents/workflows');
      return {
        success: true,
        data: response.data?.data || []
      };
    } catch (error) {
      console.error('获取工作流列表失败:', error);
      return {
        success: false,
        message: '获取工作流列表失败'
      };
    }
  }

  async executeWorkflow(workflowId, context) {
    try {
      const response = await this.client.post('/contents/workflows/execute', { 
        workflowId, 
        context 
      });
      return response;
    } catch (error) {
      console.error('执行工作流失败:', error);
      return {
        success: false,
        message: '执行工作流失败'
      };
    }
  }

  async getWorkflowStats() {
    try {
      const response = await this.client.get('/contents/workflows/stats');
      return {
        success: true,
        data: response.data?.data || {}
      };
    } catch (error) {
      console.error('获取工作流统计失败:', error);
      return {
        success: false,
        message: '获取工作流统计失败'
      };
    }
  }

  // 内容管理相关API
  async createContent(contentData) {
    try {
      const response = await this.client.post('/contents', contentData);
      return response;
    } catch (error) {
      console.error('创建内容失败:', error);
      return {
        success: false,
        message: '创建内容失败'
      };
    }
  }

  async getContentList(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await this.client.get(`/contents?${query}`);
      return response;
    } catch (error) {
      console.error('获取内容列表失败:', error);
      return {
        success: false,
        message: '获取内容列表失败'
      };
    }
  }

  async getContentById(id) {
    try {
      const response = await this.client.get(`/contents/${id}`);
      return response;
    } catch (error) {
      console.error('获取内容详情失败:', error);
      return {
        success: false,
        message: '获取内容详情失败'
      };
    }
  }

  async updateContentStatus(id, status, reason = '') {
    try {
      const response = await this.client.post(`/contents/${id}/status`, { status, reason });
      return response;
    } catch (error) {
      console.error('更新内容状态失败:', error);
      return {
        success: false,
        message: '更新内容状态失败'
      };
    }
  }

  async publishContent(id, platform, options = {}) {
    try {
      const response = await this.client.post(`/contents/${id}/publish`, { platform, options });
      return response;
    } catch (error) {
      console.error('发布内容失败:', error);
      return {
        success: false,
        message: '发布内容失败'
      };
    }
  }

  async batchPublishContent(id, platforms, options = {}) {
    try {
      const response = await this.client.post(`/contents/${id}/publish/batch`, { platforms, options });
      return response;
    } catch (error) {
      console.error('批量发布内容失败:', error);
      return {
        success: false,
        message: '批量发布内容失败'
      };
    }
  }

  async getPublishStatus(id, platform) {
    try {
      const response = await this.client.get(`/contents/${id}/publish/${platform}/status`);
      return response;
    } catch (error) {
      console.error('获取发布状态失败:', error);
      return {
        success: false,
        message: '获取发布状态失败'
      };
    }
  }

  async getPerformanceReport(id) {
    try {
      const response = await this.client.get(`/contents/${id}/performance`);
      return response;
    } catch (error) {
      console.error('获取性能报告失败:', error);
      return {
        success: false,
        message: '获取性能报告失败'
      };
    }
  }

  async trackPerformance(id) {
    try {
      const response = await this.client.post(`/contents/${id}/performance/track`);
      return response;
    } catch (error) {
      console.error('追踪性能失败:', error);
      return {
        success: false,
        message: '追踪性能失败'
      };
    }
  }

  async generateAIContent(formData, type, options = {}) {
    try {
      const response = await this.client.post('/contents/generate', { formData, type, options });
      return response;
    } catch (error) {
      console.error('AI生成内容失败:', error);
      return {
        success: false,
        message: 'AI生成内容失败'
      };
    }
  }

  async batchGenerateAIContent(formDataList, type, options = {}) {
    try {
      const response = await this.client.post('/contents/generate/batch', { formDataList, type, options });
      return response;
    } catch (error) {
      console.error('批量AI生成内容失败:', error);
      return {
        success: false,
        message: '批量AI生成内容失败'
      };
    }
  }

  async analyzeVideoTranscript(transcript) {
    try {
      const response = await this.client.post('/contents/analyze-video', { transcript });
      return response;
    } catch (error) {
      console.error('分析视频转录失败:', error);
      return {
        success: false,
        message: '分析视频转录失败'
      };
    }
  }

  async generateVideoContent(analysis) {
    try {
      const response = await this.client.post('/contents/generate-video', { analysis });
      return response;
    } catch (error) {
      console.error('生成视频内容失败:', error);
      return {
        success: false,
        message: '生成视频内容失败'
      };
    }
  }

  async reviewContent(id, isApproved, comments = '') {
    try {
      const response = await this.client.post(`/contents/${id}/review`, { isApproved, comments });
      return response;
    } catch (error) {
      console.error('审核内容失败:', error);
      return {
        success: false,
        message: '审核内容失败'
      };
    }
  }

  async getContentStats(filters = {}) {
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await this.client.get(`/contents/stats?${query}`);
      return response;
    } catch (error) {
      console.error('获取内容统计失败:', error);
      return {
        success: false,
        message: '获取内容统计失败'
      };
    }
  }

  async getPerformanceRanking(metric = 'views', limit = 10) {
    try {
      const response = await this.client.get(`/contents/performance/ranking?metric=${metric}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('获取性能排行榜失败:', error);
      return {
        success: false,
        message: '获取性能排行榜失败'
      };
    }
  }

  async getPerformanceTrends(options = {}) {
    try {
      const query = new URLSearchParams(options).toString();
      const response = await this.client.get(`/contents/performance/trends?${query}`);
      return response;
    } catch (error) {
      console.error('获取性能趋势失败:', error);
      return {
        success: false,
        message: '获取性能趋势失败'
      };
    }
  }
}

export default new ApiClient();
