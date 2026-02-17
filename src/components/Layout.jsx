import React from 'react';
import Sidebar from './Sidebar';

export const Layout = ({ children }) => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex'
    }}>
      <Sidebar />
      <main style={{
        flex: 1,
        overflow: 'auto'
      }}>
        <div style={{
          padding: '24px',
          maxWidth: '1280px',
          margin: '0 auto'
        }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
