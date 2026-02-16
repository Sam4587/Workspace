module.exports = {
  apps: [
    {
      name: 'ai-content-flow-backend',
      script: './server/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      env_test: {
        NODE_ENV: 'test',
        PORT: 5001
      },
      error_file: './server/logs/pm2/backend-error.log',
      out_file: './server/logs/pm2/backend-out.log',
      log_file: './server/logs/pm2/backend-combined.log',
      time: true,
      merge_logs: true,
      log_type: 'json'
    },
    {
      name: 'ai-content-flow-frontend',
      script: 'npm',
      args: 'run dev -- --port 5174',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      env_test: {
        NODE_ENV: 'test'
      },
      error_file: './server/logs/pm2/frontend-error.log',
      out_file: './server/logs/pm2/frontend-out.log',
      log_file: './server/logs/pm2/frontend-combined.log',
      time: true,
      merge_logs: true
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/ai-content-flow.git',
      path: '/var/www/ai-content-flow',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'deploy',
      host: 'your-staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/ai-content-flow.git',
      path: '/var/www/ai-content-flow',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env test',
      'pre-setup': ''
    }
  }
};