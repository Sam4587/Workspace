const express = require('express');
const router = express.Router();
const { sparseFrameService } = require('../services/sparseFrameService');
const { cfgService } = require('../services/cfgService');
const { identityPreservationService } = require('../services/identityPreservationService');
const { modularArchitectureService } = require('../services/modularArchitectureService');
const logger = require('../utils/logger');

router.get('/sparse-frame/stats', (req, res) => {
  try {
    const stats = sparseFrameService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/sparse-frame/analyze', async (req, res) => {
  try {
    const { videoPath, options } = req.body;
    const result = await sparseFrameService.analyzeVideo(videoPath, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/sparse-frame/process', async (req, res) => {
  try {
    const { videoPath, strategy, options } = req.body;
    const result = await sparseFrameService.processVideo(videoPath, strategy, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/sparse-frame/batch', async (req, res) => {
  try {
    const { videoPaths, options } = req.body;
    const result = await sparseFrameService.batchProcess(videoPaths, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/cfg/models', (req, res) => {
  try {
    const models = cfgService.getAllModels();
    res.json({ success: true, data: models });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/cfg/optimize', async (req, res) => {
  try {
    const result = await cfgService.optimizeParameters(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/cfg/generate', async (req, res) => {
  try {
    const result = await cfgService.generateWithCFG(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/cfg/batch', async (req, res) => {
  try {
    const { items, options } = req.body;
    const result = await cfgService.batchGenerate(items, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/cfg/compare', (req, res) => {
  try {
    const { params1, params2 } = req.body;
    const result = cfgService.compareParameters(params1, params2);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/cfg/history', (req, res) => {
  try {
    const { limit } = req.query;
    const history = cfgService.getHistory({ limit: limit ? parseInt(limit) : 50 });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/cfg/stats', (req, res) => {
  try {
    const stats = cfgService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/identity/extract', async (req, res) => {
  try {
    const { imagePath, options } = req.body;
    const result = await identityPreservationService.extractFeatures(imagePath, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/identity/register', async (req, res) => {
  try {
    const { identityId, features, metadata } = req.body;
    const result = await identityPreservationService.registerIdentity(identityId, features, metadata);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/identity/track', async (req, res) => {
  try {
    const { identityId, frames } = req.body;
    const result = await identityPreservationService.trackIdentity(identityId, frames);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/identity/verify', async (req, res) => {
  try {
    const { identityId, imagePath } = req.body;
    const result = await identityPreservationService.verifyIdentity(identityId, imagePath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/identity/compare', async (req, res) => {
  try {
    const { identityId1, identityId2 } = req.body;
    const result = await identityPreservationService.compareIdentities(identityId1, identityId2);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/identity/:identityId', (req, res) => {
  try {
    const identity = identityPreservationService.getIdentity(req.params.identityId);
    if (!identity) {
      return res.status(404).json({ success: false, error: '身份不存在' });
    }
    res.json({ success: true, data: identity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/identity/:identityId', (req, res) => {
  try {
    const result = identityPreservationService.deleteIdentity(req.params.identityId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/identity', (req, res) => {
  try {
    const { tags, limit } = req.query;
    const identities = identityPreservationService.listIdentities({
      tags: tags ? tags.split(',') : [],
      limit: limit ? parseInt(limit) : 50
    });
    res.json({ success: true, data: identities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/identity/stats', (req, res) => {
  try {
    const stats = identityPreservationService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/modular/modules', (req, res) => {
  try {
    const modules = modularArchitectureService.listModules();
    res.json({ success: true, data: modules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/modular/modules', (req, res) => {
  try {
    const { moduleId, config } = req.body;
    const result = modularArchitectureService.registerModule(moduleId, config);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/modular/modules/:moduleId', (req, res) => {
  try {
    const module = modularArchitectureService.getModule(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ success: false, error: '模块不存在' });
    }
    res.json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/modular/modules/:moduleId', (req, res) => {
  try {
    const result = modularArchitectureService.unregisterModule(req.params.moduleId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/modular/execute/:moduleId', async (req, res) => {
  try {
    const { input, options } = req.body;
    const result = await modularArchitectureService.executeModule(req.params.moduleId, input, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/modular/interfaces', (req, res) => {
  try {
    const interfaces = modularArchitectureService.listInterfaces();
    res.json({ success: true, data: interfaces });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/modular/pipelines', (req, res) => {
  try {
    const { pipelineId, stages } = req.body;
    const result = modularArchitectureService.createPipeline(pipelineId, stages);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/modular/pipelines/:pipelineId/execute', async (req, res) => {
  try {
    const { input, options } = req.body;
    const result = await modularArchitectureService.executePipeline(req.params.pipelineId, input, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/modular/pipelines', (req, res) => {
  try {
    const pipelines = modularArchitectureService.listPipelines();
    res.json({ success: true, data: pipelines });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/modular/connect', (req, res) => {
  try {
    const { sourceId, targetId, transform } = req.body;
    const result = modularArchitectureService.connectModules(sourceId, targetId, transform);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/modular/health', async (req, res) => {
  try {
    const health = await modularArchitectureService.checkAllHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/modular/stats', (req, res) => {
  try {
    const stats = modularArchitectureService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
