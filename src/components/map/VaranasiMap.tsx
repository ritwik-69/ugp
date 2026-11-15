import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, ScaleControl, CircleMarker, Polygon, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
// @ts-expect-error Leaflet's type definitions omit this runtime helper.
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
    risk_level: string;
    recommendations?: string[];
    factors?: Record<string, string>;
  };
}

interface LayerPoint {
  lat: number;
  lng: number;
  lst: number;
  elevation: number;
  lulc: string;
  lulcColor: string;
  riskLevel: string;
}

interface Hotspot {
  lat: number;
  lng: number;
  lst: number;
  lulc: string;
  riskLevel: string;
  recommendations: string[];
}

interface RegionStats {
  sampleCount: number;
  averageLst: number;
  maximumLst: number;
  urbanPercentage: number;
  vegetationPercentage: number;
  riskLevel: string;
}

interface SavedAnalysis {
  id: string;
  year: number;
  lat: number;
  lng: number;
  temperature: number;
  risk: string;
  lulc: string;
}

const riskColor = (risk: string) => {
  if (risk === 'Critical') return '#b91c1c';
  if (risk === 'High') return '#f97316';
  if (risk === 'Moderate') return '#eab308';
  return '#22c55e';
};

const heatRiskFromTemperature = (temperature: number) => {
  if (temperature >= 35) return 'Critical';
  if (temperature >= 30) return 'High';
  if (temperature >= 25) return 'Moderate';
  return 'Low';
};

const layerColor = (point: LayerPoint, layer: LayerType) => {
  if (layer === 'LULC') return point.lulcColor;
  if (layer === 'Elevation') {
    if (point.elevation >= 100) return '#7c3aed';
    if (point.elevation >= 85) return '#2563eb';
    if (point.elevation >= 70) return '#14b8a6';
    return '#f59e0b';
  }
  if (point.lst >= 32) return '#b91c1c';
  if (point.lst >= 28) return '#f97316';
  if (point.lst >= 24) return '#eab308';
  return '#22c55e';
};

const MapEvents = ({
  drawMode,
  onMapClick,
  onPolygonVertex
}: {
  drawMode: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onPolygonVertex: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click: (e) => {
      if (drawMode) {
        onPolygonVertex(e.latlng.lat, e.latlng.lng);
      } else {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

const VaranasiMap: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(2020);
  const [selectedLayer, setSelectedLayer] = useState<LayerType>('LULC');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [layerPoints, setLayerPoints] = useState<LayerPoint[]>([]);
  const [layerLoading, setLayerLoading] = useState(true);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [showHotspots, setShowHotspots] = useState(true);
  const [coordinates, setCoordinates] = useState('');
  const [drawMode, setDrawMode] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [regionStats, setRegionStats] = useState<RegionStats | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [showSavedComparison, setShowSavedComparison] = useState(false);
  const [datasetRevision, setDatasetRevision] = useState(0);

  React.useEffect(() => {
    const refreshDataset = () => setDatasetRevision((revision) => revision + 1);
    window.addEventListener('dataset-changed', refreshDataset);
    return () => window.removeEventListener('dataset-changed', refreshDataset);
  }, []);

  React.useEffect(() => {
    let active = true;
    setLayerLoading(true);
    fetch(`/api/layer-points?year=${selectedYear}`)
      .then((response) => {
        if (!response.ok) throw new Error('Layer request failed');
        return response.json();
      })
      .then((data: { points: LayerPoint[] }) => {
        if (active) setLayerPoints(data.points);
      })
      .catch(() => {
        if (active) setAnalysisError('Layer data could not be loaded. Start the backend and refresh.');
      })
      .finally(() => {
        if (active) setLayerLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedYear, datasetRevision]);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('kashi-saved-analyses');
      if (saved) setSavedAnalyses(JSON.parse(saved) as SavedAnalysis[]);
    } catch {
      setSavedAnalyses([]);
    }
  }, []);

  React.useEffect(() => {
    fetch(`/api/hotspots?year=${selectedYear}&limit=10`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { hotspots: Hotspot[] }) => setHotspots(data.hotspots))
      .catch(() => setAnalysisError('Hotspots could not be loaded.'));
  }, [selectedYear, datasetRevision]);

  const handleMapClick = async (lat: number, lng: number) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch('/api/analyze-point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, year: selectedYear }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      } else {
        setAnalysisError('Unable to analyze this point. Try another location inside the study area.');
      }
    } catch (error) {
      console.error("Analysis failed", error);
      setAnalysisError('Backend unavailable. Start the FastAPI server and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const searchCoordinates = () => {
    const [latText, lngText] = coordinates.split(',').map((value) => value.trim());
    const lat = Number(latText);
    const lng = Number(lngText);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 24 || lat > 27 || lng < 81 || lng > 85) {
      setAnalysisError('Enter coordinates inside the Varanasi study region, for example 25.3176, 82.9739.');
      return;
    }
    handleMapClick(lat, lng);
  };

  const pointInsidePolygon = (lat: number, lng: number, polygon: [number, number][]) => {
      let inside = false;
      for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
        const [currentLat, currentLng] = polygon[index];
        const [previousLat, previousLng] = polygon[previous];
        const intersects = ((currentLng > lng) !== (previousLng > lng))
          && (lat < (previousLat - currentLat) * (lng - currentLng) / (previousLng - currentLng) + currentLat);
        if (intersects) inside = !inside;
      }
      return inside;
    };

  const finishPolygon = () => {
      if (polygonPoints.length < 3) {
        setAnalysisError('Add at least three points to analyze a region.');
        return;
      }
      const selectedPoints = layerPoints.filter((point) => pointInsidePolygon(point.lat, point.lng, polygonPoints));
      if (!selectedPoints.length) {
        setAnalysisError('No sampled observations fall inside this region. Draw a larger area.');
        return;
      }
      const averageLst = selectedPoints.reduce((total, point) => total + point.lst, 0) / selectedPoints.length;
      const maximumLst = Math.max(...selectedPoints.map((point) => point.lst));
      const urbanCount = selectedPoints.filter((point) => point.lulc === 'Urban').length;
      const vegetationCount = selectedPoints.filter((point) => point.lulc === 'Vegetative Areas' || point.lulc === 'Forests').length;
      setRegionStats({
        sampleCount: selectedPoints.length,
        averageLst: Number(averageLst.toFixed(2)),
        maximumLst: Number(maximumLst.toFixed(2)),
        urbanPercentage: Number(((urbanCount / selectedPoints.length) * 100).toFixed(2)),
        vegetationPercentage: Number(((vegetationCount / selectedPoints.length) * 100).toFixed(2)),
        riskLevel: heatRiskFromTemperature(maximumLst)
      });
      setDrawMode(false);
    };

  const clearPolygon = () => {
      setPolygonPoints([]);
      setRegionStats(null);
      setAnalysisError(null);
  };

  const saveAnalysis = () => {
    if (!analysis) return;
      const saved: SavedAnalysis = {
        id: `${analysis.lat}-${analysis.lng}-${selectedYear}`,
        year: selectedYear,
        lat: analysis.lat,
        lng: analysis.lng,
        temperature: analysis.prediction.air_temperature,
        risk: analysis.prediction.risk_level,
        lulc: analysis.features.lulc
      };

      const next = [saved, ...savedAnalyses.filter((item) => item.id !== saved.id)].slice(0, 10);
      setSavedAnalyses(next);
      localStorage.setItem('kashi-saved-analyses', JSON.stringify(next));
  };

  const clearSavedAnalyses = () => {
    setSavedAnalyses([]);
    localStorage.removeItem('kashi-saved-analyses');
    setShowSavedComparison(false);
  };

  const downloadReport = () => {
    if (!analysis) return;
    const report = {
      generatedAt: new Date().toISOString(),
      year: selectedYear,
      location: { lat: analysis.lat, lng: analysis.lng },
      features: analysis.features,
      prediction: analysis.prediction,
      recommendations: analysis.prediction.recommendations ?? []
    };
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    link.download = `varanasi-point-report-${selectedYear}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="flex h-full w-full bg-[#eef3ef] overflow-hidden relative">
      {isAnalyzing && (
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] z-[2000] flex items-center justify-center pointer-events-none">
          <div className="bg-[#fbfcfa] px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-[#d8e6db]">
            <div className="w-4 h-4 border-2 border-[#2e765a] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold text-[#31443a]">Analyzing climate risk...</span>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-80 max-w-[82vw] shrink-0 bg-[#fbfcfa]/95 backdrop-blur-sm shadow-[8px_0_30px_rgba(27,52,39,0.08)] z-[1000] flex flex-col p-5 sm:p-7 space-y-6 border-r border-[#dce6de] overflow-y-auto">
        <div>
          <div className="mb-6 border-b border-[#e1e9e2] pb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#71917c]">Spatial explorer</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#21372d]">Map controls</h2>
            <p className="mt-1 text-xs leading-5 text-[#7b887e]">Choose a layer, year, or location to inspect the study area.</p>
          </div>
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Data Layers</p>
            {(['LULC', 'LST', 'Elevation'] as LayerType[]).map((layer) => (
              <button
                key={layer}
                onClick={() => setSelectedLayer(layer)}
                className={`w-full text-left px-5 py-3 rounded-2xl font-bold transition-all ${
                  selectedLayer === layer
                    ? 'bg-[#1f5945] text-white shadow-sm active:scale-[0.98]'
                    : 'bg-[#f0f5f0] text-[#52655a] hover:bg-[#e5efe7]'
                }`}
              >
                {layer === 'LULC' ? 'LULC Classification' : layer === 'LST' ? 'LST Analysis' : 'Elevation'}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Search coordinates</p>
            <input value={coordinates} onChange={(event) => setCoordinates(event.target.value)} placeholder="25.3176, 82.9739" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
            <button onClick={searchCoordinates} className="w-full px-3 py-2 rounded-lg bg-[#21372d] text-white text-xs font-bold hover:bg-[#1f5945]">Analyze location</button>
          </div>
          <button onClick={() => setShowHotspots((visible) => !visible)} className="w-full px-4 py-3 rounded-lg bg-[#fff4e5] text-[#9a5c14] text-sm font-bold">
            {showHotspots ? 'Hide' : 'Show'} top heat hotspots
          </button>
          <div className="space-y-2">
            <button onClick={() => { setDrawMode(true); setPolygonPoints([]); setRegionStats(null); setAnalysisError(null); }} className="w-full px-4 py-3 rounded-lg bg-[#f1ebf5] text-[#704b78] text-sm font-bold">
              Draw region analysis
            </button>
            {drawMode && <button onClick={finishPolygon} className="w-full px-4 py-3 rounded-lg bg-[#704b78] text-white text-sm font-bold">Finish region ({polygonPoints.length} points)</button>}
            {(polygonPoints.length > 0 || regionStats) && <button onClick={clearPolygon} className="w-full px-4 py-2 rounded-xl text-slate-500 text-xs font-bold">Clear region</button>}
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
        {selectedLayer === 'LST' && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">LST (°C)</p>
            {[['Cool < 24', '#22c55e'], ['Warm 24–28', '#eab308'], ['Hot 28–32', '#f97316'], ['Very hot ≥ 32', '#b91c1c']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-600">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />{label}
              </div>
            ))}
          </div>
        )}
        {selectedLayer === 'Elevation' && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Elevation (m)</p>
            {[['Low < 70', '#f59e0b'], ['Medium 70–85', '#14b8a6'], ['High 85–100', '#2563eb'], ['Very high ≥ 100', '#7c3aed']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-600">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />{label}
              </div>
            ))}
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
          scrollWheelZoom={false}
        >
          <MapEvents drawMode={drawMode} onMapClick={handleMapClick} onPolygonVertex={(lat, lng) => setPolygonPoints((points) => [...points, [lat, lng]])} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {polygonPoints.length >= 2 && (
            <Polygon positions={polygonPoints} pathOptions={{ color: '#7c3aed', fillColor: '#a78bfa', fillOpacity: 0.18, weight: 3 }} />
          )}

          {layerPoints.map((point) => (
            <CircleMarker
              key={`${selectedYear}-${point.lat}-${point.lng}`}
              center={[point.lat, point.lng]}
              radius={5}
              pathOptions={{
                color: layerColor(point, selectedLayer),
                fillColor: layerColor(point, selectedLayer),
                fillOpacity: 0.72,
                weight: 1
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-black text-slate-800">{point.lulc}</p>
                  <p>Surface temperature: <strong>{point.lst}°C</strong></p>
                  <p>Elevation: <strong>{point.elevation}m</strong></p>
                  <p>Heat risk: <strong>{point.riskLevel}</strong></p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {showHotspots && hotspots.map((hotspot, index) => (
            <CircleMarker
              key={`hotspot-${selectedYear}-${hotspot.lat}-${hotspot.lng}`}
              center={[hotspot.lat, hotspot.lng]}
              radius={10}
              pathOptions={{ color: '#7f1d1d', fillColor: riskColor(hotspot.riskLevel), fillOpacity: 0.95, weight: 3 }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-black text-red-800">Heat hotspot #{index + 1}</p>
                  <p>LST: <strong>{hotspot.lst}°C</strong></p>
                  <p>Class: <strong>{hotspot.lulc}</strong></p>
                  <p>Risk: <strong>{hotspot.riskLevel}</strong></p>
                  <p className="pt-1 font-bold">Recommended actions:</p>
                  <ul className="list-disc pl-4">{hotspot.recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {analysis && (
            <>
            <CircleMarker
              center={[analysis.lat, analysis.lng]}
              radius={18}
              pathOptions={{
                color: selectedLayer === 'LULC' ? analysis.features.lulc_color : selectedLayer === 'LST' ? riskColor(analysis.prediction.risk_level) : '#2563eb',
                fillOpacity: 0.3,
                weight: 3
              }}
            />
            <Marker position={[analysis.lat, analysis.lng]}>
              <Popup maxWidth={300}>
                <div className="p-2">
                  <h3 className="text-lg font-black text-slate-800 mb-3 border-b pb-2">Point Climate Analysis</h3>
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
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1">Predicted Air Temp</p>
                  <p className="text-3xl font-black">{analysis.prediction.air_temperature}°C</p>
                  <p className="text-[10px] mt-2 opacity-80">Heat Risk: {analysis.prediction.risk_level}</p>
                  </div>
                  {analysis.prediction.recommendations && (
                    <div className="mt-3 text-xs text-slate-600">
                      <p className="font-black text-slate-800">Recommended actions</p>
                      <ul className="list-disc pl-4 mt-1">
                        {analysis.prediction.recommendations.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                </div>
              </Popup>
            </Marker>
            </>
          )}

          <ZoomControl position="bottomleft" />
          <ScaleControl position="bottomleft" />
        </MapContainer>

        <div className="absolute bottom-6 right-6 bg-[#fbfcfa]/95 backdrop-blur-md p-5 rounded-xl shadow-xl z-[1000] border border-[#dce6de] max-w-xs">
          <h3 className="font-black text-slate-800 text-sm mb-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#2e765a] rounded-full"></div>
            {selectedLayer} Point Analysis
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            {layerLoading ? 'Loading geospatial observations...' : `${layerPoints.length} observations shown for ${selectedYear}. Click anywhere to inspect a point.`}
          </p>
          {analysisError && <p className="mt-3 text-xs font-bold text-red-600">{analysisError}</p>}
          {analysis && <button onClick={() => setAnalysis(null)} className="mt-3 text-xs font-bold text-[#2e765a] hover:text-[#1f5945]">Clear selected point</button>}
          {analysis && <button onClick={downloadReport} className="mt-2 block text-xs font-bold text-emerald-600 hover:text-emerald-800">Download point report</button>}
          {analysis && <button onClick={saveAnalysis} className="mt-2 block text-xs font-bold text-purple-600 hover:text-purple-800">Save this analysis</button>}
          {savedAnalyses.length > 0 && (
            <div className="mt-4 border-t border-slate-200 pt-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saved analyses</p>
              {savedAnalyses.slice(0, 3).map((saved) => (
                <button key={saved.id} onClick={() => handleMapClick(saved.lat, saved.lng)} className="block w-full text-left mt-2 text-xs font-bold text-slate-600 hover:text-blue-600">
                  {saved.year} · {saved.lulc} · {saved.temperature}°C
                </button>
              ))}
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSavedComparison((visible) => !visible)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  {showSavedComparison ? 'Hide comparison' : 'Compare saved'}
                </button>
                <button
                  type="button"
                  onClick={clearSavedAnalyses}
                  className="text-xs font-bold text-red-500 hover:text-red-700"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
        {showSavedComparison && savedAnalyses.length > 0 && (
          <div className="absolute bottom-6 left-6 z-[1000] max-w-[calc(100vw-2rem)] overflow-x-auto rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-2xl backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between gap-6">
              <h3 className="text-sm font-black text-slate-800">Saved point comparison</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {savedAnalyses.length} locations
              </span>
            </div>
            <table className="min-w-[420px] text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-2 py-2">Year</th>
                  <th className="px-2 py-2">LULC</th>
                  <th className="px-2 py-2">Temperature</th>
                  <th className="px-2 py-2">Risk</th>
                  <th className="px-2 py-2">Location</th>
                </tr>
              </thead>
              <tbody>
                {savedAnalyses.map((saved) => (
                  <tr key={`comparison-${saved.id}`} className="border-t border-slate-100 font-bold text-slate-600">
                    <td className="px-2 py-2">{saved.year}</td>
                    <td className="px-2 py-2">{saved.lulc}</td>
                    <td className="px-2 py-2">{saved.temperature}°C</td>
                    <td className="px-2 py-2" style={{ color: riskColor(saved.risk) }}>{saved.risk}</td>
                    <td className="px-2 py-2">{saved.lat.toFixed(3)}, {saved.lng.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {regionStats && (
          <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl z-[1000] border border-purple-100 w-64">
            <h3 className="font-black text-purple-800 text-sm mb-3">Selected Region Analysis</h3>
            <p className="text-xs text-slate-600">Samples: <strong>{regionStats.sampleCount}</strong></p>
            <p className="text-xs text-slate-600">Average LST: <strong>{regionStats.averageLst}°C</strong></p>
            <p className="text-xs text-slate-600">Maximum LST: <strong>{regionStats.maximumLst}°C</strong></p>
            <p className="text-xs text-slate-600">Urban: <strong>{regionStats.urbanPercentage}%</strong></p>
            <p className="text-xs text-slate-600">Vegetation: <strong>{regionStats.vegetationPercentage}%</strong></p>
            <p className="mt-2 text-sm font-black" style={{ color: riskColor(regionStats.riskLevel) }}>Risk: {regionStats.riskLevel}</p>
          </div>
        )}
        <div className="absolute top-6 right-6 bg-[#fbfcfa]/95 backdrop-blur-md p-4 rounded-xl shadow-xl z-[1000] border border-[#dce6de]">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#718078] mb-2">Heat-risk scale</p>
          <div className="space-y-1">
            {[
              ['Low', '#22c55e'],
              ['Moderate', '#eab308'],
              ['High', '#f97316'],
              ['Critical', '#b91c1c'],
            ].map(([label, color]) => (
              <div key={label} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VaranasiMap;
