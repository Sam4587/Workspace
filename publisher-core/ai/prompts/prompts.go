package prompts

import (
	"fmt"
	"strings"

	"github.com/monkeycode/publisher-core/ai/provider"
)

const (
	RoleContentCreator = "你是一位专业的内容创作者，擅长撰写吸引人的文章和社交媒体内容。"
	RoleHotspotAnalyst = "你是一位热点分析专家，擅长分析新闻热点、提取关键信息、判断趋势走向。"
	RoleContentAuditor = "你是一位内容审核专家，擅长识别内容中的敏感信息、违规内容和潜在风险。"
	RoleSEOExpert      = "你是一位SEO优化专家，擅长优化内容以提高搜索引擎排名和社交媒体曝光率。"
)

type PromptTemplate struct {
	System string
	User   string
}

var Templates = map[string]PromptTemplate{
	"generate_content": {
		System: RoleContentCreator,
		User: `请根据以下要求生成内容：

主题：{{.Topic}}
平台：{{.Platform}}
风格：{{.Style}}
字数要求：{{.Length}}字左右

请生成一篇适合{{.Platform}}平台发布的{{.Style}}风格的内容，包含标题和正文。
格式要求：
标题：[标题内容]
正文：
[正文内容]`,
	},

	"rewrite_content": {
		System: RoleContentCreator,
		User: `请将以下内容改写为{{.Style}}风格，适合{{.Platform}}平台发布：

原文：
{{.Content}}

要求：
1. 保持原文核心意思不变
2. 改变表达方式和语言风格
3. 字数控制在{{.Length}}字左右
4. 符合{{.Platform}}平台的内容规范

请直接输出改写后的内容。`,
	},

	"expand_content": {
		System: RoleContentCreator,
		User: `请将以下内容扩写，使其更加丰富详细：

原文：
{{.Content}}

要求：
1. 保持原文核心意思和风格
2. 增加细节、例子或论据
3. 扩写后字数约{{.Length}}字
4. 适合{{.Platform}}平台发布

请输出扩写后的完整内容。`,
	},

	"summarize_content": {
		System: RoleContentCreator,
		User: `请对以下内容进行摘要：

{{.Content}}

要求：
1. 提取核心要点
2. 摘要字数控制在{{.Length}}字以内
3. 语言简洁明了

请输出摘要内容。`,
	},

	"analyze_hotspot": {
		System: RoleHotspotAnalyst,
		User: `请分析以下热点话题：

标题：{{.Title}}
内容：{{.Content}}

请从以下维度进行分析：
1. 事件摘要（50字以内）
2. 关键要点（3-5个要点）
3. 情感倾向（正面/负面/中性）
4. 相关性评分（1-10分，表示对普通用户的相关程度）
5. 内容创作建议（2-3条建议）
6. 推荐标签（3-5个标签）

请以JSON格式输出：
{
  "summary": "事件摘要",
  "key_points": ["要点1", "要点2"],
  "sentiment": "情感倾向",
  "relevance": 评分数字,
  "suggestions": ["建议1", "建议2"],
  "tags": ["标签1", "标签2"]
}`,
	},

	"audit_content": {
		System: RoleContentAuditor,
		User: `请审核以下内容是否存在问题：

{{.Content}}

请检查以下方面：
1. 是否包含敏感词汇或违规内容
2. 是否存在事实错误
3. 是否有不当表述
4. 是否适合公开平台发布

请以JSON格式输出：
{
  "passed": true/false,
  "issues": ["问题1", "问题2"],
  "suggestions": ["修改建议1", "修改建议2"],
  "score": 合规评分(0-100)
}`,
	},

	"extract_keywords": {
		System: RoleSEOExpert,
		User: `请从以下内容中提取关键词：

{{.Content}}

要求：
1. 提取5-10个核心关键词
2. 关键词应具有搜索价值
3. 适合作为标签使用

请以JSON数组格式输出关键词列表。`,
	},

	"generate_title": {
		System: RoleSEOExpert,
		User: `请为以下内容生成3个吸引人的标题：

{{.Content}}

平台：{{.Platform}}

要求：
1. 标题吸引眼球但不标题党
2. 符合{{.Platform}}平台特点
3. 每个标题不超过30字

请以JSON数组格式输出标题列表。`,
	},
}

func GetTemplate(name string) (PromptTemplate, bool) {
	t, ok := Templates[name]
	return t, ok
}

func BuildPrompt(templateName string, vars map[string]string) ([]provider.Message, error) {
	tmpl, ok := Templates[templateName]
	if !ok {
		return nil, fmt.Errorf("template not found: %s", templateName)
	}

	user := tmpl.User

	for k, v := range vars {
		placeholder := fmt.Sprintf("{{.%s}}", k)
		user = strings.ReplaceAll(user, placeholder, v)
	}

	return []provider.Message{
		{Role: provider.RoleSystem, Content: tmpl.System},
		{Role: provider.RoleUser, Content: user},
	}, nil
}
