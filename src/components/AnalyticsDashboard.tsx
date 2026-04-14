import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, Line, ComposedChart, Cell 
} from 'recharts';
import img2000 from '../assets/LULC_2000_WhiteBG.png';
import img2010 from '../assets/LULC_2010_WhiteBG.png';
import img2020 from '../assets/LULC_2020_WhiteBG.png';

interface ZonalStat {
  class: string;
  area: number;
  avgLst: number;
  minLst: number;
  maxLst: number;
}

interface AccuracyPoint {
  actual: number;
  predicted: number;
}

const LULCImage: React.FC<{ year: number }> = ({ year }) => {
  const getImage = () => {
    switch (year) {
      case 2000: return img2000;
      case 2010: return img2010;
      case 2020: return img2020;
      default: return img2020;
    }
  };

  return (
    <div className="w-full h-full relative group bg-white">
    <img 
    src={getImage()} 
    alt={`LULC Map ${year}`}
    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" 
    />

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
    </div>
  );
};

const AnalyticsDashboard: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(2020);
  const [data, setData] = useState<{ zonalStats: ZonalStat[], accuracyPoints: AccuracyPoint[], mse: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?year=${selectedYear}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, [selectedYear]);

  const COLORS = ['#0000FF', '#00FF00', '#FF0000', '#006400', '#FFFF00'];

  if (loading || !data) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-xl font-bold text-slate-400 animate-pulse italic">Processing Zonal Statistics (Section 8)...</div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h3 className="text-2xl font-black text-slate-800">Section 8: Correlation & Zonal Statistics</h3>
          <p className="text-slate-500 font-medium">LULC and Thermal Distribution across the Varanasi ROI</p>
        </div>
        <div className="flex gap-2">
          {[2000, 2010, 2020].map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${
                selectedYear === y ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LULC Area Distribution (Chapter 4.1) */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <h4 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-wider text-center">Area Distribution (sq. km)</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.zonalStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="class" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 'auto']} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="area" radius={[10, 10, 0, 0]}>
                  {data.zonalStats.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LST Thermal Analysis by LULC (Chapter 4.2) */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <h4 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-wider text-center">Thermal Correlation (Mean LST)</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.zonalStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="class" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} unit="°C" domain={[0, 40]} />
                <Tooltip contentStyle={{ borderRadius: '16px' }} />
                <Bar dataKey="avgLst" name="Average LST" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
                <Line type="monotone" dataKey="maxLst" name="Max Thermal Intensity" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comparative LULC Gallery (Mirrors the Scientific Paper Layout) */}
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <h4 className="text-xl font-black text-slate-800 uppercase tracking-widest text-center mb-10 border-b pb-4">
          LULC Visual Analysis for {selectedYear}
        </h4>
        
        <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
          <div key={selectedYear} className="relative group">
            <div className="border-4 border-slate-900 p-2 bg-white shadow-2xl transition-transform hover:scale-[1.01]">
              {/* Scientific Metadata labels */}
              <div className="absolute top-4 right-4 z-[1001] bg-white/90 p-1 border border-slate-900">
                 <svg width="30" height="30" viewBox="0 0 100 100">
                    <path d="M50 5 L60 40 L50 35 L40 40 Z" fill="#000" />
                    <path d="M50 95 L40 60 L50 65 L60 60 Z" fill="#ccc" />
                    <text x="45" y="105" fontSize="12" fontWeight="bold" fill="black">N</text>
                 </svg>
              </div>
              
              <h5 className="text-center font-black text-slate-800 mb-2 border-b-2 border-slate-200 pb-1 uppercase italic tracking-tighter">LULC Map {selectedYear}</h5>
              
              {/* Real LULC Image */}
              <div className="aspect-square bg-slate-100 relative overflow-hidden border border-slate-900 z-0 flex items-center justify-center">
                 <LULCImage year={selectedYear} />
              </div>
              
              {/* Scale bar simulation */}
              <div className="mt-2 flex justify-between items-end">
                 <div className="flex flex-col">
                    <div className="w-24 h-2 bg-slate-900 flex">
                       <div className="w-1/2 h-full bg-white border-r border-slate-900"></div>
                    </div>
                    <span className="text-[8px] font-bold">0 10 20 30 40 km</span>
                 </div>
                 <span className="text-[8px] font-bold text-slate-400 font-mono tracking-tighter">82.9° E  •  25.3° N</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center gap-6 flex-wrap bg-slate-50 p-4 rounded-2xl border border-slate-100">
           {[
             { name: "Urban", color: "#ef4444" },
             { name: "Water", color: "#3b82f6" },
             { name: "Bareland", color: "#eab308" },
             { name: "Vegetation", color: "#22c55e" },
             { name: "Forest", color: "#166534" }
           ].map(item => (
             <div key={item.name} className="flex items-center gap-2">
               <div className="w-4 h-4" style={{ backgroundColor: item.color }}></div>
               <span className="text-[10px] font-black text-slate-700 uppercase">{item.name}</span>
             </div>
           ))}
        </div>
      </div>

      {/* Accuracy Section (Chapter 4.3) */}
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-lg font-black text-slate-800 uppercase tracking-wider">ANN Model Accuracy Plot (Actual vs Predicted)</h4>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 font-bold text-sm">
              Current MSE: {data.mse}
            </div>
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                type="number" 
                dataKey="actual" 
                name="Actual Temp" 
                unit="°C" 
                axisLine={false} 
                tickLine={false} 
                domain={['auto', 'auto']} 
              />
              <YAxis 
                type="number" 
                dataKey="predicted" 
                name="Predicted Temp" 
                unit="°C" 
                axisLine={false} 
                tickLine={false} 
                domain={['auto', 'auto']} 
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Data Points" data={data.accuracyPoints} fill="#3b82f6" />
              {/* Target Reference Line (Ideal y=x) */}
              <Line 
                data={[
                  { 
                    actual: Math.min(...data.accuracyPoints.map(p => p.actual)), 
                    predicted: Math.min(...data.accuracyPoints.map(p => p.actual)) 
                  },
                  { 
                    actual: Math.max(...data.accuracyPoints.map(p => p.actual)), 
                    predicted: Math.max(...data.accuracyPoints.map(p => p.actual)) 
                  }
                ]} 
                type="monotone" 
                dataKey="predicted" 
                stroke="#94a3b8" 
                strokeWidth={2}
                dot={false} 
                activeDot={false} 
                name="Target (y=x)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-slate-400 font-medium italic mt-6">
          Correlation Plot generated using Zonal Statistics extraction from ArcGIS-processed satellite layers (Landsat OLI/TIRS)
        </p>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
