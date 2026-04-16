import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Scatter, Line, ComposedChart, Cell, Legend
} from 'recharts';
import img2000 from '../../assets/LULC_2000_WhiteBG.png';
import img2010 from '../../assets/LULC_2010_WhiteBG.png';
import img2020 from '../../assets/LULC_2020_WhiteBG.png';
import lst2000 from '../../assets/LST_2000_WhiteBG.png';
import lst2010 from '../../assets/LST_2010_WhiteBG.png';
import lst2016 from '../../assets/LST_2016_WhiteBG.png';

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
    <div className="w-full h-full relative group bg-white flex items-center justify-center">
      <img 
        src={getImage()} 
        alt={`LULC Map ${year}`}
        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" 
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
    </div>
  );
};

const LSTImage: React.FC<{ year: number }> = ({ year }) => {
  const getImage = () => {
    switch (year) {
      case 2000: return lst2000;
      case 2010: return lst2010;
      case 2020: return lst2016;
      default: return lst2016;
    }
  };

  return (
    <div className="w-full h-full relative group bg-white flex items-center justify-center">
      <img 
        src={getImage()} 
        alt={`LST Map ${year}`}
        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" 
      />
      {/* LST Gradient Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-lg border border-slate-200 shadow-lg text-[10px] font-bold">
        <p className="mb-1 uppercase tracking-wider text-slate-700">LST Value (°C)</p>
        <div className="flex items-center gap-2">
          <div className="w-4 h-20 bg-gradient-to-t from-yellow-400 via-orange-500 to-red-600 rounded-sm"></div>
          <div className="flex flex-col justify-between h-20 text-[9px] text-slate-600">
            <span>High: 33.4</span>
            <span>Low: 17.6</span>
          </div>
        </div>
      </div>
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
          Visual Analysis for {selectedYear}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* LULC Map */}
          <div className="relative group">
            <div className="border-4 border-slate-900 p-2 bg-white shadow-2xl">
              <h5 className="text-center font-black text-slate-800 mb-2 border-b-2 border-slate-200 pb-1 uppercase italic tracking-tighter">LULC Map {selectedYear}</h5>
              <div className="aspect-square bg-slate-100 relative overflow-hidden border border-slate-900 z-0 flex items-center justify-center">
                 <LULCImage year={selectedYear} />
              </div>
            </div>
          </div>
          {/* LST Map */}
          <div className="relative group">
            <div className="border-4 border-slate-900 p-2 bg-white shadow-2xl">
              <h5 className="text-center font-black text-slate-800 mb-2 border-b-2 border-slate-200 pb-1 uppercase italic tracking-tighter">LST Map {selectedYear}</h5>
              <div className="aspect-square bg-slate-100 relative overflow-hidden border border-slate-900 z-0 flex items-center justify-center">
                 <LSTImage year={selectedYear} />
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
          <h4 className="text-lg font-black text-slate-800 uppercase tracking-wider">ANN Model Accuracy Plot (Predicted vs Actual)</h4>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 font-bold text-sm">
              Current MSE: {data.mse}
            </div>
          </div>
        </div>
        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="0" stroke="#ccc" />
              <XAxis 
                type="number" 
                dataKey="predicted" 
                name="Predicted" 
                axisLine={{ stroke: '#000' }} 
                tickLine={{ stroke: '#000' }} 
                tick={{ fill: '#000', fontWeight: 600 }}
                domain={['auto', 'auto']} 
                label={{ value: 'Predicted', position: 'bottom', offset: 20, style: { fontWeight: 800, fill: '#000' } }}
              />
              <YAxis 
                type="number" 
                dataKey="actual" 
                name="Actual" 
                axisLine={{ stroke: '#000' }} 
                tickLine={{ stroke: '#000' }} 
                tick={{ fill: '#000', fontWeight: 600 }}
                domain={['auto', 'auto']} 
                label={{ value: 'Actual', angle: -90, position: 'insideLeft', offset: 10, style: { fontWeight: 800, fill: '#000' } }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend verticalAlign="top" align="left" wrapperStyle={{ paddingBottom: '20px', paddingLeft: '60px' }} />
              <Scatter name="Predicted" data={data.accuracyPoints} fill="#008000" />
              {/* Actual/Ideal Reference Line */}
              <Line 
                data={[
                  { 
                    predicted: Math.min(...data.accuracyPoints.map(p => p.predicted)) - 2, 
                    actual: Math.min(...data.accuracyPoints.map(p => p.predicted)) - 2 
                  },
                  { 
                    predicted: Math.max(...data.accuracyPoints.map(p => p.predicted)) + 2, 
                    actual: Math.max(...data.accuracyPoints.map(p => p.predicted)) + 2 
                  }
                ]} 
                type="monotone" 
                dataKey="actual" 
                stroke="#FFFF00" 
                strokeWidth={3}
                dot={false} 
                activeDot={false} 
                name="Actual"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-slate-400 font-medium italic mt-6 uppercase tracking-widest">
          Chapter 4.3: Regression Analysis Results (Varanasi ROI Model Performance)
        </p>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
