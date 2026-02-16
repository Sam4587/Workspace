const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

class RSSService {
  constructor() {
    this.axiosInstance = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
  }

  async fetchRSSFeed(url) {
    try {
      const response = await this.axiosInstance.get(url, {
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data, 'binary');
      const charset = response.headers['content-type']?.includes('gbk') ? 'gbk' : 'utf-8';
      const html = buffer.toString(charset);

      const $ = cheerio.load(html);

      const items = [];
      $('item, entry').each((index, element) => {
        const $element = $(element);

        const title = $element.find('title').first().text().trim();
        const link = $element.find('link, guid').first().attr('href') ||
                   $element.find('link').first().text().trim();
        const description = $element.find('description, content, summary').first().text().trim();
        const pubDate = $element.find('pubDate, published, updated').first().text().trim();
        const category = $element.find('category').first().text().trim();

        if (title && title.length > 0) {
          items.push({
            title,
            link,
            description,
            pubDate: pubDate ? new Date(pubDate) : new Date(),
            category: category || '其他'
          });
        }
      });

      logger.info(`RSS 源 ${url} 获取 ${items.length} 条数据`);
      return items;
    } catch (error) {
      logger.error(`RSS 源 ${url} 获取失败`, { error: error.message });
      return [];
    }
  }

  async fetchMultipleRSSFeeds(urls) {
    const results = await Promise.allSettled(
      urls.map(url => this.fetchRSSFeed(url))
    );

    const allItems = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
        logger.debug(`RSS 源 ${index} 成功获取 ${result.value.length} 条`);
      } else {
        logger.warn(`RSS 源 ${index} 获取失败: ${result.reason?.message || '未知错误'}`);
      }
    });

    return allItems;
  }

  filterItemsByKeywords(items, keywords) {
    if (!keywords || keywords.length === 0) {
      return items;
    }

    return items.filter(item => {
      const title = item.title.toLowerCase();
      const description = item.description.toLowerCase();

      const match = keywords.some(keyword => {
        const kw = keyword.toLowerCase();
        const mustWords = [];
        const excludeWords = [];

        keyword.split('+').forEach(part => {
          const trimmed = part.trim();
          if (trimmed.startsWith('!')) {
            excludeWords.push(trimmed.slice(1));
          } else {
            mustWords.push(trimmed);
          }
        });

        const hasMust = mustWords.every(w => title.includes(w));
        const hasExclude = excludeWords.some(w => title.includes(w));

        return hasMust && !hasExclude;
      });

      return match;
    });

    logger.info(`关键词过滤: ${items.length} -> ${filteredItems.length} 条`);
    return filteredItems;
  }

  async getRSSStats(feeds) {
    const stats = {};

    for (const feed of feeds) {
      try {
        const items = await this.fetchRSSFeed(feed.url);
        stats[feed.name] = {
          name: feed.name,
          category: feed.category,
          itemCount: items.length,
          latestUpdate: items.length > 0 ? items[0].pubDate : null,
          enabled: feed.enabled
        };
      } catch (error) {
        stats[feed.name] = {
          name: feed.name,
          category: feed.category,
          itemCount: 0,
          latestUpdate: null,
          error: error.message
        };
      }
    }

    return stats;
  }
}

module.exports = new RSSService();
