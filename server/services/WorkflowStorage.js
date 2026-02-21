const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class WorkflowStorage {
  constructor(dataDir = path.join(__dirname, '../data')) {
    this.dataDir = dataDir;
    this.instancesFile = path.join(dataDir, 'workflow-instances.json');
    this.schedulesFile = path.join(dataDir, 'workflow-schedules.json');
    this.checkpointsFile = path.join(dataDir, 'workflow-checkpoints.json');
    
    this.ensureDataDir();
    this.loadData();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      logger.info('[WorkflowStorage] 数据目录创建成功', { path: this.dataDir });
    }
  }

  loadData() {
    this.instances = this.loadJSON(this.instancesFile, []);
    this.schedules = this.loadJSON(this.schedulesFile, []);
    this.checkpoints = this.loadJSON(this.checkpointsFile, []);
  }

  loadJSON(filePath, defaultValue) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      logger.warn('[WorkflowStorage] 加载文件失败，使用默认值', { 
        filePath, 
        error: error.message 
      });
    }
    return defaultValue;
  }

  saveJSON(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      logger.error('[WorkflowStorage] 保存文件失败', { 
        filePath, 
        error: error.message 
      });
      return false;
    }
  }

  saveWorkflowInstance(instance) {
    const index = this.instances.findIndex(i => i.id === instance.id);
    if (index >= 0) {
      this.instances[index] = { ...this.instances[index], ...instance };
    } else {
      this.instances.push(instance);
    }
    
    this.instances.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    
    if (this.instances.length > 1000) {
      this.instances = this.instances.slice(0, 1000);
    }
    
    const success = this.saveJSON(this.instancesFile, this.instances);
    if (success) {
      logger.debug('[WorkflowStorage] 工作流实例已保存', { instanceId: instance.id });
    }
    return success;
  }

  getWorkflowInstance(instanceId) {
    return this.instances.find(i => i.id === instanceId) || null;
  }

  getWorkflowInstances(filter = {}) {
    let results = [...this.instances];
    
    if (filter.workflowId) {
      results = results.filter(i => i.workflowId === filter.workflowId);
    }
    if (filter.status) {
      results = results.filter(i => i.status === filter.status);
    }
    if (filter.trigger) {
      results = results.filter(i => i.trigger === filter.trigger);
    }
    
    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const start = (page - 1) * limit;
    
    return {
      instances: results.slice(start, start + limit),
      total: results.length,
      page,
      limit
    };
  }

  saveCheckpoint(checkpoint) {
    const index = this.checkpoints.findIndex(c => 
      c.instanceId === checkpoint.instanceId && c.taskIndex === checkpoint.taskIndex
    );
    
    if (index >= 0) {
      this.checkpoints[index] = checkpoint;
    } else {
      this.checkpoints.push(checkpoint);
    }
    
    const maxCheckpoints = 1000;
    if (this.checkpoints.length > maxCheckpoints) {
      this.checkpoints = this.checkpoints.slice(-maxCheckpoints);
    }
    
    const success = this.saveJSON(this.checkpointsFile, this.checkpoints);
    if (success) {
      logger.debug('[WorkflowStorage] 检查点已保存', { 
        instanceId: checkpoint.instanceId,
        taskIndex: checkpoint.taskIndex
      });
    }
    return success;
  }

  getLatestCheckpoint(instanceId) {
    const instanceCheckpoints = this.checkpoints
      .filter(c => c.instanceId === instanceId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return instanceCheckpoints[0] || null;
  }

  saveSchedule(schedule) {
    const index = this.schedules.findIndex(s => s.id === schedule.id);
    if (index >= 0) {
      this.schedules[index] = { ...this.schedules[index], ...schedule };
    } else {
      this.schedules.push(schedule);
    }
    
    const success = this.saveJSON(this.schedulesFile, this.schedules);
    if (success) {
      logger.debug('[WorkflowStorage] 定时任务已保存', { scheduleId: schedule.id });
    }
    return success;
  }

  getSchedule(scheduleId) {
    return this.schedules.find(s => s.id === scheduleId) || null;
  }

  getSchedules(filter = {}) {
    let results = [...this.schedules];
    
    if (filter.workflowId) {
      results = results.filter(s => s.workflowId === filter.workflowId);
    }
    if (filter.enabled !== undefined) {
      results = results.filter(s => s.enabled === filter.enabled);
    }
    
    return results;
  }

  deleteSchedule(scheduleId) {
    const index = this.schedules.findIndex(s => s.id === scheduleId);
    if (index >= 0) {
      this.schedules.splice(index, 1);
      this.saveJSON(this.schedulesFile, this.schedules);
      logger.info('[WorkflowStorage] 定时任务已删除', { scheduleId });
      return true;
    }
    return false;
  }
}

const workflowStorage = new WorkflowStorage();

module.exports = {
  WorkflowStorage,
  workflowStorage
};
