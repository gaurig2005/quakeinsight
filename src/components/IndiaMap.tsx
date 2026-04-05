import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, Activity, Clock, MapPin, TrendingUp, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { indiaEarthquakes, indiaStats } from "@/data/indiaEarthquakes";
import { indiaBoundaryCoordinates, seismicZones } from "@/data/indiaBoundary";
import EarthquakeSidebar from "./EarthquakeSidebar";
import TimeSlider from "./TimeSlider";
import type { Earthquake } from "@/data/indiaEarthquakes";

const getMagnitudeColor = (magnitude: number): string => {
  if (magnitude < 3) return "#22c55e";
  if (magnitude < 5) return "#f59e0b";
  if (magnitude < 6) return "#f97316";
  if (magnitude < 7) return "#ef4444";
  return "#dc2626";
};

const getMagnitudeRadius = (magnitude: number): number => {
  return Math.max(6, Math.min(30, magnitude * 5));
};

const IndiaMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Filter state
  const [magnitudeRange, setMagnitudeRange] = useState<[number, number]>([0, 10]);
  const [yearRange, setYearRange] = useState<[number, number]>([1897, 2026]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEqId, setSelectedEqId] = useState<string | null>(null);

  // Time slider state
  const [timeSliderYear, setTimeSliderYear] = useState(2026);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const earthquakes = indiaEarthquakes;
  const stats = indiaStats;

  const minYear = useMemo(
    () => Math.min(...earthquakes.map((e) => new Date(e.time).getFullYear())),
    [earthquakes]
  );
  const maxYear = useMemo(
    () => Math.max(...earthquakes.map((e) => new Date(e.time).getFullYear())),
    [earthquakes]
  );

  // Filtered earthquakes
  const filteredEarthquakes = useMemo(() => {
    return earthquakes.filter((eq) => {
      const year = new Date(eq.time).getFullYear();
      const matchesMag = eq.magnitude >= magnitudeRange[0] && eq.magnitude <= magnitudeRange[1];
      const matchesYear = year >= yearRange[0] && year <= yearRange[1];
      const matchesSearch =
        !searchQuery ||
        eq.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.region.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTimeSlider = year <= timeSliderYear;
      return matchesMag && matchesYear && matchesSearch && matchesTimeSlider;
    });
  }, [earthquakes, magnitudeRange, yearRange, searchQuery, timeSliderYear]);

  // Time slider animation
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setTimeSliderYear((prev) => {
          if (prev >= maxYear) {
            setIsPlaying(false);
            return maxYear;
          }
          return prev + 1;
        });
      }, 500);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, maxYear]);

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

  const addMarkersToMap = useCallback(() => {
    if (!map.current) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Simple clustering: group nearby quakes when zoomed out
    const zoom = map.current.getZoom();
    const shouldCluster = zoom < 5;

    if (shouldCluster) {
      // Group by region for clustering
      const clusters: Record<string, { quakes: Earthquake[]; lat: number; lng: number }> = {};
      filteredEarthquakes.forEach((eq) => {
        const key = eq.region;
        if (!clusters[key]) {
          clusters[key] = { quakes: [], lat: 0, lng: 0 };
        }
        clusters[key].quakes.push(eq);
        clusters[key].lat += eq.coordinates.lat;
        clusters[key].lng += eq.coordinates.lng;
      });

      Object.entries(clusters).forEach(([region, cluster]) => {
        const count = cluster.quakes.length;
        const avgLat = cluster.lat / count;
        const avgLng = cluster.lng / count;
        const maxMag = Math.max(...cluster.quakes.map((q) => q.magnitude));
        const size = Math.max(40, Math.min(70, count * 10 + 30));

        const el = document.createElement("div");
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.backgroundColor = getMagnitudeColor(maxMag);
        el.style.borderRadius = "50%";
        el.style.border = "3px solid rgba(255,255,255,0.3)";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.color = "white";
        el.style.fontWeight = "bold";
        el.style.fontSize = "14px";
        el.style.cursor = "pointer";
        el.style.boxShadow = `0 0 ${size / 2}px ${getMagnitudeColor(maxMag)}80`;
        el.textContent = String(count);

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 12px; color: #1a1a2e; min-width: 180px;">
            <h3 style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">${region}</h3>
            <p style="font-size: 12px; color: #666;">${count} earthquakes</p>
            <p style="font-size: 12px; color: #666;">Max magnitude: M${maxMag.toFixed(1)}</p>
            <p style="font-size: 11px; color: #888; margin-top: 4px;">Zoom in to see individual events</p>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([avgLng, avgLat])
          .setPopup(popup)
          .addTo(map.current!);
        markersRef.current.push(marker);
      });
    } else {
      // Individual markers
      filteredEarthquakes.forEach((quake) => {
        const radius = getMagnitudeRadius(quake.magnitude);
        const el = document.createElement("div");
        el.style.width = `${radius * 2}px`;
        el.style.height = `${radius * 2}px`;
        el.style.backgroundColor = getMagnitudeColor(quake.magnitude);
        el.style.borderRadius = "50%";
        el.style.border = "2px solid rgba(255,255,255,0.5)";
        el.style.boxShadow = `0 0 ${radius}px ${getMagnitudeColor(quake.magnitude)}80`;
        el.style.cursor = "pointer";
        el.style.transition = "transform 0.2s";

        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.3)";
          el.style.zIndex = "10";
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1)";
          el.style.zIndex = "auto";
        });

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 12px; color: #1a1a2e; min-width: 220px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="background: ${getMagnitudeColor(quake.magnitude)}; color: white; font-weight: bold; padding: 4px 10px; border-radius: 6px; font-size: 14px;">
                M ${quake.magnitude.toFixed(1)}
              </span>
              ${quake.isHistorical ? '<span style="background:#6b7280;color:white;padding:2px 6px;border-radius:4px;font-size:10px;">Historical</span>' : ""}
            </div>
            <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${quake.location}</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 2px;">
              📍 ${quake.state} • ${quake.region}
            </p>
            <p style="font-size: 12px; color: #666; margin-bottom: 2px;">
              🌊 Depth: ${quake.depth.toFixed(1)} km
            </p>
            <p style="font-size: 12px; color: #666;">
              📐 ${quake.coordinates.lat.toFixed(2)}°N, ${quake.coordinates.lng.toFixed(2)}°E
            </p>
            <p style="font-size: 11px; color: #888; margin-top: 6px; border-top: 1px solid #eee; padding-top: 6px;">
              🕐 ${new Date(quake.time).toLocaleString("en-IN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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
    setLoading(false);
  }, [filteredEarthquakes]);

  // Re-render markers on filter/zoom change
  useEffect(() => {
    if (map.current && mapboxToken) {
      addMarkersToMap();
    }
  }, [addMarkersToMap]);

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
      maxBounds: [[60, 5], [100, 40]],
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    map.current.on("load", () => {
      // India boundary
      map.current?.addSource("india-boundary", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [indiaBoundaryCoordinates] },
        },
      });

      map.current?.addLayer({
        id: "india-boundary-fill",
        type: "fill",
        source: "india-boundary",
        paint: { "fill-color": "hsl(24, 95%, 53%)", "fill-opacity": 0.05 },
      });

      map.current?.addLayer({
        id: "india-boundary-line",
        type: "line",
        source: "india-boundary",
        paint: { "line-color": "hsl(24, 95%, 53%)", "line-width": 2, "line-opacity": 0.6 },
      });

      // Seismic zones
      seismicZones.forEach((zone, index) => {
        zone.coordinates.forEach((coords, ci) => {
          const sourceId = `seismic-zone-${index}-${ci}`;
          map.current?.addSource(sourceId, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: { name: zone.name },
              geometry: { type: "Polygon", coordinates: [coords] },
            },
          });
          map.current?.addLayer({
            id: `${sourceId}-fill`,
            type: "fill",
            source: sourceId,
            paint: { "fill-color": zone.color, "fill-opacity": zone.opacity },
          });
          map.current?.addLayer({
            id: `${sourceId}-line`,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": zone.color,
              "line-width": 1.5,
              "line-opacity": 0.4,
              "line-dasharray": [3, 2],
            },
          });
        });
      });

      addMarkersToMap();
    });

    // Re-cluster on zoom change
    map.current.on("zoomend", () => {
      addMarkersToMap();
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      map.current?.remove();
    };
  }, [mapboxToken]);

  const handleEarthquakeClick = (eq: Earthquake) => {
    setSelectedEqId(eq.id);
    if (map.current) {
      map.current.flyTo({
        center: [eq.coordinates.lng, eq.coordinates.lat],
        zoom: 7,
        duration: 1000,
      });
    }
  };

  const handlePlayToggle = () => {
    if (!isPlaying) {
      if (timeSliderYear >= maxYear) setTimeSliderYear(minYear);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const topStates = Object.entries(stats.byState)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

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
              Interactive earthquake visualization with filtering, clustering & time animation
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4 mr-2" /> : <PanelLeftOpen className="w-4 h-4 mr-2" />}
            {sidebarOpen ? "Hide List" : "Show List"}
          </Button>
        </div>

        {/* Map + Sidebar Layout */}
        <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-card">
          <div className="flex flex-col md:flex-row" style={{ height: "650px" }}>
            {/* Sidebar */}
            <div
              className={`${
                sidebarOpen ? "w-full md:w-[340px]" : "w-0"
              } transition-all duration-300 overflow-hidden shrink-0 h-full`}
            >
              <EarthquakeSidebar
                earthquakes={earthquakes}
                filteredEarthquakes={filteredEarthquakes}
                magnitudeRange={magnitudeRange}
                onMagnitudeRangeChange={setMagnitudeRange}
                yearRange={yearRange}
                onYearRangeChange={setYearRange}
                onEarthquakeClick={handleEarthquakeClick}
                selectedId={selectedEqId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>

            {/* Map */}
            <div className="flex-1 relative h-full">
              <div ref={mapContainer} className="w-full h-full" />

              {/* Sidebar toggle (desktop) */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute top-4 left-4 z-10 hidden md:flex glass-card h-9 w-9"
              >
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </Button>

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
              <div className="absolute bottom-16 left-4 glass-card rounded-lg p-3">
                <p className="text-xs font-semibold text-foreground mb-2">Magnitude</p>
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
                      <span className="text-[10px] text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats overlay */}
              <div className="absolute top-4 right-16 glass-card rounded-lg p-3 min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3 h-3 text-primary" />
                  <p className="text-xs font-semibold text-foreground">Showing</p>
                </div>
                <p className="text-xl font-bold text-primary font-mono">{filteredEarthquakes.length}</p>
                <p className="text-xs text-muted-foreground">of {earthquakes.length} events</p>
              </div>

              {/* Time Slider */}
              <div className="absolute bottom-4 left-4 right-4">
                <TimeSlider
                  minYear={minYear}
                  maxYear={maxYear}
                  currentYear={timeSliderYear}
                  onYearChange={setTimeSliderYear}
                  isPlaying={isPlaying}
                  onPlayToggle={handlePlayToggle}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Analysis */}
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
                  <div
                    key={region}
                    className="flex justify-between items-center py-2 border-b border-border/20 last:border-0"
                  >
                    <span className="text-sm text-foreground">{region}</span>
                    <span className="text-sm font-mono font-semibold text-primary">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Data: National Center for Seismology (NCS), India & USGS • India region only
        </p>
      </div>
    </section>
  );
};

export default IndiaMap;
