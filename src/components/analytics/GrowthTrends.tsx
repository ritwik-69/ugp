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

interface TrendData {
  year: string;
  water: number;
  vegetation: number;
  forest: number;
  urban: number;
  bareland: number;
}

interface AllTrends {
  lulcTrends: TrendData[];
  minLstTrends: TrendData[];
  maxLstTrends: TrendData[];
}

const TrendChart: React.FC<{ 
  data: TrendData[], 
  title: string, 
  yLabel: string, 
  domain: [number, number],
  ticks: number[]
}> = ({ data, title, yLabel, domain, ticks }) => (
  <div className="flex flex-col h-full bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50 shadow-inner">
    <h4 className="text-sm font-black text-slate-400 mb-8 text-center uppercase tracking-[0.2em]">
      {title}
    </h4>
    <div className="flex-1 w-full min-h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="year" 
            axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 900 }} 
            dy={15}
            label={{ 
              value: 'YEAR', 
              position: 'bottom', 
              offset: 30, 
              style: { fontWeight: 900, fontSize: 13, fill: '#1e293b', letterSpacing: '0.2em' } 
            }}
          />
          <YAxis 
            axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
            tickLine={false} 
            domain={domain}
            ticks={ticks}
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }}
            label={{ 
              value: yLabel, 
              angle: -90, 
              position: 'insideLeft', 
              offset: -10,
              style: { textAnchor: 'middle', fill: '#1e293b', fontSize: 13, fontWeight: 900, letterSpacing: '0.1em' } 
            }} 
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '20px', 
              border: 'none', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              fontSize: '12px',
              fontWeight: '900',
              padding: '16px'
            }} 
          />
          <Legend 
            verticalAlign="top" 
            align="center" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: '40px', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
          />
          
          <Line 
            type="monotone" 
            dataKey="water" 
            name="WATER"
            stroke="#2563eb" 
            strokeWidth={4} 
            dot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, strokeWidth: 0 }}
          />
          
          <Line 
            type="monotone" 
            dataKey="vegetation" 
            name="VEGETATION"
            stroke="#f97316" 
            strokeWidth={4} 
            dot={{ r: 5, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, strokeWidth: 0 }}
          />

          <Line 
            type="monotone" 
            dataKey="forest" 
            name="FOREST"
            stroke="#94a3b8" 
            strokeWidth={4} 
            dot={{ r: 5, fill: '#94a3b8', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, strokeWidth: 0 }}
          />

          <Line 
            type="monotone" 
            dataKey="urban" 
            name="URBAN"
            stroke="#eab308" 
            strokeWidth={4} 
            dot={{ r: 5, fill: '#eab308', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, strokeWidth: 0 }}
          />

          <Line 
            type="monotone" 
            dataKey="bareland" 
            name="BARELAND"
            stroke="#0ea5e9" 
            strokeWidth={4} 
            dot={{ r: 5, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const GrowthTrends: React.FC = () => {
  const [data, setData] = useState<AllTrends | null>(null);
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

  if (loading || !data) return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-pulse text-slate-400 font-bold italic">Extracting Geospatial Trends Data (2000-2020)...</div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        <TrendChart 
          data={data.lulcTrends} 
          title="LULC Variation Analysis" 
          yLabel="AREA %" 
          domain={[0, 60]}
          ticks={[0, 10, 20, 30, 40, 50, 60]}
        />

        <TrendChart 
          data={data.minLstTrends} 
          title="Minimum LST Distribution" 
          yLabel="TEMP °C" 
          domain={[0, 30]}
          ticks={[0, 5, 10, 15, 20, 25, 30]}
        />

        <TrendChart 
          data={data.maxLstTrends} 
          title="Maximum LST Intensity" 
          yLabel="TEMP °C" 
          domain={[0, 50]}
          ticks={[0, 10, 20, 30, 40, 50]}
        />
      </div>
      
      <div className="flex justify-center items-center py-4 bg-slate-900/5 mt-4 rounded-2xl">
        <p className="text-[10px] text-slate-500 font-black italic tracking-[0.3em] uppercase">
          *LAND USE LAND COVER & TEMPERATURE TREND ANALYSIS • DATA DERIVED FROM SATELLITE SENSORS (2000-2020)
        </p>
      </div>
    </div>
  );
};

export default GrowthTrends;
