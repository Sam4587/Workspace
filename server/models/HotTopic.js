/**
 * Mock HotTopic Model
 * 用于测试和开发的内存数据模型
 */

class MockHotTopicModel {
  constructor() {
    this.data = [];
    this.idCounter = 1;
  }

  _applyQueryFilter(items, query) {
    if (!query || Object.keys(query).length === 0) {
      return items;
    }

    return items.filter(item => {
      for (const key in query) {
        const queryValue = query[key];

        if (key === '$and') {
          if (!this._applyQueryFilter([item], queryValue)[0]) return false;
          continue;
        }

        if (key === '$or') {
          const orResult = queryValue.some(condition => this._applyQueryFilter([item], condition)[0]);
          if (!orResult) return false;
          continue;
        }

        if (queryValue === null || queryValue === undefined) {
          if (item[key] !== null && item[key] !== undefined) return false;
          continue;
        }

        if (typeof queryValue === 'object' && !Array.isArray(queryValue)) {
          if (queryValue.$in) {
            if (!queryValue.$in.includes(item[key])) return false;
            continue;
          }
          if (queryValue.$gte !== undefined) {
            if (item[key] < queryValue.$gte) return false;
            continue;
          }
          if (queryValue.$lte !== undefined) {
            if (item[key] > queryValue.$lte) return false;
            continue;
          }
          if (queryValue.$gt !== undefined) {
            if (item[key] <= queryValue.$gt) return false;
            continue;
          }
          if (queryValue.$lt !== undefined) {
            if (item[key] >= queryValue.$lt) return false;
            continue;
          }
          if (queryValue.$regex) {
            const regex = new RegExp(queryValue.$regex, queryValue.$options || '');
            if (!regex.test(item[key])) return false;
            continue;
          }
          if (queryValue.$exists !== undefined) {
            const exists = item[key] !== undefined;
            if (exists !== queryValue.$exists) return false;
            continue;
          }
        }

        if (item[key] !== queryValue) return false;
      }
      return true;
    });
  }

  async aggregate(pipeline) {
    let result = [...this.data];

    for (const stage of pipeline) {
      if (stage.$match) {
        result = this._applyQueryFilter(result, stage.$match);
      }
      if (stage.$group) {
        const groupField = stage.$group._id;
        const accumulators = {};
        for (const key in stage.$group) {
          if (key !== '_id') {
            accumulators[key] = stage.$group[key];
          }
        }

        const groups = {};
        for (const item of result) {
          const key = item[groupField] || 'unknown';
          if (!groups[key]) {
            groups[key] = { _id: key, count: 0, items: [] };
            for (const accKey in accumulators) {
              groups[key][accKey] = accumators[accKey].$sum || accumulators[accKey].$avg || 0;
            }
          }
          groups[key].count++;
          groups[key].items.push(item);
          for (const accKey in accumulators) {
            if (accumulators[accKey].$sum === 1) {
              groups[key][accKey] = (groups[key][accKey] || 0) + (item[accKey.replace('$sum:', '')] || 1);
            }
            if (accumulators[accKey].$avg) {
              const field = accumulators[accKey].$avg.replace('$avg:', '');
              groups[key][accKey] = ((groups[key][accKey] || 0) * (groups[key].count - 1) + (item[field] || 0)) / groups[key].count;
            }
          }
        }
        result = Object.values(groups);
      }
      if (stage.$sort) {
        const sortField = Object.keys(stage.$sort)[0];
        const sortOrder = stage.$sort[sortField];
        result.sort((a, b) => {
          if (sortOrder === 1) {
            return a[sortField] > b[sortField] ? 1 : -1;
          } else {
            return a[sortField] < b[sortField] ? 1 : -1;
          }
        });
      }
      if (stage.$limit) {
        result = result.slice(0, stage.$limit);
      }
      if (stage.$skip) {
        result = result.slice(stage.$skip);
      }
    }

    return result;
  }

  async countDocuments(query = {}) {
    return this._applyQueryFilter(this.data, query).length;
  }

  async create(doc) {
    const newDoc = {
      _id: `topic_${this.idCounter++}`,
      ...doc,
      createdAt: new Date().toISOString(),
      publishedAt: doc.publishedAt || new Date().toISOString()
    };
    this.data.push(newDoc);
    return newDoc;
  }

  async find(query = {}, options = {}) {
    let result = this._applyQueryFilter(this.data, query);

    if (options.sort) {
      const sortField = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortField];
      result.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (sortOrder === 1) {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    if (options.skip) {
      result = result.slice(options.skip);
    }

    if (options.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  async findById(id) {
    return this.data.find(item => item._id === id);
  }

  async findOne(query) {
    const results = await this.find(query, { limit: 1 });
    return results[0] || null;
  }

  async updateOne(query, update, options = {}) {
    const index = this.data.findIndex(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    if (index === -1) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    if (update.$set) {
      this.data[index] = { ...this.data[index], ...update.$set };
    } else {
      this.data[index] = { ...this.data[index], ...update };
    }

    return { matchedCount: 1, modifiedCount: 1 };
  }

  async deleteOne(query) {
    const index = this.data.findIndex(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    if (index === -1) {
      return { deletedCount: 0 };
    }

    this.data.splice(index, 1);
    return { deletedCount: 1 };
  }

  async findOneAndUpdate(query, update, options = {}) {
    const result = await this.updateOne(query, update, options);
    return result.modifiedCount > 0 ? await this.findOne(query) : null;
  }

  lean() {
    return this;
  }

  sort(sortObj) {
    this._currentSort = sortObj;
    return this;
  }

  limit(n) {
    this._currentLimit = n;
    return this;
  }

  skip(n) {
    this._currentSkip = n;
    return this;
  }

  exec() {
    return this.find({}, { sort: this._currentSort, skip: this._currentSkip, limit: this._currentLimit });
  }
}

module.exports = new MockHotTopicModel();
