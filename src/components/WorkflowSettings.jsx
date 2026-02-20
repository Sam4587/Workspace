import React, { useState, useEffect } from 'react';
import { X, Settings, Clock, RefreshCw, Bell, Bug, FileText, Save, RotateCcw } from 'lucide-react';

const defaultConfig = {
  workflowParams: {
    timeout: 60,
    dataProcessingRule: 'standard',
    batchSize: 10,
    retryDelay: 5
  },
  executionPrefs: {
    autoRetry: 2,
    maxConcurrent: 3,
    priority: 'normal',
    executionMode: 'sequential'
  },
  notifications: {
    onComplete: true,
    onError: true,
    notifyMethod: 'system',
    alertThreshold: 'warning'
  },
  advanced: {
    debugMode: false,
    logLevel: 'INFO',
    performanceMode: 'balanced',
    cacheEnabled: true
  }
};

const WorkflowSettings = ({ isOpen, onClose, onSave, initialConfig }) => {
  const [activeTab, setActiveTab] = useState('workflow');
  const [config, setConfig] = useState(initialConfig || defaultConfig);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const updateConfig = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(config);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    setHasChanges(true);
  };

  if (!isOpen) return null;

  const tabs = [
    { key: 'workflow', label: '工作流参数', icon: Settings },
    { key: 'execution', label: '执行偏好', icon: RefreshCw },
    { key: 'notifications', label: '通知设置', icon: Bell },
    { key: 'advanced', label: '高级选项', icon: Bug }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">工作流设置</h2>
              <p className="text-sm text-gray-500 mt-1">配置您的工作流参数和偏好</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="flex">
          <div className="w-56 border-r border-gray-100 bg-gray-50 p-4">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all cursor-pointer mb-2 ${
                  activeTab === key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 p-8 overflow-y-auto max-h-[65vh]">
            {activeTab === 'workflow' && (
              <div className="space-y-7">
                <div className="pb-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">工作流参数配置</h3>
                  <p className="text-sm text-gray-500 mt-1">配置基础工作流参数</p>
                </div>
                
                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    超时时间（秒）
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="10"
                      max="300"
                      value={config.workflowParams.timeout}
                      onChange={(e) => updateConfig('workflowParams', 'timeout', parseInt(e.target.value))}
                      className="flex-1 h-3 bg-gray-200 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="w-20 text-center text-base font-semibold text-gray-900 bg-blue-50 py-2 px-3 rounded-xl border border-blue-200">
                      {config.workflowParams.timeout}s
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">范围：10-300秒，默认60秒</p>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    数据处理规则
                  </label>
                  <select
                    value={config.workflowParams.dataProcessingRule}
                    onChange={(e) => updateConfig('workflowParams', 'dataProcessingRule', e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  >
                    <option value="standard">标准模式</option>
                    <option value="fast">快速模式</option>
                    <option value="thorough">深度模式</option>
                  </select>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    批处理大小
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.workflowParams.batchSize}
                    onChange={(e) => updateConfig('workflowParams', 'batchSize', parseInt(e.target.value))}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                  <p className="mt-2 text-sm text-gray-500">每次处理的数据条目数量</p>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    重试延迟（秒）
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={config.workflowParams.retryDelay}
                    onChange={(e) => updateConfig('workflowParams', 'retryDelay', parseInt(e.target.value))}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                </div>
              </div>
            )}

            {activeTab === 'execution' && (
              <div className="space-y-7">
                <div className="pb-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">执行偏好设置</h3>
                  <p className="text-sm text-gray-500 mt-1">设置任务执行方式</p>
                </div>
                
                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    自动重试次数
                  </label>
                  <div className="flex items-center space-x-3">
                    {[0, 1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        onClick={() => updateConfig('executionPrefs', 'autoRetry', num)}
                        className={`w-14 h-14 rounded-xl font-semibold text-lg transition-all cursor-pointer ${
                          config.executionPrefs.autoRetry === num
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-gray-500">执行失败时自动重试的次数（0-5次）</p>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    并发任务数量
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={config.executionPrefs.maxConcurrent}
                      onChange={(e) => updateConfig('executionPrefs', 'maxConcurrent', parseInt(e.target.value))}
                      className="flex-1 h-3 bg-gray-200 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="w-16 text-center text-base font-semibold text-gray-900 bg-blue-50 py-2 px-3 rounded-xl border border-blue-200">
                      {config.executionPrefs.maxConcurrent}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">同时执行的任务数量限制（1-10个）</p>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    执行优先级
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { value: 'low', label: '低', color: 'gray' },
                      { value: 'normal', label: '普通', color: 'blue' },
                      { value: 'high', label: '高', color: 'orange' },
                      { value: 'urgent', label: '紧急', color: 'red' }
                    ].map(({ value, label, color }) => (
                      <button
                        key={value}
                        onClick={() => updateConfig('executionPrefs', 'priority', value)}
                        className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                          config.executionPrefs.priority === value
                            ? `bg-${color}-100 text-${color}-700 ring-2 ring-${color}-500`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    执行模式
                  </label>
                  <select
                    value={config.executionPrefs.executionMode}
                    onChange={(e) => updateConfig('executionPrefs', 'executionMode', e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  >
                    <option value="sequential">顺序执行</option>
                    <option value="parallel">并行执行</option>
                    <option value="adaptive">自适应模式</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-7">
                <div className="pb-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">通知设置</h3>
                  <p className="text-sm text-gray-500 mt-1">配置通知和提醒</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <div className="text-base font-semibold text-gray-900">执行完成通知</div>
                      <div className="text-sm text-gray-500 mt-1">工作流执行完成后发送通知</div>
                    </div>
                    <button
                      onClick={() => updateConfig('notifications', 'onComplete', !config.notifications.onComplete)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all cursor-pointer ${
                        config.notifications.onComplete ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                          config.notifications.onComplete ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <div className="text-base font-semibold text-gray-900">错误告警</div>
                      <div className="text-sm text-gray-500 mt-1">执行出错时发送告警通知</div>
                    </div>
                    <button
                      onClick={() => updateConfig('notifications', 'onError', !config.notifications.onError)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all cursor-pointer ${
                        config.notifications.onError ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                          config.notifications.onError ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    通知方式
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'system', label: '系统消息' },
                      { value: 'email', label: '邮件通知' },
                      { value: 'both', label: '全部方式' }
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => updateConfig('notifications', 'notifyMethod', value)}
                        className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                          config.notifications.notifyMethod === value
                            ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    告警阈值
                  </label>
                  <select
                    value={config.notifications.alertThreshold}
                    onChange={(e) => updateConfig('notifications', 'alertThreshold', e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  >
                    <option value="info">信息级别</option>
                    <option value="warning">警告级别</option>
                    <option value="error">错误级别</option>
                    <option value="critical">严重级别</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-7">
                <div className="pb-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">高级选项</h3>
                  <p className="text-sm text-gray-500 mt-1">专业配置选项</p>
                </div>
                
                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <div className="text-base font-semibold text-gray-900">调试模式</div>
                    <div className="text-sm text-gray-500 mt-1">启用详细日志和调试信息</div>
                  </div>
                  <button
                    onClick={() => updateConfig('advanced', 'debugMode', !config.advanced.debugMode)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all cursor-pointer ${
                      config.advanced.debugMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                        config.advanced.debugMode ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    日志级别
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'ERROR', label: 'ERROR - 仅错误', color: 'red' },
                      { value: 'WARN', label: 'WARN - 警告及以上', color: 'yellow' },
                      { value: 'INFO', label: 'INFO - 信息及以上', color: 'blue' },
                      { value: 'DEBUG', label: 'DEBUG - 全部日志', color: 'gray' }
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => updateConfig('advanced', 'logLevel', value)}
                        className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                          config.advanced.logLevel === value
                            ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-800 mb-3">
                    性能优化模式
                  </label>
                  <select
                    value={config.advanced.performanceMode}
                    onChange={(e) => updateConfig('advanced', 'performanceMode', e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  >
                    <option value="speed">速度优先</option>
                    <option value="balanced">平衡模式</option>
                    <option value="quality">质量优先</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <div className="text-base font-semibold text-gray-900">启用缓存</div>
                    <div className="text-sm text-gray-500 mt-1">缓存中间结果以提高性能</div>
                  </div>
                  <button
                    onClick={() => updateConfig('advanced', 'cacheEnabled', !config.advanced.cacheEnabled)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all cursor-pointer ${
                      config.advanced.cacheEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                        config.advanced.cacheEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-8 py-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-5 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all cursor-pointer font-medium"
          >
            <RotateCcw className="h-5 w-5" />
            <span>恢复默认</span>
          </button>
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all cursor-pointer font-medium"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`flex items-center space-x-2 px-7 py-3 rounded-xl transition-all cursor-pointer font-semibold ${
                hasChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="h-5 w-5" />
              <span>保存设置</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowSettings;
