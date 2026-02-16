#!/usr/bin/env node

/**
 * AI内容流程平台 - 代码生成工具
 * 支持快速生成组件、服务、路由等代码模板
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// 模板定义
const templates = {
  // React组件模板
  component: {
    name: 'React组件',
    template: (name, options = {}) => {
      const componentName = name.charAt(0).toUpperCase() + name.slice(1);
      return `import React${options.useState ? ', { useState }' : ''}${options.useEffect ? ', { useEffect }' : ''} from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const ${componentName} = () => {
  const { showError, showSuccess } = useNotification();
  ${options.useState ? 'const [data, setData] = useState(null);' : ''}
  ${options.useEffect ? 'const [loading, setLoading] = useState(false);' : ''}

  ${options.apiCall ? `
  const { data, isLoading, error } = useQuery({
    queryKey: ['${name.toLowerCase()}'],
    queryFn: async () => {
      try {
        const response = await api.get('/${name.toLowerCase()}');
        return response.data;
      } catch (error) {
        showError('${componentName}数据获取失败');
        throw error;
      }
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });
  ` : ''}

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">${componentName}</h2>
      ${options.apiCall ? `
      {isLoading && <div>加载中...</div>}
      {error && <div className="text-red-500">加载失败: {error.message}</div>}
      {data && (
        <div>
          {/* 在这里渲染你的数据 */}
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      ` : '<div>组件内容</div>'}
    </div>
  );
};

export default ${componentName};`;
    }
  },

  // Express路由模板
  route: {
    name: 'Express路由',
    template: (name) => {
      const routeName = name.toLowerCase();
      return `const express = require('express');
const router = express.Router();

// 获取所有${routeName}
router.get('/', async (req, res) => {
  try {
    // TODO: 实现获取逻辑
    res.json({
      success: true,
      data: [],
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取${routeName}失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

// 获取单个${routeName}
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: 实现获取单个逻辑
    res.json({
      success: true,
      data: null,
      message: '获取成功'
    });
  } catch (error) {
    console.error('获取${routeName}详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取失败'
    });
  }
});

// 创建${routeName}
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    // TODO: 实现创建逻辑
    res.status(201).json({
      success: true,
      data: null,
      message: '创建成功'
    });
  } catch (error) {
    console.error('创建${routeName}失败:', error);
    res.status(500).json({
      success: false,
      message: '创建失败'
    });
  }
});

// 更新${routeName}
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    // TODO: 实现更新逻辑
    res.json({
      success: true,
      data: null,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新${routeName}失败:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
});

// 删除${routeName}
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: 实现删除逻辑
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除${routeName}失败:', error);
    res.status(500).json({
      success: false,
      message: '删除失败'
    });
  }
});

module.exports = router;`;
    }
  },

  // 服务类模板
  service: {
    name: '服务类',
    template: (name) => {
      const serviceName = name.charAt(0).toUpperCase() + name.slice(1) + 'Service';
      return `/**
 * ${serviceName}
 * ${name}相关业务逻辑处理
 */

class ${serviceName} {
  constructor() {
    // 初始化服务
  }

  /**
   * 获取所有${name}
   */
  async getAll(options = {}) {
    try {
      // TODO: 实现获取逻辑
      return [];
    } catch (error) {
      throw new Error(\`获取${name}失败: \${error.message}\`);
    }
  }

  /**
   * 根据ID获取${name}
   */
  async getById(id) {
    try {
      // TODO: 实现获取逻辑
      return null;
    } catch (error) {
      throw new Error(\`获取${name}失败: \${error.message}\`);
    }
  }

  /**
   * 创建${name}
   */
  async create(data) {
    try {
      // TODO: 实现创建逻辑
      return data;
    } catch (error) {
      throw new Error(\`创建${name}失败: \${error.message}\`);
    }
  }

  /**
   * 更新${name}
   */
  async update(id, data) {
    try {
      // TODO: 实现更新逻辑
      return data;
    } catch (error) {
      throw new Error(\`更新${name}失败: \${error.message}\`);
    }
  }

  /**
   * 删除${name}
   */
  async delete(id) {
    try {
      // TODO: 实现删除逻辑
      return true;
    } catch (error) {
      throw new Error(\`删除${name}失败: \${error.message}\`);
    }
  }
}

module.exports = new ${serviceName}();`;
    }
  },

  // 数据模型模板
  model: {
    name: '数据模型',
    template: (name) => {
      const modelName = name.charAt(0).toUpperCase() + name.slice(1);
      return `const mongoose = require('mongoose');

const ${modelName}Schema = new mongoose.Schema({
  // 基础字段
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 索引
${modelName}Schema.index({ createdAt: -1 });
${modelName}Schema.index({ status: 1 });

// 虚拟字段
${modelName}Schema.virtual('displayName').get(function() {
  return this.name || '未命名';
});

// 中间件
${modelName}Schema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 静态方法
${modelName}Schema.statics.findByStatus = function(status) {
  return this.find({ status });
};

// 实例方法
${modelName}Schema.methods.toggleStatus = function() {
  this.status = this.status === 'active' ? 'inactive' : 'active';
  return this.save();
};

module.exports = mongoose.model('${modelName}', ${modelName}Schema);`;
    }
  }
};

// 主菜单
function showMainMenu() {
  log(colors.cyan, '\n=== AI内容流程平台 - 代码生成工具 ===\n');
  
  console.log('请选择要生成的模板:');
  Object.entries(templates).forEach(([key, template], index) => {
    console.log(`${index + 1}. ${template.name} (${key})`);
  });
  console.log('0. 退出\n');
  
  rl.question('请输入选项编号: ', (answer) => {
    const choice = parseInt(answer);
    
    if (choice === 0) {
      log(colors.green, '再见！');
      rl.close();
      return;
    }
    
    const templateKeys = Object.keys(templates);
    if (choice > 0 && choice <= templateKeys.length) {
      const selectedTemplate = templateKeys[choice - 1];
      askForName(selectedTemplate);
    } else {
      log(colors.red, '无效的选择，请重新输入');
      showMainMenu();
    }
  });
}

// 询问名称
function askForName(templateType) {
  rl.question(`\n请输入${templates[templateType].name}的名称: `, (name) => {
    if (!name.trim()) {
      log(colors.red, '名称不能为空');
      askForName(templateType);
      return;
    }
    
    // 根据模板类型询问额外选项
    if (templateType === 'component') {
      askComponentOptions(name, templateType);
    } else {
      generateCode(templateType, name);
    }
  });
}

// React组件额外选项
function askComponentOptions(name, templateType) {
  console.log('\n组件选项:');
  console.log('1. 基础组件');
  console.log('2. 带useState的组件');
  console.log('3. 带useEffect的组件');
  console.log('4. 带API调用的完整组件');
  
  rl.question('请选择组件类型 (默认为4): ', (choice) => {
    const options = {
      useState: choice === '2' || choice === '3' || choice === '4',
      useEffect: choice === '3' || choice === '4',
      apiCall: choice === '4' || !choice
    };
    
    generateCode(templateType, name, options);
  });
}

// 生成代码
function generateCode(templateType, name, options = {}) {
  const template = templates[templateType];
  const code = template.template(name, options);
  
  // 确定保存路径
  let savePath;
  switch (templateType) {
    case 'component':
      savePath = path.join(process.cwd(), 'src', 'components', `${name}.jsx`);
      break;
    case 'route':
      savePath = path.join(process.cwd(), 'server', 'routes', `${name}.js`);
      break;
    case 'service':
      savePath = path.join(process.cwd(), 'server', 'services', `${name}Service.js`);
      break;
    case 'model':
      savePath = path.join(process.cwd(), 'server', 'models', `${name}.js`);
      break;
    default:
      savePath = path.join(process.cwd(), `${name}.${templateType}`);
  }
  
  // 确保目录存在
  const dir = path.dirname(savePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // 写入文件
  fs.writeFile(savePath, code, (err) => {
    if (err) {
      log(colors.red, `生成失败: ${err.message}`);
    } else {
      log(colors.green, `✅ 成功生成: ${savePath}`);
      log(colors.blue, `\n生成的代码:\n${'='.repeat(50)}\n`);
      console.log(code);
      log(colors.blue, `\n${'='.repeat(50)}\n`);
    }
    
    // 询问是否继续
    rl.question('\n是否继续生成其他代码? (y/N): ', (continueAnswer) => {
      if (continueAnswer.toLowerCase() === 'y') {
        showMainMenu();
      } else {
        log(colors.green, '再见！');
        rl.close();
      }
    });
  });
}

// 启动程序
showMainMenu();