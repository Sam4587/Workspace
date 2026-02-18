const OpenAI = require('openai');
const axios = require('axios');
const { retryWithDefaults } = require('../utils/retry');

// 安全导入LLM模块
let llmGateway = null;
try {
  llmGateway = require('./llm');
  console.log('[MultiAIService] LLM Gateway 加载成功');
} catch (error) {
  console.warn('[MultiAIService] LLM Gateway 加载失败:', error.message);
  // 创建一个mock版本
  llmGateway = {
    generate: async (messages, options = {}) => {
      return {
        content: `模拟生成的内容：${messages[messages.length - 1]?.content || '默认内容'}`,
        model: 'mock-model',
        provider: 'mock'
      };
    },
    getAvailableProviders: () => [],
    getModels: () => []
  };
}

class MultiAIService {
  constructor() {
    // 安全初始化OpenAI客户端
    try {
      this.models = {
        openai: {
          client: process.env.OPENAI_API_KEY ? new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
          }) : null,
          enabled: !!process.env.OPENAI_API_KEY
        },
        baidu: {
          apiKey: process.env.BAIDU_API_KEY,
          secretKey: process.env.BAIDU_SECRET_KEY,
          enabled: !!(process.env.BAIDU_API_KEY && process.env.BAIDU_SECRET_KEY)
        },
        xunfei: {
          apiKey: process.env.XUNFEI_API_KEY,
          appId: process.env.XUNFEI_APP_ID,
          enabled: !!(process.env.XUNFEI_API_KEY && process.env.XUNFEI_APP_ID)
        }
      };
    } catch (error) {
      console.warn('[MultiAIService] OpenAI客户端初始化失败:', error.message);
      this.models = {
        openai: {
          client: null,
          enabled: false
        },
        baidu: {
          apiKey: process.env.BAIDU_API_KEY,
          secretKey: process.env.BAIDU_SECRET_KEY,
          enabled: !!(process.env.BAIDU_API_KEY && process.env.BAIDU_SECRET_KEY)
        },
        xunfei: {
          apiKey: process.env.XUNFEI_API_KEY,
          appId: process.env.XUNFEI_APP_ID,
          enabled: !!(process.env.XUNFEI_API_KEY && process.env.XUNFEI_APP_ID)
        }
      };
    }
    
    this.baiduToken = null;
    this.baiduTokenExpire = 0;
  }
  
  // 获取百度AI访问令牌
  async getBaiduToken() {
    if (this.baiduToken && Date.now() < this.baiduTokenExpire) {
      return this.baiduToken;
    }
    
    try {
      const response = await axios.post(
        'https://aip.baidubce.com/oauth/2.0/token',
        null,
        {
          params: {
            grant_type: 'client_credentials',
            client_id: this.models.baidu.apiKey,
            client_secret: this.models.baidu.secretKey
          }
        }
      );
      
      this.baiduToken = response.data.access_token;
      this.baiduTokenExpire = Date.now() + (response.data.expires_in - 300) * 1000;
      
      return this.baiduToken;
    } catch (error) {
      console.error('获取百度AI令牌失败:', error);
      throw new Error('获取百度AI令牌失败');
    }
  }
  
  // 调用OpenAI生成内容
  async generateWithOpenAI(prompt, options = {}) {
    if (!this.models.openai.client) {
      throw new Error('OpenAI客户端未初始化，缺少API密钥');
    }

    try {
      const response = await this.models.openai.client.chat.completions.create({
        model: options.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的今日头条内容创作者，擅长撰写高质量的文章、微头条、视频脚本等。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0
      });
      
      return {
        content: response.choices[0].message.content,
        usage: response.usage,
        model: response.model,
        provider: 'openai'
      };
    } catch (error) {
      console.error('OpenAI生成失败:', error);
      throw new Error('OpenAI生成失败: ' + error.message);
    }
  }
  
  // 调用百度AI生成内容
  async generateWithBaidu(prompt, options = {}) {
    try {
      const token = await this.getBaiduToken();
      
      const response = await axios.post(
        `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions`,
        {
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_output_tokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 1
        },
        {
          params: {
            access_token: token
          }
        }
      );
      
      return {
        content: response.data.result,
        usage: response.data.usage,
        model: response.data.model,
        provider: 'baidu'
      };
    } catch (error) {
      console.error('百度AI生成失败:', error);
      throw new Error('百度AI生成失败: ' + error.message);
    }
  }
  
  // 调用讯飞AI生成内容
  async generateWithXunfei(prompt, options = {}) {
    try {
      const response = await axios.post(
        'https://spark-api-open.xfyun.cn/v1/chat/completions',
        {
          model: 'general',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7,
          top_k: options.topK || 4
        },
        {
          headers: {
            'Authorization': `Bearer ${this.models.xunfei.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage,
        model: response.data.model,
        provider: 'xunfei'
      };
    } catch (error) {
      console.error('讯飞AI生成失败:', error);
      throw new Error('讯飞AI生成失败: ' + error.message);
    }
  }
  
  // 智能选择AI模型
  async generateContent(prompt, options = {}) {
    const availableModels = Object.entries(this.models)
      .filter(([_, config]) => config.enabled)
      .map(([name, _]) => name);
    
    if (availableModels.length === 0) {
      return await this.generateWithFreeLLM(prompt, options);
    }
    
    let selectedModel = options.model || 'openai';
    
    if (!availableModels.includes(selectedModel)) {
      selectedModel = availableModels[0];
    }
    
    for (let i = 0; i < availableModels.length; i++) {
      try {
        const model = i === 0 ? selectedModel : availableModels[i];
        
        const result = await retryWithDefaults(
          async () => {
            switch (model) {
              case 'openai':
                if (this.models.openai.client) {
                  return await this.generateWithOpenAI(prompt, options);
                }
                break;
              case 'baidu':
                return await this.generateWithBaidu(prompt, options);
              case 'xunfei':
                return await this.generateWithXunfei(prompt, options);
              default:
                throw new Error(`Unknown model: ${model}`);
            }
            throw new Error(`Model ${model} not available`);
          },
          {
            maxRetries: 2,
            onRetry: (attempt, error) => {
              console.warn(`[MultiAIService] ${model} 重试 ${attempt}: ${error.message}`);
            }
          }
        );
        
        if (result) return result;
      } catch (error) {
        console.error(`模型 ${availableModels[i]} 生成失败:`, error.message);
        if (i === availableModels.length - 1) {
          // 所有付费模型都失败，尝试免费 LLM
          try {
            return await this.generateWithFreeLLM(prompt, options);
          } catch (llmError) {
            throw error; // 抛出原始错误
          }
        }
        continue; // 尝试下一个模型
      }
    }
  }

  // 使用免费 LLM 生成内容
  async generateWithFreeLLM(prompt, options = {}) {
    if (!llmGateway) {
      // 如果LLM网关也不可用，返回模拟内容
      return {
        content: `模拟生成的内容：${prompt.substring(0, 100)}...`,
        model: 'mock-model',
        provider: 'mock'
      };
    }

    const messages = [
      {
        role: 'system',
        content: '你是一个专业的今日头条内容创作者，擅长撰写高质量的文章、微头条、视频脚本等。'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const result = await llmGateway.generate(messages, options);
      return {
        content: result.content,
        model: result.model,
        provider: result.provider
      };
    } catch (error) {
      console.error('免费LLM生成失败:', error);
      // 返回模拟内容
      return {
        content: `模拟生成的内容：${prompt.substring(0, 100)}...`,
        model: 'mock-model',
        provider: 'mock'
      };
    }
  }
  
  // 获取可用模型列表
  getAvailableModels() {
    const models = Object.entries(this.models)
      .filter(([_, config]) => config.enabled)
      .map(([name, config]) => ({
        name,
        enabled: config.enabled,
        type: 'paid'
      }));
    
    // 添加免费 LLM 提供商
    try {
      if (llmGateway) {
        const freeLLMs = llmGateway.getAvailableProviders();
        freeLLMs.forEach(provider => {
          models.push({
            name: provider.name,
            enabled: true,
            type: 'free'
          });
        });
      }
    } catch (error) {
      console.warn('Failed to get free LLM providers:', error.message);
    }
    
    return models;
  }
}

module.exports = new MultiAIService();