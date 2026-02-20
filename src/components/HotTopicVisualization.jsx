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
  const [sourceChartType, setSourceChartType] = useState('bar');

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
      {/* 时间范围选择 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap gap-2 bg-gray-50 p-1.5 rounded-xl">
          {[
            { key: '1h', label: '1小时' },
            { key: '6h', label: '6小时' },
            { key: '12h', label: '12小时' },
            { key: '24h', label: '24小时' },
            { key: '7d', label: '7天' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                console.log(`点击时间标签: ${key}`);
                setTimeRange(key);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                timeRange === key
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-500">
          当前选择: {timeRange === '1h' ? '1小时' : timeRange === '6h' ? '6小时' : timeRange === '12h' ? '12小时' : timeRange === '24h' ? '24小时' : '7天'}
        </div>
      </div>

      {/* 图表标签页 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-2">
          {[
            { key: 'trend', label: '趋势分析', icon: TrendingUp },
            { key: 'source', label: '平台分布', icon: BarChartIcon },
            { key: 'category', label: '分类分析', icon: PieChartIcon },
            { key: 'heat', label: '热度分布', icon: Activity }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                console.log(`点击图表标签: ${key}`);
                setActiveTab(key);
              }}
              className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 cursor-pointer ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              type="button"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 图表内容 */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
        {activeTab === 'trend' && (
          <div className="space-y-8">
            <div className="text-center pb-4 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">热点发布趋势</h3>
              <p className="text-sm text-gray-500 mt-1">不同时间段的话题发布数量与平均热度</p>
            </div>
            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
              <ResponsiveContainer width="100%" height={500}>
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    name="话题数量"
                    stroke="#8884d8"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgHeat"
                    name="平均热度"
                    stroke="#82ca9d"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'source' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-semibold text-gray-900">平台分布</h3>
                <p className="text-sm text-gray-500 mt-1">各内容平台的话题覆盖情况</p>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setSourceChartType('bar')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                    sourceChartType === 'bar'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChartIcon className="h-4 w-4" />
                  <span>柱状图</span>
                </button>
                <button
                  onClick={() => setSourceChartType('pie')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                    sourceChartType === 'pie'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <PieChartIcon className="h-4 w-4" />
                  <span>饼图</span>
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
              {sourceChartType === 'bar' ? (
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={sourceData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                    <Bar dataKey="value" name="话题数量" fill="#8884d8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={500}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={180}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 30 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {activeTab === 'category' && (
          <div className="space-y-8">
            <div className="text-center pb-4 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">内容分类分布</h3>
              <p className="text-sm text-gray-500 mt-1">不同内容分类的话题占比</p>
            </div>
            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
              <ResponsiveContainer width="100%" height={500}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={160}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 30 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'heat' && (
          <div className="space-y-8">
            <div className="text-center pb-4 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">热度等级分布</h3>
              <p className="text-sm text-gray-500 mt-1">各热度区间的话题数量统计</p>
            </div>
            <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={heatData} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                  <Bar dataKey="value" name="话题数量" fill="#82ca9d" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* 数据统计摘要 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="text-3xl font-bold text-blue-700 mb-2">{getFilteredTopics().length}</div>
          <div className="text-sm font-medium text-blue-900">总话题数</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="text-3xl font-bold text-green-700 mb-2">
            {(() => {
              const filteredTopics = getFilteredTopics();
              return filteredTopics.length > 0 ? (filteredTopics.reduce((sum, t) => sum + (t.heat || 0), 0) / filteredTopics.length).toFixed(1) : 0;
            })()}
          </div>
          <div className="text-sm font-medium text-green-900">平均热度</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="text-3xl font-bold text-purple-700 mb-2">{new Set(getFilteredTopics().map(t => t.source)).size}</div>
          <div className="text-sm font-medium text-purple-900">覆盖平台</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="text-3xl font-bold text-orange-700 mb-2">{new Set(getFilteredTopics().map(t => t.category)).size}</div>
          <div className="text-sm font-medium text-orange-900">内容分类</div>
        </div>
      </div>
    </div>
  );
};

export default HotTopicVisualization;