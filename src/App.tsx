import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VaranasiMap from './components/map/VaranasiMap';
import PredictionForm from './components/predictor/PredictionForm';
import GrowthTrends from './components/analytics/GrowthTrends';
import Home from './components/Home';
import Layout from './components/Layout';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import './App.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="map" element={
            <div className="h-[calc(100vh-6rem)] w-screen relative px-4 pb-4">
              <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <VaranasiMap />
              </div>
            </div>
          } />
          <Route path="predict" element={
            <div className="max-w-4xl mx-auto px-4 py-8">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-slate-900 mb-4">Temperature Forecast</h2>
                <p className="text-slate-500 max-w-xl mx-auto">Input LST and elevation data to predict localized air temperature using our Random Forest regression model.</p>
              </div>
              <PredictionForm />
            </div>
          } />
          <Route path="trends" element={
            <div className="max-w-5xl mx-auto px-4 py-8">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-slate-900 mb-4">Urbanization Trends</h2>
                <p className="text-slate-500 max-w-xl mx-auto">Analyzing the historical relationship between urban area growth and vegetation decline in the Varanasi region.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 h-[500px]">
                <GrowthTrends />
              </div>
            </div>
          } />
          <Route path="analytics" element={
            <div className="max-w-7xl mx-auto px-4 py-8">
              <AnalyticsDashboard />
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
