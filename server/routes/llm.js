const express = require('express');
const router = express.Router();
const llmGateway = require('../llm');

router.get('/providers', (req, res) => {
  const providers = llmGateway.getAllProviders();
  res.json({
    success: true,
    data: providers,
  });
});

router.get('/providers/available', (req, res) => {
  const providers = llmGateway.getAvailableProviders();
  res.json({
    success: true,
    data: providers,
  });
});

router.get('/models', (req, res) => {
  const models = llmGateway.getModels();
  res.json({
    success: true,
    data: models,
  });
});

router.post('/generate', async (req, res) => {
  try {
    const { messages, model, provider, ...options } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'messages is required and must be an array',
      });
    }

    const result = await llmGateway.generate(messages, {
      model,
      provider,
      ...options,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('LLM generate error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get('/health', async (req, res) => {
  try {
    const health = await llmGateway.healthCheck();
    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
