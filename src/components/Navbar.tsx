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
    { path: '/workspace', label: 'CSV Lab' },
  ];

  return (
    <nav aria-label="Primary navigation" className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000] w-[94%] max-w-6xl">
      <div className="bg-[#fbfcfa]/95 backdrop-blur-md border border-[#dfe8df] shadow-[0_8px_30px_rgba(27,52,39,0.08)] rounded-xl px-4 py-2.5 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-[#1f5945] rounded-lg flex items-center justify-center text-[#eff8ef] font-bold">K</div>
          <span className="font-semibold text-[#21372d] tracking-tight hidden sm:inline-block">Kashi Temp Hub</span>
        </Link>
        
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                isActive(link.path)
                  ? 'bg-[#1f5945] text-white shadow-sm'
                    : 'text-[#637269] hover:bg-[#edf3ed] hover:text-[#21372d]'
              }`}
              aria-current={isActive(link.path) ? 'page' : undefined}
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
