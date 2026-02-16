import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Settings, FileText, Zap, Workflow, Activity } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

const WorkflowPanel = ({ topic, onContentGenerated }) => {
  const { showSuccess, showError } = useNotification();
  const [selectedWorkflow, setSelectedWorkflow] = useState('hot-topic-to-content');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState(null);
  const [executionProgress, setExecutionProgress] = useState([]);

  // 获取可用工作流列表
  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.getWorkflows(),
    staleTime: 300000, // 5分钟缓存
    refetchOnWindowFocus: false
  });

  // 执行工作流的mutation
  const executeWorkflowMutation = useMutation({
    mutationFn: async ({ workflowId, context }) => {
      const response = await api.executeWorkflow(workflowId, context);
      return response;
    },
    onMutate: () => {
      setIsExecuting(true);
      setExecutionProgress([]);
    },
    onSuccess: (data) => {
      setExecutionStatus(data);
      setIsExecuting(false);
      showSuccess('工作流执行成功');
      
      // 如果有生成的内容，通知父组件
      if (data.contentId) {
        onContentGenerated && onContentGenerated(data.contentId);
      }
    },
    onError: (error) => {
      setIsExecuting(false);
      setExecutionStatus(null);
      showError(`工作流执行失败: ${error.message}`);
    }
  });

  const handleExecuteWorkflow = () => {
    if (!topic) {
      showError('请选择一个热点话题');
      return;
    }

    const context = {
      topicId: topic._id,
      topic: topic.title,
      source: topic.source,
      category: topic.category,
      keywords: topic.keywords || [],
      userId: 'current_user' // 这里应该从用户上下文获取
    };

    executeWorkflowMutation.mutate({
      workflowId: selectedWorkflow,
      context
    });
  };

  // 更新执行进度
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Workflow className="h-5 w-5 mr-2 text-blue-600" />
          智能工作流
        </h3>
        <Settings className="h-4 w-4 text-gray-400" />
      </div>

      <div className="space-y-4">
        {/* 工作流选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择工作流
          </label>
          <select
            value={selectedWorkflow}
            onChange={(e) => setSelectedWorkflow(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={workflowsLoading || isExecuting}
          >
            {workflows?.data?.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>
          {workflowsLoading && (
            <div className="mt-2 text-sm text-gray-500">加载中...</div>
          )}
        </div>

        {/* 当前热点信息 */}
        {topic && (
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
            <div className="text-sm font-medium text-blue-900">当前热点</div>
            <div className="text-sm text-blue-700 mt-1">{topic.title}</div>
            <div className="text-xs text-blue-600 mt-1">
              来源: {topic.source} | 热度: {topic.heat}
            </div>
          </div>
        )}

        {/* 执行按钮 */}
        <button
          onClick={handleExecuteWorkflow}
          disabled={isExecuting || !topic}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isExecuting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>执行中...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              <span>执行工作流</span>
            </>
          )}
        </button>

        {/* 执行状态 */}
        {executionProgress.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">执行进度</h4>
            <div className="space-y-2">
              {executionProgress.map((task, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    {task.status === 'COMPLETED' ? (
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    ) : task.status === 'RUNNING' ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                    ) : task.status === 'FAILED' ? (
                      <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                    ) : (
                      <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                    )}
                    <span className={task.status === 'FAILED' ? 'text-red-600' : 'text-gray-700'}>
                      {task.name}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
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
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">执行摘要</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded">任务数: {executionStatus.tasks?.length || 0}</div>
              <div className="bg-gray-50 p-2 rounded">耗时: {(executionStatus.completedAt ? new Date(executionStatus.completedAt) - new Date(executionStatus.startedAt) : 0) / 1000}s</div>
              <div className="bg-gray-50 p-2 rounded">触发源: {executionStatus.trigger}</div>
              <div className="bg-gray-50 p-2 rounded">状态: {executionStatus.status}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowPanel;