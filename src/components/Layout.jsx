import React from 'react';
import { Sidebar } from './Sidebar';

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
