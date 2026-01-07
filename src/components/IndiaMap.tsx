import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Earthquake {
  id: string;
  magnitude: number;
  location: string;
  time: string;
  depth: number;
  coordinates: { lat: number; lng: number };
  state: string;
  region: string;
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

  const fetchEarthquakes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fnError } = await supabase.functions.invoke("fetch-earthquakes");
      
      if (fnError) throw fnError;
      
      setEarthquakes(data.earthquakes || []);
      setLastUpdated(new Date());
      
      // Update markers on map
      if (map.current) {
        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        
        // Add new markers
        data.earthquakes?.forEach((quake: Earthquake) => {
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
          el.style.animation = "pulse 2s infinite";
          
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; color: #1a1a2e;">
              <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">
                M ${quake.magnitude.toFixed(1)}
              </h3>
              <p style="font-size: 14px; margin-bottom: 4px;">${quake.location}</p>
              <p style="font-size: 12px; color: #666;">
                ${quake.state} • Depth: ${quake.depth.toFixed(1)} km
              </p>
              <p style="font-size: 11px; color: #888; margin-top: 4px;">
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
    } finally {
      setLoading(false);
    }
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

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchEarthquakes, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="map" className="py-20 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-glow rounded-full opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              India Seismic Activity Map
            </h2>
            <p className="text-muted-foreground">
              Real-time earthquake data from National Centre for Seismology (NCS) India
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString("en-IN")}
              </span>
            )}
            <Button 
              variant="glass" 
              size="sm" 
              onClick={fetchEarthquakes}
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
                <Button variant="glass" size="sm" onClick={fetchEarthquakes} className="mt-4">
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

          {/* Stats */}
          <div className="absolute top-4 left-4 glass-card rounded-lg p-4">
            <p className="text-xs font-semibold text-foreground mb-1">Recent Activity</p>
            <p className="text-2xl font-bold text-primary font-mono">{earthquakes.length}</p>
            <p className="text-xs text-muted-foreground">earthquakes in India</p>
          </div>
        </div>

        {/* Recent earthquakes list */}
        {earthquakes.length > 0 && (
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {earthquakes.slice(0, 6).map((quake) => (
              <div key={quake.id} className="glass-card rounded-xl p-4 hover:bg-card/80 transition-all">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white"
                    style={{ backgroundColor: getMagnitudeColor(quake.magnitude) }}
                  >
                    {quake.magnitude.toFixed(1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{quake.state}</h3>
                    <p className="text-sm text-muted-foreground truncate">{quake.location}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(quake.time).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short"
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default IndiaMap;
