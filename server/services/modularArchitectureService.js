/**
 * 模块化架构服务
 * IT-007: 模块化架构设计
 * 
 * 功能：
 * - 模块注册与管理
 * - 标准化接口定义
 * - 模块间通信
 * - 独立部署支持
 */

const logger = require('../utils/logger');
const EventEmitter = require('events');

class ModularArchitectureService extends EventEmitter {
  constructor() {
    super();

    this.modules = new Map();
    this.interfaces = new Map();
    this.pipelines = new Map();
    this.connections = new Map();

    this.config = {
      maxModules: 50,
      defaultTimeout: 30000,
      healthCheckInterval: 60000,
      enableCache: true
    };

    this.initializeStandardInterfaces();
  }

  initializeStandardInterfaces() {
    this.registerInterface('audio_input', {
      name: '音频输入接口',
      type: 'input',
      schema: {
        audioPath: 'string',
        sampleRate: 'number',
        channels: 'number',
        duration: 'number'
      },
      required: ['audioPath']
    });

    this.registerInterface('video_input', {
      name: '视频输入接口',
      type: 'input',
      schema: {
        videoPath: 'string',
        fps: 'number',
        resolution: 'string',
        duration: 'number'
      },
      required: ['videoPath']
    });

    this.registerInterface('image_input', {
      name: '图像输入接口',
      type: 'input',
      schema: {
        imagePath: 'string',
        width: 'number',
        height: 'number',
        format: 'string'
      },
      required: ['imagePath']
    });

    this.registerInterface('text_input', {
      name: '文本输入接口',
      type: 'input',
      schema: {
        text: 'string',
        language: 'string'
      },
      required: ['text']
    });

    this.registerInterface('video_output', {
      name: '视频输出接口',
      type: 'output',
      schema: {
        videoPath: 'string',
        fps: 'number',
        resolution: 'string',
        duration: 'number',
        format: 'string'
      },
      required: ['videoPath']
    });

    this.registerInterface('audio_output', {
      name: '音频输出接口',
      type: 'output',
      schema: {
        audioPath: 'string',
        sampleRate: 'number',
        duration: 'number',
        format: 'string'
      },
      required: ['audioPath']
    });

    this.registerInterface('feature_output', {
      name: '特征输出接口',
      type: 'output',
      schema: {
        features: 'array',
        dimensions: 'number',
        type: 'string'
      },
      required: ['features']
    });
  }

  registerModule(moduleId, moduleConfig) {
    try {
      if (this.modules.size >= this.config.maxModules) {
        throw new Error('已达到最大模块数量限制');
      }

      const module = {
        id: moduleId,
        name: moduleConfig.name || moduleId,
        version: moduleConfig.version || '1.0.0',
        description: moduleConfig.description || '',
        inputs: moduleConfig.inputs || [],
        outputs: moduleConfig.outputs || [],
        dependencies: moduleConfig.dependencies || [],
        handler: moduleConfig.handler || null,
        config: moduleConfig.config || {},
        status: 'registered',
        registeredAt: new Date().toISOString(),
        lastUsed: null,
        usageCount: 0,
        health: {
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          errorCount: 0
        }
      };

      this.validateModuleInterfaces(module);

      this.modules.set(moduleId, module);

      logger.info('[Modular] 模块已注册', { moduleId, name: module.name });

      this.emit('module:registered', { moduleId, module });

      return {
        success: true,
        moduleId,
        message: '模块注册成功'
      };
    } catch (error) {
      logger.error('[Modular] 模块注册失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  validateModuleInterfaces(module) {
    for (const input of module.inputs) {
      if (!this.interfaces.has(input)) {
        logger.warn('[Modular] 输入接口未定义', { moduleId: module.id, interface: input });
      }
    }

    for (const output of module.outputs) {
      if (!this.interfaces.has(output)) {
        logger.warn('[Modular] 输出接口未定义', { moduleId: module.id, interface: output });
      }
    }
  }

  registerInterface(interfaceId, interfaceConfig) {
    this.interfaces.set(interfaceId, {
      id: interfaceId,
      name: interfaceConfig.name || interfaceId,
      type: interfaceConfig.type || 'generic',
      schema: interfaceConfig.schema || {},
      required: interfaceConfig.required || [],
      registeredAt: new Date().toISOString()
    });

    return { success: true, interfaceId };
  }

  async executeModule(moduleId, input, options = {}) {
    const startTime = Date.now();

    try {
      const module = this.modules.get(moduleId);
      if (!module) {
        throw new Error(`模块 ${moduleId} 不存在`);
      }

      if (module.status !== 'registered' && module.status !== 'active') {
        throw new Error(`模块 ${moduleId} 状态异常: ${module.status}`);
      }

      this.validateInput(module, input);

      module.status = 'running';
      this.emit('module:started', { moduleId, input });

      let result;
      if (module.handler && typeof module.handler === 'function') {
        result = await Promise.race([
          module.handler(input, module.config, options),
          this.createTimeout(options.timeout || this.config.defaultTimeout)
        ]);
      } else {
        result = await this.defaultHandler(module, input, options);
      }

      this.validateOutput(module, result);

      module.status = 'active';
      module.lastUsed = new Date().toISOString();
      module.usageCount++;

      const executionTime = Date.now() - startTime;

      this.emit('module:completed', { moduleId, result, executionTime });

      return {
        success: true,
        moduleId,
        result,
        executionTime
      };
    } catch (error) {
      const module = this.modules.get(moduleId);
      if (module) {
        module.status = 'error';
        module.health.errorCount++;
        module.health.lastCheck = new Date().toISOString();
      }

      this.emit('module:error', { moduleId, error: error.message });

      logger.error('[Modular] 模块执行失败', { moduleId, error: error.message });

      return { success: false, moduleId, error: error.message };
    }
  }

  validateInput(module, input) {
    for (const requiredInterface of module.inputs) {
      const interfaceDef = this.interfaces.get(requiredInterface);
      if (!interfaceDef) continue;

      for (const field of interfaceDef.required) {
        if (input[field] === undefined) {
          throw new Error(`缺少必需字段: ${field}`);
        }
      }
    }
  }

  validateOutput(module, output) {
    if (!output) return;

    for (const outputInterface of module.outputs) {
      const interfaceDef = this.interfaces.get(outputInterface);
      if (!interfaceDef) continue;

      for (const field of interfaceDef.required) {
        if (output[field] === undefined) {
          logger.warn('[Modular] 输出缺少字段', { field, interface: outputInterface });
        }
      }
    }
  }

  async defaultHandler(module, input, options) {
    return {
      processed: true,
      moduleId: module.id,
      input,
      timestamp: new Date().toISOString()
    };
  }

  createTimeout(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('执行超时')), ms);
    });
  }

  createPipeline(pipelineId, stages) {
    try {
      const pipeline = {
        id: pipelineId,
        stages: [],
        createdAt: new Date().toISOString(),
        status: 'created'
      };

      for (const stage of stages) {
        const module = this.modules.get(stage.moduleId);
        if (!module) {
          throw new Error(`模块 ${stage.moduleId} 不存在`);
        }

        pipeline.stages.push({
          order: stage.order || pipeline.stages.length,
          moduleId: stage.moduleId,
          config: stage.config || {},
          transform: stage.transform || null
        });
      }

      pipeline.stages.sort((a, b) => a.order - b.order);

      this.pipelines.set(pipelineId, pipeline);

      logger.info('[Modular] 管道已创建', { pipelineId, stageCount: pipeline.stages.length });

      return { success: true, pipelineId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async executePipeline(pipelineId, input, options = {}) {
    const startTime = Date.now();

    try {
      const pipeline = this.pipelines.get(pipelineId);
      if (!pipeline) {
        throw new Error(`管道 ${pipelineId} 不存在`);
      }

      pipeline.status = 'running';
      this.emit('pipeline:started', { pipelineId });

      let currentData = input;
      const stageResults = [];

      for (const stage of pipeline.stages) {
        const stageInput = stage.transform
          ? stage.transform(currentData)
          : currentData;

        const result = await this.executeModule(stage.moduleId, stageInput, {
          ...options,
          ...stage.config
        });

        if (!result.success) {
          throw new Error(`阶段 ${stage.moduleId} 执行失败: ${result.error}`);
        }

        stageResults.push({
          moduleId: stage.moduleId,
          success: true,
          executionTime: result.executionTime
        });

        currentData = result.result;
      }

      pipeline.status = 'completed';
      const totalTime = Date.now() - startTime;

      this.emit('pipeline:completed', { pipelineId, totalTime });

      return {
        success: true,
        pipelineId,
        result: currentData,
        stageResults,
        totalTime
      };
    } catch (error) {
      const pipeline = this.pipelines.get(pipelineId);
      if (pipeline) {
        pipeline.status = 'failed';
      }

      logger.error('[Modular] 管道执行失败', { pipelineId, error: error.message });

      return { success: false, pipelineId, error: error.message };
    }
  }

  connectModules(sourceId, targetId, transform = null) {
    const connectionId = `${sourceId}->${targetId}`;

    try {
      const source = this.modules.get(sourceId);
      const target = this.modules.get(targetId);

      if (!source || !target) {
        throw new Error('源模块或目标模块不存在');
      }

      this.connections.set(connectionId, {
        id: connectionId,
        source: sourceId,
        target: targetId,
        transform,
        createdAt: new Date().toISOString()
      });

      logger.info('[Modular] 模块已连接', { sourceId, targetId });

      return { success: true, connectionId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async checkModuleHealth(moduleId) {
    const module = this.modules.get(moduleId);
    if (!module) {
      return { healthy: false, error: '模块不存在' };
    }

    try {
      const testResult = await this.executeModule(moduleId, { _healthCheck: true }, { timeout: 5000 });

      module.health.status = testResult.success ? 'healthy' : 'degraded';
      module.health.lastCheck = new Date().toISOString();

      return {
        healthy: testResult.success,
        status: module.health.status,
        lastCheck: module.health.lastCheck
      };
    } catch (error) {
      module.health.status = 'unhealthy';
      module.health.lastCheck = new Date().toISOString();

      return {
        healthy: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async checkAllHealth() {
    const results = {};

    for (const [moduleId] of this.modules) {
      results[moduleId] = await this.checkModuleHealth(moduleId);
    }

    return results;
  }

  getModule(moduleId) {
    const module = this.modules.get(moduleId);
    if (!module) return null;

    return {
      id: module.id,
      name: module.name,
      version: module.version,
      status: module.status,
      inputs: module.inputs,
      outputs: module.outputs,
      dependencies: module.dependencies,
      usageCount: module.usageCount,
      health: module.health
    };
  }

  listModules() {
    return Array.from(this.modules.values()).map(m => ({
      id: m.id,
      name: m.name,
      version: m.version,
      status: m.status,
      inputs: m.inputs,
      outputs: m.outputs
    }));
  }

  listInterfaces() {
    return Array.from(this.interfaces.values());
  }

  listPipelines() {
    return Array.from(this.pipelines.values()).map(p => ({
      id: p.id,
      stageCount: p.stages.length,
      status: p.status,
      createdAt: p.createdAt
    }));
  }

  getStats() {
    return {
      modules: {
        total: this.modules.size,
        active: Array.from(this.modules.values()).filter(m => m.status === 'active').length,
        error: Array.from(this.modules.values()).filter(m => m.status === 'error').length
      },
      interfaces: this.interfaces.size,
      pipelines: this.pipelines.size,
      connections: this.connections.size
    };
  }

  unregisterModule(moduleId) {
    const module = this.modules.get(moduleId);
    if (!module) {
      return { success: false, error: '模块不存在' };
    }

    for (const [connId, conn] of this.connections) {
      if (conn.source === moduleId || conn.target === moduleId) {
        this.connections.delete(connId);
      }
    }

    this.modules.delete(moduleId);

    logger.info('[Modular] 模块已注销', { moduleId });

    return { success: true, message: '模块已注销' };
  }
}

const modularArchitectureService = new ModularArchitectureService();

module.exports = {
  ModularArchitectureService,
  modularArchitectureService
};
