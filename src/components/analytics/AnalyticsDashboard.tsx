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

interface AnalyticsSummary {
  averageLst: number;
  maximumLst: number;
  urbanPercentage: number;
  vegetationPercentage: number;
  riskLevel: string;
}

interface YearComparison {
  year: number;
  averageLst: number;
  maximumLst: number;
  urbanPercentage: number;
  vegetationPercentage: number;
}

interface ModelEvaluation {
  trainSamples: number;
  testSamples: number;
  mae: number;
  rmse: number;
  r2: number;
  featureImportance: { feature: string; importance: number }[];
  classification: {
    labels: string[];
    confusionMatrix: number[][];
    macroPrecision: number;
    macroRecall: number;
    macroF1: number;
  };
  uncertainty: { lowerErrorBound: number; upperErrorBound: number };
}

interface AnalyticsData {
  year: number;
  zonalStats: ZonalStat[];
  accuracyPoints: AccuracyPoint[];
  mse: number | null;
  summary: AnalyticsSummary;
}

interface TrainingReport {
  trainSamples: number;
  testSamples: number;
  mae: number;
  rmse: number;
  r2: number;
  featureImportance: { feature: string; importance: number }[];
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



interface AnalyticsDashboardProps {
  workspaceMode?: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ workspaceMode = false }) => {
  const [selectedYear, setSelectedYear] = useState(2020);
  const [activeSection, setActiveSection] = useState<'overview' | 'recommendations' | 'charts' | 'model' | 'visual'>('overview');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<YearComparison[]>([]);
  const [modelFactors, setModelFactors] = useState<{ name: string; effect: string; description: string }[]>([]);
  const [evaluation, setEvaluation] = useState<ModelEvaluation | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedYears, setUploadedYears] = useState<number[]>([]);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [uploadedTraining, setUploadedTraining] = useState<TrainingReport | null>(null);

  useEffect(() => {
    let active = true;
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        let response: Response;
        if (workspaceMode && uploadedFile) {
          const formData = new FormData();
          formData.append('file', uploadedFile);
          response = await fetch(`/api/upload-analysis?year=${selectedYear}`, { method: 'POST', body: formData });
        } else {
          response = await fetch(`/api/analytics?year=${selectedYear}`);
        }
        const body = await response.text();
        const result = JSON.parse(body) as { detail?: string; filename?: string; years?: number[]; analytics?: AnalyticsData };
        if (!response.ok) throw new Error(result.detail ?? 'Analytics request failed');
        const nextData = workspaceMode && uploadedFile ? result.analytics : result as unknown as AnalyticsData;
        if (!nextData) throw new Error('Analytics response was incomplete.');
        if (active) {
          setData(nextData);
          if (workspaceMode && uploadedFile) {
            setUploadedYears(result.years ?? []);
            setUploadedFilename(result.filename ?? uploadedFile.name);
            setUploadState('success');
            setUploadStatus(`${result.filename ?? uploadedFile.name}: ${result.analytics?.accuracyPoints.length ?? 0} analyzed rows for ${nextData.year}`);
            window.dispatchEvent(new Event('dataset-changed'));
            if (nextData.year !== selectedYear) setSelectedYear(nextData.year);
          }
        }
      } catch (requestError) {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : 'Analytics could not be loaded.');
          if (workspaceMode && uploadedFile) {
            setUploadState('error');
            setUploadStatus(requestError instanceof Error ? requestError.message : 'CSV analysis failed.');
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadAnalytics();
    return () => {
      active = false;
    };
  }, [selectedYear, uploadedFile, workspaceMode]);

  const resetUploadedAnalysis = async () => {
    await fetch('/api/reset-dataset', { method: 'POST' });
    setUploadedFile(null);
    setUploadedYears([]);
    setUploadedFilename(null);
    setUploadedTraining(null);
    setUploadStatus(null);
    setUploadState('idle');
    setSelectedYear(2020);
    window.dispatchEvent(new Event('dataset-changed'));
  };

  useEffect(() => {
    if (!workspaceMode || !uploadedFile) {
      return;
    }
    setUploadState('loading');
    setUploadStatus(`Analyzing ${uploadedFile.name}...`);
  }, [uploadedFile, workspaceMode]);

  /* Load comparison and model metadata independently of the selected dataset. */
  useEffect(() => {
    Promise.all([
      fetch('/api/year-comparison').then((response) => response.ok ? response.json() : Promise.reject(new Error('Year comparison unavailable'))),
      fetch('/api/model-info').then((response) => response.ok ? response.json() : Promise.reject(new Error('Model information unavailable'))),
      fetch('/api/model-evaluation').then((response) => response.ok ? response.json() : null)
    ]).then(([comparisonData, modelData, evaluationData]) => {
      setComparison(Array.isArray(comparisonData.years) ? comparisonData.years : []);
      setModelFactors(Array.isArray(modelData.factors) ? modelData.factors : []);
      setEvaluation(evaluationData && Array.isArray(evaluationData.featureImportance) ? evaluationData : null);
    }).catch(() => setError('Some comparison insights are temporarily unavailable.'));
  }, []);

  const COLORS = ['#0000FF', '#00FF00', '#FF0000', '#006400', '#FFFF00'];

  const exportCsv = () => {
    const rows = [
      ['Metric', 'Value', 'Year'],
      ['Average LST (°C)', data?.summary.averageLst ?? '', selectedYear],
      ['Maximum LST (°C)', data?.summary.maximumLst ?? '', selectedYear],
      ['Urban Area (%)', data?.summary.urbanPercentage ?? '', selectedYear],
      ['Vegetation (%)', data?.summary.vegetationPercentage ?? '', selectedYear],
      ['Heat Risk', data?.summary.riskLevel ?? '', selectedYear],
      [],
      ['LULC Class', 'Area (sq. km)', 'Average LST (°C)', 'Minimum LST (°C)', 'Maximum LST (°C)'],
      ...(data?.zonalStats ?? []).map((stat) => [stat.class, stat.area, stat.avgLst, stat.minLst, stat.maxLst]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workspaceMode && uploadedFilename ? 'uploaded' : 'varanasi'}-climate-analysis-${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportReport = () => {
    if (!data) return;
    const report = `<!doctype html><html><head><meta charset="utf-8"><title>Varanasi Climate Report - ${selectedYear}</title><style>body{font-family:Arial;max-width:900px;margin:40px auto;color:#1e293b}h1{color:#1d4ed8}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card{padding:16px;background:#f1f5f9;border-radius:12px}li{margin:8px 0}</style></head><body><h1>Varanasi Climate Insights Report</h1><p>Dataset year: ${selectedYear}</p><div class="grid">${[
      ['Average LST', `${data.summary.averageLst}°C`], ['Maximum LST', `${data.summary.maximumLst}°C`],
      ['Urban Area', `${data.summary.urbanPercentage}%`], ['Vegetation', `${data.summary.vegetationPercentage}%`],
      ['Heat Risk', data.summary.riskLevel], ['RMSE', evaluation ? evaluation.rmse : 'Unavailable']
    ].map(([label, value]) => `<div class="card"><strong>${label}</strong><br>${value}</div>`).join('')}</div><h2>Recommendations</h2><ul>${[
      data.summary.maximumLst >= 30 ? 'Prioritize shade trees and reflective surfaces in high-temperature zones.' : 'Continue monitoring seasonal surface temperature changes.',
      data.summary.urbanPercentage >= 30 ? 'Protect remaining open, permeable areas from uncontrolled construction.' : 'Guide future growth toward compact, lower-impact development.',
      'Use hotspot and region analysis to target field surveys and interventions.'
    ].map((item) => `<li>${item}</li>`).join('')}</ul><h2>Methodology</h2><p>Metrics are calculated from the loaded Varanasi climate CSV observations and the calibrated regression model.</p></body></html>`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([report], { type: 'text/html' }));
    link.download = `varanasi-climate-report-${selectedYear}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadState('error');
      setUploadStatus('Please choose a CSV file.');
      event.target.value = '';
      return;
    }
    setError(null);
    setUploadedFile(file);
    setUploadState('loading');
    setUploadStatus(`Analyzing ${file.name}...`);
    event.target.value = '';
  };

  const retrainUploadedModel = async () => {
    if (!uploadedFile) return;
    const formData = new FormData();
    formData.append('file', uploadedFile);
    setUploadState('loading');
    setUploadStatus(`Retraining models from ${uploadedFile.name}...`);
    try {
      const response = await fetch('/api/retrain-uploaded', { method: 'POST', body: formData });
      const result = await response.json() as { detail?: string; filename?: string; training?: TrainingReport };
      if (!response.ok || !result.training) throw new Error(result.detail ?? 'Retraining failed.');
      setUploadedTraining(result.training);
      setUploadState('success');
      setUploadStatus(`${result.filename ?? uploadedFile.name}: retraining complete`);
      window.dispatchEvent(new Event('dataset-changed'));
    } catch (retrainError) {
      setUploadState('error');
      setUploadStatus(retrainError instanceof Error ? retrainError.message : 'Retraining failed.');
    } finally {
      setUploadState((state) => state === 'loading' ? 'error' : state);
    }
  };

  if (error && !data) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
      <p className="text-lg font-black text-red-600">Unable to load analytics</p>
      <p className="mt-2 text-sm text-slate-500">{error}</p>
      <button onClick={() => window.location.reload()} className="mt-5 px-5 py-2 rounded-xl bg-blue-600 text-white font-bold">Retry</button>
    </div>
  );

  if (loading || !data) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-xl font-bold text-slate-400 animate-pulse italic">Processing Zonal Statistics (Section 8)...</div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-6 border-b border-[#dce6de] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71917c]">{workspaceMode ? 'Uploaded workspace' : 'Pretrained dataset'} • Climate intelligence</p>
          <h3 className="mt-2 text-3xl font-semibold tracking-tight text-[#21372d]">Climate analytics</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#748178]">Compare surface temperature, land-cover composition, and model evidence for the selected year.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(uploadedYears.length > 0 ? uploadedYears : [2000, 2010, 2020]).map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                selectedYear === y ? 'bg-[#1f5945] text-white shadow-sm' : 'bg-white text-[#617267] border border-[#dce6de]'
              }`}
            >
              {y}
            </button>
          ))}
          <button
            onClick={exportCsv}
            className="rounded-lg bg-[#2e765a] px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1f5945]"
          >
            Export CSV
          </button>
          <button onClick={exportReport} className="rounded-lg bg-[#704b78] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#5d3d64]">
            Export Report
          </button>
          {workspaceMode && <label className="cursor-pointer rounded-lg bg-[#21372d] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#1f5945]">
            Analyze CSV
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleUpload} />
          </label>}
          {workspaceMode && uploadedFile && (
            <button
              type="button"
              onClick={resetUploadedAnalysis}
              className="px-4 py-2 rounded-xl font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-all"
            >
              Return to built-in data
            </button>
          )}
          {workspaceMode && uploadedFile && (
            <button
              type="button"
              onClick={() => void retrainUploadedModel()}
              disabled={uploadState === 'loading'}
              className="px-4 py-2 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400 transition-all"
            >
              {uploadState === 'loading' ? 'Training...' : 'Retrain uploaded model'}
            </button>
          )}
        </div>
      </div>
      <nav aria-label="Analytics sections" className="flex gap-1 overflow-x-auto border-b border-[#e1e9e2] bg-[#f5f7f4] py-3">
        {[
          ['overview', 'Overview'],
          ['recommendations', 'Recommendations'],
          ['charts', 'Charts'],
          ['model', 'Model evidence'],
          ['visual', 'Visual analysis'],
        ].filter(([id]) => !workspaceMode || id !== 'visual').map(([id, label]) => (
          <button key={id} type="button" onClick={() => setActiveSection(id as typeof activeSection)} className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold transition ${activeSection === id ? 'bg-[#1f5945] text-white' : 'text-[#627b6b] hover:bg-[#e3efe7] hover:text-[#1f5945]'}`}>
            {label}
          </button>
        ))}
      </nav>
      {workspaceMode && uploadedFilename && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50 px-5 py-4 text-sm font-bold text-purple-800">
          Showing results calculated from <span className="font-black">{uploadedFilename}</span>. The built-in dataset and trained models have not been changed.
        </div>
      )}
      {workspaceMode && uploadedTraining && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <h4 className="text-lg font-black text-emerald-900">Uploaded workspace model</h4>
          <p className="mt-1 text-sm font-medium text-emerald-800">
            This model was trained only from {uploadedFilename}.
          </p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              ['MAE', uploadedTraining.mae],
              ['RMSE', uploadedTraining.rmse],
              ['R²', uploadedTraining.r2],
              ['Train rows', uploadedTraining.trainSamples],
              ['Test rows', uploadedTraining.testSamples]
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-white/80 p-3">
                <p className="text-[10px] font-bold uppercase text-emerald-700">{label}</p>
                <p className="mt-1 text-xl font-black text-emerald-950">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {workspaceMode && uploadStatus && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm font-bold ${
            uploadState === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : uploadState === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-blue-200 bg-blue-50 text-blue-700'
          }`}
        >
          {uploadStatus}
        </div>
      )}

      {activeSection === 'overview' && <section id="analytics-overview" className="pt-4">
        <div className="mb-3 flex items-end justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#71917c]">At a glance</p><p className="mt-1 text-sm text-[#748178]">Key indicators for the selected observation year.</p></div>
          <span className="hidden text-xs font-semibold text-[#89958c] sm:block">Current dataset</span>
        </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: 'Average LST', value: `${data.summary.averageLst}°C`, color: 'text-blue-700' },
          { label: 'Maximum LST', value: `${data.summary.maximumLst}°C`, color: 'text-red-600' },
          { label: 'Urban Area', value: `${data.summary.urbanPercentage}%`, color: 'text-orange-600' },
          { label: 'Vegetation', value: `${data.summary.vegetationPercentage}%`, color: 'text-green-600' },
          { label: 'Heat Risk', value: data.summary.riskLevel, color: data.summary.riskLevel === 'Critical' || data.summary.riskLevel === 'High' ? 'text-red-600' : 'text-amber-600' },
        ].map((metric) => (
          <div key={metric.label} className="border border-[#dfe8df] bg-white p-5 shadow-[0_6px_18px_rgba(27,52,39,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#89958c]">{metric.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${metric.color}`}>{metric.value}</p>
            <p className="mt-1 text-[10px] font-semibold text-[#89958c]">{selectedYear} observation set</p>
          </div>
        ))}
      </div>
      </section>}

      {activeSection === 'recommendations' && <section id="analytics-recommendations" className="pt-4">
      <div className="border border-[#cfe2d4] bg-[#e8f3eb] p-6">
        <h4 className="text-lg font-semibold text-[#28543d]">Planning recommendations</h4>
        <p className="mt-1 text-sm text-[#527160]">Actions suggested from the {selectedYear} climate indicators.</p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm font-bold text-slate-700">
          {[
            data.summary.maximumLst >= 30 ? 'Prioritize shade trees and reflective surfaces in high-temperature zones.' : 'Continue monitoring seasonal surface temperature changes.',
            data.summary.urbanPercentage >= 30 ? 'Protect remaining open, permeable areas from uncontrolled construction.' : 'Guide future growth toward compact, lower-impact development.',
            data.summary.vegetationPercentage < 40 ? 'Restore vegetation corridors and protect existing forest cover.' : 'Maintain current vegetation and prevent land-cover conversion.',
            'Use the map hotspot layer and region tool to target field surveys and interventions.'
          ].map((recommendation) => <li key={recommendation} className="bg-white/80 p-3 rounded-xl">{recommendation}</li>)}
        </ul>
      </div>
      </section>}

      {activeSection === 'overview' && !uploadedFile && <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h4 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-4">Year comparison</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {comparison.map((item) => (
            <div key={item.year} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-xl font-black text-blue-700">{item.year}</p>
              <p className="text-sm font-bold text-slate-600 mt-2">Average LST: {item.averageLst}°C</p>
              <p className="text-sm font-bold text-slate-600">Urban: {item.urbanPercentage}%</p>
              <p className="text-sm font-bold text-slate-600">Vegetation: {item.vegetationPercentage}%</p>
            </div>
          ))}
        </div>
      </div>}

      {activeSection === 'model' && <div id="analytics-model" className="bg-[#21372d] p-6 text-white shadow-[0_10px_28px_rgba(27,52,39,0.12)]">
        <h4 className="text-lg font-black uppercase tracking-wider mb-4">Model factor explanation</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modelFactors.map((factor) => (
            <div key={factor.name} className="bg-white/10 p-4 rounded-2xl">
              <p className="font-black">{factor.name}</p>
              <p className="text-xs text-blue-200 font-bold mt-1">{factor.effect}</p>
              <p className="text-xs text-slate-300 mt-2">{factor.description}</p>
            </div>
          ))}
        </div>
      </div>}

      {activeSection === 'model' && evaluation && !uploadedFile && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-4">Held-out model evaluation</h4>
          <p className="text-xs text-slate-500 mb-4">Evaluated on {evaluation.testSamples} observations not used in the training portion.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[['MAE', evaluation.mae], ['RMSE', evaluation.rmse], ['R²', evaluation.r2], ['Train samples', evaluation.trainSamples]].map(([label, value]) => (
              <div key={String(label)} className="p-4 rounded-2xl bg-slate-50"><p className="text-xs font-bold text-slate-500">{label}</p><p className="text-2xl font-black text-blue-700">{value}</p></div>
            ))}
          </div>
          <div className="mt-5 space-y-2">
            {evaluation.featureImportance.map((item) => <div key={item.feature} className="flex items-center gap-3 text-xs font-bold"><span className="w-24">{item.feature}</span><div className="h-2 flex-1 bg-slate-100 rounded-full"><div className="h-2 bg-blue-600 rounded-full" style={{ width: `${item.importance * 100}%` }} /></div><span>{Math.round(item.importance * 100)}%</span></div>)}
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            {evaluation.classification && evaluation.uncertainty && [['Precision', evaluation.classification.macroPrecision], ['Recall', evaluation.classification.macroRecall], ['F1', evaluation.classification.macroF1], ['Error low', evaluation.uncertainty.lowerErrorBound], ['Error high', evaluation.uncertainty.upperErrorBound]].map(([label, value]) => (
              <div key={String(label)} className="p-3 rounded-xl bg-slate-50"><p className="text-[10px] font-bold text-slate-500">{label}</p><p className="font-black text-slate-800">{value}</p></div>
            ))}
          </div>
          {evaluation.classification && <div className="mt-5 overflow-x-auto">
            <p className="text-xs font-black text-slate-500 mb-2">LULC confusion matrix</p>
            <table className="text-xs border-collapse">
              <tbody>
                {evaluation.classification.confusionMatrix.map((row, rowIndex) => (
                  <tr key={evaluation.classification.labels[rowIndex]}>
                    {row.map((value, columnIndex) => <td key={`${rowIndex}-${columnIndex}`} className="border border-slate-200 px-3 py-2 text-center">{value}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
        </div>
      )}

      {activeSection === 'charts' && <div id="analytics-charts" className="pt-4">
      <div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#71917c]">Evidence in charts</p><p className="mt-1 text-sm text-[#748178]">Land-cover composition and thermal distribution by class.</p></div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* LULC Area Distribution (Chapter 4.1) */}
        <div className="border border-[#dfe8df] bg-white p-6 shadow-[0_8px_24px_rgba(27,52,39,0.05)]">
          <h4 className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-[#627b6b]">Area distribution (sq. km)</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
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
        <div className="border border-[#dfe8df] bg-white p-6 shadow-[0_8px_24px_rgba(27,52,39,0.05)]">
          <h4 className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-[#627b6b]">Thermal correlation (mean LST)</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
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
      </div>}

      {activeSection === 'visual' && !workspaceMode && (
        <div id="analytics-visual" className="border border-[#dfe8df] bg-white p-6 shadow-[0_8px_24px_rgba(27,52,39,0.05)]">
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-widest text-center mb-10 border-b pb-4">
            Visual Analysis for {selectedYear}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="relative group">
              <div className="border-4 border-slate-900 p-2 bg-white shadow-2xl">
                <h5 className="text-center font-black text-slate-800 mb-2 border-b-2 border-slate-200 pb-1 uppercase italic tracking-tighter">LULC Map {selectedYear}</h5>
                <div className="aspect-square bg-slate-100 relative overflow-hidden border border-slate-900 z-0 flex items-center justify-center">
                   <LULCImage year={selectedYear} />
                </div>
              </div>
            </div>
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
      )}

      {/* Accuracy Section (Chapter 4.3) */}
      {activeSection === 'model' && <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-lg font-black text-slate-800 uppercase tracking-wider">Model Accuracy Plot (Predicted vs Actual)</h4>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 font-bold text-sm">
              Current MSE: {data.mse}
            </div>
          </div>
        </div>
        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
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
      </div>}
    </div>
  );
};

export default AnalyticsDashboard;
