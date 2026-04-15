import React, { useState, useEffect } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart
} from 'recharts';

const GrowthTrends: React.FC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trends')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch trends", err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-pulse text-slate-400 font-bold italic">Extracting LULC Variation Data (2000-2020)...</div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col p-4">
      <h3 className="text-3xl font-black text-slate-900 mb-10 text-center uppercase tracking-tight">
        LULC VARIATION (2000-2020)
      </h3>
      
      <div className="flex-1 min-h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 40, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="year" 
              axisLine={{ stroke: '#94a3b8', strokeWidth: 2 }}
              tickLine={false} 
              tick={{ fill: '#475569', fontSize: 14, fontWeight: 800 }} 
              dy={10}
              label={{ 
                value: 'YEAR', 
                position: 'bottom', 
                offset: 40, 
                style: { fontWeight: 900, fontSize: 16, fill: '#1e293b', letterSpacing: '0.1em' } 
              }}
            />
            <YAxis 
              axisLine={{ stroke: '#94a3b8', strokeWidth: 2 }}
              tickLine={false} 
              domain={[0, 60]}
              ticks={[0, 10, 20, 30, 40, 50, 60]}
              tick={{ fill: '#475569', fontSize: 13, fontWeight: 800 }}
              label={{ 
                value: 'AREA %', 
                angle: -90, 
                position: 'insideLeft', 
                offset: -5,
                style: { textAnchor: 'middle', fill: '#1e293b', fontSize: 16, fontWeight: 900, letterSpacing: '0.1em' } 
              }} 
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                fontSize: '14px',
                fontWeight: '800',
                padding: '12px'
              }} 
            />
            <Legend 
              verticalAlign="top" 
              align="center" 
              iconType="circle"
              wrapperStyle={{ paddingBottom: '50px', fontWeight: 900, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}
            />
            
            <Line 
              type="monotone" 
              dataKey="water" 
              name="WATER"
              stroke="#2563eb" 
              strokeWidth={4} 
              dot={{ r: 6, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
            />
            
            <Line 
              type="monotone" 
              dataKey="vegetation" 
              name="VEGETATION"
              stroke="#f97316" 
              strokeWidth={4} 
              dot={{ r: 6, fill: '#f97316', strokeWidth: 3, stroke: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
            />

            <Line 
              type="monotone" 
              dataKey="forest" 
              name="FOREST"
              stroke="#94a3b8" 
              strokeWidth={4} 
              dot={{ r: 6, fill: '#94a3b8', strokeWidth: 3, stroke: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
            />

            <Line 
              type="monotone" 
              dataKey="urban" 
              name="URBAN"
              stroke="#eab308" 
              strokeWidth={4} 
              dot={{ r: 6, fill: '#eab308', strokeWidth: 3, stroke: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
            />

            <Line 
              type="monotone" 
              dataKey="bareland" 
              name="BARELAND"
              stroke="#0ea5e9" 
              strokeWidth={4} 
              dot={{ r: 6, fill: '#0ea5e9', strokeWidth: 3, stroke: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <p className="text-xs text-slate-400 mt-16 text-center font-bold italic tracking-wider">
        *LAND USE LAND COVER VARIATION ANALYSIS • DATA DERIVED FROM LANDSAT SATELLITE MISSIONS (2000-2020)
      </p>
    </div>
  );
};

export default GrowthTrends;
