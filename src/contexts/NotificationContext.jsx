import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
  showWarning: () => {},
});

// 默认自动关闭时间（毫秒）
const DEFAULT_AUTO_CLOSE_DELAY = 3000;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((notification) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification = { 
      ...notification, 
      id,
      createdAt: Date.now(),
    };
    
    setNotifications((prev) => [...prev, newNotification]);
    
    // 自动关闭逻辑
    const autoCloseDelay = notification.autoCloseDelay !== undefined 
      ? notification.autoCloseDelay 
      : DEFAULT_AUTO_CLOSE_DELAY;
    
    if (autoCloseDelay > 0 && !notification.persist) {
      setTimeout(() => {
        removeNotification(id);
      }, autoCloseDelay);
    }
    
    return id;
  }, [removeNotification]);

  // 便捷方法：显示成功通知
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      ...options,
    });
  }, [addNotification]);

  // 便捷方法：显示错误通知
  const showError = useCallback((message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      autoCloseDelay: options.autoCloseDelay || 5000, // 错误消息默认显示更久
      ...options,
    });
  }, [addNotification]);

  // 便捷方法：显示信息通知
  const showInfo = useCallback((message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      ...options,
    });
  }, [addNotification]);

  // 便捷方法：显示警告通知
  const showWarning = useCallback((message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      autoCloseDelay: options.autoCloseDelay || 4000, // 警告消息默认显示稍久
      ...options,
    });
  }, [addNotification]);

  // 关闭所有通知
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* 通知渲染组件 */}
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification} 
      />
    </NotificationContext.Provider>
  );
};

// 通知容器组件
const NotificationContainer = ({ notifications, onClose }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onClose={onClose}
        />
      ))}
    </div>
  );
};

// 单个通知项组件
const NotificationItem = ({ notification, onClose }) => {
  const { id, type, message, title } = notification;

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-400',
          icon: 'text-green-500',
          iconBg: 'bg-green-100',
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-400',
          icon: 'text-red-500',
          iconBg: 'bg-red-100',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-400',
          icon: 'text-yellow-500',
          iconBg: 'bg-yellow-100',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-400',
          icon: 'text-blue-500',
          iconBg: 'bg-blue-100',
        };
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const styles = getTypeStyles(type);

  return (
    <div 
      className={`pointer-events-auto max-w-sm w-full ${styles.bg} border-l-4 ${styles.border} rounded-r-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out animate-slide-in`}
      role="alert"
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          <div className={`${styles.iconBg} rounded-full p-1`}>
            {getIcon(type)}
          </div>
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          {title && (
            <p className="text-sm font-medium text-gray-900">{title}</p>
          )}
          <p className={`text-sm ${title ? 'mt-1 text-gray-600' : 'text-gray-700'}`}>
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => onClose(id)}
            className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span className="sr-only">关闭</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export default NotificationContext;
