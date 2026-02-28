import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, Activity, Clock, MapPin, TrendingUp } from "lucide-react";
import { staticEarthquakes, staticStats, type Earthquake } from "@/data/staticEarthquakes";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  const earthquakes = staticEarthquakes;
  const stats = staticStats;

  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-mapbox-token");
      if (error) throw error;
      setMapboxToken(data.token);
    } catch (err) {
      console.error("Failed to fetch Mapbox token:", err);
      setError("Map configuration error");
      setLoading(false);
    }
  };

  const addMarkersToMap = useCallback(() => {
    if (!map.current) return;
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    earthquakes.forEach((quake) => {
      const el = document.createElement("div");
      const size = Math.max(20, Math.min(50, quake.magnitude * 8));
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.backgroundColor = getMagnitudeColor(quake.magnitude);
      el.style.borderRadius = "50%";
      el.style.border = "2px solid white";
      el.style.boxShadow = `0 0 ${size / 2}px ${getMagnitudeColor(quake.magnitude)}`;
      el.style.cursor = "pointer";

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 12px; color: #1a1a2e; min-width: 200px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="background: ${getMagnitudeColor(quake.magnitude)}; color: white; font-weight: bold; padding: 4px 8px; border-radius: 6px; font-size: 14px;">
              M ${quake.magnitude.toFixed(1)}
            </span>
            ${quake.isHistorical ? '<span style="background: #6366f1; color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px;">HISTORICAL</span>' : ''}
          </div>
          <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${quake.location}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 4px;">
            📍 ${quake.state} • ${quake.region} | 🌊 Depth: ${quake.depth.toFixed(1)} km
          </p>
          <p style="font-size: 10px; color: #aaa; margin-top: 4px;">
            ${new Date(quake.time).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([quake.coordinates.lng, quake.coordinates.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
    setLoading(false);
  }, [earthquakes]);

  useEffect(() => {
    fetchMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [82.8, 22.5],
      zoom: 4.2,
      pitch: 30,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    map.current.on("load", () => {
      map.current?.addSource("india-boundary", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [[[68, 8], [68, 35], [97, 35], [97, 8], [68, 8]]],
          },
        },
      });

      map.current?.addLayer({
        id: "india-boundary-line",
        type: "line",
        source: "india-boundary",
        paint: {
          "line-color": "#f59e0b",
          "line-width": 1,
          "line-opacity": 0.3,
          "line-dasharray": [4, 2],
        },
      });

      addMarkersToMap();
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      map.current?.remove();
    };
  }, [mapboxToken, addMarkersToMap]);

  const topStates = Object.entries(stats.byState)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const recentQuakes = earthquakes.filter(q => !q.isHistorical);

  return (
    <section id="map" className="py-20 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-glow rounded-full opacity-50" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            India Seismic Activity Map
          </h2>
          <p className="text-muted-foreground">
            Earthquake data sourced from National Center for Seismology (NCS) & USGS • India region only (1976–2026)
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-card">
          <div ref={mapContainer} className="w-full h-[500px] md:h-[600px]" />

          {loading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 text-seismic-severe mx-auto mb-2" />
                <p className="text-muted-foreground">{error}</p>
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

          {/* Stats overlay */}
          <div className="absolute top-4 left-4 glass-card rounded-lg p-4 min-w-[180px]">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Data Summary</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold text-primary font-mono">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-seismic-moderate font-mono">{stats.maxMagnitude}</p>
                <p className="text-xs text-muted-foreground">Max Mag</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground">Avg: M{stats.avgMagnitude}</p>
            </div>
          </div>
        </div>

        {/* Data Analysis Section */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              Most Affected States
            </h3>
            <div className="space-y-3">
              {topStates.map(([state, count], i) => (
                <div key={state} className="flex items-center gap-3">
                  <span className="text-sm font-mono text-muted-foreground w-5">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-foreground">{state}</span>
                      <span className="text-sm font-mono text-primary">{count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary rounded-full h-1.5 transition-all"
                        style={{ width: `${(count / topStates[0][1]) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              Region-wise Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.byRegion)
                .sort(([, a], [, b]) => b - a)
                .map(([region, count]) => (
                  <div key={region} className="flex justify-between items-center py-2 border-b border-border/20 last:border-0">
                    <span className="text-sm text-foreground">{region}</span>
                    <span className="text-sm font-mono font-semibold text-primary">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Recent Events List */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            Recorded Seismic Events
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentQuakes.slice(0, 6).map((quake) => (
              <div key={quake.id} className="glass-card rounded-xl p-4 hover:bg-card/80 transition-all">
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-lg flex flex-col items-center justify-center font-bold text-white shrink-0"
                    style={{ backgroundColor: getMagnitudeColor(quake.magnitude) }}
                  >
                    <span className="text-lg">{quake.magnitude.toFixed(1)}</span>
                    <span className="text-[10px] opacity-80">MAG</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{quake.state}</h4>
                    <p className="text-sm text-muted-foreground truncate">{quake.location}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(quake.time).toLocaleDateString("en-IN")}
                      </span>
                      <span>Depth: {quake.depth.toFixed(1)} km</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Data: National Center for Seismology (NCS), India & USGS • India region only (1976–2026)
        </p>
      </div>
    </section>
  );
};

export default IndiaMap;
