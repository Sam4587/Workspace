/**
 * LLM Gateway 统一入口
 * 转发到新的模块化实现
 */

const llmGateway = require('./llm/LLMGateway');

module.exports = llmGateway;
