import { useState, useMemo } from "react";
import { Search, Filter, Clock, MapPin, Waves, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Earthquake } from "@/data/indiaEarthquakes";

interface EarthquakeSidebarProps {
  earthquakes: Earthquake[];
  filteredEarthquakes: Earthquake[];
  magnitudeRange: [number, number];
  onMagnitudeRangeChange: (range: [number, number]) => void;
  yearRange: [number, number];
  onYearRangeChange: (range: [number, number]) => void;
  onEarthquakeClick: (eq: Earthquake) => void;
  selectedId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const getMagnitudeColor = (magnitude: number): string => {
  if (magnitude < 3) return "#22c55e";
  if (magnitude < 5) return "#f59e0b";
  if (magnitude < 6) return "#f97316";
  if (magnitude < 7) return "#ef4444";
  return "#dc2626";
};

const EarthquakeSidebar = ({
  earthquakes,
  filteredEarthquakes,
  magnitudeRange,
  onMagnitudeRangeChange,
  yearRange,
  onYearRangeChange,
  onEarthquakeClick,
  selectedId,
  searchQuery,
  onSearchChange,
}: EarthquakeSidebarProps) => {
  const [filtersOpen, setFiltersOpen] = useState(true);

  const minYear = useMemo(
    () => Math.min(...earthquakes.map((e) => new Date(e.time).getFullYear())),
    [earthquakes]
  );
  const maxYear = useMemo(
    () => Math.max(...earthquakes.map((e) => new Date(e.time).getFullYear())),
    [earthquakes]
  );

  return (
    <div className="w-full h-full flex flex-col bg-card/95 backdrop-blur-md border-r border-border/50">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-2 mb-3">
          <Waves className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Earthquake List</h3>
          <Badge variant="secondary" className="ml-auto text-xs">
            {filteredEarthquakes.length}/{earthquakes.length}
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search location, state..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm bg-background/50"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border/30">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            Filters
          </span>
          {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {filtersOpen && (
          <div className="px-4 pb-4 space-y-4">
            {/* Magnitude filter */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">
                Magnitude: {magnitudeRange[0].toFixed(1)} – {magnitudeRange[1].toFixed(1)}
              </label>
              <Slider
                min={0}
                max={10}
                step={0.5}
                value={magnitudeRange}
                onValueChange={(v) => onMagnitudeRangeChange(v as [number, number])}
                className="mt-1"
              />
            </div>
            {/* Year filter */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">
                Year: {yearRange[0]} – {yearRange[1]}
              </label>
              <Slider
                min={minYear}
                max={maxYear}
                step={1}
                value={yearRange}
                onValueChange={(v) => onYearRangeChange(v as [number, number])}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </div>

      {/* Earthquake List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredEarthquakes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No earthquakes match filters
            </div>
          ) : (
            filteredEarthquakes.map((eq) => (
              <button
                key={eq.id}
                onClick={() => onEarthquakeClick(eq)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedId === eq.id
                    ? "bg-primary/15 ring-1 ring-primary/40"
                    : "hover:bg-muted/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: getMagnitudeColor(eq.magnitude) }}
                  >
                    {eq.magnitude.toFixed(1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {eq.location}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {eq.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(eq.time).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span>Depth: {eq.depth.toFixed(1)} km</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default EarthquakeSidebar;
