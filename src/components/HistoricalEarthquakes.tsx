import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, History, TrendingUp, MapPin, Calendar, Filter, Download, BarChart3 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

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

interface Stats {
  total: number;
  avgMagnitude: string;
  maxMagnitude: number;
  byRegion: Record<string, number>;
  byDecade: Record<string, number>;
}

const getMagnitudeColor = (magnitude: number): string => {
  if (magnitude < 5) return "bg-seismic-moderate";
  if (magnitude < 6) return "bg-seismic-high";
  if (magnitude < 7) return "bg-seismic-severe";
  return "bg-seismic-extreme";
};

const HistoricalEarthquakes = () => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yearRange, setYearRange] = useState([1976, 2026]);
  const [minMagnitude, setMinMagnitude] = useState(3);
  const [dataFetched, setDataFetched] = useState(false);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fnError } = await supabase.functions.invoke("fetch-earthquakes", {
        body: null,
        headers: {},
      });
      
      // Use query params via URL
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-earthquakes?type=all&startYear=${yearRange[0]}&endYear=${yearRange[1]}&minMagnitude=${minMagnitude}`,
        {
          headers: {
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!response.ok) throw new Error("Failed to fetch data");
      
      const result = await response.json();
      
      setEarthquakes(result.earthquakes || []);
      setStats(result.stats || null);
      setDataFetched(true);
    } catch (err: any) {
      console.error("Error fetching historical earthquakes:", err);
      setError(err.message || "Failed to fetch historical data");
    } finally {
      setLoading(false);
    }
  };

  // Prepare timeline chart data from byDecade stats
  const getTimelineData = () => {
    if (!stats?.byDecade) return [];
    return Object.entries(stats.byDecade)
      .map(([decade, count]) => ({
        decade,
        count,
        year: parseInt(decade.replace("s", ""))
      }))
      .sort((a, b) => a.year - b.year);
  };

  // Prepare magnitude distribution data
  const getMagnitudeDistribution = () => {
    if (earthquakes.length === 0) return [];
    const ranges = [
      { range: "4.0-4.9", min: 4, max: 4.9, count: 0 },
      { range: "5.0-5.9", min: 5, max: 5.9, count: 0 },
      { range: "6.0-6.9", min: 6, max: 6.9, count: 0 },
      { range: "7.0-7.9", min: 7, max: 7.9, count: 0 },
      { range: "8.0+", min: 8, max: 10, count: 0 },
    ];
    earthquakes.forEach(eq => {
      const r = ranges.find(r => eq.magnitude >= r.min && eq.magnitude <= r.max);
      if (r) r.count++;
    });
    return ranges;
  };

  // Export to CSV
  const exportToCSV = () => {
    if (earthquakes.length === 0) return;
    
    const headers = ["Date", "Magnitude", "Location", "State", "Region", "Depth (km)", "Latitude", "Longitude"];
    const rows = earthquakes.map(eq => [
      new Date(eq.time).toISOString().split("T")[0],
      eq.magnitude.toFixed(1),
      `"${eq.location.replace(/"/g, '""')}"`,
      eq.state,
      eq.region,
      eq.depth.toFixed(1),
      eq.coordinates.lat.toFixed(4),
      eq.coordinates.lng.toFixed(4)
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadFile(csvContent, "india_earthquakes.csv", "text/csv");
  };

  // Export to JSON
  const exportToJSON = () => {
    if (earthquakes.length === 0) return;
    
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        yearRange: `${yearRange[0]}-${yearRange[1]}`,
        minMagnitude,
        totalRecords: earthquakes.length,
        source: "National Center for Seismology (NCS) / USGS"
      },
      statistics: stats,
      earthquakes: earthquakes.map(eq => ({
        date: new Date(eq.time).toISOString().split("T")[0],
        magnitude: eq.magnitude,
        location: eq.location,
        state: eq.state,
        region: eq.region,
        depth_km: eq.depth,
        latitude: eq.coordinates.lat,
        longitude: eq.coordinates.lng,
        isHistorical: eq.isHistorical || false
      }))
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    downloadFile(jsonContent, "india_earthquakes.json", "application/json");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const timelineData = getTimelineData();
  const magnitudeData = getMagnitudeDistribution();

  return (
    <section id="historical" className="py-20 bg-card/30 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-glow rounded-full opacity-30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-4">
            <History className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Historical Archive</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            50 Years of India Seismic Data
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore India's earthquake catalog from 1976 to present, sourced from National Center for Seismology (NCS) &amp; USGS.
          </p>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Filter Historical Data</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Year Range: {yearRange[0]} - {yearRange[1]}
              </label>
              <Slider
                value={yearRange}
                onValueChange={setYearRange}
                min={1976}
                max={2026}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>1976</span>
                <span>2026</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Minimum Magnitude: {minMagnitude.toFixed(1)}
              </label>
              <Slider
                value={[minMagnitude]}
                onValueChange={(val) => setMinMagnitude(val[0])}
                min={2}
                max={8}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>M 2.0</span>
                <span>M 8.0+</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button 
              onClick={fetchHistoricalData} 
              disabled={loading}
              size="lg"
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading Historical Data...
                </>
              ) : (
                <>
                  <History className="w-4 h-4" />
                  Load Historical Earthquakes
                </>
              )}
            </Button>
            
            {earthquakes.length > 0 && (
              <>
                <Button 
                  onClick={exportToCSV} 
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                <Button 
                  onClick={exportToJSON} 
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </Button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="text-center text-seismic-severe p-4 glass-card rounded-xl mb-8">
            {error}
          </div>
        )}

        {/* Statistics */}
        {stats && dataFetched && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-4xl font-bold text-primary font-mono">{stats.total}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Earthquakes</p>
            </div>
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-4xl font-bold text-seismic-high font-mono">{stats.maxMagnitude.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground mt-1">Maximum Magnitude</p>
            </div>
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-4xl font-bold text-seismic-moderate font-mono">{stats.avgMagnitude}</p>
              <p className="text-sm text-muted-foreground mt-1">Average Magnitude</p>
            </div>
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-4xl font-bold text-primary font-mono">{Object.keys(stats.byRegion).length}</p>
              <p className="text-sm text-muted-foreground mt-1">Regions Affected</p>
            </div>
          </div>
        )}

        {/* Timeline Charts */}
        {dataFetched && timelineData.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Earthquake Frequency Timeline */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Earthquake Frequency by Decade
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="decade" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                      name="Earthquakes"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Magnitude Distribution */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Magnitude Distribution
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={magnitudeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="range" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Count"
                      radius={[4, 4, 0, 0]}
                      fill="hsl(var(--primary))"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Region breakdown */}
        {stats && Object.keys(stats.byRegion).length > 0 && (
          <div className="glass-card rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Earthquakes by Region
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(stats.byRegion)
                .sort((a, b) => b[1] - a[1])
                .map(([region, count]) => (
                  <div key={region} className="bg-background/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-primary font-mono">{count}</p>
                    <p className="text-xs text-muted-foreground mt-1">{region}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Earthquake list */}
        {earthquakes.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Significant Earthquakes ({earthquakes.length} events)
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
              {earthquakes.map((quake) => (
                <div 
                  key={quake.id} 
                  className="glass-card rounded-xl p-4 hover:bg-card/80 transition-all border-l-4"
                  style={{ borderLeftColor: quake.magnitude >= 7 ? "#dc2626" : quake.magnitude >= 6 ? "#ef4444" : "#f59e0b" }}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className={`w-14 h-14 rounded-lg flex items-center justify-center font-bold text-white shrink-0 ${getMagnitudeColor(quake.magnitude)}`}
                    >
                      {quake.magnitude.toFixed(1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{quake.state}</h4>
                      <p className="text-sm text-muted-foreground truncate">{quake.location}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(quake.time).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                        <span className="mx-1">•</span>
                        <span>Depth: {quake.depth.toFixed(0)} km</span>
                      </div>
                      {quake.isHistorical && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                          Historical Record
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!dataFetched && !loading && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <History className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Adjust the filters above and click "Load Historical Earthquakes" to explore India's seismic history.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default HistoricalEarthquakes;