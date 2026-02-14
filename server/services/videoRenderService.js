const { renderMedia, selectCodec, renderStill } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

class VideoRenderService {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'public', 'videos');
    this.previewDir = path.join(process.cwd(), 'public', 'previews');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    if (!fs.existsSync(this.previewDir)) {
      fs.mkdirSync(this.previewDir, { recursive: true });
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

    const outputFilename = `preview_${Date.now()}.png`;
    const outputPath = path.join(this.previewDir, outputFilename);

    try {
      await renderStill({
        compositionId,
        inputProps: props,
        frame: frame,
        output: outputPath,
      });

      return {
        success: true,
        previewUrl: `/previews/${outputFilename}`,
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
