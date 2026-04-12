import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden">
      <Navbar />
      <main className="w-full min-h-screen pt-24">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
