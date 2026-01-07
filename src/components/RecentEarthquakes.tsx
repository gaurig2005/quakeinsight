import { AlertTriangle, MapPin, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";

interface Earthquake {
  id: string;
  magnitude: number;
  location: string;
  time: string;
  depth: string;
  coordinates: { lat: number; lng: number };
  trend: "up" | "down" | "stable";
}

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

const recentEarthquakes: Earthquake[] = [
  {
    id: "1",
    magnitude: 6.2,
    location: "Southern California, USA",
    time: "2 minutes ago",
    depth: "12.4 km",
    coordinates: { lat: 34.052, lng: -118.244 },
    trend: "up",
  },
  {
    id: "2",
    magnitude: 4.8,
    location: "Tokyo Bay, Japan",
    time: "15 minutes ago",
    depth: "45.2 km",
    coordinates: { lat: 35.689, lng: 139.692 },
    trend: "stable",
  },
  {
    id: "3",
    magnitude: 5.4,
    location: "Central Chile",
    time: "32 minutes ago",
    depth: "28.7 km",
    coordinates: { lat: -33.449, lng: -70.669 },
    trend: "down",
  },
  {
    id: "4",
    magnitude: 3.1,
    location: "Northern Italy",
    time: "1 hour ago",
    depth: "8.3 km",
    coordinates: { lat: 45.464, lng: 9.19 },
    trend: "stable",
  },
  {
    id: "5",
    magnitude: 7.1,
    location: "Sumatra, Indonesia",
    time: "2 hours ago",
    depth: "67.5 km",
    coordinates: { lat: -0.789, lng: 113.921 },
    trend: "down",
  },
];

const RecentEarthquakes = () => {
  return (
    <section id="dashboard" className="py-20 bg-gradient-dark">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Recent Seismic Activity
            </h2>
            <p className="text-muted-foreground">
              Real-time earthquake data from monitoring stations worldwide
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-seismic-high opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-seismic-high"></span>
            </span>
            Live updates
          </div>
        </div>

        <div className="grid gap-4">
          {recentEarthquakes.map((quake, index) => (
            <div
              key={quake.id}
              className="glass-card rounded-xl p-4 md:p-6 hover:bg-card/80 transition-all duration-300 cursor-pointer group animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4 md:gap-6">
                {/* Magnitude */}
                <div
                  className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl flex flex-col items-center justify-center border ${getMagnitudeClass(
                    quake.magnitude
                  )}`}
                >
                  <span className="text-2xl md:text-3xl font-bold font-mono">
                    {quake.magnitude.toFixed(1)}
                  </span>
                  <span className="text-xs uppercase tracking-wider opacity-80">
                    {getMagnitudeLabel(quake.magnitude)}
                  </span>
                </div>

                {/* Details */}
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
                        <span>Depth: {quake.depth}</span>
                        <span>{quake.time}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {quake.trend === "up" && (
                        <TrendingUp className="w-4 h-4 text-seismic-severe" />
                      )}
                      {quake.trend === "down" && (
                        <TrendingDown className="w-4 h-4 text-seismic-low" />
                      )}
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
