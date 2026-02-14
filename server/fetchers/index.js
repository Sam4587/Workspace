/**
 * 数据抓取器入口
 * 统一导出所有 Fetcher 相关模块
 */

const BaseFetcher = require('./BaseFetcher');
const WeiboFetcher = require('./WeiboFetcher');
const ToutiaoFetcher = require('./ToutiaoFetcher');
const ZhihuFetcher = require('./ZhihuFetcher');
const RSSFetcher = require('./RSSFetcher');
const { FetcherManager, fetcherManager } = require('./FetcherManager');

module.exports = {
  // 基类
  BaseFetcher,

  // 具体 Fetcher 实现
  WeiboFetcher,
  ToutiaoFetcher,
  ZhihuFetcher,
  RSSFetcher,

  // 管理器
  FetcherManager,
  fetcherManager
};
