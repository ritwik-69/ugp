import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VaranasiMap from './components/map/VaranasiMap';
import PredictionForm from './components/predictor/PredictionForm';
import GrowthTrends from './components/analytics/GrowthTrends';
import Home from './components/Home';
import Layout from './components/Layout';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import UploadedWorkspace from './components/workspace/UploadedWorkspace';
import './App.css';

const PretrainedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/reset-dataset', { method: 'POST' })
      .then((response) => {
        if (!response.ok) throw new Error('Could not restore pretrained mode.');
        if (mounted) setReady(true);
      })
      .catch(() => {
        if (mounted) setReady(true);
      });
    return () => { mounted = false; };
  }, []);

  return ready ? <>{children}</> : <div className="min-h-[60vh] flex items-center justify-center text-sm font-bold text-slate-500">Loading pretrained dashboard...</div>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ErrorBoundary><Home /></ErrorBoundary>} />
          <Route path="map" element={
            <PretrainedRoute><ErrorBoundary>
              <div className="h-[calc(100vh-6rem)] w-screen relative px-5 pb-5">
                <div className="w-full h-full rounded-2xl overflow-hidden shadow-[0_16px_45px_rgba(27,52,39,0.12)] border border-[#dce6de]">
                  <VaranasiMap />
                </div>
              </div>
            </ErrorBoundary></PretrainedRoute>
          } />
          <Route path="predict" element={
            <PretrainedRoute><ErrorBoundary>
              <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="text-center mb-10">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#71917c]">Pretrained model</p>
                  <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[#21372d]">Temperature forecast</h2>
                  <p className="text-[#748178] max-w-xl mx-auto mt-3">Estimate localized air temperature from land surface and terrain conditions.</p>
                </div>
                <PredictionForm />
              </div>
            </ErrorBoundary></PretrainedRoute>
          } />
          <Route path="trends" element={
            <PretrainedRoute><ErrorBoundary>
              <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Geospatial Evolution Trends</h2>
                  <p className="text-slate-500 max-w-2xl mx-auto font-medium">Historical analysis of land cover variation and surface temperature intensity across the Varanasi region (2000-2020).</p>
                </div>
                <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl border border-slate-100 h-[650px]">
                  <GrowthTrends />
                </div>
              </div>
            </ErrorBoundary></PretrainedRoute>
          } />
          <Route path="analytics" element={
            <PretrainedRoute><ErrorBoundary>
              <div className="max-w-7xl mx-auto px-4 py-8">
                <AnalyticsDashboard />
              </div>
            </ErrorBoundary></PretrainedRoute>
          } />
          <Route path="workspace" element={
            <ErrorBoundary>
              <UploadedWorkspace />
            </ErrorBoundary>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
