import React, { useState } from 'react';

interface PredictionResult {
  airTemperature: number;
  mse: number;
  riskLevel: string;
  recommendation: string;
}

interface PredictionFormProps {
  workspaceMode?: boolean;
}

const PredictionForm: React.FC<PredictionFormProps> = ({ workspaceMode = false }) => {
  const [lst, setLst] = useState<string>('');
  const [elevation, setElevation] = useState<string>('');
  const [lulc, setLulc] = useState<string>('Urban');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const lstValue = Number(lst);
    const elevationValue = Number(elevation);
    if (!Number.isFinite(lstValue) || lstValue < -20 || lstValue > 70) {
      setError('Enter an LST value between -20°C and 70°C.');
      setLoading(false);
      return;
    }
    if (!Number.isFinite(elevationValue) || elevationValue < -100 || elevationValue > 3000) {
      setError('Enter an elevation between -100m and 3000m.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lst: lstValue,
          lulc_class: lulc,
          elevation: elevationValue,
        }),
      });

      if (!response.ok) throw new Error('Model prediction failed');

      const data = await response.json();
      setResult({
        airTemperature: data.air_temperature,
        mse: data.mse,
        riskLevel: data.risk_level,
        recommendation: data.recommendation,
      });
    } catch {
      setError('Failed to fetch prediction from ML model. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl justify-center gap-6 lg:grid-cols-[minmax(0,540px)_minmax(280px,360px)]">
      <div className="border border-[#dce6de] bg-[#fbfcfa] p-6 shadow-[0_12px_35px_rgba(27,52,39,0.07)] md:p-8">
        <div className="mb-8 border-b border-[#e1e9e2] pb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71917c]">Model inputs</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#21372d]">Estimate air temperature</h2>
          <p className="mt-2 text-sm leading-6 text-[#748178]">
            Enter the observed surface and terrain conditions for the location you want to examine.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[#33483a] mb-1.5">
            Land Surface Temp (LST °C)
          </label>
          <input
            type="number"
            step="0.1"
            required
            value={lst}
            onChange={(e) => setLst(e.target.value)}
            className="w-full rounded-lg border border-[#ccd9cf] bg-white px-4 py-3 text-[#21372d] outline-none transition focus:border-[#4c9270] focus:ring-2 focus:ring-[#d9ecdf]"
            placeholder="e.g. 32.5"
          />
          <p className="mt-1.5 text-xs text-[#8a968e]">Typical range: 18–40°C</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#33483a] mb-1.5">
            Elevation (m)
          </label>
          <input
            type="number"
            required
            value={elevation}
            onChange={(e) => setElevation(e.target.value)}
            className="w-full rounded-lg border border-[#ccd9cf] bg-white px-4 py-3 text-[#21372d] outline-none transition focus:border-[#4c9270] focus:ring-2 focus:ring-[#d9ecdf]"
            placeholder="e.g. 80"
          />
          <p className="mt-1.5 text-xs text-[#8a968e]">Elevation above mean sea level</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#33483a] mb-1.5">
            LULC Classification
          </label>
          <select
            value={lulc}
            onChange={(e) => setLulc(e.target.value)}
            className="w-full rounded-lg border border-[#ccd9cf] bg-white px-4 py-3 text-[#21372d] outline-none transition focus:border-[#4c9270] focus:ring-2 focus:ring-[#d9ecdf]"
          >
            <option value="Water Bodies">Water Bodies</option>
            <option value="Vegetative Areas">Vegetative Areas</option>
            <option value="Urban">Urban</option>
            <option value="Forests">Forests</option>
            <option value="Barelands">Barelands</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {[['Urban', '32.5', '82'], ['Vegetative Areas', '27.0', '78'], ['Water Bodies', '23.0', '75']].map(([label, sampleLst, sampleElevation]) => (
            <button key={label} type="button" onClick={() => { setLulc(label); setLst(sampleLst); setElevation(sampleElevation); }} className="rounded-full border border-[#cbdacf] px-3 py-1.5 text-xs font-semibold text-[#527160] hover:border-[#6da080] hover:bg-[#eff7f0]">
              Try {label}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg px-4 py-3.5 font-bold text-white transition-all ${
            loading ? 'cursor-not-allowed bg-[#9aaca0]' : 'bg-[#1f5945] hover:bg-[#174936] active:scale-[0.99]'
          }`}
        >
          {loading ? 'Running Inference...' : 'Predict Air Temperature'}
        </button>
      </form>

      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
      </div>

      {result ? (
        <div className="border border-[#cfe2d4] bg-[#e8f3eb] p-6 shadow-[0_12px_35px_rgba(31,89,69,0.08)] md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4c8062]">Prediction output</p>
          <p className="mt-2 text-sm font-semibold text-[#345542]">{workspaceMode ? 'Uploaded workspace model' : 'Pretrained Varanasi model'}</p>
          <div className="mt-10 border-b border-[#c9dfce] pb-8">
            <p className="text-sm font-semibold text-[#527160]">Estimated air temperature</p>
            <p className="mt-2 text-6xl font-semibold tracking-[-0.06em] text-[#1f5945]">{result.airTemperature}°C</p>
          </div>
          <div className="space-y-4 pt-6">
            <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-[#527160]">Heat-risk level</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#8a5a18] shadow-sm">
              {result.riskLevel}
            </span>
            </div>
            <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-[#527160]">Reference error (MSE)</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-mono font-bold text-[#33483a] shadow-sm">
              {result.mse}
            </span>
            </div>
            <div className="mt-6 border-l-2 border-[#5c9b73] pl-4 text-sm leading-6 text-[#456554]">{result.recommendation}</div>
          </div>
        </div>
      ) : (
        <aside className="border border-[#dce6de] bg-white p-6 shadow-[0_12px_35px_rgba(27,52,39,0.06)] md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71917c]">About this estimate</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-[#21372d]">From surface signal to air temperature</h3>
          <p className="mt-3 text-sm leading-6 text-[#748178]">
            The model combines satellite-derived land surface temperature, elevation, and land-cover context to estimate local air temperature.
          </p>

          <div className="mt-8 border-t border-[#e1e9e2] pt-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#71917c]">Heat-risk guide</p>
            <div className="mt-4 space-y-3">
              {[
                ['Low', 'Below 25°C', '#4b9b70'],
                ['Moderate', '25–29.9°C', '#b68525'],
                ['High', '30–34.9°C', '#c86d2b'],
                ['Critical', '35°C and above', '#a8483c'],
              ].map(([label, range, color]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold text-[#46594c]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>
                  <span className="text-xs font-medium text-[#89958c]">{range}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-[#e1e9e2] pt-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#71917c]">Workflow</p>
            <ol className="mt-4 space-y-3 text-sm text-[#627267]">
              <li className="flex gap-3"><span className="font-bold text-[#2e765a]">01</span>Enter the local environmental conditions.</li>
              <li className="flex gap-3"><span className="font-bold text-[#2e765a]">02</span>Run the trained regression model.</li>
              <li className="flex gap-3"><span className="font-bold text-[#2e765a]">03</span>Review the estimate and recommended action.</li>
            </ol>
          </div>
        </aside>
      )}
    </div>
  );
};

export default PredictionForm;
