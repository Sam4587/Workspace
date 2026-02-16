import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navItems } from '../nav-items';
import { Bot } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-card shadow-lg border-r border-border">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold text-card-foreground">AI创作系统</h1>
        </div>
      </div>
      
      <nav className="mt-6">
        {navItems.filter(item => !item.hidden).map((item) => {
          const isActive = location.pathname === item.to;
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent text-accent-foreground border-r-2 border-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
