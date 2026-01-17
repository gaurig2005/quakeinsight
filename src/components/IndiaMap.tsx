import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, RefreshCw, Radio, Wifi, WifiOff, Activity, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

const getMagnitudeColor = (magnitude: number): string => {
  if (magnitude < 3) return "#22c55e";
  if (magnitude < 5) return "#f59e0b";
  if (magnitude < 6) return "#f97316";
  if (magnitude < 7) return "#ef4444";
  return "#dc2626";
};

const IndiaMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");
  const [newEarthquakeAlert, setNewEarthquakeAlert] = useState<Earthquake | null>(null);
  const previousEarthquakesRef = useRef<Set<string>>(new Set());

  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-mapbox-token");
      if (error) throw error;
      setMapboxToken(data.token);
    } catch (err) {
      console.error("Failed to fetch Mapbox token:", err);
      setError("Map configuration error");
    }
  };

  const checkForNewEarthquakes = useCallback((newQuakes: Earthquake[]) => {
    const currentIds = previousEarthquakesRef.current;
    const newQuakeFound = newQuakes.find(q => !currentIds.has(q.id) && !q.isHistorical);
    
    if (newQuakeFound && currentIds.size > 0) {
      setNewEarthquakeAlert(newQuakeFound);
      setTimeout(() => setNewEarthquakeAlert(null), 10000);
    }
    
    previousEarthquakesRef.current = new Set(newQuakes.map(q => q.id));
  }, []);

  const fetchEarthquakes = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      setConnectionStatus("connecting");
      
      const { data, error: fnError } = await supabase.functions.invoke("fetch-earthquakes");
      
      if (fnError) throw fnError;
      
      const quakes = data.earthquakes || [];
      checkForNewEarthquakes(quakes);
      setEarthquakes(quakes);
      setLastUpdated(new Date());
      setConnectionStatus("connected");
      
      // Update markers on map
      if (map.current) {
        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        
        // Add new markers with enhanced styling
        quakes.forEach((quake: Earthquake) => {
          const el = document.createElement("div");
          el.className = "earthquake-marker";
          const size = Math.max(20, Math.min(50, quake.magnitude * 8));
          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
          el.style.backgroundColor = getMagnitudeColor(quake.magnitude);
          el.style.borderRadius = "50%";
          el.style.border = "2px solid white";
          el.style.boxShadow = `0 0 ${size/2}px ${getMagnitudeColor(quake.magnitude)}`;
          el.style.cursor = "pointer";
          
          // Add pulse animation for recent earthquakes (within last hour)
          const isRecent = Date.now() - new Date(quake.time).getTime() < 60 * 60 * 1000;
          if (isRecent) {
            el.style.animation = "pulse 1.5s infinite";
          }
          
          const timeAgo = getTimeAgo(new Date(quake.time));
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 12px; color: #1a1a2e; min-width: 200px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="background: ${getMagnitudeColor(quake.magnitude)}; color: white; font-weight: bold; padding: 4px 8px; border-radius: 6px; font-size: 14px;">
                  M ${quake.magnitude.toFixed(1)}
                </span>
                ${isRecent ? '<span style="background: #ef4444; color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px;">LIVE</span>' : ''}
              </div>
              <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${quake.location}</h3>
              <p style="font-size: 12px; color: #666; margin-bottom: 4px;">
                📍 ${quake.state} | 🌊 Depth: ${quake.depth.toFixed(1)} km
              </p>
              <p style="font-size: 11px; color: #888; display: flex; align-items: center; gap: 4px;">
                🕐 ${timeAgo}
              </p>
              <p style="font-size: 10px; color: #aaa; margin-top: 4px;">
                ${new Date(quake.time).toLocaleString("en-IN")}
              </p>
            </div>
          `);
          
          const marker = new mapboxgl.Marker(el)
            .setLngLat([quake.coordinates.lng, quake.coordinates.lat])
            .setPopup(popup)
            .addTo(map.current!);
          
          markersRef.current.push(marker);
        });
      }
    } catch (err: any) {
      console.error("Error fetching earthquakes:", err);
      setError(err.message || "Failed to fetch earthquake data");
      setConnectionStatus("disconnected");
    } finally {
      setLoading(false);
    }
  }, [checkForNewEarthquakes]);

  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  useEffect(() => {
    fetchMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [82.8, 22.5], // Center of India
      zoom: 4.2,
      pitch: 30,
      bearing: 0,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );

    map.current.on("load", () => {
      // Add India boundary highlight
      map.current?.addSource("india-boundary", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [[
              [68, 8], [68, 35], [97, 35], [97, 8], [68, 8]
            ]]
          }
        }
      });

      map.current?.addLayer({
        id: "india-boundary-line",
        type: "line",
        source: "india-boundary",
        paint: {
          "line-color": "#f59e0b",
          "line-width": 1,
          "line-opacity": 0.3,
          "line-dasharray": [4, 2]
        }
      });

      fetchEarthquakes();
    });

    // Add pulse animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      markersRef.current.forEach(m => m.remove());
      map.current?.remove();
    };
  }, []);

  // Auto-refresh based on live status - every 1 minute when live, 5 minutes otherwise
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => fetchEarthquakes(false), isLive ? 60 * 1000 : 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLive, fetchEarthquakes]);

  const recentQuakes = earthquakes.filter(q => !q.isHistorical && Date.now() - new Date(q.time).getTime() < 24 * 60 * 60 * 1000);
  const significantQuakes = earthquakes.filter(q => q.magnitude >= 4.5);

  return (
    <section id="map" className="py-20 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-glow rounded-full opacity-50" />
      
      {/* New Earthquake Alert Banner */}
      {newEarthquakeAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-pulse">
          <div className="glass-card bg-seismic-severe/20 border-seismic-severe/50 rounded-xl px-6 py-3 flex items-center gap-4">
            <Activity className="w-5 h-5 text-seismic-severe animate-pulse" />
            <div>
              <p className="font-semibold text-foreground">
                New Earthquake Detected: M{newEarthquakeAlert.magnitude.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">{newEarthquakeAlert.location}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                India Seismic Activity Map
              </h2>
              {/* Live Indicator */}
              <Badge 
                variant={connectionStatus === "connected" ? "default" : "secondary"}
                className={`flex items-center gap-1 ${connectionStatus === "connected" ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}`}
              >
                {connectionStatus === "connected" ? (
                  <>
                    <Radio className="w-3 h-3 animate-pulse" />
                    LIVE
                  </>
                ) : connectionStatus === "connecting" ? (
                  <>
                    <Wifi className="w-3 h-3 animate-pulse" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    Offline
                  </>
                )}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Real-time earthquake data from USGS • Auto-updates every minute
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Updated: {lastUpdated.toLocaleTimeString("en-IN")}
              </div>
            )}
            <Button 
              variant={isLive ? "default" : "outline"}
              size="sm" 
              onClick={() => setIsLive(!isLive)}
              className={isLive ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30" : ""}
            >
              <Radio className={`w-4 h-4 ${isLive ? "animate-pulse" : ""}`} />
              {isLive ? "Live" : "Paused"}
            </Button>
            <Button 
              variant="glass" 
              size="sm" 
              onClick={() => fetchEarthquakes(true)}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-card">
          <div ref={mapContainer} className="w-full h-[500px] md:h-[600px]" />
          
          {loading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading earthquake data...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 text-seismic-severe mx-auto mb-2" />
                <p className="text-muted-foreground">{error}</p>
                <Button variant="glass" size="sm" onClick={() => fetchEarthquakes(true)} className="mt-4">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 glass-card rounded-lg p-4">
            <p className="text-xs font-semibold text-foreground mb-2">Magnitude Scale</p>
            <div className="flex gap-2">
              {[
                { color: "bg-seismic-low", label: "<3" },
                { color: "bg-seismic-moderate", label: "3-5" },
                { color: "bg-seismic-high", label: "5-6" },
                { color: "bg-seismic-severe", label: "6-7" },
                { color: "bg-seismic-extreme", label: "7+" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Stats */}
          <div className="absolute top-4 left-4 glass-card rounded-lg p-4 min-w-[180px]">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Live Activity</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold text-primary font-mono">{recentQuakes.length}</p>
                <p className="text-xs text-muted-foreground">Last 24h</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-seismic-moderate font-mono">{significantQuakes.length}</p>
                <p className="text-xs text-muted-foreground">M4.5+</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground">Total: {earthquakes.length} events</p>
            </div>
          </div>
        </div>

        {/* Recent earthquakes list with live indicators */}
        {earthquakes.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Seismic Events
              </h3>
              <span className="text-sm text-muted-foreground">Showing latest 6 events</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earthquakes.slice(0, 6).map((quake) => {
                const isRecent = Date.now() - new Date(quake.time).getTime() < 60 * 60 * 1000;
                const timeAgo = getTimeAgo(new Date(quake.time));
                
                return (
                  <div 
                    key={quake.id} 
                    className={`glass-card rounded-xl p-4 hover:bg-card/80 transition-all ${isRecent ? "ring-2 ring-primary/50" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center font-bold text-white ${isRecent ? "animate-pulse" : ""}`}
                        style={{ backgroundColor: getMagnitudeColor(quake.magnitude) }}
                      >
                        <span className="text-lg">{quake.magnitude.toFixed(1)}</span>
                        <span className="text-[10px] opacity-80">MAG</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground truncate">{quake.state}</h3>
                          {isRecent && (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{quake.location}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo}
                          </span>
                          <span>Depth: {quake.depth.toFixed(1)} km</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default IndiaMap;
