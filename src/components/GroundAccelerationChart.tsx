import { useMemo, useRef, useEffect, useState } from "react";
import { Gauge, TrendingUp, MapPin, AlertTriangle, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

interface GroundAccelerationChartProps {
  earthquakes: (Earthquake & { isHistorical?: boolean })[];
}

// Calculate Peak Ground Acceleration using attenuation relationship
const calculatePGA = (magnitude: number, distance: number, depth: number): number => {
  // GMPE (Ground Motion Prediction Equation) - simplified Boore-Atkinson model
  const hypoDistance = Math.sqrt(distance * distance + depth * depth);
  const logPGA = 0.72 * magnitude - 0.0039 * hypoDistance - Math.log10(hypoDistance) + 1.0;
  return Math.pow(10, logPGA);
};

// Calculate Peak Ground Velocity
const calculatePGV = (magnitude: number, distance: number, depth: number): number => {
  const hypoDistance = Math.sqrt(distance * distance + depth * depth);
  const logPGV = 0.68 * magnitude - 0.003 * hypoDistance - Math.log10(hypoDistance) + 0.5;
  return Math.pow(10, logPGV);
};

// Calculate spectral acceleration at different periods
const calculateSpectralAcceleration = (magnitude: number, depth: number, period: number): number => {
  const basePGA = calculatePGA(magnitude, 50, depth);
  // Simplified spectral shape
  if (period < 0.1) return basePGA * 1.0;
  if (period < 0.3) return basePGA * 2.5;
  if (period < 0.5) return basePGA * 2.0;
  if (period < 1.0) return basePGA * 1.2;
  return basePGA * (1 / period) * 0.8;
};

// Get MMI (Modified Mercalli Intensity) from PGA
const getMMI = (pga: number): { value: number; label: string; color: string } => {
  if (pga < 0.17) return { value: 1, label: "I - Not felt", color: "#94a3b8" };
  if (pga < 1.4) return { value: 2, label: "II-III - Weak", color: "#22c55e" };
  if (pga < 3.9) return { value: 4, label: "IV - Light", color: "#84cc16" };
  if (pga < 9.2) return { value: 5, label: "V - Moderate", color: "#f59e0b" };
  if (pga < 18) return { value: 6, label: "VI - Strong", color: "#f97316" };
  if (pga < 34) return { value: 7, label: "VII - Very Strong", color: "#ef4444" };
  if (pga < 65) return { value: 8, label: "VIII - Severe", color: "#dc2626" };
  if (pga < 124) return { value: 9, label: "IX - Violent", color: "#b91c1c" };
  return { value: 10, label: "X+ - Extreme", color: "#7f1d1d" };
};

const GroundAccelerationChart = ({ earthquakes }: GroundAccelerationChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedDistance, setSelectedDistance] = useState(50);
  
  const recentQuakes = earthquakes.filter(e => !e.isHistorical).slice(0, 20);
  const latestQuake = recentQuakes[0];
  
  const accelerationData = useMemo(() => {
    if (!latestQuake) return { pga: 0, pgv: 0, mmi: getMMI(0), spectral: [] };
    
    const pga = calculatePGA(latestQuake.magnitude, selectedDistance, latestQuake.depth);
    const pgv = calculatePGV(latestQuake.magnitude, selectedDistance, latestQuake.depth);
    const mmi = getMMI(pga);
    
    // Generate spectral acceleration curve
    const periods = [0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0];
    const spectral = periods.map(period => ({
      period,
      sa: calculateSpectralAcceleration(latestQuake.magnitude, latestQuake.depth, period)
    }));
    
    return { pga, pgv, mmi, spectral };
  }, [latestQuake, selectedDistance]);
  
  // Regional PGA analysis
  const regionalAnalysis = useMemo(() => {
    const regionData: Record<string, { maxPGA: number; events: number; avgMag: number }> = {};
    
    recentQuakes.forEach(quake => {
      if (!regionData[quake.region]) {
        regionData[quake.region] = { maxPGA: 0, events: 0, avgMag: 0 };
      }
      const pga = calculatePGA(quake.magnitude, 30, quake.depth);
      regionData[quake.region].maxPGA = Math.max(regionData[quake.region].maxPGA, pga);
      regionData[quake.region].events++;
      regionData[quake.region].avgMag += quake.magnitude;
    });
    
    Object.keys(regionData).forEach(region => {
      regionData[region].avgMag /= regionData[region].events;
    });
    
    return Object.entries(regionData)
      .sort((a, b) => b[1].maxPGA - a[1].maxPGA)
      .slice(0, 5);
  }, [recentQuakes]);

  // Draw spectral acceleration curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || accelerationData.spectral.length === 0) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const { width, height } = canvas;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);
    
    // Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    
    // Find max SA for scaling
    const maxSA = Math.max(...accelerationData.spectral.map(s => s.sa));
    
    // Draw curve
    ctx.beginPath();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 3;
    
    accelerationData.spectral.forEach((point, i) => {
      const x = padding.left + (Math.log10(point.period * 100) / Math.log10(400)) * chartWidth;
      const y = padding.top + chartHeight - (point.sa / maxSA) * chartHeight * 0.9;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Glow effect
    ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
    ctx.lineWidth = 8;
    ctx.stroke();
    
    // Draw points
    ctx.fillStyle = "#f59e0b";
    accelerationData.spectral.forEach((point) => {
      const x = padding.left + (Math.log10(point.period * 100) / Math.log10(400)) * chartWidth;
      const y = padding.top + chartHeight - (point.sa / maxSA) * chartHeight * 0.9;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // X-axis label
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Period (s)", width / 2, height - 5);
    
    // Y-axis label
    ctx.save();
    ctx.translate(12, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Sa (cm/s²)", 0, 0);
    ctx.restore();
  }, [accelerationData]);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Gauge className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Ground Acceleration Analysis</h2>
            <p className="text-muted-foreground text-sm">
              PGA • PGV • Spectral acceleration • MMI intensity
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main PGA Display */}
          <div className="glass-card rounded-xl p-6">
            <div className="text-center mb-6">
              <div 
                className="w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ 
                  background: `conic-gradient(${accelerationData.mmi.color} ${Math.min(100, accelerationData.pga)}%, transparent 0)`,
                  boxShadow: `0 0 40px ${accelerationData.mmi.color}40`
                }}
              >
                <div className="w-28 h-28 rounded-full bg-background flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold font-mono text-foreground">
                    {accelerationData.pga.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">cm/s²</span>
                </div>
              </div>
              <p className="text-lg font-semibold" style={{ color: accelerationData.mmi.color }}>
                {accelerationData.mmi.label}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                at {selectedDistance} km distance
              </p>
            </div>

            {/* Distance Selector */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">Distance from epicenter</p>
              <div className="flex gap-2">
                {[10, 30, 50, 100].map(dist => (
                  <button
                    key={dist}
                    onClick={() => setSelectedDistance(dist)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm transition-all ${
                      selectedDistance === dist 
                        ? "bg-primary/20 text-primary" 
                        : "bg-background/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {dist} km
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold font-mono text-primary">{accelerationData.pgv.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">PGV (cm/s)</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold font-mono" style={{ color: accelerationData.mmi.color }}>
                  {accelerationData.mmi.value}
                </p>
                <p className="text-xs text-muted-foreground">MMI Scale</p>
              </div>
            </div>
          </div>

          {/* Response Spectrum */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              Response Spectrum
            </h3>
            
            <canvas 
              ref={canvasRef} 
              width={400} 
              height={250} 
              className="w-full h-[250px] rounded-lg"
            />
            
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-center bg-background/50 rounded-lg p-2">
                <p className="text-sm font-bold font-mono text-seismic-moderate">
                  {accelerationData.spectral.find(s => s.period === 0.2)?.sa.toFixed(1) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Sa(0.2s)</p>
              </div>
              <div className="text-center bg-background/50 rounded-lg p-2">
                <p className="text-sm font-bold font-mono text-seismic-high">
                  {accelerationData.spectral.find(s => s.period === 1.0)?.sa.toFixed(1) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Sa(1.0s)</p>
              </div>
              <div className="text-center bg-background/50 rounded-lg p-2">
                <p className="text-sm font-bold font-mono text-blue-400">
                  {accelerationData.spectral.find(s => s.period === 2.0)?.sa.toFixed(1) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Sa(2.0s)</p>
              </div>
            </div>
          </div>

          {/* Regional PGA Analysis */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              Regional Ground Motion
            </h3>
            
            <div className="space-y-4">
              {regionalAnalysis.map(([region, data], index) => {
                const mmi = getMMI(data.maxPGA);
                return (
                  <div key={region} className="bg-background/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                        <span className="font-medium text-foreground text-sm">{region}</span>
                      </div>
                      <Badge style={{ backgroundColor: `${mmi.color}30`, color: mmi.color }}>
                        MMI {mmi.value}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <p className="font-mono font-bold text-foreground">{data.maxPGA.toFixed(1)}</p>
                        <p className="text-muted-foreground">Max PGA</p>
                      </div>
                      <div>
                        <p className="font-mono font-bold text-foreground">{data.events}</p>
                        <p className="text-muted-foreground">Events</p>
                      </div>
                      <div>
                        <p className="font-mono font-bold text-foreground">M{data.avgMag.toFixed(1)}</p>
                        <p className="text-muted-foreground">Avg Mag</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MMI Scale Reference */}
        <div className="mt-8 glass-card rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Modified Mercalli Intensity Scale
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
            {[
              { level: "I", pga: "<0.17", desc: "Not felt" },
              { level: "II", pga: "0.17-1.4", desc: "Weak" },
              { level: "III", pga: "1.4-3.9", desc: "Weak" },
              { level: "IV", pga: "3.9-9.2", desc: "Light" },
              { level: "V", pga: "9.2-18", desc: "Moderate" },
              { level: "VI", pga: "18-34", desc: "Strong" },
              { level: "VII", pga: "34-65", desc: "V. Strong" },
              { level: "VIII", pga: "65-124", desc: "Severe" },
              { level: "IX", pga: "124-239", desc: "Violent" },
              { level: "X", pga: ">239", desc: "Extreme" },
            ].map((item, i) => (
              <div 
                key={item.level} 
                className="text-center p-2 rounded-lg"
                style={{ 
                  backgroundColor: getMMI(i === 0 ? 0 : parseFloat(item.pga.split("-")[0]) + 0.1).color + "20",
                  borderLeft: `3px solid ${getMMI(i === 0 ? 0 : parseFloat(item.pga.split("-")[0]) + 0.1).color}`
                }}
              >
                <p className="font-bold text-foreground">{item.level}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GroundAccelerationChart;
