import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/map', label: 'Map' },
    { path: '/predict', label: 'Predictor' },
    { path: '/trends', label: 'Trends' },
    { path: '/analytics', label: 'Analytics' },
  ];

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-2xl">
      <div className="bg-white/80 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:rotate-12 transition-transform">V</div>
          <span className="font-black text-slate-800 tracking-tight hidden sm:inline-block">Varanasi Climate</span>
        </Link>
        
        <div className="flex items-center gap-1 sm:gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                isActive(link.path)
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
