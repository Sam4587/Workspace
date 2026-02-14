const path = require('path');
const fs = require('fs');
const axios = require('axios');

class TTSService {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'public', 'audio');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateSpeech(options) {
    const { text, provider = 'azure', voice, speed = 1.0 } = options;

    switch (provider) {
      case 'azure':
        return this.azureTTS(text, voice, speed);
      case 'aliyun':
        return this.aliyunTTS(text, voice, speed);
      case 'xfyun':
        return this.xfyunTTS(text, voice, speed);
      default:
        throw new Error(`Unknown TTS provider: ${provider}`);
    }
  }

  async azureTTS(text, voice = 'zh-CN-XiaoxiaoNeural', speed = 1.0) {
    const apiKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;

    if (!apiKey || !region) {
      throw new Error('Azure TTS configuration missing');
    }

    const ssml = `
      <speak version="1.0" xmlns="https://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
        <voice name="${voice}">
          <prosody rate="${(speed - 1) * 100}%">
            ${text}
          </prosody>
        </voice>
      </speak>
    `;

    try {
      const response = await axios({
        method: 'POST',
        url: `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        data: ssml,
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        },
        responseType: 'arraybuffer',
      });

      const outputFilename = `tts_${Date.now()}.mp3`;
      const outputPath = path.join(this.outputDir, outputFilename);
      
      fs.writeFileSync(outputPath, response.data);

      return {
        success: true,
        outputPath,
        outputUrl: `/audio/${outputFilename}`,
      };
    } catch (error) {
      console.error('Azure TTS error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async aliyunTTS(text, voice = 'xiaoyun', speed = 1.0) {
    const appKey = process.env.ALIYUN_TTS_APPKEY;
    const token = process.env.ALIYUN_TTS_TOKEN;

    if (!appKey || !token) {
      throw new Error('Aliyun TTS configuration missing');
    }

    console.log('Aliyun TTS not fully implemented - using placeholder');
    return {
      success: false,
      error: 'Aliyun TTS not implemented',
    };
  }

  async xfyunTTS(text, voice = 'xiaoyan', speed = 1.0) {
    const appId = process.env.XFYUN_TTS_APPID;
    const apiKey = process.env.XFYUN_TTS_APIKEY;

    if (!appId || !apiKey) {
      throw new Error('iFlytek TTS configuration missing');
    }

    console.log('iFlytek TTS not fully implemented - using placeholder');
    return {
      success: false,
      error: 'iFlytek TTS not implemented',
    };
  }

  getOutputDir() {
    return this.outputDir;
  }
}

module.exports = new TTSService();
