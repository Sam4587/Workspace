/**
 * Mock PublishRecord Model
 * 用于测试和开发的内存数据模型
 */

class MockPublishRecordModel {
  constructor() {
    this.data = [];
    this.idCounter = 1;
  }

  async aggregate(pipeline) {
    // 模拟聚合查询
    // 根据聚合阶段处理数据
    let result = [...this.data];
    
    for (const stage of pipeline) {
      if (stage.$match) {
        result = result.filter(item => {
          for (const key in stage.$match) {
            if (key === 'status' && item.status !== stage.$match.status) return false;
            if (key === 'publishTime' && stage.$match.publishTime.$gte) {
              if (new Date(item.publishTime) < stage.$match.publishTime.$gte) return false;
            }
          }
          return true;
        });
      }
      
      if (stage.$group) {
        // 简化的聚合逻辑
        const groups = {};
        result.forEach(item => {
          let groupKey = 'all';
          if (stage.$group._id && stage.$group._id.$dateToString) {
            const dateField = stage.$group._id.$dateToString.date.replace('$', '');
            const format = stage.$group._id.$dateToString.format;
            const date = new Date(item[dateField]);
            if (format === '%Y-%m-%d') {
              groupKey = date.toISOString().split('T')[0];
            } else if (format === '%m-%d') {
              const parts = date.toISOString().split('T')[0].split('-');
              groupKey = `${parts[1]}-${parts[2]}`;
            }
          }
          
          if (!groups[groupKey]) {
            groups[groupKey] = { _id: groupKey };
            // 初始化求和字段
            for (const field in stage.$group) {
              if (field !== '_id' && stage.$group[field].$sum) {
                groups[groupKey][field] = 0;
              }
            }
          }
          
          // 累加求和
          for (const field in stage.$group) {
            if (field !== '_id' && stage.$group[field].$sum) {
              const sumField = stage.$group[field].$sum;
              if (typeof sumField === 'number') {
                groups[groupKey][field] += sumField;
              } else if (sumField.startsWith('$')) {
                const fieldName = sumField.substring(1);
                const value = this.getNestedValue(item, fieldName);
                groups[groupKey][field] += (value || 0);
              }
            }
          }
        });
        
        result = Object.values(groups);
      }
      
      if (stage.$sort) {
        if (stage.$sort._id) {
          const order = stage.$sort._id;
          result.sort((a, b) => order === 1 ? (a._id > b._id ? 1 : -1) : (a._id < b._id ? 1 : -1));
        }
      }
      
      if (stage.$limit) {
        result = result.slice(0, stage.$limit);
      }
    }
    
    return result;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  async countDocuments(query = {}) {
    return this.data.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    }).length;
  }

  async create(doc) {
    const newDoc = {
      _id: `publish_${this.idCounter++}`,
      ...doc,
      publishTime: new Date().toISOString()
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
}

module.exports = new MockPublishRecordModel();
