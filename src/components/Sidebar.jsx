import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navItems } from '../nav-items';
import { Bot } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Logo区域 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-blue-600 flex-shrink-0" />
          <h1 className="text-xl font-bold text-gray-900">AI创作系统</h1>
        </div>
      </div>
      
      {/* 导航菜单 */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {navItems.filter(item => !item.hidden).map((item) => {
            const isActive = location.pathname === item.to;
            
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* 底部信息 */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          AI Content Flow v1.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
