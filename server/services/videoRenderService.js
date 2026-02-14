const { renderMedia, selectCodec } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

class VideoRenderService {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'public', 'videos');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async renderVideo(options) {
    const {
      compositionId,
      props,
      outputFormat = 'mp4',
      quality = 80,
      fps = 30,
      width = 1920,
      height = 1080,
    } = options;

    const outputFilename = `${Date.now()}-${compositionId}.${outputFormat}`;
    const outputPath = path.join(this.outputDir, outputFilename);

    try {
      const result = await renderMedia({
        compositionId,
        inputProps: props,
        outputLocation: outputPath,
        codec: selectCodec(outputFormat),
        fps,
        width,
        height,
        quality,
        logLevel: 'info',
      });

      return {
        success: true,
        outputPath,
        outputUrl: `/videos/${outputFilename}`,
        duration: result.duration,
      };
    } catch (error) {
      console.error('Video render error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async renderPreview(options) {
    const {
      compositionId,
      props,
      frame = 0,
    } = options;

    try {
      const previewImage = await this.renderFrame({
        compositionId,
        inputProps: props,
        frameNumber: frame,
      });

      return {
        success: true,
        previewImage,
      };
    } catch (error) {
      console.error('Preview render error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  getOutputDir() {
    return this.outputDir;
  }
}

module.exports = new VideoRenderService();
