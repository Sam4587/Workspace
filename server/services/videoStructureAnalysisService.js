const multiAIService = require('./multiAIService');
const logger = require('../utils/logger');

class VideoStructureAnalysisService {
  constructor() {
    this.structureTypes = {
      hook: { name: '开头钩子', description: '前3-5秒的吸引点', icon: '🎣' },
      setup: { name: '铺垫内容', description: '背景介绍和情境铺垫', icon: '📖' },
      climax: { name: '核心包袱', description: '高潮或反转部分', icon: '💥' },
      cta: { name: '结尾引导', description: '互动引导或关注引导', icon: '📢' }
    };
  }

  async analyzeStructure(transcript, metadata = {}) {
    try {
      logger.info('开始视频结构分析', { transcriptLength: transcript?.length });

      if (!transcript || transcript.trim().length === 0) {
        throw new Error('转录文本不能为空');
      }

      const structure = await this._identifyStructure(transcript, metadata);
      const rhythm = await this._analyzeRhythm(transcript, structure);
      const viralElements = await this._identifyViralElements(transcript, structure);
      const suggestions = this._generateSuggestions(structure, rhythm, viralElements);
      const overallScore = this._calculateOverallScore(structure, rhythm, viralElements);
      const viralPotential = this._assessViralPotential(viralElements);

      const result = {
        structure,
        rhythm,
        viralElements,
        overallScore,
        viralPotential,
        suggestions,
        analyzedAt: new Date().toISOString()
      };

      logger.info('视频结构分析完成', { overallScore, viralPotential });

      return result;
    } catch (error) {
      logger.error('视频结构分析失败', { error: error.message });
      throw error;
    }
  }

  async _identifyStructure(transcript, metadata) {
    const prompt = `你是一个专业的短视频内容分析师。请分析以下视频转录文本，识别其结构组成。

视频信息：
- 时长：${metadata.duration || '未知'}
- 平台：${metadata.platform || '未知'}

转录文本：
"""
${transcript}
"""

请按以下四个部分进行分析，每个部分需要：
1. 提取该部分的具体内容（原文引用）
2. 评估该部分的得分（0-100分）
3. 估算该部分的时间范围（如果有线索）

四个部分说明：
- hook（开头钩子）：前3-5秒的吸引点，用于抓住观众注意力
- setup（铺垫内容）：背景介绍和情境铺垫，为高潮做准备
- climax（核心包袱）：高潮或反转部分，视频的核心价值点
- cta（结尾引导）：互动引导或关注引导，促进用户行为

请严格按照以下JSON格式返回，不要添加任何其他内容：
{
  "hook": {
    "content": "开头钩子的具体内容",
    "score": 85,
    "startTime": "00:00",
    "endTime": "00:05",
    "analysis": "简要分析为什么这样评分"
  },
  "setup": {
    "content": "铺垫内容的具体内容",
    "score": 70,
    "startTime": "00:05",
    "endTime": "00:20",
    "analysis": "简要分析"
  },
  "climax": {
    "content": "核心包袱的具体内容",
    "score": 90,
    "startTime": "00:20",
    "endTime": "00:45",
    "analysis": "简要分析"
  },
  "cta": {
    "content": "结尾引导的具体内容",
    "score": 60,
    "startTime": "00:45",
    "endTime": "00:50",
    "analysis": "简要分析"
  }
}`;

    try {
      const response = await multiAIService.generateContent(prompt, {
        temperature: 0.3,
        maxTokens: 1500
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this._getDefaultStructure();
    } catch (error) {
      logger.error('结构识别失败', { error: error.message });
      return this._getDefaultStructure();
    }
  }

  async _analyzeRhythm(transcript, structure) {
    const totalLength = transcript.length;
    const sections = Object.values(structure);
    
    const avgSectionScore = sections.reduce((sum, s) => sum + (s.score || 0), 0) / sections.length;
    
    const pace = {
      overall: avgSectionScore >= 70 ? 'good' : avgSectionScore >= 50 ? 'moderate' : 'needs_improvement',
      score: Math.round(avgSectionScore),
      description: this._getPaceDescription(avgSectionScore)
    };

    const emotionalCurve = await this._analyzeEmotionalCurve(transcript);
    const informationDensity = this._calculateInfoDensity(transcript);

    return {
      pace,
      emotionalCurve,
      informationDensity,
      totalLength,
      estimatedDuration: Math.ceil(totalLength / 10)
    };
  }

  async _analyzeEmotionalCurve(transcript) {
    const prompt = `分析以下文本的情感曲线，识别情感高低点：

文本：
"""
${transcript.slice(0, 1000)}
"""

请返回JSON格式：
{
  "curve": [
    { "position": 0, "emotion": "neutral", "intensity": 5 },
    { "position": 25, "emotion": "curious", "intensity": 7 },
    { "position": 50, "emotion": "excited", "intensity": 9 },
    { "position": 75, "emotion": "satisfied", "intensity": 6 },
    { "position": 100, "emotion": "neutral", "intensity": 4 }
  ],
  "peakPosition": 50,
  "emotionTypes": ["curious", "excited", "satisfied"]
}`;

    try {
      const response = await multiAIService.generateContent(prompt, {
        temperature: 0.3,
        maxTokens: 500
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn('情感曲线分析失败', { error: error.message });
    }

    return {
      curve: [
        { position: 0, emotion: 'neutral', intensity: 5 },
        { position: 50, emotion: 'engaged', intensity: 7 },
        { position: 100, emotion: 'neutral', intensity: 5 }
      ],
      peakPosition: 50,
      emotionTypes: ['neutral', 'engaged']
    };
  }

  _calculateInfoDensity(transcript) {
    const sentences = transcript.split(/[。！？.!?]/).filter(s => s.trim());
    const avgSentenceLength = transcript.length / Math.max(sentences.length, 1);
    
    const keywords = transcript.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    const uniqueKeywords = [...new Set(keywords)];
    
    return {
      sentenceCount: sentences.length,
      avgSentenceLength: Math.round(avgSentenceLength),
      keywordCount: uniqueKeywords.length,
      density: avgSentenceLength > 30 ? 'high' : avgSentenceLength > 15 ? 'medium' : 'low'
    };
  }

  async _identifyViralElements(transcript, structure) {
    const prompt = `你是一个短视频爆款分析专家。请分析以下视频内容，识别可能引发传播的爆款元素。

转录文本：
"""
${transcript.slice(0, 1500)}
"""

结构评分：
- 开头钩子：${structure.hook?.score || 0}分
- 铺垫内容：${structure.setup?.score || 0}分
- 核心包袱：${structure.climax?.score || 0}分
- 结尾引导：${structure.cta?.score || 0}分

请识别以下爆款元素，并返回JSON格式：
{
  "emotionalTriggers": [
    { "type": "共鸣", "content": "具体内容", "strength": "high/medium/low" }
  ],
  "controversyPoints": [
    { "type": "争议", "content": "具体内容", "risk": "high/medium/low" }
  ],
  "practicalValue": [
    { "type": "实用", "content": "具体内容", "usefulness": "high/medium/low" }
  ],
  "entertainmentElements": [
    { "type": "娱乐", "content": "具体内容", "appeal": "high/medium/low" }
  ],
  "sharingMotivations": [
    { "type": "分享动机", "content": "具体内容", "likelihood": "high/medium/low" }
  ],
  "viralScore": 75,
  "viralPotential": "high/medium/low",
  "keyFactors": ["因素1", "因素2", "因素3"]
}`;

    try {
      const response = await multiAIService.generateContent(prompt, {
        temperature: 0.3,
        maxTokens: 800
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn('爆款元素识别失败', { error: error.message });
    }

    return {
      emotionalTriggers: [],
      controversyPoints: [],
      practicalValue: [],
      entertainmentElements: [],
      sharingMotivations: [],
      viralScore: 50,
      viralPotential: 'medium',
      keyFactors: []
    };
  }

  _generateSuggestions(structure, rhythm, viralElements) {
    const suggestions = [];

    if (structure.hook && structure.hook.score < 70) {
      suggestions.push({
        type: 'hook',
        priority: 'high',
        title: '优化开头钩子',
        suggestion: '开头钩子吸引力不足，建议在前3秒加入更强的吸引元素',
        examples: ['使用悬念开头："你绝对想不到..."', '提出问题："为什么..."', '展示惊人数据或结果'],
        impact: '可提升观众留存率20-30%'
      });
    }

    if (structure.setup && structure.setup.score < 60) {
      suggestions.push({
        type: 'setup',
        priority: 'medium',
        title: '优化铺垫内容',
        suggestion: '铺垫部分过于冗长或缺乏吸引力，建议精简并增加悬念',
        examples: ['缩短背景介绍', '在铺垫中埋下伏笔', '使用"但是"制造转折预期'],
        impact: '可提升观众继续观看意愿'
      });
    }

    if (structure.climax && structure.climax.score < 70) {
      suggestions.push({
        type: 'climax',
        priority: 'high',
        title: '强化核心包袱',
        suggestion: '核心内容不够突出或缺乏冲击力，建议增加反转或惊喜元素',
        examples: ['添加意外转折', '强化情感表达', '使用对比手法'],
        impact: '可显著提升传播潜力'
      });
    }

    if (structure.cta && structure.cta.score < 60) {
      suggestions.push({
        type: 'cta',
        priority: 'medium',
        title: '优化结尾引导',
        suggestion: '结尾引导不够明确，建议添加清晰的互动引导',
        examples: ['点赞关注引导："如果觉得有用，点个赞吧"', '评论互动引导："你怎么看？评论区告诉我"', '分享转发引导："转发给需要的朋友"'],
        impact: '可提升互动率15-25%'
      });
    }

    if (viralElements.viralScore < 50) {
      suggestions.push({
        type: 'viral',
        priority: 'high',
        title: '提升爆款潜力',
        suggestion: '内容缺乏传播动机，建议增加引发分享的元素',
        examples: ['添加争议性观点引发讨论', '增加情感共鸣点', '提供高实用价值内容'],
        impact: '可提升分享率30-50%'
      });
    }

    if (rhythm.pace.overall === 'needs_improvement') {
      suggestions.push({
        type: 'rhythm',
        priority: 'medium',
        title: '优化内容节奏',
        suggestion: '内容节奏需要优化，建议调整各部分时长比例',
        examples: ['开头控制在3-5秒', '铺垫不超过总时长的30%', '核心内容占40-50%'],
        impact: '可提升整体观看体验'
      });
    }

    return suggestions;
  }

  _calculateOverallScore(structure, rhythm, viralElements) {
    const structureScore = Object.values(structure).reduce((sum, s) => sum + (s.score || 0), 0) / 4;
    const viralScore = viralElements.viralScore || 50;
    const rhythmScore = rhythm.pace?.score || 50;

    return Math.round(structureScore * 0.5 + viralScore * 0.3 + rhythmScore * 0.2);
  }

  _assessViralPotential(viralElements) {
    const score = viralElements.viralScore || 50;
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  _getPaceDescription(score) {
    if (score >= 80) return '节奏紧凑，各部分衔接流畅';
    if (score >= 60) return '节奏适中，整体较为协调';
    if (score >= 40) return '节奏一般，部分环节需要优化';
    return '节奏松散，建议重新规划内容结构';
  }

  _getDefaultStructure() {
    return {
      hook: { content: '', score: 50, startTime: '00:00', endTime: '00:05', analysis: '未能识别' },
      setup: { content: '', score: 50, startTime: '00:05', endTime: '00:20', analysis: '未能识别' },
      climax: { content: '', score: 50, startTime: '00:20', endTime: '00:45', analysis: '未能识别' },
      cta: { content: '', score: 50, startTime: '00:45', endTime: '00:50', analysis: '未能识别' }
    };
  }

  async batchAnalyze(videos) {
    const results = [];
    for (const video of videos) {
      try {
        const result = await this.analyzeStructure(video.transcript, video.metadata);
        results.push({ id: video.id, success: true, data: result });
      } catch (error) {
        results.push({ id: video.id, success: false, error: error.message });
      }
    }
    return results;
  }
}

module.exports = new VideoStructureAnalysisService();
