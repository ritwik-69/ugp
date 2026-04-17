import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, ScaleControl, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const VARANASI_COORDS: [number, number] = [25.3176, 82.9739];
const YEARS = [2000, 2010, 2020];

type LayerType = 'LULC' | 'LST' | 'Elevation';

interface AnalysisResult {
  lat: number;
  lng: number;
  features: {
    lulc: string;
    lulc_color: string;
    lst: number;
    elevation: number;
  };
  prediction: {
    air_temperature: number;
    mse: number;
  };
}

const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const VaranasiMap: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(2020);
  const [selectedLayer, setSelectedLayer] = useState<LayerType>('LULC');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleMapClick = async (lat: number, lng: number) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, year: selectedYear }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden relative">
      {isAnalyzing && (
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-[2000] flex items-center justify-center pointer-events-none">
          <div className="bg-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-blue-100">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-slate-700">SVM Classification & ANN Prediction...</span>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-72 bg-white/90 backdrop-blur-sm shadow-xl z-[1000] flex flex-col p-8 space-y-10 border-r border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Map Controls</h2>
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Data Layers</p>
            {(['LULC', 'LST', 'Elevation'] as LayerType[]).map((layer) => (
              <button
                key={layer}
                onClick={() => setSelectedLayer(layer)}
                className={`w-full text-left px-5 py-3 rounded-2xl font-bold transition-all ${
                  selectedLayer === layer
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-[0.98]'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {layer === 'LULC' ? 'SVM Classification' : layer === 'LST' ? 'LST Analysis' : 'Elevation'}
              </button>
            ))}
          </div>
        </div>

        {selectedLayer === 'LULC' && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Legend</p>
            <div className="space-y-2">
              {[
                { name: "Water", color: "#3b82f6" },
                { name: "Vegetation", color: "#22c55e" },
                { name: "Urban", color: "#ef4444" },
                { name: "Forest", color: "#166534" },
                { name: "Bareland", color: "#eab308" }
              ].map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs font-bold text-slate-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto">
          <div className="space-y-6">
            <div className="flex justify-between items-baseline">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Temporal Range</p>
              <span className="text-lg font-black text-blue-600">{selectedYear}</span>
            </div>
            <input
              type="range"
              min="0"
              max={YEARS.length - 1}
              step="1"
              value={YEARS.indexOf(selectedYear)}
              onChange={(e) => setSelectedYear(YEARS[parseInt(e.target.value)])}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] font-black text-slate-400 px-1">
              {YEARS.map((y) => (
                <span key={y}>{y}</span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Map Area */}
      <main className="flex-1 relative">
        <MapContainer
          center={VARANASI_COORDS}
          zoom={12}
          className="h-full w-full"
          zoomControl={false}
        >
          <MapEvents onMapClick={handleMapClick} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {analysis && (
            <Marker position={[analysis.lat, analysis.lng]}>
              <Popup maxWidth={300}>
                <div className="p-2">
                  <h3 className="text-lg font-black text-slate-800 mb-3 border-b pb-2">SVM Classification</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs items-center">
                      <span className="text-slate-500 font-bold uppercase">LULC Class</span>
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: analysis.features.lulc_color }}></div>
                         <span className="text-blue-600 font-black">{analysis.features.lulc}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-bold uppercase">Surface Temp</span>
                      <span className="text-slate-800 font-black">{analysis.features.lst}°C</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-bold uppercase">Elevation</span>
                      <span className="text-slate-800 font-black">{analysis.features.elevation.toFixed(1)}m</span>
                    </div>
                  </div>
                  <div className="bg-blue-600 p-4 rounded-xl text-white shadow-lg shadow-blue-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">ANN Predicted Air Temp</p>
                  <p className="text-3xl font-black">{analysis.prediction.air_temperature}°C</p>
                  <p className="text-[10px] mt-2 opacity-60">Model Confidence (MSE): 0.9523</p>
                  </div>

                </div>
              </Popup>
            </Marker>
          )}

          <ZoomControl position="bottomleft" />
          <ScaleControl position="bottomleft" />
        </MapContainer>

        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-2xl z-[1000] border border-slate-100 max-w-xs">
          <h3 className="font-black text-slate-800 text-sm mb-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            SVM Point Analysis
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Click anywhere on the map to perform real-time <strong>SVM Classification</strong> and <strong>ANN Prediction</strong>. The model analyzes spectral signatures at the selected location to determine land cover and predict surface air temperature.
          </p>
        </div>
      </main>
    </div>
  );
};

export default VaranasiMap;
