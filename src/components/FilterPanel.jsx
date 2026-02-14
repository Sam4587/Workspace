import React, { useState } from 'react';
import { X } from 'lucide-react';

const FilterPanel = ({ filters, onFiltersChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const timeOptions = [
    { value: '1h', label: '1小时内' },
    { value: '6h', label: '6小时内' },
    { value: '12h', label: '12小时内' },
    { value: '24h', label: '24小时内' },
    { value: '7d', label: '7天内' }
  ];

  const sourceOptions = [
    { value: 'weibo', label: '微博热搜' },
    { value: 'toutiao', label: '今日头条' },
    { value: 'weixin', label: '微信热文' },
    { value: 'baidu', label: '百度热搜' },
    { value: 'zhihu', label: '知乎热榜' }
  ];

  const trendOptions = [
    { value: 'up', label: '上升趋势' },
    { value: 'down', label: '下降趋势' },
    { value: 'stable', label: '稳定' }
  ];

  const handleSourceChange = (source) => {
    const newSources = localFilters.sources.includes(source)
      ? localFilters.sources.filter(s => s !== source)
      : [...localFilters.sources, source];
    
    const newFilters = { ...localFilters, sources: newSources };
    setLocalFilters(newFilters);
  };

  const handleTrendChange = (trend) => {
    const newTrends = localFilters.trends.includes(trend)
      ? localFilters.trends.filter(t => t !== trend)
      : [...localFilters.trends, trend];
    
    const newFilters = { ...localFilters, trends: newTrends };
    setLocalFilters(newFilters);
  };

  const handleHeatRangeChange = (index, value) => {
    const newHeatRange = [...localFilters.heatRange];
    newHeatRange[index] = parseInt(value) || 0;
    const newFilters = { ...localFilters, heatRange: newHeatRange };
    setLocalFilters(newFilters);
  };

  const handleSuitabilityRangeChange = (index, value) => {
    const newSuitabilityRange = [...localFilters.suitabilityRange];
    newSuitabilityRange[index] = parseInt(value) || 0;
    const newFilters = { ...localFilters, suitabilityRange: newSuitabilityRange };
    setLocalFilters(newFilters);
  };

  const handleTimeRangeChange = (value) => {
    const newFilters = { ...localFilters, timeRange: value };
    setLocalFilters(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      heatRange: [0, 100],
      suitabilityRange: [0, 100],
      timeRange: '24h',
      sources: [],
      trends: []
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const handleApplyFilters = () => {
    // 应用筛选条件
    onFiltersChange(localFilters);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            时间范围
          </label>
          <select
            value={localFilters.timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {timeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            热度范围
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max="100"
              value={localFilters.heatRange[0]}
              onChange={(e) => handleHeatRangeChange(0, e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              min="0"
              max="100"
              value={localFilters.heatRange[1]}
              onChange={(e) => handleHeatRangeChange(1, e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            适配度范围
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max="100"
              value={localFilters.suitabilityRange[0]}
              onChange={(e) => handleSuitabilityRangeChange(0, e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              min="0"
              max="100"
              value={localFilters.suitabilityRange[1]}
              onChange={(e) => handleSuitabilityRangeChange(1, e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            趋势
          </label>
          <div className="space-y-1">
            {trendOptions.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.trends.includes(option.value)}
                  onChange={() => handleTrendChange(option.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          来源平台
        </label>
        <div className="flex flex-wrap gap-2">
          {sourceOptions.map(option => (
            <label key={option.value} className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.sources.includes(option.value)}
                onChange={() => handleSourceChange(option.value)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end space-x-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          重置
        </button>
        <button 
          onClick={handleApplyFilters}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          应用筛选
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
