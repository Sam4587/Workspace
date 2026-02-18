import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChartIcon, PieChartIcon, Activity } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const CATEGORY_TRANSLATIONS = {
  'other': '其他',
  'entertainment': '娱乐',
  'tech': '科技',
  'finance': '财经',
  'sports': '体育',
  'politics': '政治',
  'health': '健康',
  'lifestyle': '生活方式'
};

const SOURCE_TRANSLATIONS = {
  'weibo': '微博',
  'weixin': '微信',
  'zhihu': '知乎',
  'douyin': '抖音',
  'bilibili': '哔哩哔哩',
  'toutiao': '今日头条',
  'xiaohongshu': '小红书',
  'baidu': '百度',
  'tieba': '贴吧',
  'thepaper': '澎湃新闻',
  'ifeng': '凤凰网',
  'wallstreetcn-hot': '华尔街见闻',
  'cls-hot': '财联社',
  'bilibili-hot-search': 'B站热搜',
  'unknown': '未知'
};

const translateCategory = (category) => {
  return CATEGORY_TRANSLATIONS[category] || category;
};

const translateSource = (source) => {
  return SOURCE_TRANSLATIONS[source] || source;
};

const HotTopicVisualization = ({ topics = [], loading = false }) => {
  const [activeTab, setActiveTab] = useState('trend');
  const [timeRange, setTimeRange] = useState('24h');

  // 根据时间范围过滤话题
  const getFilteredTopics = () => {
    if (!topics.length) return [];

    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    const cutoffTime = new Date(now.getTime() - timeRangeMs[timeRange]);

    return topics.filter(topic => {
      const topicDate = new Date(topic.publishedAt);
      return topicDate >= cutoffTime;
    });
  };

  // 处理趋势数据
  const getTrendData = () => {
    const filteredTopics = getFilteredTopics();
    if (!filteredTopics.length) return [];
    
    // 按时间分组统计
    const hourlyData = {};
    filteredTopics.forEach(topic => {
      const hour = new Date(topic.publishedAt).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { hour: `${hour}:00`, count: 0, avgHeat: 0, totalHeat: 0 };
      }
      hourlyData[hour].count++;
      hourlyData[hour].totalHeat += topic.heat || 0;
    });

    // 计算平均热度
    Object.values(hourlyData).forEach(data => {
      data.avgHeat = data.totalHeat / data.count;
    });

    return Object.values(hourlyData).sort((a, b) => 
      parseInt(a.hour.split(':')[0]) - parseInt(b.hour.split(':')[0])
    );
  };

  // 处理平台分布数据
  const getSourceData = () => {
    const filteredTopics = getFilteredTopics();
    if (!filteredTopics.length) return [];
    
    const sourceCount = {};
    filteredTopics.forEach(topic => {
      const source = topic.source || 'unknown';
      const translatedSource = translateSource(source);
      sourceCount[translatedSource] = (sourceCount[translatedSource] || 0) + 1;
    });

    return Object.entries(sourceCount).map(([name, value]) => ({
      name,
      value
    }));
  };

  // 处理分类分布数据
  const getCategoryData = () => {
    const filteredTopics = getFilteredTopics();
    if (!filteredTopics.length) return [];
    
    const mainCategories = ['entertainment', 'tech', 'finance', 'sports', 'social', 'international'];
    const categoryCount = {};
    
    filteredTopics.forEach(topic => {
      let category;
      if (mainCategories.includes(topic.category)) {
        category = topic.category;
      } else {
        category = 'other'; // 将非主要分类归入其他
      }
      
      const translatedCategory = translateCategory(category);
      categoryCount[translatedCategory] = (categoryCount[translatedCategory] || 0) + 1;
    });

    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    }));
  };

  // 处理热度分布数据
  const getHeatDistribution = () => {
    const filteredTopics = getFilteredTopics();
    if (!filteredTopics.length) return [];
    
    const distribution = {
      '90-100': 0,
      '70-89': 0,
      '50-69': 0,
      '30-49': 0,
      '0-29': 0
    };

    filteredTopics.forEach(topic => {
      const heat = topic.heat || 0;
      if (heat >= 90) distribution['90-100']++;
      else if (heat >= 70) distribution['70-89']++;
      else if (heat >= 50) distribution['50-69']++;
      else if (heat >= 30) distribution['30-49']++;
      else distribution['0-29']++;
    });

    return Object.entries(distribution).map(([range, count]) => ({
      name: `${range}热度`,
      value: count
    }));
  };

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">加载可视化数据...</span>
      </div>
    );
  }

  // 无数据状态
  if (!topics.length) {
    return (
      <div className="text-center py-12">
        <Activity className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">暂无数据</h3>
        <p className="mt-1 text-sm text-gray-500">请选择时间范围或刷新数据</p>
      </div>
    );
  }

  const trendData = getTrendData();
  const sourceData = getSourceData();
  const categoryData = getCategoryData();
  const heatData = getHeatDistribution();

  return (
    <div className="space-y-6">
      {/* 时间范围选择 */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { key: '1h', label: '1小时' },
            { key: '6h', label: '6小时' },
            { key: '12h', label: '12小时' },
            { key: '24h', label: '24小时' },
            { key: '7d', label: '7天' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeRange(key)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                timeRange === key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 图表标签页 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'trend', label: '趋势分析', icon: TrendingUp },
            { key: 'source', label: '平台分布', icon: BarChartIcon },
            { key: 'category', label: '分类分析', icon: PieChartIcon },
            { key: 'heat', label: '热度分布', icon: Activity }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 图表内容 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'trend' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">热点发布趋势</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="count"
                  name="话题数量"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgHeat"
                  name="平均热度"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'source' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">平台分布</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="value" name="话题数量" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'category' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">内容分类分布</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'heat' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">热度等级分布</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={heatData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" name="话题数量" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 数据统计摘要 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{getFilteredTopics().length}</div>
          <div className="text-sm text-blue-800">总话题数</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {(() => {
              const filteredTopics = getFilteredTopics();
              return filteredTopics.length > 0 ? (filteredTopics.reduce((sum, t) => sum + (t.heat || 0), 0) / filteredTopics.length).toFixed(1) : 0;
            })()}
          </div>
          <div className="text-sm text-green-800">平均热度</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{new Set(getFilteredTopics().map(t => t.source)).size}</div>
          <div className="text-sm text-purple-800">覆盖平台</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">{new Set(getFilteredTopics().map(t => t.category)).size}</div>
          <div className="text-sm text-orange-800">内容分类</div>
        </div>
      </div>
    </div>
  );
};

export default HotTopicVisualization;