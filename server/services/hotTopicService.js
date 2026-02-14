const axios = require('axios');
const cheerio = require('cheerio');
const HotTopic = require('../models/HotTopic');

class HotTopicService {
  constructor() {
    this.sources = [
      {
        name: '微博热搜',
        url: 'https://weibo.com/ajax/side/hotSearch',
        type: 'api'
      },
      {
        name: '今日头条',
        url: 'https://www.toutiao.com/hot',
        type: 'scrape'
      },
      {
        name: '百度热搜',
        url: 'https://top.baidu.com/board',
        type: 'scrape'
      }
    ];
  }

  async fetchWeiboHotSearch() {
    try {
      const response = await axios.get(this.sources[0].url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const topics = response.data.data?.realtime || [];
      return topics.slice(0, 20).map((topic, index) => ({
        title: topic.word || topic.query,
        description: topic.word_zh || topic.query,
        category: this.categorizeTopic(topic.word || topic.query),
        heat: Math.max(1, 100 - index * 2),
        trend: this.getTrend(index),
        source: '微博热搜',
        sourceUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(topic.word || topic.query)}`,
        keywords: this.extractKeywords(topic.word || topic.query),
        suitability: this.calculateSuitability(topic.word || topic.query),
        publishedAt: new Date()
      }));
    } catch (error) {
      console.error('微博热搜抓取失败:', error.message);
      return [];
    }
  }

  async fetchToutiaoHot() {
    try {
      const response = await axios.get(this.sources[1].url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const topics = [];
      
      $('.hot-list-item').slice(0, 20).each((index, element) => {
        const title = $(element).find('.title').text().trim();
        const heat = parseInt($(element).find('.heat').text()) || (100 - index * 2);
        
        if (title) {
          topics.push({
            title,
            description: title,
            category: this.categorizeTopic(title),
            heat: Math.min(100, Math.max(1, heat)),
            trend: this.getTrend(index),
            source: '今日头条',
            sourceUrl: $(element).find('a').attr('href') || '',
            keywords: this.extractKeywords(title),
            suitability: this.calculateSuitability(title),
            publishedAt: new Date()
          });
        }
      });
      
      return topics;
    } catch (error) {
      console.error('今日头条抓取失败:', error.message);
      return [];
    }
  }

  async updateHotTopics() {
    try {
      const weiboTopics = await this.fetchWeiboHotSearch();
      const toutiaoTopics = await this.fetchToutiaoHot();
      
      const allTopics = [...weiboTopics, ...toutiaoTopics];
      
      // 保存到数据库
      for (const topic of allTopics) {
        await HotTopic.findOneAndUpdate(
          { title: topic.title, source: topic.source },
          topic,
          { upsert: true, new: true }
        );
      }
      
      console.log(`成功更新 ${allTopics.length} 个热点话题`);
      return allTopics;
    } catch (error) {
      console.error('热点更新失败:', error.message);
      throw error;
    }
  }

  categorizeTopic(title) {
    const categories = {
      '娱乐': ['电影', '明星', '综艺', '音乐', '电视剧', '娱乐'],
      '科技': ['AI', '人工智能', '科技', '互联网', '手机', '数码'],
      '财经': ['股市', '经济', '金融', '投资', '房价', '财经'],
      '体育': ['足球', '篮球', '奥运', '体育', '运动员'],
      '社会': ['社会', '民生', '政策', '教育', '医疗'],
      '国际': ['国际', '外交', '战争', '政治', '国家']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        return category;
      }
    }
    
    return '其他';
  }

  getTrend(index) {
    if (index < 5) return 'up';
    if (index > 15) return 'down';
    return 'stable';
  }

  extractKeywords(title) {
    const keywords = [];
    const commonWords = ['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这'];
    
    const words = title.split(/[\s,，。！？；：""''（）()【】《》\[\]]/);
    words.forEach(word => {
      if (word.length > 1 && !commonWords.includes(word)) {
        keywords.push(word);
      }
    });
    
    return keywords.slice(0, 5);
  }

  calculateSuitability(title) {
    let score = 50;
    
    // 根据标题特征调整适配度
    if (title.length > 10 && title.length < 50) score += 20;
    if (title.includes('？') || title.includes('!')) score += 10;
    if (title.includes('最新') || title.includes('突发')) score += 15;
    
    return Math.min(100, Math.max(0, score));
  }
}

module.exports = new HotTopicService();
