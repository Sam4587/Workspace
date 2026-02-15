/**
 * 视频内容分析 Prompt 模板
 * 用于视频转录内容的分析、总结和改写
 */

module.exports = {
  // ========== 内容分析（通用）==========
  SUMMARY_PROMPT: `请分析以下视频转录内容，生成：
1. 一段200字以内的核心摘要
2. 3-5个关键观点（带时间戳，如果有）
3. 2-3句金句

转录内容：
{transcript}

请以JSON格式输出：
{"summary": "核心摘要", "keyPoints": ["观点1", "观点2"], "quotes": ["金句1", "金句2"]}`,

  // ========== 小红书风格 ==========
  XIAOHONGSHU_REWRITE: `基于以下视频内容，创作一篇小红书风格的图文笔记：

要求：
- 标题要有吸引力，最多20字
- 正文口语化，使用emoji，最多1000字
- 开头要有互动感（"姐妹们"、"绝了"等）
- 结尾引导互动（点赞收藏）
- 生成3-5个话题标签

原始内容：
{summary}

输出JSON格式：
{"title": "", "content": "", "tags": []}`,

  // ========== 抖音风格 ==========
  DOUYIN_SCRIPT: `基于以下视频内容，创作一个抖音短视频脚本：

要求：
- 开头3秒钩子（吸引注意力）
- 核心内容60秒内讲完
- 结尾引导互动（点赞关注）
- 适合口播的口语化表达

原始内容：
{summary}

输出JSON格式：
{"hook": "", "mainContent": "", "cta": "", "suggestedDuration": 60}`,

  // ========== 今日头条风格 ==========
  TOUTIAO_ARTICLE: `基于以下视频内容，创作一篇今日头条风格的文章：

要求：
- 标题吸引眼球，最多30字
- 正文专业严谨，最多2000字
- 结构清晰（引言-正文-结语）
- 可选：生成微头条版本（300字以内）

原始内容：
{summary}

输出JSON格式：
{"title": "", "content": "", "microContent": "", "tags": []}`,

  // ========== 批量生成 ==========
  MULTI_PLATFORM: `基于以下视频内容，同时生成小红书、抖音、今日头条三个平台的文案：

原始内容：{summary}

输出JSON格式：
{
  "xiaohongshu": {"title": "", "content": "", "tags": []},
  "douyin": {"hook": "", "mainContent": "", "cta": ""},
  "toutiao": {"title": "", "content": "", "microContent": "", "tags": []}
}`,

  // ========== 关键词提取 ==========
  KEYWORD_EXTRACTION: `从以下内容中提取5-10个关键词，用于内容标签：

内容：
{transcript}

输出JSON格式：
{"keywords": ["关键词1", "关键词2", ...]}`,

  // ========== 内容分类 ==========
  CONTENT_CLASSIFICATION: `分析以下视频内容，判断其所属类别：

内容：
{transcript}

可选类别：科技、财经、娱乐、教育、生活、美食、旅游、健康、体育、汽车、房产、其他

输出JSON格式：
{"category": "类别", "confidence": 0.95}`,

  // ========== 情感分析 ==========
  SENTIMENT_ANALYSIS: `分析以下视频内容的情感倾向：

内容：
{transcript}

输出JSON格式：
{"sentiment": "positive/neutral/negative", "emotion": "情感描述", "intensity": 0.8}`,

  // ========== 内容质量评估 ==========
  QUALITY_ASSESSMENT: `评估以下视频转录内容的质量：

内容：
{transcript}

从以下维度评估（1-10分）：
- 信息量
- 可读性
- 时效性
- 争议性
- 传播性

输出JSON格式：
{"scores": {"信息量": 8, "可读性": 7, ...}, "overallScore": 7.5, "recommendation": "推荐理由"}`
};
