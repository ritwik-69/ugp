import React, { useState } from 'react';

interface PredictionResult {
  airTemperature: number;
  mse: number;
}

const PredictionForm: React.FC = () => {
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

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lst: parseFloat(lst),
          lulc_class: lulc,
          elevation: parseFloat(elevation),
        }),
      });

      if (!response.ok) throw new Error('Model prediction failed');

      const data = await response.json();
      setResult({
        airTemperature: data.air_temperature,
        mse: data.mse,
      });
    } catch (err) {
      setError('Failed to fetch prediction from ML model. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">ANN Model Predictor</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Land Surface Temp (LST °C)
          </label>
          <input
            type="number"
            step="0.1"
            required
            value={lst}
            onChange={(e) => setLst(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
            placeholder="e.g. 32.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Elevation (m)
          </label>
          <input
            type="number"
            required
            value={elevation}
            onChange={(e) => setElevation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
            placeholder="e.g. 80"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            LULC Classification
          </label>
          <select
            value={lulc}
            onChange={(e) => setLulc(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
          >
            <option value="Water Bodies">Water Bodies</option>
            <option value="Vegetative Areas">Vegetative Areas</option>
            <option value="Urban">Urban</option>
            <option value="Forests">Forests</option>
            <option value="Barelands">Barelands</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
          }`}
        >
          {loading ? 'Running Inference...' : 'Predict Air Temperature'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider mb-1">ANN Predicted Result</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-blue-900">{result.airTemperature}°C</span>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 flex justify-between items-center">
            <span className="text-sm text-gray-600">Reference MSE (Report)</span>
            <span className="px-2 py-1 bg-white rounded text-xs font-mono font-bold text-gray-800 shadow-sm border border-gray-200">
              {result.mse}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionForm;
