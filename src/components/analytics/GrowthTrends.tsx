import React, { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface TrendData {
  year: string;
  water: number;
  vegetation: number;
  forest: number;
  urban: number;
  bareland: number;
  minLst?: number;
  maxLst?: number;
}

interface AllTrends {
  lulcTrends: TrendData[];
  minLstTrends: TrendData[];
  maxLstTrends: TrendData[];
}

const series = [
  { key: 'water', name: 'Water', color: '#6288a0' },
  { key: 'vegetation', name: 'Vegetation', color: '#4b8a68' },
  { key: 'forest', name: 'Forest', color: '#7d9a85' },
  { key: 'urban', name: 'Urban', color: '#b48b2d' },
  { key: 'bareland', name: 'Bareland', color: '#c57b35' },
] as const;

const TrendChart: React.FC<{
  data: TrendData[];
  title: string;
  yLabel: string;
  domain: [number, number];
}> = ({ data, title, yLabel, domain }) => (
  <div className="flex min-h-[350px] flex-col border border-[#dfe8df] bg-[#fbfcfa] p-5 shadow-[0_8px_24px_rgba(27,52,39,0.05)]">
    <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#627b6b]">{title}</h4>
    <div className="min-h-[280px] flex-1">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3ebe4" />
          <XAxis dataKey="year" axisLine={{ stroke: '#cbdacf' }} tickLine={false} tick={{ fill: '#748178', fontSize: 11, fontWeight: 600 }} />
          <YAxis domain={domain} axisLine={{ stroke: '#cbdacf' }} tickLine={false} tick={{ fill: '#748178', fontSize: 10, fontWeight: 600 }} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #dfe8df', boxShadow: '0 8px 20px rgba(27,52,39,0.08)', fontSize: '12px' }} />
          <Legend verticalAlign="top" align="left" iconType="circle" wrapperStyle={{ paddingBottom: '18px', fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.06em' }} />
          {series.map((item) => (
            <Line key={item.key} type="monotone" dataKey={item.key} name={item.name} stroke={item.color} strokeWidth={2.5} dot={{ r: 3, fill: item.color, strokeWidth: 1.5, stroke: '#fff' }} activeDot={{ r: 5 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#89958c]">{yLabel}</p>
  </div>
);

const GrowthTrends: React.FC = () => {
  const [data, setData] = useState<AllTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datasetRevision, setDatasetRevision] = useState(0);

  useEffect(() => {
    const refreshDataset = () => setDatasetRevision((revision) => revision + 1);
    window.addEventListener('dataset-changed', refreshDataset);
    return () => window.removeEventListener('dataset-changed', refreshDataset);
  }, []);

  useEffect(() => {
    fetch('/api/trends')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Trend data unavailable')))
      .then((json: AllTrends) => setData(json))
      .catch(() => setError('Trend data could not be loaded. Start the backend and try again.'))
      .finally(() => setLoading(false));
  }, [datasetRevision]);

  if (loading) return <div className="flex h-full min-h-[420px] items-center justify-center text-sm font-semibold text-[#7b887e]">Loading historical observations...</div>;
  if (error || !data) return <div className="flex h-full min-h-[420px] items-center justify-center text-sm font-semibold text-red-600">{error ?? 'Trend data unavailable.'}</div>;

  const firstLulc = data.lulcTrends[0];
  const lastLulc = data.lulcTrends[data.lulcTrends.length - 1];
  const firstMax = data.maxLstTrends[0];
  const lastMax = data.maxLstTrends[data.maxLstTrends.length - 1];
  const change = (current: number, previous: number) => `${current - previous >= 0 ? '+' : ''}${(current - previous).toFixed(1)}`;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="mb-5 flex flex-col justify-between gap-3 border-b border-[#e1e9e2] pb-5 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71917c]">Historical observatory</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#21372d]">How the landscape is changing</h3>
          <p className="mt-1 text-sm text-[#748178]">A view of land-cover composition and thermal intensity across the available years.</p>
        </div>
        <span className="text-xs font-semibold text-[#89958c]">{data.lulcTrends[0]?.year} — {data.lulcTrends[data.lulcTrends.length - 1]?.year}</span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Urban cover', `${lastLulc.urban}%`, `${change(lastLulc.urban, firstLulc.urban)} pts since ${firstLulc.year}`],
          ['Vegetation', `${lastLulc.vegetation}%`, `${change(lastLulc.vegetation, firstLulc.vegetation)} pts since ${firstLulc.year}`],
          ['Peak LST', `${lastMax.maxLst ?? 0}°C`, `${change(lastMax.maxLst ?? 0, firstMax.maxLst ?? 0)}°C since ${firstMax.year}`],
          ['Latest reading', lastMax.year, 'Most recent available year'],
        ].map(([label, value, note]) => (
          <div key={label} className="border border-[#dfe8df] bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#89958c]">{label}</p>
            <p className="mt-2 text-xl font-semibold text-[#2e765a]">{value}</p>
            <p className="mt-1 text-[11px] text-[#7b887e]">{note}</p>
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-3">
        <TrendChart data={data.lulcTrends} title="Land-cover composition" yLabel="Share of observations (%)" domain={[0, 60]} />
        <TrendChart data={data.minLstTrends} title="Minimum surface temperature" yLabel="Temperature (°C)" domain={[0, 30]} />
        <TrendChart data={data.maxLstTrends} title="Maximum surface temperature" yLabel="Temperature (°C)" domain={[0, 50]} />
      </div>
    </div>
  );
};

export default GrowthTrends;
