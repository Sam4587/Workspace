/**
 * 日志输出系统
 * 提供统一的日志格式化和输出功能
 */

const chalk = require('chalk').default || require('chalk');
const moment = require('moment');

class Logger {
  constructor(logLevel = 'info') {
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    this.currentLevel = this.levels[logLevel] || this.levels.info;
    this.colors = {
      debug: chalk.gray,
      info: chalk.blue,
      warn: chalk.yellow,
      error: chalk.red
    };
  }

  /**
   * 设置日志级别
   */
  setLevel(level) {
    this.currentLevel = this.levels[level] || this.levels.info;
  }

  /**
   * 获取时间戳
   */
  getTimestamp() {
    return moment().format('HH:mm:ss');
  }

  /**
   * 格式化日志消息
   */
  formatMessage(level, message, prefix = '') {
    const timestamp = chalk.gray(`[${this.getTimestamp()}]`);
    const levelTag = this.colors[level](`[${level.toUpperCase()}]`);
    const prefixTag = prefix ? chalk.cyan(`[${prefix}]`) : '';
    
    return `${timestamp} ${levelTag}${prefixTag} ${message}`;
  }

  /**
   * 调试日志
   */
  debug(message, prefix = '') {
    if (this.currentLevel <= this.levels.debug) {
      console.log(this.formatMessage('debug', message, prefix));
    }
  }

  /**
   * 信息日志
   */
  info(message, prefix = '') {
    if (this.currentLevel <= this.levels.info) {
      console.log(this.formatMessage('info', message, prefix));
    }
  }

  /**
   * 警告日志
   */
  warn(message, prefix = '') {
    if (this.currentLevel <= this.levels.warn) {
      console.warn(this.formatMessage('warn', message, prefix));
    }
  }

  /**
   * 错误日志
   */
  error(message, prefix = '') {
    if (this.currentLevel <= this.levels.error) {
      console.error(this.formatMessage('error', message, prefix));
    }
  }

  /**
   * 成功消息
   */
  success(message, prefix = '') {
    const timestamp = chalk.gray(`[${this.getTimestamp()}]`);
    const prefixTag = prefix ? chalk.cyan(`[${prefix}]`) : '';
    console.log(`${timestamp} ${chalk.green('✅')} ${prefixTag} ${message}`);
  }

  /**
   * 分隔线
   */
  divider(char = '=', length = 50) {
    console.log(chalk.gray(char.repeat(length)));
  }

  /**
   * 标题
   */
  header(title) {
    this.divider();
    console.log(chalk.bold.cyan(`  ${title}`));
    this.divider();
  }

  /**
   * 服务状态显示
   */
  serviceStatus(serviceName, status, details = {}) {
    const statusColors = {
      'running': chalk.green,
      'starting': chalk.yellow,
      'stopped': chalk.gray,
      'error': chalk.red
    };
    
    const colorFunc = statusColors[status] || chalk.white;
    const statusText = colorFunc(status.toUpperCase());
    
    let message = `${chalk.bold(serviceName)}: ${statusText}`;
    
    if (Object.keys(details).length > 0) {
      const detailItems = Object.entries(details)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      message += ` (${detailItems})`;
    }
    
    console.log(message);
  }

  /**
   * 进度指示器
   */
  progress(message, current, total) {
    const percentage = Math.round((current / total) * 100);
    const barLength = 20;
    const filledLength = Math.round((percentage / 100) * barLength);
    const emptyLength = barLength - filledLength;
    
    const bar = chalk.green('█'.repeat(filledLength)) + chalk.gray('░'.repeat(emptyLength));
    
    console.log(`${bar} ${percentage}% ${message}`);
  }

  /**
   * 表格输出
   */
  table(data, headers = null) {
    if (!data || data.length === 0) return;
    
    // 如果没有提供表头，从第一个对象提取键
    if (!headers) {
      headers = Object.keys(data[0]);
    }
    
    // 计算每列的最大宽度
    const columnWidths = headers.map(header => {
      const maxWidth = Math.max(
        header.length,
        ...data.map(row => String(row[header] || '').length)
      );
      return Math.min(maxWidth, 30); // 限制最大宽度
    });
    
    // 输出表头
    const headerRow = headers.map((header, index) => {
      return chalk.bold(header.padEnd(columnWidths[index]));
    }).join(' | ');
    console.log(chalk.gray(headerRow));
    
    // 输出分隔线
    const separator = columnWidths.map(width => '-'.repeat(width)).join('-|-');
    console.log(chalk.gray(separator));
    
    // 输出数据行
    data.forEach(row => {
      const dataRow = headers.map((header, index) => {
        const value = String(row[header] || '');
        return value.length > columnWidths[index] 
          ? value.substring(0, columnWidths[index] - 3) + '...' 
          : value.padEnd(columnWidths[index]);
      }).join(' | ');
      console.log(dataRow);
    });
  }
}

// 创建全局日志实例
const logger = new Logger();

module.exports = { Logger, logger };