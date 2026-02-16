const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server running',
    timestamp: new Date().toISOString()
  });
});

// 任务管理路由
const taskRoutes = require('./routes/tasks');
app.use('/api/tasks', taskRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Task management server running on port ${PORT}`);
});