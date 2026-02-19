import { useState, useCallback, useRef } from 'react';
import { useNotification } from '../contexts/NotificationContext';

/**
 * 工作流步骤状态
 */
const STEP_STATUS = {
  PENDING: 'pending',      // 等待中
  RUNNING: 'running',      // 执行中
  COMPLETED: 'completed',  // 已完成
  FAILED: 'failed',        // 失败
  SKIPPED: 'skipped'       // 已跳过
};

/**
 * 工作流钩子
 * 用于管理多步骤业务流程，支持弹窗通知和自动后续操作
 * 
 * @param {Object} options - 配置选项
 * @param {string} options.workflowName - 工作流名称
 * @param {boolean} options.showNotifications - 是否显示通知弹窗
 * @param {boolean} options.autoCloseNotification - 通知是否自动关闭
 * @param {number} options.notificationDuration - 通知显示时长（毫秒）
 * @param {Function} options.onComplete - 工作流完成回调
 * @param {Function} options.onError - 工作流错误回调
 * @param {Function} options.onStepComplete - 步骤完成回调
 */
export const useWorkflow = (options = {}) => {
  const {
    workflowName = '未命名工作流',
    showNotifications = true,
    autoCloseNotification = true,
    notificationDuration = 3000,
    onComplete,
    onError,
    onStepComplete
  } = options;

  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [workflowResult, setWorkflowResult] = useState(null);
  const [workflowError, setWorkflowError] = useState(null);
  
  // 使用 ref 存储回调，避免依赖问题
  const callbacksRef = useRef({ onComplete, onError, onStepComplete });
  callbacksRef.current = { onComplete, onError, onStepComplete };

  /**
   * 定义工作流步骤
   * @param {Array} stepDefinitions - 步骤定义数组
   */
  const defineSteps = useCallback((stepDefinitions) => {
    const initializedSteps = stepDefinitions.map((step, index) => ({
      id: step.id || `step-${index}`,
      name: step.name || `步骤 ${index + 1}`,
      description: step.description || '',
      handler: step.handler,
      required: step.required !== false, // 默认必需
      skippable: step.skippable === true, // 默认可跳过
      retryable: step.retryable !== false, // 默认可重试
      maxRetries: step.maxRetries || 3,
      onSuccess: step.onSuccess,
      onError: step.onError,
      status: STEP_STATUS.PENDING,
      result: null,
      error: null,
      retryCount: 0,
      startTime: null,
      endTime: null
    }));
    
    setSteps(initializedSteps);
    setCurrentStepIndex(-1);
    setWorkflowResult(null);
    setWorkflowError(null);
    
    return initializedSteps;
  }, []);

  /**
   * 更新步骤状态
   */
  const updateStepStatus = useCallback((stepIndex, updates) => {
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[stepIndex] = { ...newSteps[stepIndex], ...updates };
      return newSteps;
    });
  }, []);

  /**
   * 执行单个步骤
   */
  const executeStep = useCallback(async (step, stepIndex, context) => {
    const stepStartTime = Date.now();
    
    // 更新步骤为运行中状态
    updateStepStatus(stepIndex, {
      status: STEP_STATUS.RUNNING,
      startTime: stepStartTime
    });

    // 显示步骤开始通知
    if (showNotifications) {
      showInfo(`开始执行: ${step.name}`, {
        autoCloseDelay: 2000
      });
    }

    try {
      // 执行步骤处理器
      const result = await step.handler(context, step);
      
      const stepEndTime = Date.now();
      const duration = stepEndTime - stepStartTime;
      
      // 更新步骤为完成状态
      updateStepStatus(stepIndex, {
        status: STEP_STATUS.COMPLETED,
        result,
        endTime: stepEndTime,
        duration
      });

      // 显示成功通知
      if (showNotifications && autoCloseNotification) {
        showSuccess(`${step.name} 完成`, {
          autoCloseDelay: notificationDuration
        });
      }

      // 调用步骤成功回调
      if (step.onSuccess) {
        await step.onSuccess(result, context, step);
      }

      // 调用全局步骤完成回调
      if (callbacksRef.current.onStepComplete) {
        await callbacksRef.current.onStepComplete(step, result, context);
      }

      return { success: true, result };

    } catch (error) {
      const stepEndTime = Date.now();
      
      // 更新步骤为失败状态
      updateStepStatus(stepIndex, {
        status: STEP_STATUS.FAILED,
        error: error.message,
        endTime: stepEndTime
      });

      // 显示错误通知
      if (showNotifications) {
        showError(`${step.name} 失败: ${error.message}`, {
          autoCloseDelay: 5000
        });
      }

      // 调用步骤错误回调
      if (step.onError) {
        await step.onError(error, context, step);
      }

      return { success: false, error };
    }
  }, [showNotifications, autoCloseNotification, notificationDuration, showInfo, showSuccess, showError, updateStepStatus]);

  /**
   * 执行工作流
   * @param {Object} initialContext - 初始上下文数据
   */
  const execute = useCallback(async (initialContext = {}) => {
    if (steps.length === 0) {
      throw new Error('工作流步骤未定义');
    }

    if (isRunning) {
      throw new Error('工作流正在运行中');
    }

    setIsRunning(true);
    setWorkflowResult(null);
    setWorkflowError(null);
    
    const context = { ...initialContext };
    const workflowStartTime = Date.now();

    // 显示工作流开始通知
    if (showNotifications) {
      showInfo(`开始执行工作流: ${workflowName}`, {
        autoCloseDelay: 2000
      });
    }

    try {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStepIndex(i);
        const step = steps[i];

        // 执行步骤
        const stepResult = await executeStep(step, i, context);

        if (!stepResult.success) {
          // 如果步骤失败且是必需步骤，则终止工作流
          if (step.required) {
            throw new Error(`必需步骤 "${step.name}" 执行失败: ${stepResult.error.message}`);
          }
          
          // 如果步骤可跳过，则标记为跳过并继续
          if (step.skippable) {
            updateStepStatus(i, { status: STEP_STATUS.SKIPPED });
            if (showNotifications) {
              showWarning(`跳过步骤: ${step.name}`, {
                autoCloseDelay: 3000
              });
            }
          }
        } else {
          // 将步骤结果存入上下文
          context[step.id] = stepResult.result;
        }
      }

      const workflowEndTime = Date.now();
      const totalDuration = workflowEndTime - workflowStartTime;

      const result = {
        success: true,
        context,
        steps: steps.map(s => ({
          id: s.id,
          name: s.name,
          status: s.status,
          duration: s.duration,
          result: s.result
        })),
        totalDuration,
        completedAt: new Date().toISOString()
      };

      setWorkflowResult(result);
      setCurrentStepIndex(-1);

      // 显示工作流完成通知
      if (showNotifications && autoCloseNotification) {
        showSuccess(`工作流 "${workflowName}" 执行完成`, {
          autoCloseDelay: notificationDuration
        });
      }

      // 调用完成回调
      if (callbacksRef.current.onComplete) {
        await callbacksRef.current.onComplete(result);
      }

      return result;

    } catch (error) {
      const workflowEndTime = Date.now();
      
      const errorResult = {
        success: false,
        error: error.message,
        context,
        steps: steps.map(s => ({
          id: s.id,
          name: s.name,
          status: s.status,
          result: s.result,
          error: s.error
        })),
        totalDuration: workflowEndTime - workflowStartTime,
        failedAt: new Date().toISOString()
      };

      setWorkflowError(errorResult);
      setCurrentStepIndex(-1);

      // 显示工作流失败通知
      if (showNotifications) {
        showError(`工作流 "${workflowName}" 执行失败: ${error.message}`, {
          autoCloseDelay: 5000
        });
      }

      // 调用错误回调
      if (callbacksRef.current.onError) {
        await callbacksRef.current.onError(error, errorResult);
      }

      throw error;

    } finally {
      setIsRunning(false);
    }
  }, [steps, isRunning, workflowName, showNotifications, autoCloseNotification, notificationDuration, executeStep, showInfo, showSuccess, showWarning, showError, updateStepStatus]);

  /**
   * 重置工作流
   */
  const reset = useCallback(() => {
    setSteps(prev => prev.map(step => ({
      ...step,
      status: STEP_STATUS.PENDING,
      result: null,
      error: null,
      retryCount: 0,
      startTime: null,
      endTime: null
    })));
    setCurrentStepIndex(-1);
    setIsRunning(false);
    setWorkflowResult(null);
    setWorkflowError(null);
  }, []);

  /**
   * 重试失败的步骤
   */
  const retryFailedSteps = useCallback(async (context = {}) => {
    const failedSteps = steps.filter(s => s.status === STEP_STATUS.FAILED);
    
    if (failedSteps.length === 0) {
      showInfo('没有失败的步骤需要重试');
      return;
    }

    for (const step of failedSteps) {
      const stepIndex = steps.findIndex(s => s.id === step.id);
      if (stepIndex >= 0) {
        await executeStep(step, stepIndex, context);
      }
    }
  }, [steps, executeStep, showInfo]);

  /**
   * 获取工作流进度
   */
  const getProgress = useCallback(() => {
    if (steps.length === 0) return 0;
    const completedSteps = steps.filter(s => 
      s.status === STEP_STATUS.COMPLETED || s.status === STEP_STATUS.SKIPPED
    ).length;
    return Math.round((completedSteps / steps.length) * 100);
  }, [steps]);

  /**
   * 获取当前步骤
   */
  const getCurrentStep = useCallback(() => {
    if (currentStepIndex < 0 || currentStepIndex >= steps.length) return null;
    return steps[currentStepIndex];
  }, [steps, currentStepIndex]);

  return {
    // 状态
    steps,
    currentStepIndex,
    isRunning,
    workflowResult,
    workflowError,
    progress: getProgress(),
    currentStep: getCurrentStep(),
    
    // 方法
    defineSteps,
    execute,
    reset,
    retryFailedSteps,
    
    // 常量
    STEP_STATUS
  };
};

export default useWorkflow;
