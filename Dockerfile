FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY server/package*.json ./server/

# 安装依赖
RUN npm install --production
RUN cd server && npm install --production

# 复制源代码
COPY . .
COPY server ./server

# 创建日志目录
RUN mkdir -p /app/logs

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# 启动应用
CMD ["npm", "run", "start:prod"]
