import { AlertTriangle, MapPin, ArrowUpRight } from "lucide-react";
import { indiaEarthquakes } from "@/data/indiaEarthquakes";
import { useMemo } from "react";

const getMagnitudeClass = (magnitude: number) => {
  if (magnitude < 3) return "magnitude-low";
  if (magnitude < 5) return "magnitude-moderate";
  if (magnitude < 6) return "magnitude-high";
  if (magnitude < 7) return "magnitude-severe";
  return "magnitude-extreme";
};

const getMagnitudeLabel = (magnitude: number) => {
  if (magnitude < 3) return "Minor";
  if (magnitude < 5) return "Light";
  if (magnitude < 6) return "Moderate";
  if (magnitude < 7) return "Strong";
  return "Major";
};

const RecentEarthquakes = () => {
  const quakes = useMemo(() => 
    [...indiaEarthquakes]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5),
    []
  );

  return (
    <section id="dashboard" className="py-20 bg-gradient-dark">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Recent Seismic Activity
            </h2>
            <p className="text-muted-foreground">
              Latest earthquake data from USGS (1975–2026)
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {quakes.map((quake, index) => (
            <div
              key={quake.id}
              className="glass-card rounded-xl p-4 md:p-6 hover:bg-card/80 transition-all duration-300 cursor-pointer group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4 md:gap-6">
                <div
                  className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl flex flex-col items-center justify-center border ${getMagnitudeClass(quake.magnitude)}`}
                >
                  <span className="text-2xl md:text-3xl font-bold font-mono">
                    {quake.magnitude.toFixed(1)}
                  </span>
                  <span className="text-xs uppercase tracking-wider opacity-80">
                    {getMagnitudeLabel(quake.magnitude)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        {quake.location}
                        {quake.magnitude >= 6 && (
                          <AlertTriangle className="w-4 h-4 text-seismic-severe animate-pulse" />
                        )}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {quake.coordinates.lat.toFixed(3)}°, {quake.coordinates.lng.toFixed(3)}°
                        </span>
                        <span>Depth: {quake.depth.toFixed(0)} km</span>
                        <span>{new Date(quake.time).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentEarthquakes;
