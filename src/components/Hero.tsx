import { Activity, MapPin, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-seismic.jpg";

const SeismicWave = () => (
  <div className="absolute inset-0 overflow-hidden opacity-30">
    <svg className="w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
      <path
        d="M0,100 Q50,50 100,100 T200,100 T300,100 T400,100 T500,100 T600,100 T700,100 T800,100 T900,100 T1000,100 T1100,100 T1200,100"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        className="animate-pulse"
      />
      <path
        d="M0,100 Q75,20 150,100 T300,100 T450,100 T600,100 T750,100 T900,100 T1050,100 T1200,100"
        fill="none"
        stroke="hsl(var(--primary) / 0.5)"
        strokeWidth="1.5"
        className="animate-pulse-slow"
      />
    </svg>
  </div>
);

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      
      {/* Animated glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-glow rounded-full animate-pulse-slow" />
      
      <SeismicWave />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="animate-slide-up">
          {/* Live indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-seismic-high opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-seismic-high"></span>
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              Live Monitoring Active
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
            <span className="text-gradient">Quake</span>
            <span className="text-foreground">Insight</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Advanced earthquake prediction and real-time seismic monitoring powered by cutting-edge AI technology
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="xl">
              <Activity className="w-5 h-5" />
              View Live Activity
            </Button>
            <Button variant="glass" size="xl">
              <MapPin className="w-5 h-5" />
              Explore Risk Map
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { icon: Activity, label: "Earthquakes Today", value: "127" },
            { icon: AlertTriangle, label: "High Risk Alerts", value: "3" },
            { icon: MapPin, label: "Stations Active", value: "2,847" },
            { icon: Clock, label: "Prediction Accuracy", value: "94.7%" },
          ].map((stat, index) => (
            <div
              key={index}
              className="glass-card rounded-xl p-4 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl md:text-3xl font-bold text-foreground font-mono">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
