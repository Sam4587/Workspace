/**
 * Whisper 本地转录器
 * 使用 faster-whisper 进行本地语音识别
 */

const BaseTranscriber = require('./BaseTranscriber');
const logger = require('../utils/logger');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class WhisperLocalTranscriber extends BaseTranscriber {
  constructor(config = {}) {
    super(config);
    this.name = 'whisper-local';
    this.model = config.model || 'medium';
    this.device = config.device || 'cuda';
    this.outputDir = config.output_dir || './storage/transcripts';
    this.pythonPath = config.python_path || 'python3';
    this.whisperScriptPath = path.join(__dirname, 'whisper_transcribe.py');
  }

  /**
   * 转录媒体文件
   * @param {string} mediaPath - 媒体文件路径
   * @param {Object} options - 转录选项
   * @returns {Promise<TranscriptResult>}
   */
  async transcribe(mediaPath, options = {}) {
    const startTime = Date.now();

    try {
      this.log('info', '开始转录', { mediaPath, model: this.model });

      // 确保输出目录存在
      await fs.mkdir(this.outputDir, { recursive: true });

      // 执行 Whisper 转录
      const result = await this.runWhisper(mediaPath, options);

      if (!result.success) {
        return this.createResult({
          success: false,
          error: result.error || '转录失败',
          processingTime: Date.now() - startTime
        });
      }

      this.log('info', '转录完成', {
        duration: result.duration,
        textLength: result.text.length
      });

      return this.createResult({
        success: true,
        duration: result.duration,
        language: result.language || this.language,
        text: result.text,
        segments: result.segments || [],
        keywords: result.keywords || [],
        modelSize: this.model,
        processingTime: Date.now() - startTime,
        metadata: {
          model: this.model,
          device: this.device
        }
      });
    } catch (error) {
      this.log('error', '转录失败', { error: error.message });
      return this.createResult({
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * 运行 Whisper 转录
   * @param {string} mediaPath - 媒体路径
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async runWhisper(mediaPath, options = {}) {
    // 首先尝试使用 faster-whisper Python 库
    const pythonResult = await this.tryPythonWhisper(mediaPath, options);
    if (pythonResult.success) {
      return pythonResult;
    }

    // 如果 Python 方式失败，尝试命令行工具
    return await this.tryCLIWhisper(mediaPath, options);
  }

  /**
   * 使用 Python faster-whisper 库
   * @param {string} mediaPath - 媒体路径
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async tryPythonWhisper(mediaPath, options = {}) {
    return new Promise((resolve) => {
      const script = `
import json
import sys
try:
    from faster_whisper import WhisperModel

    model_size = "${this.model}"
    device = "${this.device}"

    model = WhisperModel(model_size, device=device, compute_type="auto")
    segments, info = model.transcribe("${mediaPath}", language="${options.language || 'zh'}")

    result = {
        "success": True,
        "text": "",
        "segments": [],
        "duration": info.duration,
        "language": info.language
    }

    for segment in segments:
        result["text"] += segment.text
        result["segments"].append({
            "index": segment.id,
            "start": segment.start,
            "end": segment.end,
            "text": segment.text,
            "confidence": getattr(segment, 'avg_logprob', 0)
        })

    print(json.dumps(result, ensure_ascii=False))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

      const cmd = `${this.pythonPath} -c '${script}'`;
      const timeout = this.timeout;

      exec(cmd, { timeout, maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
        if (error) {
          this.log('warn', 'Python Whisper 执行失败', { error: error.message });
          resolve({ success: false, error: error.message });
          return;
        }

        try {
          const result = JSON.parse(stdout.trim());
          resolve(result);
        } catch (parseError) {
          this.log('warn', '解析 Whisper 输出失败', { error: parseError.message });
          resolve({ success: false, error: parseError.message });
        }
      });
    });
  }

  /**
   * 使用命令行 whisper 工具
   * @param {string} mediaPath - 媒体路径
   * @param {Object} options - 选项
   * @returns {Promise<Object>}
   */
  async tryCLIWhisper(mediaPath, options = {}) {
    return new Promise((resolve) => {
      const outputPath = path.join(this.outputDir, `transcript_${Date.now()}`);
      const language = options.language || 'zh';

      // 构建 whisper 命令
      let cmd = `whisper "${mediaPath}"`;
      cmd += ` --model ${this.model}`;
      cmd += ` --language ${language}`;
      cmd += ` --output_format json`;
      cmd += ` --output_dir "${this.outputDir}"`;

      if (this.device === 'cuda') {
        cmd += ' --device cuda';
      }

      this.log('debug', '执行 Whisper 命令', { cmd: 'whisper ...' });

      exec(cmd, { timeout: this.timeout, maxBuffer: 1024 * 1024 * 50 }, async (error, stdout, stderr) => {
        if (error) {
          this.log('warn', 'CLI Whisper 执行失败', { error: error.message });
          resolve({ success: false, error: error.message });
          return;
        }

        try {
          // 查找生成的 JSON 文件
          const baseName = path.basename(mediaPath, path.extname(mediaPath));
          const jsonFile = path.join(this.outputDir, `${baseName}.json`);

          const content = await fs.readFile(jsonFile, 'utf-8');
          const data = JSON.parse(content);

          // 转换为标准格式
          const result = {
            success: true,
            text: data.text || '',
            segments: (data.segments || []).map((seg, idx) => ({
              index: idx,
              start: seg.start,
              end: seg.end,
              text: seg.text,
              confidence: seg.avg_logprob || 0
            })),
            duration: data.segments ? data.segments[data.segments.length - 1]?.end || 0 : 0,
            language: language
          };

          // 清理临时文件
          try {
            await fs.unlink(jsonFile);
          } catch {}

          resolve(result);
        } catch (parseError) {
          this.log('warn', '解析 Whisper CLI 输出失败', { error: parseError.message });
          resolve({ success: false, error: parseError.message });
        }
      });
    });
  }

  /**
   * 获取引擎信息
   * @returns {Object}
   */
  getEngineInfo() {
    return {
      ...super.getEngineInfo(),
      model: this.model,
      device: this.device
    };
  }
}

module.exports = WhisperLocalTranscriber;
