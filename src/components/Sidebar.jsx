import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navItems } from '../nav-items';
import { Bot } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  return (
    <div style={{
      width: '250px',
      height: '100vh',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Logo区域 */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Bot size={32} style={{ color: '#2563eb', flexShrink: 0 }} />
        <h1 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#111827',
          margin: 0
        }}>AI创作系统</h1>
      </div>
      
      {/* 导航菜单 */}
      <nav style={{
        flex: 1,
        padding: '16px'
      }}>
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          gap: '4px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {navItems.filter(item => !item.hidden).map((item) => {
            const isActive = location.pathname === item.to;
            
            return (
              <li key={item.to} style={{ marginBottom: '4px' }}>
                <Link
                  to={item.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    ...(isActive
                      ? {
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)'
                        }
                      : {
                          color: '#4b5563',
                          backgroundColor: 'transparent',
                          ':hover': {
                            backgroundColor: '#f3f4f6'
                          }
                        }
                    )
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ flexShrink: 0, width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* 底部信息 */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          AI Content Flow v1.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
