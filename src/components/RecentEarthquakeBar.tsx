import { useMemo, useState } from "react";
import { Clock, MapPin, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Earthquake } from "@/data/indiaEarthquakes";

interface RecentEarthquakeBarProps {
  earthquakes: Earthquake[];
  onEarthquakeClick?: (eq: Earthquake) => void;
}

const getMagnitudeColor = (magnitude: number): string => {
  if (magnitude < 3) return "#22c55e";
  if (magnitude < 5) return "#f59e0b";
  if (magnitude < 6) return "#f97316";
  if (magnitude < 7) return "#ef4444";
  return "#dc2626";
};

const RecentEarthquakeBar = ({ earthquakes, onEarthquakeClick }: RecentEarthquakeBarProps) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [magFilter, setMagFilter] = useState<[number, number]>([0, 10]);
  const [yearFilter, setYearFilter] = useState<[number, number]>([1975, 2026]);

  const sorted = useMemo(() => {
    return [...earthquakes]
      .filter(eq => {
        const year = new Date(eq.time).getFullYear();
        return eq.magnitude >= magFilter[0] && eq.magnitude <= magFilter[1] &&
               year >= yearFilter[0] && year <= yearFilter[1];
      })
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 100);
  }, [earthquakes, magFilter, yearFilter]);

  return (
    <div className="w-full h-full flex flex-col bg-card/95 backdrop-blur-md border-l border-border/50">
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Recent Earthquakes</h3>
        </div>
        <p className="text-xs text-muted-foreground">Latest {sorted.length} events</p>
      </div>

      {/* Filters toggle */}
      <div className="border-b border-border/30">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-primary" />
            Filter
          </span>
          {filtersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {filtersOpen && (
          <div className="px-4 pb-3 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Magnitude: {magFilter[0].toFixed(1)} – {magFilter[1].toFixed(1)}
              </label>
              <Slider min={0} max={10} step={0.5} value={magFilter}
                onValueChange={(v) => setMagFilter(v as [number, number])} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Year: {yearFilter[0]} – {yearFilter[1]}
              </label>
              <Slider min={1975} max={2026} step={1} value={yearFilter}
                onValueChange={(v) => setYearFilter(v as [number, number])} />
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sorted.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No events match</div>
          ) : (
            sorted.map((eq) => (
              <button
                key={eq.id}
                onClick={() => onEarthquakeClick?.(eq)}
                className="w-full text-left p-2.5 rounded-lg hover:bg-muted/40 transition-all"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                    style={{ backgroundColor: getMagnitudeColor(eq.magnitude) }}
                  >
                    {eq.magnitude.toFixed(1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{eq.location}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />{eq.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(eq.time).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                      <span>D: {eq.depth.toFixed(0)}km</span>
                    </div>
                  </div>
                  {!eq.isHistorical && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">Live</Badge>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RecentEarthquakeBar;
