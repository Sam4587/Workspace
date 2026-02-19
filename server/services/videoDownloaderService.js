/**
 * 视频下载服务
 * VT-001: yt-dlp多平台视频下载集成
 * 
 * 功能：
 * - 多平台视频下载（30+平台）
 * - 视频信息提取
 * - 进度回调
 * - 格式转换
 */

const logger = require('../utils/logger');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const NodeCache = require('node-cache');

class VideoDownloaderService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
    this.activeDownloads = new Map();
    this.downloadHistory = [];
    this.maxHistorySize = 500;

    this.config = {
      ytDlpPath: process.env.YT_DLP_PATH || 'yt-dlp',
      ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
      defaultOutputDir: process.env.VIDEO_OUTPUT_DIR || './downloads/videos',
      defaultFormat: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      maxConcurrentDownloads: 3,
      timeout: 300000,
      retryAttempts: 3,
      retryDelay: 5000
    };

    this.supportedPlatforms = this.initializeSupportedPlatforms();
  }

  initializeSupportedPlatforms() {
    return {
      youtube: {
        name: 'YouTube',
        domains: ['youtube.com', 'youtu.be'],
        features: ['video', 'playlist', 'live']
      },
      bilibili: {
        name: 'B站',
        domains: ['bilibili.com', 'b23.tv'],
        features: ['video', 'bangumi']
      },
      douyin: {
        name: '抖音',
        domains: ['douyin.com', 'v.douyin.com'],
        features: ['video', 'live']
      },
      tiktok: {
        name: 'TikTok',
        domains: ['tiktok.com', 'vm.tiktok.com'],
        features: ['video']
      },
      kuaishou: {
        name: '快手',
        domains: ['kuaishou.com', 'gifshow.com'],
        features: ['video', 'live']
      },
      xiaohongshu: {
        name: '小红书',
        domains: ['xiaohongshu.com', 'xhslink.com'],
        features: ['video', 'images']
      },
      weibo: {
        name: '微博',
        domains: ['weibo.com', 'weibo.cn'],
        features: ['video']
      },
      youku: {
        name: '优酷',
        domains: ['youku.com'],
        features: ['video']
      },
      iqiyi: {
        name: '爱奇艺',
        domains: ['iqiyi.com'],
        features: ['video']
      },
      tencent: {
        name: '腾讯视频',
        domains: ['v.qq.com'],
        features: ['video']
      },
      instagram: {
        name: 'Instagram',
        domains: ['instagram.com'],
        features: ['video', 'reels', 'stories']
      },
      twitter: {
        name: 'Twitter/X',
        domains: ['twitter.com', 'x.com'],
        features: ['video']
      },
      facebook: {
        name: 'Facebook',
        domains: ['facebook.com', 'fb.watch'],
        features: ['video']
      },
      vimeo: {
        name: 'Vimeo',
        domains: ['vimeo.com'],
        features: ['video']
      },
      spotify: {
        name: 'Spotify',
        domains: ['spotify.com'],
        features: ['audio']
      },
      ncm: {
        name: '网易云音乐',
        domains: ['music.163.com'],
        features: ['audio']
      }
    };
  }

  async checkYtDlpInstalled() {
    return new Promise((resolve) => {
      exec(`${this.config.ytDlpPath} --version`, (error, stdout) => {
        if (error) {
          logger.warn('[VideoDownloader] yt-dlp未安装或不在PATH中');
          resolve({ installed: false, version: null });
        } else {
          const version = stdout.trim();
          logger.info('[VideoDownloader] yt-dlp版本', { version });
          resolve({ installed: true, version });
        }
      });
    });
  }

  detectPlatform(url) {
    const urlLower = url.toLowerCase();

    for (const [key, platform] of Object.entries(this.supportedPlatforms)) {
      for (const domain of platform.domains) {
        if (urlLower.includes(domain)) {
          return { key, ...platform };
        }
      }
    }

    return { key: 'unknown', name: '未知平台', features: [] };
  }

  async getVideoInfo(url, options = {}) {
    const cacheKey = `info_${url}`;

    const cached = this.cache.get(cacheKey);
    if (cached && !options.forceRefresh) {
      return { success: true, cached: true, ...cached };
    }

    try {
      logger.info('[VideoDownloader] 获取视频信息', { url });

      const args = [
        '--dump-json',
        '--no-download',
        '--no-warnings',
        '--no-playlist',
        url
      ];

      const result = await this.executeYtDlp(args, { timeout: 30000 });

      const info = JSON.parse(result);

      const videoInfo = {
        id: info.id,
        title: info.title,
        description: info.description,
        duration: info.duration,
        durationString: info.duration_string,
        uploader: info.uploader || info.channel,
        uploaderId: info.uploader_id,
        uploadDate: info.upload_date,
        viewCount: info.view_count,
        likeCount: info.like_count,
        thumbnail: info.thumbnail,
        platform: this.detectPlatform(url).name,
        formats: (info.formats || []).slice(0, 10).map(f => ({
          formatId: f.format_id,
          ext: f.ext,
          resolution: f.resolution,
          fps: f.fps,
          vcodec: f.vcodec,
          acodec: f.acodec,
          filesize: f.filesize,
          filesizeApprox: f.filesize_approx
        })),
        availableSubtitles: info.subtitles ? Object.keys(info.subtitles) : [],
        availableAutomaticCaptions: info.automatic_captions ? Object.keys(info.automatic_captions) : []
      };

      this.cache.set(cacheKey, videoInfo);

      return { success: true, ...videoInfo };
    } catch (error) {
      logger.error('[VideoDownloader] 获取视频信息失败', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  async downloadVideo(url, options = {}) {
    const downloadId = this.generateId();

    if (this.activeDownloads.size >= this.config.maxConcurrentDownloads) {
      return {
        success: false,
        error: '已达到最大并发下载数，请稍后重试',
        queuePosition: this.activeDownloads.size
      };
    }

    try {
      const platform = this.detectPlatform(url);
      logger.info('[VideoDownloader] 开始下载视频', { url, platform: platform.name, downloadId });

      const outputDir = options.outputDir || this.config.defaultOutputDir;
      await fs.mkdir(outputDir, { recursive: true });

      const outputTemplate = options.outputTemplate || path.join(outputDir, '%(title)s_%(id)s.%(ext)s');

      const args = [
        '-f', options.format || this.config.defaultFormat,
        '--merge-output-format', 'mp4',
        '-o', outputTemplate,
        '--no-warnings',
        '--no-playlist',
        '--newline',
        url
      ];

      if (options.subtitleLanguage) {
        args.push('--write-subs', '--sub-langs', options.subtitleLanguage);
      }

      if (options.thumbnail) {
        args.push('--write-thumbnail');
      }

      if (options.proxy) {
        args.push('--proxy', options.proxy);
      }

      const download = {
        id: downloadId,
        url,
        platform: platform.name,
        status: 'downloading',
        progress: 0,
        startTime: Date.now(),
        outputPath: null,
        error: null
      };

      this.activeDownloads.set(downloadId, download);

      const result = await this.runDownloadProcess(downloadId, args, download);

      return result;
    } catch (error) {
      logger.error('[VideoDownloader] 下载失败', { error: error.message });
      return { success: false, error: error.message, downloadId };
    }
  }

  async runDownloadProcess(downloadId, args, download) {
    return new Promise((resolve, reject) => {
      const process = spawn(this.config.ytDlpPath, args);
      let lastProgress = 0;
      let outputPath = null;

      process.stdout.on('data', (data) => {
        const output = data.toString();
        const progress = this.parseProgress(output);

        if (progress > lastProgress) {
          lastProgress = progress;
          download.progress = progress;
          this.activeDownloads.set(downloadId, download);
        }

        const destMatch = output.match(/\[Merger\] Merging formats into "(.+?)"/) ||
          output.match(/\[download\] Destination: (.+\.mp4)/);

        if (destMatch) {
          outputPath = destMatch[1];
          download.outputPath = outputPath;
        }
      });

      process.stderr.on('data', (data) => {
        logger.debug('[VideoDownloader] stderr', { data: data.toString() });
      });

      process.on('close', (code) => {
        this.activeDownloads.delete(downloadId);

        if (code === 0) {
          download.status = 'completed';
          download.progress = 100;
          download.endTime = Date.now();
          download.duration = download.endTime - download.startTime;

          this.addToHistory(download);

          resolve({
            success: true,
            downloadId,
            outputPath: download.outputPath,
            duration: download.duration
          });
        } else {
          download.status = 'failed';
          download.error = `进程退出码: ${code}`;

          resolve({
            success: false,
            downloadId,
            error: download.error
          });
        }
      });

      process.on('error', (error) => {
        this.activeDownloads.delete(downloadId);
        download.status = 'failed';
        download.error = error.message;

        resolve({
          success: false,
          downloadId,
          error: error.message
        });
      });
    });
  }

  parseProgress(output) {
    const patterns = [
      /\[download\]\s+(\d+\.?\d*)%/,
      /\[info\]\s+(\d+\.?\d*)%/
    ];

    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        return parseFloat(match[1]);
      }
    }

    return 0;
  }

  async downloadAudio(url, options = {}) {
    const downloadId = this.generateId();

    try {
      const outputDir = options.outputDir || this.config.defaultOutputDir;
      await fs.mkdir(outputDir, { recursive: true });

      const outputTemplate = options.outputTemplate || path.join(outputDir, '%(title)s_%(id)s.%(ext)s');

      const args = [
        '-x',
        '--audio-format', options.audioFormat || 'mp3',
        '--audio-quality', options.audioQuality || '0',
        '-o', outputTemplate,
        '--no-warnings',
        '--no-playlist',
        '--newline',
        url
      ];

      const download = {
        id: downloadId,
        url,
        type: 'audio',
        status: 'downloading',
        progress: 0,
        startTime: Date.now()
      };

      this.activeDownloads.set(downloadId, download);

      const result = await this.runDownloadProcess(downloadId, args, download);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async downloadSubtitle(url, options = {}) {
    try {
      const outputDir = options.outputDir || this.config.defaultOutputDir;
      await fs.mkdir(outputDir, { recursive: true });

      const args = [
        '--write-subs',
        '--write-auto-subs',
        '--sub-langs', options.language || 'all',
        '--skip-download',
        '-o', path.join(outputDir, '%(title)s_%(id)s'),
        '--no-warnings',
        url
      ];

      await this.executeYtDlp(args);

      return { success: true, message: '字幕下载完成' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async batchDownload(urls, options = {}) {
    const results = [];

    for (const url of urls) {
      const result = await this.downloadVideo(url, options);
      results.push({
        url,
        ...result
      });
    }

    return {
      total: urls.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  async extractAudio(videoPath, outputPath, options = {}) {
    try {
      const args = [
        '-i', videoPath,
        '-vn',
        '-acodec', options.codec || 'libmp3lame',
        '-ab', options.bitrate || '192k',
        '-ar', options.sampleRate || '44100',
        '-y',
        outputPath
      ];

      await this.executeFFmpeg(args);

      return { success: true, outputPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  executeYtDlp(args, options = {}) {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || this.config.timeout;
      let output = '';
      let errorOutput = '';

      const process = spawn(this.config.ytDlpPath, args);
      const timer = setTimeout(() => {
        process.kill();
        reject(new Error('执行超时'));
      }, timeout);

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve(output);
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

  executeFFmpeg(args) {
    return new Promise((resolve, reject) => {
      const process = spawn(this.config.ffmpegPath, args);

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg退出码: ${code}`));
        }
      });

      process.on('error', reject);
    });
  }

  addToHistory(download) {
    this.downloadHistory.unshift(download);

    if (this.downloadHistory.length > this.maxHistorySize) {
      this.downloadHistory = this.downloadHistory.slice(0, this.maxHistorySize);
    }
  }

  getDownloadStatus(downloadId) {
    const active = this.activeDownloads.get(downloadId);
    if (active) {
      return { active: true, ...active };
    }

    const historyItem = this.downloadHistory.find(d => d.id === downloadId);
    if (historyItem) {
      return { active: false, ...historyItem };
    }

    return null;
  }

  getHistory(options = {}) {
    let history = [...this.downloadHistory];

    if (options.platform) {
      history = history.filter(d => d.platform === options.platform);
    }

    if (options.status) {
      history = history.filter(d => d.status === options.status);
    }

    if (options.limit) {
      history = history.slice(0, options.limit);
    }

    return history;
  }

  getStats() {
    const total = this.downloadHistory.length;
    const completed = this.downloadHistory.filter(d => d.status === 'completed').length;
    const failed = this.downloadHistory.filter(d => d.status === 'failed').length;

    const avgDuration = completed > 0
      ? this.downloadHistory
        .filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + d.duration, 0) / completed
      : 0;

    const platformStats = {};
    this.downloadHistory.forEach(d => {
      if (!platformStats[d.platform]) {
        platformStats[d.platform] = { total: 0, completed: 0 };
      }
      platformStats[d.platform].total++;
      if (d.status === 'completed') {
        platformStats[d.platform].completed++;
      }
    });

    return {
      total,
      completed,
      failed,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgDuration: Math.round(avgDuration),
      activeDownloads: this.activeDownloads.size,
      platformStats
    };
  }

  getSupportedPlatforms() {
    return Object.entries(this.supportedPlatforms).map(([key, value]) => ({
      id: key,
      ...value
    }));
  }

  cancelDownload(downloadId) {
    const download = this.activeDownloads.get(downloadId);
    if (!download) {
      return { success: false, error: '下载任务不存在' };
    }

    download.status = 'cancelled';
    this.activeDownloads.delete(downloadId);

    return { success: true, message: '下载已取消' };
  }

  generateId() {
    return `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConfig() {
    return { ...this.config };
  }
}

const videoDownloaderService = new VideoDownloaderService();

module.exports = {
  VideoDownloaderService,
  videoDownloaderService
};
