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

module.exports = router;
