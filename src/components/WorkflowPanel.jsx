import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings, FileText, Zap, Workflow, Activity, AlertCircle, RefreshCw, ArrowRight, Eye, Edit3 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';
import WorkflowSettings from './WorkflowSettings';

const defaultWorkflowConfig = {
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

const WorkflowPanel = ({ topic, onContentGenerated }) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [selectedWorkflow, setSelectedWorkflow] = useState('hot-topic-to-content');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [executionProgress, setExecutionProgress] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [workflowConfig, setWorkflowConfig] = useState(() => {
    const saved = localStorage.getItem('workflowConfig');
    return saved ? JSON.parse(saved) : defaultWorkflowConfig;
  });

  // 获取可用工作流列表
  const { 
    data: workflows, 
    isLoading: workflowsLoading, 
    isError: workflowsError,
    refetch: refetchWorkflows 
  } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const result = await api.getWorkflows();
      if (!result.success) {
        throw new Error(result.message || '获取工作流列表失败');
      }
      return result;
    },
    staleTime: 300000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  // 执行工作流的mutation
  const executeWorkflowMutation = useMutation({
    mutationFn: async ({ workflowId, context, config }) => {
      const response = await api.executeWorkflow(workflowId, { 
        ...context,
        config
      });
      return response;
    },
    onMutate: () => {
      setIsExecuting(true);
      setExecutionProgress([]);
    },
    onSuccess: (data) => {
      setExecutionStatus(data);
      setIsExecuting(false);
      
      if (data.savedContents && data.savedContents.length > 0) {
        setGeneratedContent(data.savedContents[0]);
      } else if (data.contentId) {
        setGeneratedContent({ _id: data.contentId });
      }
      
      showSuccess('工作流执行成功');
      
      if (workflowConfig.notifications.onComplete) {
        console.log('[通知] 工作流执行完成');
      }
      
      if (data.contentId) {
        onContentGenerated && onContentGenerated(data.contentId);
      }
    },
    onError: (error) => {
      setIsExecuting(false);
      setExecutionStatus(null);
      showError(`工作流执行失败: ${error.message}`);
      
      if (workflowConfig.notifications.onError) {
        console.log('[告警] 工作流执行失败:', error.message);
      }
    }
  });

  const handleExecuteWorkflow = () => {
    const context = {
      userId: 'current_user'
    };

    if (topic) {
      context.topicId = topic._id;
      context.topic = topic.title;
      context.source = topic.source;
      context.category = topic.category;
      context.keywords = topic.keywords || [];
    }

    executeWorkflowMutation.mutate({
      workflowId: selectedWorkflow,
      context,
      config: workflowConfig
    });
  };

  const handleSaveConfig = (newConfig) => {
    setWorkflowConfig(newConfig);
    localStorage.setItem('workflowConfig', JSON.stringify(newConfig));
    showSuccess('设置已保存');
  };

  useEffect(() => {
    if (executionStatus?.tasks) {
      setExecutionProgress(executionStatus.tasks);
    }
  }, [executionStatus]);

  const getWorkflowName = (id) => {
    const workflow = workflows?.data?.find(w => w.id === id);
    return workflow ? workflow.name : id;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Workflow className="h-6 w-6 mr-3 text-blue-600" />
          智能工作流
        </h3>
        <button
          onClick={() => setShowSettings(true)}
          className="p-3 hover:bg-gray-100 rounded-full transition-all cursor-pointer group"
          title="工作流设置"
        >
          <Settings className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </button>
      </div>

      <div className="space-y-6">
        {/* 工作流选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            选择工作流
          </label>
          {workflowsError ? (
            <div className="space-y-3 p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">加载工作流失败</span>
              </div>
              <button
                onClick={() => refetchWorkflows()}
                className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                <span>点击重试</span>
              </button>
            </div>
          ) : (
            <>
              <select
                value={selectedWorkflow}
                onChange={(e) => setSelectedWorkflow(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                disabled={workflowsLoading || isExecuting}
              >
                {workflows?.data?.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
              {workflowsLoading && (
                <div className="mt-3 text-sm text-gray-500">加载中...</div>
              )}
              {!workflowsLoading && workflows?.data?.length === 0 && (
                <div className="mt-3 text-sm text-gray-500">暂无可用工作流</div>
              )}
              {workflows?.data?.length > 0 && (
                <div className="mt-3 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  {workflows.data.find(w => w.id === selectedWorkflow)?.description || ''}
                </div>
              )}
            </>
          )}
        </div>

        {/* 当前热点信息 */}
        {topic ? (
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
            <div className="text-sm font-semibold text-blue-900 mb-2">当前热点</div>
            <div className="text-base text-blue-800 mb-2">{topic.title}</div>
            <div className="text-sm text-blue-600">
              来源: {topic.source} | 热度: {topic.heat}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-3 text-gray-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-base">请先从热点列表中选择一个话题</span>
            </div>
          </div>
        )}

        {/* 当前配置摘要 */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span className="font-medium">超时:</span>
              <span className="text-gray-900">{workflowConfig.workflowParams.timeout}s</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">重试:</span>
              <span className="text-gray-900">{workflowConfig.executionPrefs.autoRetry}次</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">并发:</span>
              <span className="text-gray-900">{workflowConfig.executionPrefs.maxConcurrent}</span>
            </div>
          </div>
        </div>

        {/* 执行按钮 */}
        <button
          onClick={handleExecuteWorkflow}
          disabled={isExecuting}
          className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg font-medium shadow-md hover:shadow-lg"
        >
          {isExecuting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>执行中...</span>
            </>
          ) : (
            <>
              <Zap className="h-5 w-5" />
              <span>执行工作流</span>
            </>
          )}
        </button>

        {/* 执行状态 */}
        {executionProgress.length > 0 && (
          <div className="border-t pt-6 mt-6">
            <h4 className="text-base font-semibold text-gray-900 mb-4">执行进度</h4>
            <div className="space-y-3">
              {executionProgress.map((task, index) => (
                <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    {task.status === 'COMPLETED' ? (
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    ) : task.status === 'RUNNING' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    ) : task.status === 'FAILED' ? (
                      <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                    ) : (
                      <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                    )}
                    <span className={`text-base ${task.status === 'FAILED' ? 'text-red-600 font-medium' : 'text-gray-800'}`}>
                      {task.name}
                    </span>
                  </div>
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                    task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    task.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 执行结果摘要 */}
        {executionStatus && executionStatus.summary && (
          <div className="border-t pt-6 mt-6">
            <h4 className="text-base font-semibold text-gray-900 mb-4">执行摘要</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">任务数</div>
                <div className="text-2xl font-bold text-gray-900">{executionStatus.tasks?.length || 0}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">耗时</div>
                <div className="text-2xl font-bold text-gray-900">{((executionStatus.completedAt ? new Date(executionStatus.completedAt) - new Date(executionStatus.startedAt) : 0) / 1000).toFixed(1)}s</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">触发源</div>
                <div className="text-lg font-semibold text-gray-900">{executionStatus.trigger}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-gray-500 mb-1">状态</div>
                <div className="text-lg font-semibold text-gray-900">{executionStatus.status}</div>
              </div>
            </div>
          </div>
        )}

        {/* 生成内容预览和操作指引 */}
        {generatedContent && (
          <div className="border-t pt-6 mt-6">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">内容已生成！</h4>
                  <p className="text-sm text-gray-600">工作流执行成功，您可以查看或编辑生成的内容</p>
                </div>
              </div>
              
              {generatedContent.title && (
                <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">内容标题</div>
                  <div className="text-base font-medium text-gray-900">{generatedContent.title}</div>
                  {generatedContent.wordCount && (
                    <div className="text-sm text-gray-500 mt-2">{generatedContent.wordCount} 字</div>
                  )}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    if (generatedContent._id) {
                      navigate('/content-creation', { state: { contentId: generatedContent._id } });
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg"
                >
                  <Eye className="h-5 w-5" />
                  <span>查看内容</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (generatedContent._id) {
                      navigate('/content-creation', { state: { contentId: generatedContent._id, editMode: true } });
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  <Edit3 className="h-5 w-5" />
                  <span>编辑内容</span>
                </button>
              </div>
              
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h5 className="text-sm font-medium text-yellow-800 mb-2">💡 后续操作建议</h5>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 查看生成的内容质量和准确性</li>
                  <li>• 根据需要编辑和优化内容</li>
                  <li>• 选择目标平台进行发布</li>
                  <li>• 设置定时发布或立即发布</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 设置面板 */}
      <WorkflowSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveConfig}
        initialConfig={workflowConfig}
      />
    </div>
  );
};

export default WorkflowPanel;
