import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, AlertTriangle, Activity, Clock, MapPin, TrendingUp, PanelLeftOpen, PanelLeftClose, Map, Satellite, Mountain, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { indiaEarthquakes, indiaStats } from "@/data/indiaEarthquakes";
import { indiaBoundaryCoordinates, seismicZones } from "@/data/indiaBoundary";
import EarthquakeSidebar from "./EarthquakeSidebar";
import RecentEarthquakeBar from "./RecentEarthquakeBar";
import TimeSlider from "./TimeSlider";
import type { Earthquake } from "@/data/indiaEarthquakes";
import { supabase } from "@/integrations/supabase/client";

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
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [magnitudeRange, setMagnitudeRange] = useState<[number, number]>([0, 10]);
  const [yearRange, setYearRange] = useState<[number, number]>([1975, 2026]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEqId, setSelectedEqId] = useState<string | null>(null);

  const [timeSliderYear, setTimeSliderYear] = useState(2026);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mapStyle, setMapStyle] = useState<"roadmap" | "satellite" | "terrain">("roadmap");
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [liveEarthquakes, setLiveEarthquakes] = useState<Earthquake[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  // Merge static CSV data with live USGS data
  const earthquakes = useMemo(() => {
    const staticIds = new Set(indiaEarthquakes.map(e => e.id));
    const uniqueLive = liveEarthquakes.filter(e => !staticIds.has(e.id));
    return [...indiaEarthquakes, ...uniqueLive];
  }, [liveEarthquakes]);

  const stats = useMemo(() => ({
    total: earthquakes.length,
    avgMagnitude: (earthquakes.reduce((s, e) => s + e.magnitude, 0) / earthquakes.length).toFixed(1),
    maxMagnitude: Math.max(...earthquakes.map(e => e.magnitude)),
    byState: earthquakes.reduce((acc, e) => { acc[e.state] = (acc[e.state] || 0) + 1; return acc; }, {} as Record<string, number>),
    byRegion: earthquakes.reduce((acc, e) => { acc[e.region] = (acc[e.region] || 0) + 1; return acc; }, {} as Record<string, number>),
    byDecade: earthquakes.reduce((acc, e) => { const d = Math.floor(new Date(e.time).getFullYear() / 10) * 10; acc[`${d}s`] = (acc[`${d}s`] || 0) + 1; return acc; }, {} as Record<string, number>),
  }), [earthquakes]);

  // Fetch live USGS data via edge function
  const fetchLiveData = useCallback(async () => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-earthquakes", {
        body: null,
      });
      if (error) throw error;
      if (data?.earthquakes) {
        setLiveEarthquakes(data.earthquakes);
        console.log(`Fetched ${data.earthquakes.length} live earthquakes from USGS`);
      }
    } catch (err: any) {
      console.error("Live USGS fetch failed:", err);
      setLiveError("Live data unavailable");
    } finally {
      setLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  const minYear = useMemo(
    () => Math.min(...earthquakes.map((e) => new Date(e.time).getFullYear())),
    [earthquakes]
  );
  const maxYear = useMemo(
    () => Math.max(...earthquakes.map((e) => new Date(e.time).getFullYear())),
    [earthquakes]
  );

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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      center: [20, 78],
      zoom: 4,
      maxBounds: L.latLngBounds([-5, 60], [40, 100]),
      maxBoundsViscosity: 1.0,
      zoomControl: false,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    // Default roadmap tile layer
    const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // India boundary
    const boundaryLatLngs = indiaBoundaryCoordinates.map(
      ([lng, lat]) => [lat, lng] as [number, number]
    );
    L.polygon(boundaryLatLngs, {
      color: "hsl(24, 95%, 53%)",
      weight: 2,
      opacity: 0.6,
      fillColor: "hsl(24, 95%, 53%)",
      fillOpacity: 0.05,
    }).addTo(map);

    // Seismic zones
    seismicZones.forEach((zone) => {
      zone.coordinates.forEach((coords) => {
        const latLngs = coords.map(
          ([lng, lat]) => [lat, lng] as [number, number]
        );
        L.polygon(latLngs, {
          color: zone.color,
          weight: 1.5,
          opacity: 0.4,
          dashArray: "6 4",
          fillColor: zone.color,
          fillOpacity: zone.opacity,
        }).addTo(map);
      });
    });

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setLoading(false);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when filters change
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    const zoom = mapRef.current.getZoom();
    const shouldCluster = zoom < 5;

    if (shouldCluster) {
      const clusters: Record<string, { quakes: Earthquake[]; lat: number; lng: number }> = {};
      filteredEarthquakes.forEach((eq) => {
        const key = eq.region;
        if (!clusters[key]) clusters[key] = { quakes: [], lat: 0, lng: 0 };
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

        const icon = L.divIcon({
          className: "",
          html: `<div style="width:${size}px;height:${size}px;background:${getMagnitudeColor(maxMag)};border-radius:50%;border:3px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px;cursor:pointer;box-shadow:0 0 ${size / 2}px ${getMagnitudeColor(maxMag)}80;">${count}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        L.marker([avgLat, avgLng], { icon })
          .bindPopup(`
            <div style="padding:12px;min-width:180px;">
              <h3 style="font-weight:700;font-size:14px;margin-bottom:6px;">${region}</h3>
              <p style="font-size:12px;color:#666;">${count} earthquakes</p>
              <p style="font-size:12px;color:#666;">Max magnitude: M${maxMag.toFixed(1)}</p>
              <p style="font-size:11px;color:#888;margin-top:4px;">Zoom in to see individual events</p>
            </div>
          `)
          .addTo(markersLayerRef.current!);
      });
    } else {
      filteredEarthquakes.forEach((quake) => {
        const radius = getMagnitudeRadius(quake.magnitude);
        const color = getMagnitudeColor(quake.magnitude);

        const icon = L.divIcon({
          className: "",
          html: `<div style="width:${radius * 2}px;height:${radius * 2}px;background:${color};border-radius:50%;border:2px solid rgba(255,255,255,0.5);box-shadow:0 0 ${radius}px ${color}80;cursor:pointer;transition:transform 0.2s;" onmouseenter="this.style.transform='scale(1.3)'" onmouseleave="this.style.transform='scale(1)'"></div>`,
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius],
        });

        L.marker([quake.coordinates.lat, quake.coordinates.lng], { icon })
          .bindPopup(`
            <div style="padding:12px;min-width:220px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <span style="background:${color};color:white;font-weight:bold;padding:4px 10px;border-radius:6px;font-size:14px;">M ${quake.magnitude.toFixed(1)}</span>
                ${quake.isHistorical ? '<span style="background:#6b7280;color:white;padding:2px 6px;border-radius:4px;font-size:10px;">Historical</span>' : ""}
              </div>
              <h3 style="font-weight:600;font-size:14px;margin-bottom:4px;">${quake.location}</h3>
              <p style="font-size:12px;color:#666;margin-bottom:2px;">📍 ${quake.state} • ${quake.region}</p>
              <p style="font-size:12px;color:#666;margin-bottom:2px;">🌊 Depth: ${quake.depth.toFixed(1)} km</p>
              <p style="font-size:12px;color:#666;">📐 ${quake.coordinates.lat.toFixed(2)}°N, ${quake.coordinates.lng.toFixed(2)}°E</p>
              <p style="font-size:11px;color:#888;margin-top:6px;border-top:1px solid #eee;padding-top:6px;">🕐 ${new Date(quake.time).toLocaleString("en-IN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          `)
          .addTo(markersLayerRef.current!);
      });
    }
  }, [filteredEarthquakes]);

  // Re-cluster on zoom
  useEffect(() => {
    if (!mapRef.current) return;
    const handler = () => {
      // Trigger re-render by toggling a dummy state — but simpler to just re-run markers
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();
        // We need to force the effect above; easiest: dispatch custom event
      }
    };
    mapRef.current.on("zoomend", handler);
    return () => { mapRef.current?.off("zoomend", handler); };
  }, []);

  // Switch tile layers when mapStyle changes
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    const tileSources: Record<string, { url: string; attribution: string; maxZoom: number }> = {
      roadmap: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      },
      satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 18,
      },
      terrain: {
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        maxZoom: 17,
      },
    };

    const source = tileSources[mapStyle];
    mapRef.current.removeLayer(tileLayerRef.current);
    const newLayer = L.tileLayer(source.url, {
      attribution: source.attribution,
      maxZoom: source.maxZoom,
    }).addTo(mapRef.current);
    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  const handleEarthquakeClick = (eq: Earthquake) => {
    setSelectedEqId(eq.id);
    if (mapRef.current) {
      mapRef.current.flyTo([eq.coordinates.lat, eq.coordinates.lng], 7, { duration: 1 });
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

        <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-card">
          <div className="flex flex-col md:flex-row" style={{ height: "700px" }}>
            <div
              className={`${sidebarOpen ? "w-full md:w-[300px]" : "w-0"} transition-all duration-300 overflow-hidden shrink-0 h-full`}
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

            <div className="flex-1 relative h-full">
              <div ref={mapContainer} className="w-full h-full" />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="absolute top-4 left-4 z-[1000] hidden md:flex glass-card h-9 w-9"
              >
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </Button>

              {/* Map Style Switcher */}
              <div className="absolute top-4 left-16 z-[1000] flex gap-1 glass-card rounded-lg p-1">
                {[
                  { id: "roadmap" as const, icon: Map, label: "Default" },
                  { id: "satellite" as const, icon: Satellite, label: "Satellite" },
                  { id: "terrain" as const, icon: Mountain, label: "Terrain" },
                ].map((style) => (
                  <Button
                    key={style.id}
                    variant={mapStyle === style.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMapStyle(style.id)}
                    className={`h-8 px-2.5 text-xs gap-1.5 ${mapStyle === style.id ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    <style.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{style.label}</span>
                  </Button>
                ))}
              </div>

              {loading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-[1000]">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading map...</p>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="absolute bottom-16 left-4 glass-card rounded-lg p-3 z-[1000]">
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
              <div className="absolute top-4 right-16 glass-card rounded-lg p-3 min-w-[140px] z-[1000]">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3 h-3 text-primary" />
                  <p className="text-xs font-semibold text-foreground">Showing</p>
                </div>
                <p className="text-xl font-bold text-primary font-mono">{filteredEarthquakes.length}</p>
                <p className="text-xs text-muted-foreground">of {earthquakes.length} events</p>
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/30">
                  {liveLoading ? (
                    <Badge variant="outline" className="text-[10px] gap-1"><RefreshCw className="w-2.5 h-2.5 animate-spin" />Loading live...</Badge>
                  ) : liveError ? (
                    <Badge variant="destructive" className="text-[10px]">Offline</Badge>
                  ) : liveEarthquakes.length > 0 ? (
                    <Badge variant="secondary" className="text-[10px] gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />+{liveEarthquakes.length} live</Badge>
                  ) : null}
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={fetchLiveData} disabled={liveLoading}>
                    <RefreshCw className={`w-3 h-3 ${liveLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Time Slider */}
              <div className="absolute bottom-4 left-4 right-4 z-[1000]">
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

            {/* Recent Earthquake Bar on the right */}
            <div className="hidden md:block w-[280px] shrink-0 h-full">
              <RecentEarthquakeBar
                earthquakes={earthquakes}
                onEarthquakeClick={handleEarthquakeClick}
              />
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
          Data: USGS Earthquake Catalog (1975–2026) • Region: Lat [-1.1°, 36.4°] Lon [64.6°, 93.3°] • {indiaEarthquakes.length} historical + {liveEarthquakes.length} live events
        </p>
      </div>
    </section>
  );
};

export default IndiaMap;
