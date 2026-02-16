/**
 * Remotion视频渲染服务
 * 负责视频的服务器端渲染和管理
 */

const { bundle } = require('@remotion/bundler');
const { getCompositions, renderMedia } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class VideoRenderer {
  constructor() {
    this.bundled = null;
    this.outputDir = path.join(process.cwd(), 'storage', 'videos');
    this.ensureOutputDir();
  }

  async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('创建视频输出目录失败:', error);
    }
  }

  /**
   * 打包Remotion项目
   */
  async bundleProject() {
    if (this.bundled) {
      return this.bundled;
    }

    console.log('正在打包Remotion项目...');
    const entry = path.join(__dirname, 'index.jsx');
    
    try {
      this.bundled = await bundle(entry, () => undefined, {
        webpackOverride: (config) => config,
      });
      console.log('Remotion项目打包完成');
      return this.bundled;
    } catch (error) {
      console.error('打包失败:', error);
      throw error;
    }
  }

  /**
   * 获取可用的视频模板
   */
  async getTemplates() {
    const bundled = await this.bundleProject();
    const compositions = await getCompositions(bundled, {
      inputProps: {},
    });

    return compositions.map(comp => ({
      id: comp.id,
      durationInFrames: comp.durationInFrames,
      fps: comp.fps,
      width: comp.width,
      height: comp.height,
      defaultProps: this.getDefaultProps(comp.id)
    }));
  }

  /**
   * 获取模板默认属性
   */
  getDefaultProps(templateId) {
    const defaultProps = {
      ArticleVideo: {
        title: '默认标题',
        subtitle: '默认副标题',
        content: '这是默认的视频内容...',
        images: [],
        backgroundMusic: null
      },
      MicroVideo: {
        title: '默认微头条标题',
        content: '这是默认的微头条内容...\n支持多行文本展示',
        avatar: null,
        username: '创作者',
        time: '刚刚',
        likes: 0,
        comments: 0,
        shares: 0
      }
    };

    return defaultProps[templateId] || {};
  }

  /**
   * 渲染视频
   */
  async renderVideo(templateId, props = {}, options = {}) {
    const renderId = uuidv4();
    const startTime = Date.now();

    try {
      console.log(`开始渲染视频: ${templateId}`, { renderId });

      const bundled = await this.bundleProject();
      
      // 获取模板信息
      const templates = await this.getTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error(`未找到模板: ${templateId}`);
      }

      // 合并默认属性和传入属性
      const finalProps = { ...this.getDefaultProps(templateId), ...props };

      // 设置输出文件路径
      const outputFile = path.join(
        this.outputDir, 
        `${templateId}_${renderId}.mp4`
      );

      // 执行渲染
      await renderMedia({
        serveUrl: bundled,
        composition: {
          id: templateId,
          durationInFrames: template.durationInFrames,
          fps: template.fps,
          width: template.width,
          height: template.height,
        },
        outputLocation: outputFile,
        inputProps: finalProps,
        codec: 'h264',
        quality: options.quality || 80,
        frameRange: options.frameRange || null,
      });

      const duration = Date.now() - startTime;
      const fileSize = (await fs.stat(outputFile)).size;

      console.log(`视频渲染完成: ${templateId}`, {
        renderId,
        duration: `${(duration / 1000).toFixed(2)}s`,
        fileSize: `${(fileSize / 1024 / 1024).toFixed(2)}MB`,
        outputFile
      });

      return {
        success: true,
        renderId,
        templateId,
        outputFile,
        duration,
        fileSize,
        props: finalProps
      };

    } catch (error) {
      console.error(`视频渲染失败: ${templateId}`, {
        renderId,
        error: error.message
      });

      throw new Error(`渲染失败: ${error.message}`);
    }
  }

  /**
   * 批量渲染视频
   */
  async batchRender(tasks) {
    const results = [];
    
    for (const task of tasks) {
      try {
        const result = await this.renderVideo(
          task.templateId, 
          task.props, 
          task.options
        );
        results.push({ ...result, status: 'success' });
      } catch (error) {
        results.push({
          templateId: task.templateId,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 获取渲染状态
   */
  async getRenderStatus(renderId) {
    // 在实际实现中，这里会查询渲染任务的状态
    // 目前返回模拟数据
    return {
      renderId,
      status: 'completed',
      progress: 100
    };
  }

  /**
   * 获取已渲染的视频列表
   */
  async getRenderedList() {
    try {
      const files = await fs.readdir(this.outputDir);
      const videoFiles = files.filter(file => 
        file.endsWith('.mp4') || file.endsWith('.mov')
      );

      const videoList = await Promise.all(
        videoFiles.map(async (file) => {
          const filePath = path.join(this.outputDir, file);
          const stats = await fs.stat(filePath);
          
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
          };
        })
      );

      return videoList.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('获取视频列表失败:', error);
      return [];
    }
  }
}

// 单例实例
const videoRenderer = new VideoRenderer();

module.exports = {
  VideoRenderer,
  videoRenderer
};