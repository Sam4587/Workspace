/**
 * 微信公众号平台实现
 * 支持图文消息发布、草稿管理、素材管理
 */

const logger = require('../../utils/logger');

class WechatPlatform {
  constructor() {
    this.id = 'wechat';
    this.name = '微信公众号';
    this.loginRequired = true;
    this.features = ['article', 'image', 'video'];
    this.maxImages = 20;
    this.maxVideoSize = 100;
    this.isLoggedIn = false;
    
    this.config = {
      appId: process.env.WECHAT_APP_ID,
      appSecret: process.env.WECHAT_APP_SECRET,
      baseUrl: 'https://api.weixin.qq.com/cgi-bin'
    };
    
    this.accessToken = null;
    this.tokenExpiresAt = null;
  }

  async login(options = {}) {
    if (!this.config.appId || !this.config.appSecret) {
      return {
        success: false,
        error: '未配置微信公众号AppID或AppSecret',
        hint: '请在环境变量中设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET'
      };
    }

    try {
      const token = await this.getAccessToken();
      return {
        success: true,
        data: {
          method: 'service_account',
          message: '微信公众号服务号已授权',
          expiresIn: 7200
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const axios = require('axios');
    const url = `${this.config.baseUrl}/token?grant_type=client_credential&appid=${this.config.appId}&secret=${this.config.appSecret}`;
    
    const response = await axios.get(url);
    
    if (response.data.errcode) {
      throw new Error(`获取AccessToken失败: ${response.data.errmsg}`);
    }
    
    this.accessToken = response.data.access_token;
    this.tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;
    
    logger.info('[WechatPlatform] AccessToken获取成功');
    return this.accessToken;
  }

  async checkLogin() {
    try {
      if (!this.config.appId || !this.config.appSecret) {
        return {
          isLoggedIn: false,
          message: '未配置微信公众号凭证'
        };
      }
      
      await this.getAccessToken();
      this.isLoggedIn = true;
      
      return {
        isLoggedIn: true,
        message: '已授权'
      };
    } catch (error) {
      return {
        isLoggedIn: false,
        message: error.message
      };
    }
  }

  async publish(content, options = {}) {
    this.validateContent(content);
    
    logger.info('[WechatPlatform] 开始发布到微信公众号...');
    
    try {
      const token = await this.getAccessToken();
      
      const articleData = {
        articles: [{
          title: content.title,
          author: content.author || '',
          digest: content.digest || content.summary || content.content.substring(0, 120),
          content: this.formatContent(content.content),
          content_source_url: content.sourceUrl || '',
          need_open_comment: content.enableComment ? 1 : 0,
          only_fans_can_comment: content.onlyFansComment ? 1 : 0,
          thumb_media_id: content.thumbMediaId || ''
        }]
      };

      if (options.draft) {
        const result = await this.createDraft(token, articleData);
        return {
          id: result.media_id,
          platform: this.id,
          title: content.title,
          status: 'draft',
          mediaId: result.media_id,
          message: '草稿创建成功'
        };
      }

      const draftResult = await this.createDraft(token, articleData);
      const publishResult = await this.publishDraft(token, draftResult.media_id);
      
      return {
        id: publishResult.publish_id,
        platform: this.id,
        title: content.title,
        status: 'published',
        msgDataId: publishResult.msg_data_id,
        publishId: publishResult.publish_id,
        publishedAt: new Date().toISOString(),
        message: '发布成功'
      };
    } catch (error) {
      logger.error('[WechatPlatform] 发布失败', { error: error.message });
      throw error;
    }
  }

  async createDraft(token, articleData) {
    const axios = require('axios');
    const url = `${this.config.baseUrl}/draft/add?access_token=${token}`;
    
    const response = await axios.post(url, articleData);
    
    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(`创建草稿失败: ${response.data.errmsg}`);
    }
    
    return response.data;
  }

  async publishDraft(token, mediaId) {
    const axios = require('axios');
    const url = `${this.config.baseUrl}/freepublish/submit?access_token=${token}`;
    
    const response = await axios.post(url, { media_id: mediaId });
    
    if (response.data.errcode && response.data.errcode !== 0) {
      throw new Error(`发布失败: ${response.data.errmsg}`);
    }
    
    return response.data;
  }

  async uploadImage(imagePath, options = {}) {
    const token = await this.getAccessToken();
    const axios = require('axios');
    const FormData = require('form-data');
    const fs = require('fs');
    
    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath));
    form.append('type', options.type || 'thumb');
    
    const url = `${this.config.baseUrl}/material/add_material?access_token=${token}&type=${options.type || 'image'}`;
    
    const response = await axios.post(url, form, {
      headers: form.getHeaders()
    });
    
    if (response.data.errcode) {
      throw new Error(`上传图片失败: ${response.data.errmsg}`);
    }
    
    return {
      mediaId: response.data.media_id,
      url: response.data.url
    };
  }

  async getMaterialList(type = 'news', offset = 0, count = 20) {
    const token = await this.getAccessToken();
    const axios = require('axios');
    const url = `${this.config.baseUrl}/material/batchget_material?access_token=${token}`;
    
    const response = await axios.post(url, {
      type,
      offset,
      count
    });
    
    return response.data;
  }

  validateContent(content) {
    if (!content.title || content.title.trim().length === 0) {
      throw new Error('标题不能为空');
    }
    
    if (content.title.length > 64) {
      throw new Error('标题长度不能超过64个字符');
    }
    
    if (!content.content || content.content.trim().length === 0) {
      throw new Error('内容不能为空');
    }
    
    if (content.digest && content.digest.length > 120) {
      throw new Error('摘要长度不能超过120个字符');
    }
  }

  formatContent(content) {
    return content
      .replace(/\n/g, '<br/>')
      .replace(/#{1,6}\s+(.+)/g, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  }

  getConfig() {
    return {
      id: this.id,
      name: this.name,
      features: this.features,
      maxImages: this.maxImages,
      maxVideoSize: this.maxVideoSize,
      loginRequired: this.loginRequired,
      configured: !!(this.config.appId && this.config.appSecret)
    };
  }

  async getStats() {
    try {
      const token = await this.getAccessToken();
      const axios = require('axios');
      const url = `${this.config.baseUrl}/user/get?access_token=${token}`;
      
      const response = await axios.post(url, {
        begin_openid: '',
        lang: 'zh_CN'
      });
      
      return {
        totalUsers: response.data.total,
        count: response.data.count
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }
}

module.exports = WechatPlatform;
