import React from 'react';
import { Link } from 'react-router-dom';

const modules = [
  { path: '/map', number: '01', title: 'Spatial explorer', description: 'Inspect land cover, surface temperature, elevation, and heat-risk patterns across the city.', tone: 'bg-[#e3efe7] text-[#1f5945]' },
  { path: '/predict', number: '02', title: 'Temperature model', description: 'Estimate near-surface air temperature from local satellite and terrain conditions.', tone: 'bg-[#e9edf5] text-[#38527d]' },
  { path: '/trends', number: '03', title: 'Change over time', description: 'Follow how urbanisation, vegetation, and thermal intensity have shifted since 2000.', tone: 'bg-[#f3ead6] text-[#8a5a18]' },
  { path: '/analytics', number: '04', title: 'Research summary', description: 'Review zonal statistics, model performance, and planning recommendations.', tone: 'bg-[#eee8f0] text-[#704b78]' },
];

const Home: React.FC = () => (
  <div className="min-h-[calc(100vh-6rem)] bg-[#f5f7f4]">
    <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-20">
      <div>
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-[#1f7654]">Varanasi • Climate intelligence</p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#18271f] md:text-7xl">
          Read the city through its <span className="text-[#2e765a]">changing surface.</span>
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-[#64736a]">
          Kashi Temp Hub brings satellite observations, land-cover change, and machine learning into one practical research workspace.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link to="/map" className="rounded-lg bg-[#1f5945] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(31,89,69,0.2)] transition hover:bg-[#174936]">
            Open spatial explorer
          </Link>
          <Link to="/workspace" className="rounded-lg border border-[#cbd9ce] bg-white px-5 py-3 text-sm font-bold text-[#2d5542] transition hover:border-[#8eb49c] hover:bg-[#f8fbf8]">
            Test your CSV
          </Link>
        </div>
      </div>

      <div className="relative min-h-[330px] overflow-hidden rounded-2xl bg-[#1f5945] p-8 text-white shadow-[0_18px_50px_rgba(31,89,69,0.18)]">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[28px] border-white/10" />
        <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full border-[36px] border-[#9bc8a7]/20" />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-center justify-between border-b border-white/15 pb-5">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#c8e7ce]">Current view</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">2020 baseline</span>
          </div>
          <div className="py-10">
            <p className="text-6xl font-semibold tracking-[-0.05em]">33.4°</p>
            <p className="mt-2 text-sm text-[#d3ebd7]">observed maximum surface temperature</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border-l border-white/20 pl-3"><p className="text-xl font-semibold">42%</p><p className="text-xs text-[#c8e7ce]">urban cover</p></div>
            <div className="border-l border-white/20 pl-3"><p className="text-xl font-semibold">18.6°</p><p className="text-xs text-[#c8e7ce]">minimum LST</p></div>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl border-t border-[#dce6de] px-6 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#71917c]">Explore the platform</p><h2 className="mt-2 text-2xl font-semibold text-[#21372d]">Research modules</h2></div>
        <span className="hidden text-sm text-[#849188] sm:block">Four views, one shared dataset</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {modules.map((module) => (
          <Link key={module.path} to={module.path} className="group border border-[#dfe8df] bg-white p-5 transition hover:-translate-y-1 hover:border-[#a9c5b0] hover:shadow-[0_12px_30px_rgba(31,89,69,0.08)]">
            <div className={`mb-12 inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${module.tone}`}>{module.number}</div>
            <h3 className="text-lg font-semibold text-[#25382c]">{module.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#758178]">{module.description}</p>
            <span className="mt-5 inline-block text-sm font-bold text-[#2e765a] transition group-hover:translate-x-1">Explore →</span>
          </Link>
        ))}
      </div>
    </section>
  </div>
);

export default Home;
