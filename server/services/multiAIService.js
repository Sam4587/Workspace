
const OpenAI = require('openai');
const axios = require('axios');

class MultiAIService {
  constructor() {
    this.models = {
      openai: {
        client: new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        }),
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
      throw new Error('没有可用的AI模型');
    }
    
    // 根据选项选择模型
    let selectedModel = options.model || 'openai';
    
    if (!availableModels.includes(selectedModel)) {
      selectedModel = availableModels[0]; // 使用第一个可用模型
    }
    
    // 尝试生成内容，如果失败则切换到下一个模型
    for (let i = 0; i < availableModels.length; i++) {
      try {
        const model = i === 0 ? selectedModel : availableModels[i];
        
        switch (model) {
          case 'openai':
            return await this.generateWithOpenAI(prompt, options);
          case 'baidu':
            return await this.generateWithBaidu(prompt, options);
          case 'xunfei':
            return await this.generateWithXunfei(prompt, options);
          default:
            continue;
        }
      } catch (error) {
        console.error(`模型 ${availableModels[i]} 生成失败:`, error.message);
        if (i === availableModels.length - 1) {
          throw error; // 所有模型都失败
        }
        continue; // 尝试下一个模型
      }
    }
  }
  
  // 获取可用模型列表
  getAvailableModels() {
    return Object.entries(this.models)
      .filter(([_, config]) => config.enabled)
      .map(([name, config]) => ({
        name,
        enabled: config.enabled
      }));
  }
}

module.exports = new MultiAIService();

