/**
 * NewsNow API 数据抓取器
 * 使用 NewsNow 统一 API 获取多平台热点数据
 * 参考 TrendRadar 数据源配置
 *
 * 当 NewsNow API 不可用时，回退到现有 fetchers
 */

const axios = require('axios');
const BaseFetcher = require('./BaseFetcher');
const logger = require('../utils/logger');
const { SourceType, Source, Category, Trend } = require('../core/types');

// 引入现有 fetchers 作为备用
const WeiboFetcher = require('./WeiboFetcher');
const ZhihuFetcher = require('./ZhihuFetcher');
const ToutiaoFetcher = require('./ToutiaoFetcher');
const BaiduFetcher = require('./BaiduFetcher');
const DouyinFetcher = require('./DouyinFetcher');
const BilibiliFetcher = require('./BilibiliFetcher');
const TiebaFetcher = require('./TiebaFetcher');
const ThepaperFetcher = require('./ThepaperFetcher');
const IfengFetcher = require('./IfengFetcher');
const WallstreetcnFetcher = require('./WallstreetcnFetcher');
const ClsFetcher = require('./ClsFetcher');

// NewsNow API 基础地址
const NEWSNOW_API_BASE = 'https://newsnow.busiyi.world/api/s';

// NewsNow 平台 ID 映射
const NEWSNOW_SOURCE_MAP = {
  // 社交媒体
  weibo: { name: '微博热搜', source: Source.WEIBO, fetcher: WeiboFetcher },
  zhihu: { name: '知乎热榜', source: Source.ZHIHU, fetcher: ZhihuFetcher },
  tieba: { name: '贴吧热议', source: Source.OTHER, fetcher: TiebaFetcher },

  // 新闻资讯
  toutiao: { name: '今日头条', source: Source.TOUTIAO, fetcher: ToutiaoFetcher },
  baidu: { name: '百度热搜', source: Source.BAIDU, fetcher: BaiduFetcher },
  thepaper: { name: '澎湃新闻', source: Source.OTHER, fetcher: ThepaperFetcher },
  ifeng: { name: '凤凰网', source: Source.OTHER, fetcher: IfengFetcher },

  // 视频平台
  douyin: { name: '抖音热搜', source: Source.DOUYIN, fetcher: DouyinFetcher },
  'bilibili-hot-search': { name: 'B站热搜', source: Source.BILIBILI, fetcher: BilibiliFetcher },

  // 财经类
  'wallstreetcn-hot': { name: '华尔街见闻', source: Source.OTHER, fetcher: WallstreetcnFetcher },
  'cls-hot': { name: '财联社热门', source: Source.OTHER, fetcher: ClsFetcher }
};

class NewsNowFetcher extends BaseFetcher {
  /**
   * @param {Object} options
   * @param {string} [options.sourceId] - 单个数据源 ID
   * @param {string[]} [options.sourceIds] - 多个数据源 ID 列表
   * @param {number} [options.maxItems] - 每个源最大条数
   */
  constructor(options = {}) {
    super({
      name: 'NewsNowFetcher',
      url: NEWSNOW_API_BASE,
      type: SourceType.API,
      timeout: 20000,
      cacheTTL: 1800 // 30 分钟缓存
    });

    this.maxItems = options.maxItems || 50;
    this.axiosInstance = axios.create({
      baseURL: NEWSNOW_API_BASE,
      timeout: this.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    // 确定要抓取的数据源
    if (options.sourceId) {
      this.sourceIds = [options.sourceId];
    } else if (options.sourceIds && options.sourceIds.length > 0) {
      this.sourceIds = options.sourceIds;
    } else {
      // 默认抓取所有支持的数据源
      this.sourceIds = Object.keys(NEWSNOW_SOURCE_MAP);
    }
  }

  /**
   * 从 NewsNow API 获取单个数据源的热点
   * @param {string} sourceId - 数据源 ID
   * @returns {Promise<Object[]>}
   */
  async fetchFromSource(sourceId) {
    const cacheKey = `newsnow-${sourceId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // 首先尝试 NewsNow API
    try {
      const response = await this.fetchWithRetry(async () => {
        return await this.axiosInstance.get('', {
          params: { source: sourceId }
        });
      });

      // 检查是否返回有效 JSON 数据（而非被 Cloudflare 拦截的 HTML）
      const contentType = response.headers?.['content-type'] || '';
      if (!contentType.includes('application/json') || typeof response.data === 'string') {
        logger.warn(`[NewsNow] 数据源 ${sourceId} 返回非 JSON 响应，可能被 Cloudflare 拦截`);
        throw new Error('Cloudflare block detected');
      }

      if (!response.data || response.data.code !== 200) {
        logger.warn(`[NewsNow] 数据源 ${sourceId} 返回异常: ${response.data?.message || '未知错误'}`);
        throw new Error(response.data?.message || 'API error');
      }

      const items = response.data.data || [];
      this.setCache(cacheKey, items);
      logger.info(`[NewsNow] 数据源 ${sourceId} 获取 ${items.length} 条数据`);

      return items;
    } catch (error) {
      logger.warn(`[NewsNow] 数据源 ${sourceId} API 获取失败: ${error.message}，尝试使用备用 fetcher`);

      // 回退到现有 fetcher
      return await this.fetchFromFallback(sourceId);
    }
  }

  /**
   * 使用备用 fetcher 获取数据
   * @param {string} sourceId - 数据源 ID
   * @returns {Promise<Object[]>}
   */
  async fetchFromFallback(sourceId) {
    const sourceInfo = NEWSNOW_SOURCE_MAP[sourceId];

    if (!sourceInfo || !sourceInfo.fetcher) {
      logger.warn(`[NewsNow] 数据源 ${sourceId} 没有可用的备用 fetcher`);
      return [];
    }

    try {
      const FetcherClass = sourceInfo.fetcher;
      const fetcher = new FetcherClass();
      const topics = await fetcher.fetch();

      // 转换为 NewsNow 数据格式，保留原有的 category 字段
      const items = topics.map((topic, index) => ({
        title: topic.title,
        url: topic.sourceUrl || '',
        hot: topic.heat,
        pub_date: topic.publishedAt?.toISOString() || new Date().toISOString(),
        source: sourceId,
        sourceName: sourceInfo.name,
        category: topic.category
      }));

      logger.info(`[NewsNow] 使用备用 fetcher 获取 ${sourceId} 数据: ${items.length} 条`);
      return items;
    } catch (error) {
      logger.error(`[NewsNow] 备用 fetcher ${sourceId} 也失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 将 NewsNow 数据转换为标准 HotTopic 格式
   * @param {Object} item - NewsNow 数据项
   * @param {string} sourceId - 数据源 ID
   * @param {number} index - 排序索引
   * @returns {Object}
   */
  transformItem(item, sourceId, index) {
    const sourceInfo = NEWSNOW_SOURCE_MAP[sourceId] || { name: '未知来源', source: Source.OTHER };

    // 优先使用数据中携带的 sourceName（来自备用 fetcher）
    const sourceName = item.sourceName || sourceInfo.name;

    return {
      title: item.title?.trim() || '',
      description: item.title || '',
      category: item.category || this.categorizeTopic(item.title || ''),
      heat: this.calculateHeat(item, index),
      trend: this.getTrend(index),
      source: sourceName,
      sourceId: sourceId,
      sourceUrl: item.url || '',
      originalUrl: item.url || '',
      keywords: this.extractKeywords(item.title || ''),
      suitability: this.calculateSuitability(item.title || ''),
      publishedAt: item.pub_date ? new Date(item.pub_date) : new Date(),
      extra: {
        hotValue: item.hot || null,
        originTitle: item.origin_title || null
      }
    };
  }

  /**
   * 计算热度值 (0-100)
   */
  calculateHeat(item, index) {
    // 如果有热度值，尝试转换为 0-100 范围
    if (item.hot) {
      const hotValue = parseInt(item.hot) || 0;
      if (hotValue > 0) {
        // 对数缩放
        return Math.min(100, Math.max(1, Math.floor(10 + Math.log10(hotValue) * 15)));
      }
    }
    // 默认按排名计算
    return Math.max(1, 100 - index * 3);
  }

  /**
   * 分类话题
   */
  categorizeTopic(title) {
    const categories = {
      [Category.ENTERTAINMENT]: [
        '电影', '明星', '综艺', '音乐', '电视剧', '娱乐', '演员', '歌手', '票房',
        '动画', '动漫', '游戏', '电竞', '手游', '网游', '单机', '视频', 'B站', '抖音',
        '热搜', '热榜', '八卦', '绯闻', '恋情', '结婚', '离婚', '出轨', '道歉', '声明',
        '直播', '网红', '博主', 'UP主', '粉丝', '应援', '打榜', '应援', '应援会'
      ],
      [Category.TECH]: [
        'AI', '人工智能', '科技', '互联网', '手机', '数码', '芯片', '软件', 'APP',
        '华为', '苹果', '小米', 'OPPO', 'vivo', '三星', '腾讯', '阿里', '百度', '字节',
        '5G', '6G', '云计算', '大数据', '区块链', '元宇宙', 'VR', 'AR', '自动驾驶',
        '新能源', '电动车', '电池', '充电', '光伏', '风电', '半导体', '集成电路',
        'CPU', 'GPU', '处理器', '显卡', '内存', '硬盘', '电脑', '笔记本', '平板',
        '评测', '开箱', '体验', '上手', '测评', '对比', '横评'
      ],
      [Category.FINANCE]: [
        '股市', '经济', '金融', '投资', '房价', '财经', '股票', '基金', '银行', '利率',
        '楼市', '房产', '购房', '房贷', '贷款', '降息', '加息', '通胀', '通缩', 'CPI',
        'GDP', '就业', '失业', '收入', '工资', '薪酬', '加薪', '降薪', '裁员', '破产',
        'A股', '港股', '美股', '牛市', '熊市', '涨停', '跌停', '开盘', '收盘', '熔断',
        '汇率', '人民币', '美元', '欧元', '日元', '英镑', '外汇', '外贸', '进出口',
        '债券', '国债', '企业债', '理财', '保险', '信托', '期货', '期权', '黄金', '白银'
      ],
      [Category.SPORTS]: [
        '足球', '篮球', '奥运', '体育', '运动员', 'NBA', '世界杯', '比赛', '联赛',
        '梅西', 'C罗', '詹姆斯', '姚明', '易建联', '孙颖莎', '樊振东', '全红婵',
        '欧冠', '英超', '西甲', '意甲', '德甲', '中超', 'CBA', '亚运会', '世锦赛',
        '网球', '羽毛球', '乒乓球', '游泳', '田径', '体操', '跳水', '举重', '摔跤',
        '滑雪', '滑冰', '冰球', '足球赛', '篮球赛', '运动会', '锦标赛', '冠军', '亚军',
        '决赛', '半决赛', '八强', '四强', '晋级', '淘汰', '夺冠', '卫冕', '败北', '失利'
      ],
      [Category.SOCIETY]: [
        '社会', '民生', '政策', '教育', '医疗', '学校', '高考', '就业',
        '政府', '市委', '省委', '国务院', '发改委', '教育部', '卫健委', '公安部',
        '新闻', '通报', '公告', '通知', '通告', '公示', '辟谣', '澄清', '声明',
        '疫情', '病毒', '疫苗', '口罩', '核酸', '抗原', '隔离', '封控', '解封',
        '交通事故', '火灾', '地震', '洪水', '台风', '暴雨', '干旱', '灾害', '救援',
        '婚丧嫁娶', '彩礼', '婚礼', '离婚', '再婚', '生育', '二胎', '三胎', '出生率',
        '养老', '退休', '养老金', '社保', '医保', '公积金', '低保', '五保', '扶贫',
        '城管', '交警', '警察', '民警', '辅警', '消防员', '医生', '护士', '教师',
        '农民工', '外卖员', '快递员', '网约车', '出租车', '公交车', '地铁', '高铁',
        '火车票', '机票', '酒店', '民宿', '旅游', '景区', '景点', '公园', '广场'
      ],
      [Category.INTERNATIONAL]: [
        '国际', '外交', '战争', '政治', '国家', '美国', '俄罗斯', '欧盟',
        '中国', '日本', '韩国', '朝鲜', '印度', '越南', '菲律宾', '马来西亚', '新加坡',
        '英国', '法国', '德国', '意大利', '西班牙', '加拿大', '澳大利亚', '新西兰',
        '以色列', '巴勒斯坦', '乌克兰', '中东', '北约', 'G7', 'G20', '联合国',
        '总统', '总理', '首相', '国王', '女王', '元首', '领导人', '访华', '出访',
        '建交', '断交', '军演', '导弹', '航母', '战机', '坦克', '核武器', '核试验',
        '贸易战', '制裁', '关税', 'WTO', '世界银行', 'IMF', '亚投行', '金砖国家',
        '一带一路', '上合组织', '东盟', '非盟', '阿盟', '海合会', '欧佩克', 'OPEC'
      ]
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => title.includes(keyword))) {
        return category;
      }
    }

    return Category.OTHER;
  }

  /**
   * 获取趋势
   */
  getTrend(index) {
    if (index < 5) return Trend.UP;
    if (index > 15) return Trend.DOWN;
    return Trend.STABLE;
  }

  /**
   * 提取关键词
   */
  extractKeywords(title) {
    const stopWords = new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那']);

    const words = title.split(/[\s,，。！？；：""''（）()【】《》\[\]\/\\]/);
    return words
      .filter(word => word.length > 1 && !stopWords.has(word))
      .slice(0, 5);
  }

  /**
   * 计算适配度
   */
  calculateSuitability(title) {
    let score = 50;

    // 标题长度适中
    if (title.length >= 10 && title.length <= 50) score += 20;

    // 包含疑问或感叹
    if (title.includes('？') || title.includes('!')) score += 10;

    // 包含时效性词汇
    if (title.includes('最新') || title.includes('突发') || title.includes('刚刚')) score += 15;

    // 包含数字
    if (/\d+/.test(title)) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 抓取所有配置的数据源
   * @returns {Promise<Object[]>}
   */
  async fetch() {
    const allTopics = [];

    // 并行抓取所有数据源
    const fetchPromises = this.sourceIds.map(async (sourceId) => {
      const items = await this.fetchFromSource(sourceId);
      return items
        .slice(0, this.maxItems)
        .map((item, index) => this.transformItem(item, sourceId, index));
    });

    const results = await Promise.allSettled(fetchPromises);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allTopics.push(...result.value);
      }
    }

    // 验证并过滤无效数据
    const validTopics = allTopics.filter(topic => {
      const validated = this.validateTopic(topic);
      if (!validated.valid) {
        logger.debug(`[NewsNow] 跳过无效话题: ${validated.error}`);
        return false;
      }
      return true;
    });

    logger.info(`[NewsNow] 共获取 ${validTopics.length} 条有效热点数据`);

    return validTopics;
  }

  /**
   * 获取单个数据源的热点（便捷方法）
   * @param {string} sourceId - 数据源 ID
   * @returns {Promise<Object[]>}
   */
  async fetchSource(sourceId) {
    const items = await this.fetchFromSource(sourceId);
    return items
      .slice(0, this.maxItems)
      .map((item, index) => this.transformItem(item, sourceId, index));
  }

  /**
   * 获取支持的数据源列表
   * @returns {Object[]}
   */
  getSupportedSources() {
    return Object.entries(NEWSNOW_SOURCE_MAP).map(([id, info]) => ({
      id,
      name: info.name,
      enabled: this.sourceIds.includes(id)
    }));
  }
}

// 创建默认实例（获取所有数据源）
const newsNowFetcher = new NewsNowFetcher();

module.exports = {
  NewsNowFetcher,
  newsNowFetcher,
  NEWSNOW_SOURCE_MAP
};
