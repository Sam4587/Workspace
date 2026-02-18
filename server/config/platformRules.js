const platformRules = {
  toutiao: {
    name: '今日头条',
    maxTitleLength: 30,
    forbiddenWords: ['最', '第一', '唯一', '绝对', '100%', '顶级', '最强'],
    requiredPatterns: [],
    recommendedPatterns: ['数字+悬念', '对比反差', '热点+观点', '疑问句']
  },
  douyin: {
    name: '抖音',
    maxTitleLength: 30,
    forbiddenWords: ['最', '第一', '唯一', '绝对', '100%', '顶级', '最强'],
    requiredPatterns: [],
    recommendedPatterns: ['口语化', '疑问句', '情绪化', '话题感']
  },
  xiaohongshu: {
    name: '小红书',
    maxTitleLength: 50,
    forbiddenWords: ['最', '第一', '唯一', '绝对', '100%'],
    requiredPatterns: [],
    recommendedPatterns: ['种草感', '个人体验', '情感共鸣', '干货型']
  }
};

module.exports = platformRules;
