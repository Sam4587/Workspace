/**
 * 高效转录服务
 * VT-002: Faster-Whisper高效转录集成
 * 
 * 功能：
 * - 高效语音转录
 * - 多语言自动检测
 * - VAD语音活动检测
 * - 批量转录队列
 */

const logger = require('../utils/logger');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const NodeCache = require('node-cache');

class TranscriptionService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 7200, checkperiod: 600 });
    this.transcriptionQueue = [];
    this.activeTranscriptions = new Map();
    this.transcriptionHistory = [];
    this.maxHistorySize = 300;

    this.config = {
      whisperModel: process.env.WHISPER_MODEL || 'large-v3',
      device: process.env.WHISPER_DEVICE || 'cuda',
      computeType: process.env.WHISPER_COMPUTE_TYPE || 'float16',
      maxConcurrentJobs: 2,
      timeout: 600000,
      supportedFormats: ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.mp4', '.mkv', '.webm'],
      defaultLanguage: null,
      beamSize: 5,
      vadFilter: true,
      vadMinSilenceDuration: 500
    };

    this.models = {
      'tiny': { size: '39MB', speed: '~32x', accuracy: '较低' },
      'base': { size: '74MB', speed: '~22x', accuracy: '较低' },
      'small': { size: '244MB', speed: '~12x', accuracy: '中等' },
      'medium': { size: '769MB', speed: '~6x', accuracy: '较高' },
      'large-v2': { size: '1.5GB', speed: '~3x', accuracy: '高' },
      'large-v3': { size: '1.5GB', speed: '~3x', accuracy: '最高' }
    };

    this.languages = {
      'zh': '中文',
      'en': '英语',
      'ja': '日语',
      'ko': '韩语',
      'fr': '法语',
      'de': '德语',
      'es': '西班牙语',
      'ru': '俄语',
      'pt': '葡萄牙语',
      'it': '意大利语',
      'ar': '阿拉伯语',
      'hi': '印地语',
      'auto': '自动检测'
    };
  }

  async checkFasterWhisperInstalled() {
    return new Promise((resolve) => {
      exec('python -c "import faster_whisper; print(faster_whisper.__version__)"', (error, stdout) => {
        if (error) {
          logger.warn('[Transcription] Faster-Whisper未安装');
          resolve({ installed: false, version: null });
        } else {
          const version = stdout.trim();
          logger.info('[Transcription] Faster-Whisper版本', { version });
          resolve({ installed: true, version });
        }
      });
    });
  }

  async transcribe(audioPath, options = {}) {
    const transcriptionId = this.generateId();

    try {
      const ext = path.extname(audioPath).toLowerCase();
      if (!this.config.supportedFormats.includes(ext)) {
        throw new Error(`不支持的音频格式: ${ext}`);
      }

      await fs.access(audioPath);

      const stats = await fs.stat(audioPath);
      const fileSize = stats.size;

      logger.info('[Transcription] 开始转录', { audioPath, transcriptionId });

      const transcription = {
        id: transcriptionId,
        audioPath,
        fileSize,
        status: 'processing',
        startTime: Date.now(),
        options,
        result: null
      };

      this.activeTranscriptions.set(transcriptionId, transcription);

      const result = await this.runTranscription(audioPath, options);

      transcription.status = 'completed';
      transcription.endTime = Date.now();
      transcription.duration = transcription.endTime - transcription.startTime;
      transcription.result = result;

      this.addToHistory(transcription);
      this.activeTranscriptions.delete(transcriptionId);

      return {
        success: true,
        transcriptionId,
        ...result,
        duration: transcription.duration
      };
    } catch (error) {
      const transcription = this.activeTranscriptions.get(transcriptionId);
      if (transcription) {
        transcription.status = 'failed';
        transcription.error = error.message;
        this.activeTranscriptions.delete(transcriptionId);
      }

      logger.error('[Transcription] 转录失败', { error: error.message });
      return { success: false, transcriptionId, error: error.message };
    }
  }

  async runTranscription(audioPath, options = {}) {
    const model = options.model || this.config.whisperModel;
    const device = options.device || this.config.device;
    const computeType = options.computeType || this.config.computeType;
    const language = options.language || this.config.defaultLanguage;
    const beamSize = options.beamSize || this.config.beamSize;
    const vadFilter = options.vadFilter !== false ? this.config.vadFilter : false;

    const pythonScript = `
import json
import sys
from faster_whisper import WhisperModel

try:
    model = WhisperModel(
        "${model}",
        device="${device}",
        compute_type="${computeType}"
    )
    
    segments, info = model.transcribe(
        "${audioPath.replace(/\\/g, '\\\\')}",
        language=${language ? `"${language}"` : 'None'},
        beam_size=${beamSize},
        vad_filter=${vadFilter},
        vad_parameters=dict(min_silence_duration_ms=${this.config.vadMinSilenceDuration})
    )
    
    result = {
        "language": info.language,
        "language_probability": info.language_probability,
        "duration": info.duration,
        "segments": []
    }
    
    for segment in segments:
        result["segments"].append({
            "start": segment.start,
            "end": segment.end,
            "text": segment.text.strip(),
            "words": [{"start": w.start, "end": w.end, "word": w.word, "probability": w.probability} for w in (segment.words or [])]
        })
    
    print(json.dumps(result, ensure_ascii=False))
    
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
`;

    const result = await this.executePython(pythonScript);

    if (result.error) {
      throw new Error(result.error);
    }

    const fullText = result.segments.map(s => s.text).join(' ');

    return {
      language: result.language,
      languageProbability: result.language_probability,
      duration: result.duration,
      fullText,
      segments: result.segments,
      segmentCount: result.segments.length,
      wordCount: fullText.split(/\s+/).length
    };
  }

  async transcribeWithTimestamps(audioPath, options = {}) {
    const result = await this.transcribe(audioPath, options);

    if (!result.success) {
      return result;
    }

    const timestamps = result.segments.map(segment => ({
      start: this.formatTimestamp(segment.start),
      end: this.formatTimestamp(segment.end),
      startSeconds: segment.start,
      endSeconds: segment.end,
      text: segment.text
    }));

    return {
      ...result,
      timestamps,
      srt: this.generateSRT(result.segments),
      vtt: this.generateVTT(result.segments)
    };
  }

  formatTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  generateSRT(segments) {
    return segments.map((segment, index) => {
      const startTime = this.formatTimestampSRT(segment.start);
      const endTime = this.formatTimestampSRT(segment.end);
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
    }).join('\n');
  }

  formatTimestampSRT(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  generateVTT(segments) {
    const header = 'WEBVTT\n\n';
    const body = segments.map(segment => {
      const startTime = this.formatTimestampVTT(segment.start);
      const endTime = this.formatTimestampVTT(segment.end);
      return `${startTime} --> ${endTime}\n${segment.text}\n`;
    }).join('\n');

    return header + body;
  }

  formatTimestampVTT(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  async batchTranscribe(audioPaths, options = {}) {
    const results = [];

    for (const audioPath of audioPaths) {
      const result = await this.transcribe(audioPath, options);
      results.push({
        audioPath,
        ...result
      });
    }

    return {
      total: audioPaths.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  async detectLanguage(audioPath) {
    try {
      const pythonScript = `
import json
from faster_whisper import WhisperModel

model = WhisperModel("base", device="cpu", compute_type="int8")
segments, info = model.transcribe("${audioPath.replace(/\\/g, '\\\\')}", language=None, beam_size=1, vad_filter=False)

result = {
    "language": info.language,
    "language_probability": info.language_probability
}

print(json.dumps(result))
`;

      const result = await this.executePython(pythonScript);

      return {
        success: true,
        language: result.language,
        languageName: this.languages[result.language] || result.language,
        probability: result.language_probability
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getWordLevelTimestamps(audioPath, options = {}) {
    const result = await this.transcribe(audioPath, {
      ...options,
      wordTimestamps: true
    });

    if (!result.success) {
      return result;
    }

    const words = [];
    for (const segment of result.segments) {
      if (segment.words && segment.words.length > 0) {
        words.push(...segment.words);
      }
    }

    return {
      ...result,
      words,
      wordCount: words.length
    };
  }

  executePython(script) {
    return new Promise((resolve, reject) => {
      const process = spawn('python', ['-c', script]);
      let output = '';
      let errorOutput = '';

      const timer = setTimeout(() => {
        process.kill();
        reject(new Error('执行超时'));
      }, this.config.timeout);

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            reject(new Error(`JSON解析失败: ${output}`));
          }
        } else {
          reject(new Error(errorOutput || `进程退出码: ${code}`));
        }
      });

      process.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  addToHistory(transcription) {
    this.transcriptionHistory.unshift(transcription);

    if (this.transcriptionHistory.length > this.maxHistorySize) {
      this.transcriptionHistory = this.transcriptionHistory.slice(0, this.maxHistorySize);
    }
  }

  getTranscriptionStatus(transcriptionId) {
    const active = this.activeTranscriptions.get(transcriptionId);
    if (active) {
      return { active: true, ...active };
    }

    const historyItem = this.transcriptionHistory.find(t => t.id === transcriptionId);
    if (historyItem) {
      return { active: false, ...historyItem };
    }

    return null;
  }

  getHistory(options = {}) {
    let history = [...this.transcriptionHistory];

    if (options.language) {
      history = history.filter(t => t.result?.language === options.language);
    }

    if (options.status) {
      history = history.filter(t => t.status === options.status);
    }

    if (options.limit) {
      history = history.slice(0, options.limit);
    }

    return history;
  }

  getStats() {
    const total = this.transcriptionHistory.length;
    const completed = this.transcriptionHistory.filter(t => t.status === 'completed').length;
    const failed = this.transcriptionHistory.filter(t => t.status === 'failed').length;

    const avgDuration = completed > 0
      ? this.transcriptionHistory
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.duration, 0) / completed
      : 0;

    const totalAudioDuration = this.transcriptionHistory
      .filter(t => t.status === 'completed' && t.result?.duration)
      .reduce((sum, t) => sum + t.result.duration, 0);

    const languageStats = {};
    this.transcriptionHistory.forEach(t => {
      if (t.result?.language) {
        const lang = t.result.language;
        if (!languageStats[lang]) {
          languageStats[lang] = 0;
        }
        languageStats[lang]++;
      }
    });

    return {
      total,
      completed,
      failed,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgProcessingTime: Math.round(avgDuration),
      totalAudioDuration: Math.round(totalAudioDuration),
      activeJobs: this.activeTranscriptions.size,
      languageStats
    };
  }

  getModels() {
    return Object.entries(this.models).map(([key, value]) => ({
      id: key,
      ...value
    }));
  }

  getLanguages() {
    return Object.entries(this.languages).map(([code, name]) => ({
      code,
      name
    }));
  }

  getSupportedFormats() {
    return this.config.supportedFormats;
  }

  cancelTranscription(transcriptionId) {
    const transcription = this.activeTranscriptions.get(transcriptionId);
    if (!transcription) {
      return { success: false, error: '转录任务不存在' };
    }

    transcription.status = 'cancelled';
    this.activeTranscriptions.delete(transcriptionId);

    return { success: true, message: '转录已取消' };
  }

  generateId() {
    return `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConfig() {
    return { ...this.config };
  }
}

const transcriptionService = new TranscriptionService();

module.exports = {
  TranscriptionService,
  transcriptionService
};
