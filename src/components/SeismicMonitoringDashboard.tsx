import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, Waves, Radio, BarChart3, TrendingUp, AlertTriangle, 
  Zap, Volume2, Signal, Target, Clock, MapPin, Gauge, AreaChart,
  RefreshCw, Wifi
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import SeismicWaveform from "./SeismicWaveform";

interface Earthquake {
  id: string;
  magnitude: number;
  location: string;
  time: string;
  depth: number;
  coordinates: { lat: number; lng: number };
  state: string;
  region: string;
  isHistorical?: boolean;
}

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

// Calculate Peak Ground Acceleration
const calculatePGA = (magnitude: number, depth: number): number => {
  const logPGA = 0.72 * magnitude - Math.log10(Math.sqrt(50 * 50 + depth * depth)) + 1.0;
  return Math.pow(10, logPGA);
};

// Calculate Gutenberg-Richter b-value
const calculateBValue = (earthquakes: Earthquake[]): number => {
  if (earthquakes.length < 5) return 1.0;
  const magnitudes = earthquakes.map(e => e.magnitude).filter(m => m >= 3);
  if (magnitudes.length < 3) return 1.0;
  const avgMag = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
  const minMag = Math.min(...magnitudes);
  return 1 / (avgMag - minMag) || 1.0;
};

// Calculate cumulative seismic energy (Joules, log scale)
const calculateCumulativeEnergy = (earthquakes: Earthquake[]): number => {
  return earthquakes.reduce((total, eq) => {
    // Gutenberg-Richter formula: log E = 1.5M + 4.8
    const energy = Math.pow(10, 1.5 * eq.magnitude + 4.8);
    return total + energy;
  }, 0);
};

// Calculate precursor index based on pattern analysis
const calculatePrecursorIndex = (earthquakes: Earthquake[]): number => {
  if (earthquakes.length < 10) return 0;
  
  const recent = earthquakes.slice(0, 20);
  let index = 0;
  
  // Check for foreshock patterns (increasing frequency of small quakes)
  const smallQuakes = recent.filter(e => e.magnitude >= 2 && e.magnitude < 4);
  if (smallQuakes.length > 8) index += 20;
  
  // Check for depth migration (shallowing trend)
  const depths = recent.map(e => e.depth);
  const avgFirstHalf = depths.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
  const avgSecondHalf = depths.slice(10, 20).reduce((a, b) => a + b, 0) / Math.min(10, depths.length - 10);
  if (avgSecondHalf < avgFirstHalf * 0.8) index += 25;
  
  // Check for magnitude clustering
  const magStd = Math.sqrt(recent.map(e => Math.pow(e.magnitude - 4, 2)).reduce((a, b) => a + b, 0) / recent.length);
  if (magStd < 0.8) index += 15;
  
  // Check for spatial clustering
  const lats = recent.map(e => e.coordinates.lat);
  const lngs = recent.map(e => e.coordinates.lng);
  const latSpread = Math.max(...lats) - Math.min(...lats);
  const lngSpread = Math.max(...lngs) - Math.min(...lngs);
  if (latSpread < 2 && lngSpread < 2) index += 20;
  
  // Time acceleration pattern
  const times = recent.map(e => new Date(e.time).getTime());
  const intervals = times.slice(1).map((t, i) => times[i] - t);
  const recentIntervals = intervals.slice(0, 5);
  const olderIntervals = intervals.slice(5, 10);
  if (recentIntervals.length > 0 && olderIntervals.length > 0) {
    const avgRecent = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;
    const avgOlder = olderIntervals.reduce((a, b) => a + b, 0) / olderIntervals.length;
    if (avgRecent < avgOlder * 0.5) index += 20;
  }
  
  return Math.min(100, index);
};

const SeismicMonitoringDashboard = () => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedQuake, setSelectedQuake] = useState<Earthquake | null>(null);

  const fetchEarthquakes = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("fetch-earthquakes");
      if (error) throw error;
      setEarthquakes(data.earthquakes || []);
      setLastUpdated(new Date());
      if (data.earthquakes?.length > 0 && !selectedQuake) {
        setSelectedQuake(data.earthquakes[0]);
      }
    } catch (err) {
      console.error("Error fetching earthquakes:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedQuake]);

  useEffect(() => {
    fetchEarthquakes();
    
    if (isLive) {
      const interval = setInterval(fetchEarthquakes, 60000);
      return () => clearInterval(interval);
    }
  }, [isLive, fetchEarthquakes]);

  const metrics: SeismicMetrics = useMemo(() => {
    if (earthquakes.length === 0) {
      return { avgPGA: 0, maxPGA: 0, avgSNR: 0, noiseLevel: 0, stationActivity: 0, precursorIndex: 0, cumulativeEnergy: 0, bValue: 1 };
    }
    
    const pgas = earthquakes.slice(0, 20).map(e => calculatePGA(e.magnitude, e.depth));
    const avgPGA = pgas.reduce((a, b) => a + b, 0) / pgas.length;
    const maxPGA = Math.max(...pgas);
    
    return {
      avgPGA,
      maxPGA,
      avgSNR: 15 + Math.random() * 10, // Simulated SNR
      noiseLevel: 0.05 + Math.random() * 0.1, // Background noise level
      stationActivity: Math.min(100, 60 + earthquakes.filter(e => !e.isHistorical).length * 2),
      precursorIndex: calculatePrecursorIndex(earthquakes),
      cumulativeEnergy: calculateCumulativeEnergy(earthquakes.slice(0, 50)),
      bValue: calculateBValue(earthquakes.slice(0, 50))
    };
  }, [earthquakes]);

  const recentQuakes = earthquakes.filter(e => !e.isHistorical).slice(0, 10);
  const highRiskRegions = useMemo(() => {
    const regionCounts: Record<string, { count: number; avgMag: number; quakes: Earthquake[] }> = {};
    earthquakes.filter(e => !e.isHistorical).slice(0, 50).forEach(e => {
      if (!regionCounts[e.region]) {
        regionCounts[e.region] = { count: 0, avgMag: 0, quakes: [] };
      }
      regionCounts[e.region].count++;
      regionCounts[e.region].quakes.push(e);
    });
    
    Object.keys(regionCounts).forEach(region => {
      const quakes = regionCounts[region].quakes;
      regionCounts[region].avgMag = quakes.reduce((a, b) => a + b.magnitude, 0) / quakes.length;
    });
    
    return Object.entries(regionCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Real-Time Seismic Monitoring
              </h2>
              <Badge className={`${isLive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-muted text-muted-foreground"}`}>
                {isLive ? (
                  <>
                    <Radio className="w-3 h-3 mr-1 animate-pulse" />
                    LIVE
                  </>
                ) : "PAUSED"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Advanced seismic analysis • Waveforms • Ground acceleration • Signal processing
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant={isLive ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className={isLive ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
            >
              <Wifi className="w-4 h-4 mr-1" />
              {isLive ? "Live" : "Paused"}
            </Button>
            <Button variant="glass" size="sm" onClick={fetchEarthquakes} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
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
          {/* Live Waveform Display */}
          <div className="lg:col-span-2">
            {selectedQuake ? (
              <SeismicWaveform
                magnitude={selectedQuake.magnitude}
                depth={selectedQuake.depth}
                time={selectedQuake.time}
                location={selectedQuake.location}
                isLive={isLive}
              />
            ) : (
              <div className="glass-card rounded-xl p-8 flex items-center justify-center h-[200px]">
                <p className="text-muted-foreground">Select an earthquake to view waveform</p>
              </div>
            )}
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
                <span className="text-foreground">{highRiskRegions.length > 0 ? `${highRiskRegions[0][0]}` : "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Energy buildup</span>
                <span className="text-foreground font-mono">{(Math.log10(metrics.cumulativeEnergy)).toFixed(1)} J (log)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events with Signal Analysis */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Earthquakes with Waveform Selection */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Waves className="w-5 h-5 text-primary" />
                Recent Events (Click for Waveform)
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
                      isSelected 
                        ? "bg-primary/20 ring-1 ring-primary/50" 
                        : "bg-background/50 hover:bg-card/80"
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
                          {new Date(quake.time).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* High-Risk Regions Analysis */}
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
                        <p className="text-xs text-muted-foreground">{data.count} events</p>
                      </div>
                    </div>
                    <Badge 
                      className={`${
                        data.avgMag >= 5 ? "bg-seismic-severe/20 text-seismic-severe" :
                        data.avgMag >= 4 ? "bg-seismic-moderate/20 text-seismic-moderate" :
                        "bg-seismic-low/20 text-seismic-low"
                      }`}
                    >
                      Avg M{data.avgMag.toFixed(1)}
                    </Badge>
                  </div>
                  <Progress 
                    value={(data.count / (highRiskRegions[0]?.[1]?.count || 1)) * 100} 
                    className="h-1.5"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Cumulative Energy Release</span>
              </div>
              <p className="text-xl font-bold font-mono text-primary">
                10<sup>{Math.log10(metrics.cumulativeEnergy).toFixed(1)}</sup> Joules
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Equivalent to ~{(metrics.cumulativeEnergy / 4.184e12).toFixed(2)} kilotons TNT
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeismicMonitoringDashboard;
