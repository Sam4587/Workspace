# 热点监控模块 Mock 数据问题修复记录

## 问题概述

**发现时间**: 2026-02-16  
**问题模块**: 热点监控 (Hot Topics Monitoring)  
**严重程度**: 高 - 影响核心功能

### 问题表现

前端热点监控页面显示的是硬编码的模拟数据，而非来自 NewsNow API 的真实热点数据。用户无法获取真实的微博、知乎、今日头条等平台的热点信息。

## 问题根因分析

### 1. 后端硬编码 Mock 数据

**文件**: `server/server.js` (第 39-118 行)

原代码直接在文件中定义了 6 条硬编码的模拟数据：

```javascript
let cachedTopics = [
  {
    _id: '1',
    title: 'AI大模型技术突破：GPT-5即将发布',
    description: 'OpenAI宣布即将发布新一代大模型...',
    // ... 更多硬编码数据
  },
  // ... 共 6 条假数据
];
```

**问题**: 这些数据是静态的、虚假的，与真实热点无关。

### 2. 前端静默回退到 Mock 数据

**文件**: `src/lib/api.js` (第 76-88 行)

原代码在 API 调用失败时，静默返回 mock 数据：

```javascript
} catch (error) {
  console.error('获取热点话题失败:', error);
  return {
    success: true,  // 错误地返回 success: true
    data: mockHotTopics,  // 返回假数据
    pagination: {...}
  };
}
```

**问题**: 
- 用户无法感知数据获取失败
- `success: true` 误导前端认为请求成功
- 假数据让用户误以为系统正常工作

### 3. Logger 导入错误

**影响文件**: 40+ 个文件

错误写法：
```javascript
const { logger } = require('../utils/logger');
```

正确写法：
```javascript
const logger = require('../utils/logger');
```

**问题**: `logger.js` 导出的是 logger 实例本身，不是包含 logger 属性的对象。

## 修复方案

### 修复 1: 后端使用真实数据源

**文件**: `server/server.js`

移除硬编码数据，改用 NewsNowFetcher：

```javascript
const { newsNowFetcher, NewsNowFetcher } = require('./fetchers/NewsNowFetcher');

let cachedTopics = [];
let lastFetchTime = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 分钟缓存

async function fetchAndCacheTopics(clearCache = true) {
  try {
    // 检查缓存
    if (!clearCache && cachedTopics.length > 0 && lastFetchTime && 
        (Date.now() - lastFetchTime < CACHE_DURATION)) {
      return cachedTopics;
    }
    
    // 使用 NewsNowFetcher 获取真实数据
    const topics = await newsNowFetcher.fetch();
    
    if (topics && topics.length > 0) {
      cachedTopics = topics;
      lastFetchTime = Date.now();
      return cachedTopics;
    }
    
    return cachedTopics.length > 0 ? cachedTopics : [];
  } catch (error) {
    console.error('获取热点数据失败:', error.message);
    return cachedTopics.length > 0 ? cachedTopics : [];
  }
}
```

### 修复 2: 前端正确处理错误

**文件**: `src/lib/api.js`

移除 mock 数据回退，正确返回错误状态：

```javascript
async getHotTopics(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await this.client.get(`/hot-topics?${query}`);
    return {
      success: true,
      data: response.data || [],
      pagination: response.pagination || {...}
    };
  } catch (error) {
    console.error('获取热点话题失败:', error);
    return {
      success: false,  // 正确标记失败
      message: error.message || '获取热点话题失败',
      data: [],  // 返回空数组，不是假数据
      pagination: {...}
    };
  }
}
```

### 修复 3: 批量修复 Logger 导入

```bash
find . -name "*.js" -exec sed -i 's/const { logger } = require/const logger = require/g' {} \;
```

## 数据源说明

### NewsNowFetcher 工作机制

1. **主数据源**: NewsNow API (`https://newsnow.busiyi.world/api/s`)
2. **备用数据源**: 各平台独立 Fetcher
   - `WeiboFetcher` - 微博热搜
   - `ZhihuFetcher` - 知乎热榜
   - `ToutiaoFetcher` - 今日头条

### 当前数据获取情况

| 数据源 | 状态 | 数据量 |
|--------|------|--------|
| 微博热搜 | 正常 | 20 条 |
| 知乎热榜 | 备用数据 | 10 条 |
| 今日头条 | 备用数据 | 10 条 |
| **总计** | - | **40 条** |

## 经验教训

### 1. 禁止在核心功能中使用硬编码 Mock 数据

**原则**: 
- 热点监控、数据分析等核心功能必须使用真实数据
- Mock 数据仅用于开发阶段的 UI 调试
- 生产环境必须移除所有 Mock 数据

### 2. 错误处理必须透明

**原则**:
- API 失败时返回 `success: false`
- 不要静默回退到假数据
- 让用户知道真实情况

### 3. 数据源必须有备用方案

**原则**:
- 主 API 失败时使用备用 Fetcher
- 备用 Fetcher 失败时使用缓存
- 所有方案都失败时返回空数据，不是假数据

## 后续改进建议

1. **添加数据源健康监控**: 在前端显示各数据源状态
2. **添加数据新鲜度指示**: 显示数据获取时间
3. **添加手动刷新功能**: 允许用户强制刷新数据
4. **完善错误提示**: 当无数据时，提示用户可能的原因

## 相关文件

- `server/server.js` - 后端主服务
- `server/fetchers/NewsNowFetcher.js` - NewsNow 数据获取器
- `server/fetchers/WeiboFetcher.js` - 微博数据获取器
- `server/fetchers/ZhihuFetcher.js` - 知乎数据获取器
- `server/fetchers/ToutiaoFetcher.js` - 今日头条数据获取器
- `src/lib/api.js` - 前端 API 客户端
- `src/pages/HotTopics.jsx` - 热点监控页面

---

**修复者**: AI Developer  
**审核者**: 待审核  
**状态**: 已修复，待验证
