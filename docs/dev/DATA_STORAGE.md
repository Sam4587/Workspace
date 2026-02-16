# 数据存储方案说明

> **重要声明**：本项目已明确放弃 MongoDB，所有与 MongoDB 相关的代码和配置均已移除或禁用。

## 决策背景

### 为什么放弃 MongoDB

| 原因 | 说明 |
|------|------|
| **资源限制** | MongoDB 占用内存较高，当前服务器资源有限 |
| **成本考虑** | 优先使用免费方案，降低运营成本 |
| **实际需求** | 当前数据量小，轻量级存储完全满足需求 |
| **简化部署** | 减少外部依赖，降低部署复杂度 |
| **开发效率** | 无需维护数据库连接，开发调试更便捷 |

### 当前阶段策略

**免费优先，最小化服务器使用**

- 不使用任何付费数据库服务
- 不部署独立的数据库服务器
- 使用本地文件系统存储持久化数据
- 使用内存缓存热点数据

---

## 存储方案详解

### 1. 内存存储（热点数据）

**用途**：存储实时热点数据，定时刷新

```javascript
// server/services/hotTopicService.js
class HotTopicService {
  constructor() {
    this.cache = {
      weibo: [],
      zhihu: [],
      toutiao: [],
      lastUpdate: null
    };
  }

  // 数据在内存中，服务重启后清空
  // 通过定时任务自动刷新
}
```

**特点**：
- 读写速度最快
- 服务重启后数据清空
- 自动从数据源重新获取

### 2. JSON 文件存储（持久化数据）

**用途**：存储用户数据、生成内容、系统配置

```
server/storage/
├── data/
│   ├── contents.json      # AI 生成的内容
│   ├── users.json         # 用户数据
│   ├── settings.json      # 系统设置
│   └── analytics.json     # 分析数据
├── videos/                # 视频文件
│   └── 2026-02-16/        # 按日期分目录
└── transcripts/           # 转录结果
    └── 2026-02-16/        # 按日期分目录
```

**实现示例**：

```javascript
// server/utils/jsonStorage.js
const fs = require('fs').promises;
const path = require('path');

class JsonStorage {
  constructor(filename) {
    this.filePath = path.join(__dirname, '../storage/data', filename);
  }

  async read() {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return []; // 文件不存在返回空数组
    }
  }

  async write(data) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }
}
```

### 3. 环境变量（敏感配置）

**用途**：存储 API 密钥等敏感信息

```env
# server/.env
OPENAI_API_KEY=sk-xxx
GROQ_API_KEY=gsk_xxx
ALIYUN_ASR_ACCESS_KEY=xxx
```

---

## 数据类型与存储映射

| 数据类型 | 存储方式 | 持久化 | 说明 |
|----------|----------|--------|------|
| 热点数据 | 内存 | 否 | 实时性强，自动刷新 |
| 用户数据 | JSON 文件 | 是 | 小规模用户 |
| 生成内容 | JSON 文件 | 是 | 便于备份迁移 |
| 视频文件 | 本地文件系统 | 是 | 按日期分目录 |
| 转录结果 | JSON 文件 | 是 | 关联视频 ID |
| API 密钥 | 环境变量 | 是 | 不纳入版本控制 |
| 系统配置 | JSON 文件 | 是 | 可在界面修改 |

---

## 后端代码注意事项

### 已移除/禁用的 MongoDB 相关代码

```
server/
├── models/              # MongoDB 模型目录（已弃用）
│   └── *.js            # 保留文件但不再使用
├── index.js            # 生产服务器（MongoDB 版本，已禁用）
└── simple-server.js    # 当前使用的服务器（无 MongoDB）
```

### 开发者须知

1. **不要引入 MongoDB 依赖**
   - 不要安装 `mongoose` 或 `mongodb` 包
   - 不要创建新的 MongoDB 模型

2. **使用内存或 JSON 存储**
   ```javascript
   // 正确做法
   const storage = new JsonStorage('contents.json');
   const contents = await storage.read();

   // 错误做法（不要使用）
   const Content = require('../models/Content');
   const contents = await Content.find();
   ```

3. **数据迁移**
   - 如需从 MongoDB 迁移数据，导出为 JSON 格式
   - 使用 `mongoexport` 工具导出

---

## 未来扩展方案

当数据量增长到需要数据库时，可考虑以下方案：

### 方案一：SQLite（推荐）

```javascript
// 使用 better-sqlite3
const Database = require('better-sqlite3');
const db = new Database('trendradar.db');

// 单文件数据库，零配置
// 适合中小规模数据（百万级记录）
```

**优点**：
- 单文件，易于备份
- 零配置，无需独立服务
- 性能优秀
- 完全免费

### 方案二：LowDB

```javascript
// 基于 JSON 的轻量级数据库
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);
```

**优点**：
- 与现有 JSON 存储兼容
- 支持查询和索引
- 零依赖

### 方案三：云数据库（免费额度）

| 服务 | 免费额度 | 说明 |
|------|----------|------|
| Supabase | 500MB | PostgreSQL |
| PlanetScale | 5GB | MySQL 兼容 |
| MongoDB Atlas | 512MB | 如需 MongoDB |
| Turso | 9GB | SQLite 兼容 |

---

## 常见问题

### Q: 数据会丢失吗？

A: JSON 文件存储的数据会持久化。内存中的热点数据会在服务重启后自动从数据源重新获取。

### Q: 如何备份数据？

A: 直接复制 `server/storage/` 目录即可。

### Q: 数据量大了怎么办？

A: 当单文件超过 100MB 或记录数超过 10 万条时，建议迁移到 SQLite。

### Q: 多实例部署怎么办？

A: 当前方案不支持多实例。如需多实例，建议使用云数据库服务。

---

## 更新记录

| 日期 | 变更 |
|------|------|
| 2026-02-16 | 明确放弃 MongoDB，采用轻量级存储方案 |

---

**文档维护者**：TrendRadar 开发团队
**最后更新**：2026-02-16
