import React, { useState } from 'react';
import VaranasiMap from '../map/VaranasiMap';
import PredictionForm from '../predictor/PredictionForm';
import GrowthTrends from '../analytics/GrowthTrends';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';

type WorkspaceTab = 'overview' | 'map' | 'predictor' | 'trends' | 'analytics';

const UploadedWorkspace: React.FC = () => {
  const [tab, setTab] = useState<WorkspaceTab>('overview');

  const tabs: { id: WorkspaceTab; label: string }[] = [
    { id: 'overview', label: 'Workspace home' },
    { id: 'map', label: 'Uploaded map' },
    { id: 'predictor', label: 'Uploaded predictor' },
    { id: 'trends', label: 'Uploaded trends' },
    { id: 'analytics', label: 'Test & analyze CSV' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav aria-label="Uploaded workspace navigation" className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold transition-all ${
              tab === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            ['1', 'Upload CSV', 'Use the CSV validator in Test & analyze CSV.'],
            ['2', 'Retrain models', 'Train a temperature regressor and LULC classifier.'],
            ['3', 'Review metrics', 'Inspect MAE, RMSE, R², charts, and risk summaries.'],
            ['4', 'Explore results', 'Use the separate map, predictor, and trends tabs.'],
          ].map(([number, title, description]) => (
            <article key={number} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl">
              <span className="text-3xl font-black text-emerald-600">{number}</span>
              <h2 className="mt-4 text-lg font-black text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </article>
          ))}
        </section>
      )}

      {tab === 'map' && (
        <div className="h-[calc(100vh-15rem)] min-h-[620px] overflow-hidden rounded-3xl border-4 border-white bg-white shadow-2xl">
          <VaranasiMap />
        </div>
      )}

      {tab === 'predictor' && (
        <section className="rounded-3xl bg-slate-50 p-6">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-black text-slate-900">Uploaded Model Predictor</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">Predictions use the uploaded workspace model after retraining.</p>
          </div>
          <PredictionForm workspaceMode />
        </section>
      )}

      {tab === 'trends' && (
        <div className="h-[650px] rounded-3xl border border-slate-100 bg-white p-4 shadow-2xl">
          <GrowthTrends />
        </div>
      )}

      {tab === 'analytics' && (
        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 md:p-6">
          <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-bold text-emerald-900">
              Upload and analyze your CSV here. The pretrained Analytics page does not contain upload controls.
            </p>
          </div>
          <AnalyticsDashboard workspaceMode />
        </div>
      )}
    </div>
  );
};

export default UploadedWorkspace;
