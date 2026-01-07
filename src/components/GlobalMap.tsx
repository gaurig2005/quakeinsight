import earthquakeMap from "@/assets/earthquake-map.jpg";
import { MapPin, Layers, Globe, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const GlobalMap = () => {
  const hotspots = [
    { name: "Ring of Fire", risk: "Extreme", x: "75%", y: "45%" },
    { name: "San Andreas Fault", risk: "High", x: "18%", y: "38%" },
    { name: "Himalayan Belt", risk: "High", x: "62%", y: "35%" },
    { name: "Mediterranean", risk: "Moderate", x: "48%", y: "33%" },
  ];

  return (
    <section id="map" className="py-20 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-glow rounded-full opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Global Seismic Activity Map
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time visualization of earthquake activity and tectonic plate boundaries worldwide
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-card">
          {/* Map Image */}
          <div className="relative aspect-video">
            <img
              src={earthquakeMap}
              alt="Global Earthquake Activity Map"
              className="w-full h-full object-cover"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/30" />
            
            {/* Hotspot markers */}
            {hotspots.map((spot, index) => (
              <div
                key={index}
                className="absolute group cursor-pointer"
                style={{ left: spot.x, top: spot.y }}
              >
                <div className="relative">
                  {/* Ping animation */}
                  <span className="absolute -inset-2 animate-ping rounded-full bg-primary/30"></span>
                  {/* Center dot */}
                  <span className="relative flex h-4 w-4 rounded-full bg-primary shadow-glow"></span>
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 pointer-events-none">
                  <div className="glass-card rounded-lg px-3 py-2 text-sm whitespace-nowrap">
                    <p className="font-semibold text-foreground">{spot.name}</p>
                    <p className="text-xs text-muted-foreground">Risk: {spot.risk}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Map controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button variant="glass" size="icon">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="glass" size="icon">
              <Layers className="w-4 h-4" />
            </Button>
            <Button variant="glass" size="icon">
              <Globe className="w-4 h-4" />
            </Button>
          </div>

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
        </div>

        {/* Info cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {[
            {
              icon: MapPin,
              title: "2,847 Active Stations",
              description: "Seismic monitoring stations worldwide providing real-time data",
            },
            {
              icon: Globe,
              title: "15 Tectonic Plates",
              description: "Major plate boundaries tracked for earthquake prediction",
            },
            {
              icon: Layers,
              title: "Multi-layer Analysis",
              description: "Surface, depth, and historical data combined for accuracy",
            },
          ].map((card, index) => (
            <div
              key={index}
              className="glass-card rounded-xl p-6 hover:bg-card/80 transition-all group"
            >
              <card.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GlobalMap;
