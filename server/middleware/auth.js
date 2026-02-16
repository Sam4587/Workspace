/**
 * 认证中间件
 * 用于保护需要认证的路由
 */

const tokenService = require('../services/TokenService');

/**
 * 验证JWT访问令牌的中间件
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失'
    });
  }

  const decoded = tokenService.verifyAccessToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: '无效或已过期的访问令牌'
    });
  }

  // 将用户信息附加到请求对象
  req.user = decoded;
  next();
}

/**
 * 可选认证中间件
 * 如果提供了令牌则验证，否则继续执行
 */
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = tokenService.verifyAccessToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  
  next();
}

module.exports = {
  authenticateToken,
  optionalAuthenticate
};