const express = require('express');
const router = express.Router();
const { enhancedScheduleService } = require('../services/enhancedScheduleService');
const logger = require('../utils/logger');

router.get('/status', (req, res) => {
  try {
    const status = enhancedScheduleService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('[ScheduleAPI] 获取状态失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/presets', (req, res) => {
  try {
    const presets = enhancedScheduleService.getPresets();
    res.json({
      success: true,
      data: presets
    });
  } catch (error) {
    logger.error('[ScheduleAPI] 获取预设失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/start', (req, res) => {
  try {
    const { preset } = req.body;
    const result = enhancedScheduleService.start(preset || 'morning_evening');
    res.json({
      success: result,
      data: enhancedScheduleService.getStatus()
    });
  } catch (error) {
    logger.error('[ScheduleAPI] 启动调度失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/stop', (req, res) => {
  try {
    enhancedScheduleService.stop();
    res.json({
      success: true,
      data: enhancedScheduleService.getStatus()
    });
  } catch (error) {
    logger.error('[ScheduleAPI] 停止调度失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/config', (req, res) => {
  try {
    const newConfig = req.body;
    const status = enhancedScheduleService.updateConfig(newConfig);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('[ScheduleAPI] 更新配置失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/next-runs', (req, res) => {
  try {
    const nextRuns = enhancedScheduleService.getNextRunTimes();
    res.json({
      success: true,
      data: nextRuns
    });
  } catch (error) {
    logger.error('[ScheduleAPI] 获取下次执行时间失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/history', (req, res) => {
  try {
    const count = parseInt(req.query.count) || 10;
    const history = enhancedScheduleService.getHistory(count);
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('[ScheduleAPI] 获取历史记录失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/trigger/fetch', async (req, res) => {
  try {
    const result = await enhancedScheduleService.triggerFetch();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[ScheduleAPI] 手动触发抓取失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/trigger/push', async (req, res) => {
  try {
    const result = await enhancedScheduleService.triggerPush();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[ScheduleAPI] 手动触发推送失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/trigger/analyze', async (req, res) => {
  try {
    const result = await enhancedScheduleService.triggerAnalyze();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('[ScheduleAPI] 手动触发分析失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/time-windows/:name', (req, res) => {
  try {
    const { name } = req.params;
    const status = enhancedScheduleService.getTimeWindowStatus(name);
    if (!status) {
      return res.status(404).json({
        success: false,
        error: '时间窗口不存在'
      });
    }
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('[ScheduleAPI] 获取时间窗口状态失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/time-windows', (req, res) => {
  try {
    const { name, start, end, ...options } = req.body;
    enhancedScheduleService.addTimeWindow(name, start, end, options);
    res.json({
      success: true,
      data: enhancedScheduleService.getTimeWindowStatus(name)
    });
  } catch (error) {
    logger.error('[ScheduleAPI] 添加时间窗口失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/dedup/clear', (req, res) => {
  try {
    enhancedScheduleService.clearDedupCache();
    res.json({
      success: true,
      message: '去重缓存已清空'
    });
  } catch (error) {
    logger.error('[ScheduleAPI] 清空去重缓存失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/dedup/strategies', (req, res) => {
  try {
    const { name, config } = req.body;
    enhancedScheduleService.addDedupStrategy(name, config);
    res.json({
      success: true,
      message: `去重策略 ${name} 已添加`
    });
  } catch (error) {
    logger.error('[ScheduleAPI] 添加去重策略失败', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
