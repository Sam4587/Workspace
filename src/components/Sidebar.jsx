import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navItems } from '../nav-items';
import { Bot } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Bot className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">AI创作系统</h1>
        </div>
      </div>
      
      <nav className="mt-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
