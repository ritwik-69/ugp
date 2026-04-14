import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse translate-x-1/2 translate-y-1/2" />
      
      <div className="max-w-4xl px-8 text-center z-10">
        <h1 className="text-6xl font-black text-slate-900 mb-6 tracking-tight">
          Varanasi <span className="text-blue-600">Climate Insights</span>
        </h1>
        <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto">
          Explore environmental shifts and climate forecasts for the Varanasi region using high-resolution geospatial data and machine learning.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Link to="/map" className="group p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-slate-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.382V6.418a2 2 0 011.106-1.789L9 2l6 3 5.447-2.724A2 2 0 0121 4.618v8.964a2 2 0 01-1.106 1.789L15 18l-6 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Satellite Map</h3>
            <p className="text-sm text-slate-500 text-center leading-relaxed">Interactive LULC and LST layers from 2000-2020.</p>
          </Link>
          
          <Link to="/predict" className="group p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-slate-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Climate Predictor</h3>
            <p className="text-sm text-slate-500 text-center leading-relaxed">Predict surface temperatures using Random Forest models.</p>
          </Link>
          
          <Link to="/trends" className="group p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-slate-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Growth Trends</h3>
            <p className="text-sm text-slate-500 text-center leading-relaxed">Visualize urbanization and vegetation shifts over time.</p>
          </Link>
          
          <Link to="/analytics" className="group p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-slate-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Analytics</h3>
            <p className="text-sm text-slate-500 text-center leading-relaxed">Correlation and zonal statistics for Varanasi ROI.</p>
          </Link>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400 text-xs font-medium tracking-wider uppercase">
        Climate Analytics Platform • Varanasi Region
      </div>
    </div>
  );
};

export default Home;
