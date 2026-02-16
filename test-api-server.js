const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 模拟API端点
app.post('/api/v1/ai/content/generate', (req, res) => {
  const { topic, style, platform, length } = req.body;
  
  // 模拟AI生成的内容
  const mockContent = `关于"${topic}"的${style}风格内容
  
这是一个由AI生成的示例内容。根据您的要求，我为您创作了这篇${length || 500}字左右的文章。

内容要点：
1. 紧扣主题"${topic}"
2. 采用${style}的表达风格
3. 适合${platform === 'general' ? '通用平台' : platform}发布
4. 结构清晰，易于阅读

这只是一个演示内容，实际使用时会调用真正的AI服务来生成高质量的内容。`;

  setTimeout(() => {
    res.json({
      success: true,
      data: {
        content: mockContent,
        topic,
        style,
        platform
      }
    });
  }, 1000);
});

app.post('/api/v1/ai/content/rewrite', (req, res) => {
  const { content, style, platform } = req.body;
  
  const rewrittenContent = `${style}版本的内容：
  
${content}

---
*此内容已根据${style}风格进行了优化调整，更适合在${platform}平台发布。*`;

  setTimeout(() => {
    res.json({
      success: true,
      data: {
        content: rewrittenContent
      }
    });
  }, 800);
});

app.post('/api/v1/publish', (req, res) => {
  const { platform, type, title, content, tags } = req.body;
  
  // 模拟发布成功
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        task_id: `task_${Date.now()}`,
        status: 'published',
        platform,
        title,
        post_url: `https://${platform}.com/post/example-${Date.now()}`
      }
    });
  }, 1500);
});

// 旧版本API端点（向后兼容）
app.post('/api/content/generate', (req, res) => {
  const { topic, style, platform, length } = req.body;
  
  // 模拟AI生成的内容
  const mockContent = `关于"${topic}"的${style}风格内容
  
这是一个由AI生成的示例内容。根据您的要求，我为您创作了这篇${length || 500}字左右的文章。

内容要点：
1. 紧扣主题"${topic}"
2. 采用${style}的表达风格
3. 适合${platform === 'general' ? '通用平台' : platform}发布
4. 结构清晰，易于阅读

这只是一个演示内容，实际使用时会调用真正的AI服务来生成高质量的内容。`;

  setTimeout(() => {
    res.json({
      success: true,
      data: {
        content: mockContent,
        topic,
        style,
        platform
      }
    });
  }, 1000);
});

app.post('/api/content/rewrite', (req, res) => {
  const { content, style, platform } = req.body;
  
  const rewrittenContent = `${style}版本的内容：
  
${content}

---
*此内容已根据${style}风格进行了优化调整，更适合在${platform}平台发布。*`;

  setTimeout(() => {
    res.json({
      success: true,
      data: {
        content: rewrittenContent
      }
    });
  }, 800);
});

app.post('/api/publish', (req, res) => {
  const { platform, type, title, content, tags } = req.body;
  
  // 模拟发布成功
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        taskId: `task_${Date.now()}`,
        status: 'published',
        platform,
        title,
        postUrl: `https://${platform}.com/post/example-${Date.now()}`
      }
    });
  }, 1500);
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '测试服务器运行正常',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`测试API服务器运行在 http://localhost:${PORT}`);
  console.log('支持的端点:');
  console.log('- POST /api/content/generate');
  console.log('- POST /api/content/rewrite'); 
  console.log('- POST /api/publish');
  console.log('- GET /api/health');
});