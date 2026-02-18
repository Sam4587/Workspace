const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const tokenService = require('../services/TokenService');
const { validateRequired, validateTypes } = require('../middleware/validation');

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
router.post('/login', 
  validateRequired(['username', 'password']),
  validateTypes({ username: 'string', password: 'string' }),
  async (req, res) => {
  console.log('[AUTH] 新的认证路由被调用!!!');
  try {
    const { username, password } = req.body;
    
    console.log('[DEBUG] 接收到登录请求:', { username, password });
    console.log('[DEBUG] 环境变量 ADMIN_USERNAME:', process.env.ADMIN_USERNAME);
    console.log('[DEBUG] 环境变量 ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? '[已设置]' : '[未设置]');
    
    // 强制从环境变量读取凭证
    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;
    
    if (!validUsername || !validPassword) {
      console.error('[AUTH] 错误: 管理员凭证未配置');
      return res.status(500).json({
        success: false,
        message: '服务器配置错误: 请配置 ADMIN_USERNAME 和 ADMIN_PASSWORD'
      });
    }
    
    console.log('[DEBUG] 有效凭证:', { validUsername, validPassword });
    console.log('[DEBUG] 匹配结果:', { 
      usernameMatch: username === validUsername,
      passwordMatch: password === validPassword 
    });
    
    // 检查凭证
    if (username === validUsername && password === validPassword) {
      // 如果使用默认密码，发出警告
      if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'admin123') {
        console.warn('⚠️ 警告: 正在使用默认密码，请在生产环境中配置 ADMIN_PASSWORD');
      }
      
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          success: false,
          message: '服务器配置错误: JWT_SECRET 未配置'
        });
      }
      
      // 使用TokenService生成令牌
      const tokens = tokenService.generateTokens(
        { userId: 'admin', username: validUsername },
        'admin'
      );
      
      res.json({
        success: true,
        data: {
          ...tokens,
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

// 刷新访问令牌
router.post('/refresh', 
  validateRequired(['refresh_token']),
  validateTypes({ refresh_token: 'string' }),
  async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: '刷新令牌是必需的'
      });
    }
    
    const newTokens = tokenService.refreshAccessToken(refresh_token);
    
    if (!newTokens) {
      return res.status(401).json({
        success: false,
        message: '无效或过期的刷新令牌'
      });
    }
    
    res.json({
      success: true,
      data: newTokens
    });
  } catch (error) {
    console.error('刷新令牌失败:', error);
    res.status(500).json({
      success: false,
      message: '刷新令牌失败'
    });
  }
});

// 用户登出
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { refresh_token } = req.body;
    
    // 撤销访问令牌
    if (token) {
      tokenService.revokeAccessToken(token);
    }
    
    // 撤销刷新令牌
    if (refresh_token) {
      tokenService.revokeRefreshToken(refresh_token);
    }
    
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出失败:', error);
    res.status(500).json({
      success: false,
      message: '登出失败'
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
    
    // 使用TokenService验证令牌
    const decoded = tokenService.verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: '无效或已撤销的令牌'
      });
    }
    
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
