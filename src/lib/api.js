import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    try {
      const query = new URLSearchParams(params).toString();
      const response = await this.client.get(`/hot-topics?${query}`);
      // 确保返回数据格式正确
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
      // 返回默认数据而不是抛出错误
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
    try {
      return await this.client.get(`/hot-topics/trends/new?hours=${hours}`);
    } catch (error) {
      console.error('获取新增热点失败:', error);
      return {
        success: true,
        data: []
      };
    }
  }

  async getTopicTrend(id, days = 7) {
    try {
      return await this.client.get(`/hot-topics/trends/timeline/${id}?days=${days}`);
    } catch (error) {
      console.error('获取热点趋势失败:', error);
      return {
        success: false,
        message: '获取热点趋势失败'
      };
    }
  }

  async getCrossPlatformAnalysis(title) {
    try {
      return await this.client.get(`/hot-topics/trends/cross-platform/${encodeURIComponent(title)}`);
    } catch (error) {
      console.error('获取跨平台分析失败:', error);
      return {
        success: false,
        message: '获取跨平台分析失败'
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

  async checkAIHealth() {
    try {
      return await this.client.get('/hot-topics/ai/health');
    } catch (error) {
      console.error('AI 健康检查失败:', error);
      return {
        success: false,
        message: 'AI 健康检查失败'
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

  // 发布相关
  async publishToToutiao(contentId, scheduledTime) {
    try {
      return await this.client.post('/publish/toutiao', { contentId, scheduledTime });
    } catch (error) {
      console.error('发布到今日头条失败:', error);
      return {
        success: false,
        message: '发布到今日头条失败'
      };
    }
  }

  async getPublishQueue(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      return await this.client.get(`/publish/queue?${query}`);
    } catch (error) {
      console.error('获取发布队列失败:', error);
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

  async getPublishHistory(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      return await this.client.get(`/publish/history?${query}`);
    } catch (error) {
      console.error('获取发布历史失败:', error);
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
}

export default new ApiClient();
