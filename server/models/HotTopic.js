/**
 * Mock HotTopic Model
 * 用于测试和开发的内存数据模型
 */

class MockHotTopicModel {
  constructor() {
    this.data = [];
    this.idCounter = 1;
  }

  async aggregate(pipeline) {
    // 模拟聚合查询
    return [];
  }

  async countDocuments(query = {}) {
    return this.data.filter(item => {
      if (query.createdAt && query.createdAt.$gte) {
        return new Date(item.createdAt) >= query.createdAt.$gte;
      }
      return true;
    }).length;
  }

  async create(doc) {
    const newDoc = {
      _id: `topic_${this.idCounter++}`,
      ...doc,
      createdAt: new Date().toISOString()
    };
    this.data.push(newDoc);
    return newDoc;
  }

  async find(query = {}) {
    return this.data.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  }

  async findById(id) {
    return this.data.find(item => item._id === id);
  }
}

module.exports = new MockHotTopicModel();
