/**
 * Auto Dev Server 主入口
 * 导出核心类供程序化使用
 */

const AutoDevServer = require('./AutoDevServer');
const ConfigManager = require('./ConfigManager');
const ProcessManager = require('./ProcessManager');
const { Logger, logger } = require('./Logger');

module.exports = {
  AutoDevServer,
  ConfigManager,
  ProcessManager,
  Logger,
  logger
};