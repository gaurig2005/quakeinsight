import { useState, useMemo } from "react";
import { 
  Activity, Waves, BarChart3, TrendingUp, AlertTriangle, 
  Zap, Volume2, Signal, Target, MapPin, Gauge, AreaChart
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import SeismicWaveform from "./SeismicWaveform";
import { staticEarthquakes, type Earthquake } from "@/data/staticEarthquakes";

interface SeismicMetrics {
  avgPGA: number;
  maxPGA: number;
  avgSNR: number;
  noiseLevel: number;
  stationActivity: number;
  precursorIndex: number;
  cumulativeEnergy: number;
  bValue: number;
}

const calculatePGA = (magnitude: number, depth: number): number => {
  const logPGA = 0.72 * magnitude - Math.log10(Math.sqrt(50 * 50 + depth * depth)) + 1.0;
  return Math.pow(10, logPGA);
};

const calculateBValue = (earthquakes: Earthquake[]): number => {
  if (earthquakes.length < 5) return 1.0;
  const magnitudes = earthquakes.map(e => e.magnitude).filter(m => m >= 3);
  if (magnitudes.length < 3) return 1.0;
  const avgMag = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
  const minMag = Math.min(...magnitudes);
  return 1 / (avgMag - minMag) || 1.0;
};

const calculateCumulativeEnergy = (earthquakes: Earthquake[]): number => {
  return earthquakes.reduce((total, eq) => {
    const energy = Math.pow(10, 1.5 * eq.magnitude + 4.8);
    return total + energy;
  }, 0);
};

const calculatePrecursorIndex = (earthquakes: Earthquake[]): number => {
  if (earthquakes.length < 10) return 0;
  const recent = earthquakes.slice(0, 20);
  let index = 0;
  const smallQuakes = recent.filter(e => e.magnitude >= 2 && e.magnitude < 4);
  if (smallQuakes.length > 8) index += 20;
  const depths = recent.map(e => e.depth);
  const avgFirstHalf = depths.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
  const avgSecondHalf = depths.slice(10, 20).reduce((a, b) => a + b, 0) / Math.min(10, depths.length - 10);
  if (avgSecondHalf < avgFirstHalf * 0.8) index += 25;
  const magStd = Math.sqrt(recent.map(e => Math.pow(e.magnitude - 4, 2)).reduce((a, b) => a + b, 0) / recent.length);
  if (magStd < 0.8) index += 15;
  const lats = recent.map(e => e.coordinates.lat);
  const lngs = recent.map(e => e.coordinates.lng);
  if (Math.max(...lats) - Math.min(...lats) < 2 && Math.max(...lngs) - Math.min(...lngs) < 2) index += 20;
  return Math.min(100, index);
};

const SeismicMonitoringDashboard = () => {
  const earthquakes = staticEarthquakes;
  const [selectedQuake, setSelectedQuake] = useState<Earthquake>(earthquakes[0]);

  const metrics: SeismicMetrics = useMemo(() => {
    const pgas = earthquakes.slice(0, 20).map(e => calculatePGA(e.magnitude, e.depth));
    return {
      avgPGA: pgas.reduce((a, b) => a + b, 0) / pgas.length,
      maxPGA: Math.max(...pgas),
      avgSNR: 18.4,
      noiseLevel: 0.08,
      stationActivity: 78,
      precursorIndex: calculatePrecursorIndex(earthquakes),
      cumulativeEnergy: calculateCumulativeEnergy(earthquakes.slice(0, 50)),
      bValue: calculateBValue(earthquakes.slice(0, 50)),
    };
  }, [earthquakes]);

  const recentQuakes = earthquakes.filter(e => !e.isHistorical).slice(0, 10);
  const highRiskRegions = useMemo(() => {
    const regionCounts: Record<string, { count: number; avgMag: number; quakes: Earthquake[] }> = {};
    earthquakes.filter(e => !e.isHistorical).forEach(e => {
      if (!regionCounts[e.region]) regionCounts[e.region] = { count: 0, avgMag: 0, quakes: [] };
      regionCounts[e.region].count++;
      regionCounts[e.region].quakes.push(e);
    });
    Object.keys(regionCounts).forEach(region => {
      const quakes = regionCounts[region].quakes;
      regionCounts[region].avgMag = quakes.reduce((a, b) => a + b.magnitude, 0) / quakes.length;
    });
    return Object.entries(regionCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
  }, [earthquakes]);

  const getPrecursorStatus = (index: number) => {
    if (index < 20) return { color: "text-green-400", bg: "bg-green-500/20", label: "Low" };
    if (index < 50) return { color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Moderate" };
    if (index < 75) return { color: "text-orange-400", bg: "bg-orange-500/20", label: "Elevated" };
    return { color: "text-red-400", bg: "bg-red-500/20", label: "High" };
  };

  const precursorStatus = getPrecursorStatus(metrics.precursorIndex);

  return (
    <section id="monitoring" className="py-20 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-gradient-glow rounded-full opacity-30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Seismic Data Analysis
          </h2>
          <p className="text-muted-foreground">
            Waveform analysis • Ground acceleration • Signal processing • NCS India data
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="glass-card rounded-xl p-4 text-center">
            <Gauge className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono text-primary">{metrics.avgPGA.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Avg PGA (cm/s²)</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Zap className="w-6 h-6 text-seismic-high mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono text-seismic-high">{metrics.maxPGA.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Max PGA (cm/s²)</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Volume2 className="w-6 h-6 text-seismic-moderate mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono text-seismic-moderate">{metrics.avgSNR.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Avg SNR (dB)</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Signal className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono text-blue-400">{(metrics.noiseLevel * 100).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Noise Level</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <BarChart3 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono text-purple-400">{metrics.bValue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">b-Value (G-R)</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <Activity className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono text-cyan-400">{metrics.stationActivity}%</p>
            <p className="text-xs text-muted-foreground">Station Activity</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Waveform Display */}
          <div className="lg:col-span-2">
            <SeismicWaveform
              magnitude={selectedQuake.magnitude}
              depth={selectedQuake.depth}
              time={selectedQuake.time}
              location={selectedQuake.location}
            />
          </div>

          {/* Precursor Analysis */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className={`w-5 h-5 ${precursorStatus.color}`} />
              <h3 className="font-semibold text-foreground">Precursor Analysis</h3>
            </div>
            
            <div className={`${precursorStatus.bg} rounded-lg p-4 mb-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-semibold ${precursorStatus.color}`}>Risk Index</span>
                <span className={`text-2xl font-bold font-mono ${precursorStatus.color}`}>
                  {metrics.precursorIndex}%
                </span>
              </div>
              <Progress value={metrics.precursorIndex} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Status: <span className={precursorStatus.color}>{precursorStatus.label}</span>
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Foreshock pattern</span>
                <span className="text-foreground">{recentQuakes.filter(e => e.magnitude < 4).length > 5 ? "Detected" : "Normal"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Depth migration</span>
                <span className="text-foreground">Monitoring</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spatial clustering</span>
                <span className="text-foreground">{highRiskRegions.length > 0 ? highRiskRegions[0][0] : "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Energy buildup</span>
                <span className="text-foreground font-mono">{(Math.log10(metrics.cumulativeEnergy)).toFixed(1)} J (log)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events + High-Risk Regions */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Waves className="w-5 h-5 text-primary" />
                Events (Click for Waveform)
              </h3>
              <span className="text-xs text-muted-foreground">{recentQuakes.length} events</span>
            </div>
            
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {recentQuakes.map((quake) => {
                const pga = calculatePGA(quake.magnitude, quake.depth);
                const isSelected = selectedQuake?.id === quake.id;
                
                return (
                  <div
                    key={quake.id}
                    onClick={() => setSelectedQuake(quake)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected ? "bg-primary/20 ring-1 ring-primary/50" : "bg-background/50 hover:bg-card/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ 
                            backgroundColor: quake.magnitude >= 6 ? "#ef4444" : 
                              quake.magnitude >= 5 ? "#f97316" : 
                              quake.magnitude >= 4 ? "#f59e0b" : "#22c55e"
                          }}
                        >
                          {quake.magnitude.toFixed(1)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{quake.state}</p>
                          <p className="text-xs text-muted-foreground">{quake.location.slice(0, 40)}...</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-primary">{pga.toFixed(1)} cm/s²</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(quake.time).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-seismic-high" />
              <h3 className="font-semibold text-foreground">High-Activity Regions</h3>
            </div>
            
            <div className="space-y-4">
              {highRiskRegions.map(([region, data], index) => (
                <div key={region} className="bg-background/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-foreground">{region}</p>
                        <p className="text-xs text-muted-foreground">{data.count} events • Avg M{data.avgMag.toFixed(1)}</p>
                      </div>
                    </div>
                    <MapPin className="w-4 h-4 text-seismic-high" />
                  </div>
                  <Progress value={(data.count / highRiskRegions[0][1].count) * 100} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Analysis based on NCS & USGS data • India region (1976–2026)
        </p>
      </div>
    </section>
  );
};

export default SeismicMonitoringDashboard;
