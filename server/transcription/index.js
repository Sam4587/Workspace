/**
 * 转录引擎模块入口
 * 提供视频/音频转文字能力
 */

const TranscriptionEngine = require('./TranscriptionEngine');
const BaseTranscriber = require('./BaseTranscriber');
const WhisperLocalTranscriber = require('./WhisperLocalTranscriber');
const AliyunASRTranscriber = require('./AliyunASRTranscriber');
const TaskQueue = require('./TaskQueue');
const { logger } = require('../utils/logger');

// 创建转录引擎实例
const transcriptionEngine = new TranscriptionEngine();

module.exports = {
  TranscriptionEngine,
  BaseTranscriber,
  WhisperLocalTranscriber,
  AliyunASRTranscriber,
  TaskQueue,
  transcriptionEngine
};
