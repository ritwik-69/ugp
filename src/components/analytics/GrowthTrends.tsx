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
    fetch('/api/lst-trends')
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
      <div className="animate-pulse text-slate-400 font-bold italic">Extracting LST Trend Data...</div>
    </div>
  );

  const classes = ["Water Bodies", "Vegetative Areas", "Urban", "Barelands"];
  const colors = ["#3b82f6", "#22c55e", "#ef4444", "#eab308"];

  return (
    <div className="w-full h-full flex flex-col p-4 space-y-12">
      {/* Min LST Chart */}
      <div className="flex-1 min-h-[400px] w-full bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
        <h3 className="text-2xl font-black text-slate-900 mb-8 text-center uppercase tracking-tight">Minimum LST Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="year" />
            <YAxis unit="°C" />
            <Tooltip />
            <Legend />
            {classes.map((cls, i) => (
              <Line key={cls} type="monotone" dataKey={`${cls}_min`} name={cls} stroke={colors[i]} strokeWidth={3} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Max LST Chart */}
      <div className="flex-1 min-h-[400px] w-full bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
        <h3 className="text-2xl font-black text-slate-900 mb-8 text-center uppercase tracking-tight">Maximum LST Trend</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="year" />
            <YAxis unit="°C" />
            <Tooltip />
            <Legend />
            {classes.map((cls, i) => (
              <Line key={cls} type="monotone" dataKey={`${cls}_max`} name={cls} stroke={colors[i]} strokeWidth={3} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GrowthTrends;
