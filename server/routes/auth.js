const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

// 安全配置检查
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// 启动时检查必需的环境变量
if (!JWT_SECRET) {
  console.error('❌ 错误: JWT_SECRET 环境变量未配置');
  console.error('请在 .env 文件中设置 JWT_SECRET=your-secret-key');
}

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 从环境变量读取凭证
    const validUsername = ADMIN_USERNAME || 'admin';
    const validPassword = ADMIN_PASSWORD || 'admin123';
    
    // 检查凭证
    if (username === validUsername && password === validPassword) {
      // 如果使用默认密码，发出警告
      if (!ADMIN_PASSWORD || ADMIN_PASSWORD === 'admin123') {
        console.warn('⚠️ 警告: 正在使用默认密码，请在生产环境中配置 ADMIN_PASSWORD');
      }
      
      if (!JWT_SECRET) {
        return res.status(500).json({
          success: false,
          message: '服务器配置错误: JWT_SECRET 未配置'
        });
      }
      
      const token = jwt.sign(
        { userId: 'admin', username: validUsername },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        data: {
          token,
          user: {
            id: 'admin',
            username: validUsername,
            role: 'admin'
          }
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
});

// 获取用户信息
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未授权'
      });
    }
    
    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: '服务器配置错误: JWT_SECRET 未配置'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({
      success: true,
      data: {
        id: decoded.userId,
        username: decoded.username,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(401).json({
      success: false,
      message: '无效的token'
    });
  }
});

module.exports = router;
