const express = require('express');
const router = express.Router();
const llmGateway = require('../services/llm');

router.get('/providers', (req, res) => {
  try {
    const providers = llmGateway.getAvailableProviders();
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/models/:provider?', (req, res) => {
  try {
    const { provider } = req.params;
    const models = provider 
      ? llmGateway.getModels(provider)
      : llmGateway.getAvailableProviders().flatMap(p => 
          p.models.map(m => ({ provider: p.name, model: m }))
        );
    
    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { messages, provider, model, temperature, maxTokens } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'messages 参数必须是数组'
      });
    }

    const result = await llmGateway.generate(messages, {
      provider,
      model,
      temperature,
      maxTokens
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { message, system, provider, model, temperature, maxTokens } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'message 参数不能为空'
      });
    }

    const messages = [];
    if (system) {
      messages.push({ role: 'system', content: system });
    }
    messages.push({ role: 'user', content: message });

    const result = await llmGateway.generate(messages, {
      provider,
      model,
      temperature,
      maxTokens
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/health', async (req, res) => {
  try {
    const results = await llmGateway.checkHealth();
    const allHealthy = Object.values(results).every(r => r.healthy);
    
    res.json({
      success: true,
      healthy: allHealthy,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/ollama/models', async (req, res) => {
  try {
    const models = await llmGateway.listOllamaModels();
    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/ollama/pull', async (req, res) => {
  try {
    const { model } = req.body;
    
    if (!model) {
      return res.status(400).json({
        success: false,
        message: 'model 参数不能为空'
      });
    }

    const result = await llmGateway.pullOllamaModel(model);
    res.json({
      success: result.success,
      message: result.success ? `模型 ${model} 拉取成功` : result.error
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
