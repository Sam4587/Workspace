import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Play, Pause, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

const BatchGeneration = ({ templates = [] }) => {
  const { showSuccess, showError } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [batchId, setBatchId] = useState(null);

  const { data: batchStatus, refetch } = useQuery({
    queryKey: ['batch-status', batchId],
    queryFn: async () => {
      if (!batchId) return null;
      const response = await fetch(`/api/video/render/batch/${batchId}`);
      const data = await response.json();
      return data.data;
    },
    enabled: !!batchId,
    refetchInterval: 3000,
  });

  const batchMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/video/render/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setBatchId(data.data.batchId);
        showSuccess(`已提交 ${data.data.submittedTasks} 个渲染任务`);
      } else {
        showError(data.message || '批量提交失败');
      }
    },
    onError: (error) => {
      showError('批量提交失败: ' + error.message);
    },
  });

  const addTask = () => {
    setTasks([...tasks, {
      id: Date.now(),
      templateId: templates[0]?.id || '',
      props: {},
    }]);
  };

  const removeTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const updateTask = (taskId, field, value) => {
    setTasks(tasks.map(t => 
      t.id === taskId ? { ...t, [field]: value } : t
    ));
  };

  const startBatchRender = () => {
    if (tasks.length === 0) {
      showError('请先添加渲染任务');
      return;
    }
    batchMutation.mutate();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'rendering':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">批量生成</h3>
        <button
          onClick={addTask}
          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>添加任务</span>
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>点击"添加任务"开始批量生成</p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {tasks.map((task, index) => (
            <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-500 w-6">{index + 1}</span>
              
              <select
                value={task.templateId}
                onChange={(e) => updateTask(task.id, 'templateId', e.target.value)}
                className="flex-1 px-3 py-2 border rounded"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <button
                onClick={() => removeTask(task.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          共 {tasks.length} 个任务
        </span>
        <button
          onClick={startBatchRender}
          disabled={tasks.length === 0 || batchMutation.isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {batchMutation.isPending ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>提交中...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span>开始批量生成</span>
            </>
          )}
        </button>
      </div>

      {batchStatus && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">批量任务进度</h4>
          <div className="flex items-center space-x-4 mb-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${batchStatus.summary.progress}%` }}
              />
            </div>
            <span className="text-sm">{batchStatus.summary.progress}%</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="text-center">
              <div className="font-medium">{batchStatus.summary.total}</div>
              <div className="text-gray-500">总计</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">{batchStatus.summary.completed}</div>
              <div className="text-gray-500">完成</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-yellow-600">{batchStatus.summary.pending + batchStatus.summary.rendering}</div>
              <div className="text-gray-500">处理中</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-red-600">{batchStatus.summary.failed}</div>
              <div className="text-gray-500">失败</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchGeneration;
