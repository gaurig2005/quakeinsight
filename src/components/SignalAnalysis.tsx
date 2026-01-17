import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Activity, BarChart2, Radio, Waves, Filter, Cpu, 
  Layers, Target, Clock, ArrowUpDown, Zap
} from "lucide-react";
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

interface SignalAnalysisProps {
  earthquakes: (Earthquake & { isHistorical?: boolean })[];
}

// Generate frequency spectrum from waveform (simplified FFT simulation)
const generateSpectrum = (magnitude: number, depth: number): { frequency: number; amplitude: number }[] => {
  const spectrum: { frequency: number; amplitude: number }[] = [];
  const peakFreq = Math.max(0.5, 3 - magnitude * 0.4);
  
  for (let f = 0.1; f <= 20; f += 0.5) {
    // Simulate typical earthquake frequency distribution
    const distance = Math.abs(f - peakFreq);
    const amplitude = Math.exp(-distance * 0.5) * (magnitude / 8) + Math.random() * 0.05;
    spectrum.push({ frequency: f, amplitude: Math.min(1, amplitude) });
  }
  
  return spectrum;
};

// Calculate dominant frequency
const getDominantFrequency = (spectrum: { frequency: number; amplitude: number }[]): number => {
  let maxAmplitude = 0;
  let dominantFreq = 0;
  spectrum.forEach(s => {
    if (s.amplitude > maxAmplitude) {
      maxAmplitude = s.amplitude;
      dominantFreq = s.frequency;
    }
  });
  return dominantFreq;
};

// Classify wave type based on characteristics
const classifyWaveType = (magnitude: number, depth: number): string => {
  if (depth > 100) return "Deep Focus";
  if (depth > 40) return "Intermediate";
  if (magnitude > 5) return "Surface Wave Dominant";
  return "Body Wave Dominant";
};

// Calculate corner frequency
const calculateCornerFrequency = (magnitude: number): number => {
  // fc ≈ 0.49 * (stress drop / M0)^(1/3) - simplified
  return Math.pow(10, 6.73 - magnitude) / 10;
};

const SignalAnalysis = ({ earthquakes }: SignalAnalysisProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<"spectrum" | "time" | "filtered">("spectrum");
  
  const recentQuakes = earthquakes.filter(e => !e.isHistorical).slice(0, 5);
  const latestQuake = recentQuakes[0];
  
  const spectrum = useMemo(() => {
    if (!latestQuake) return [];
    return generateSpectrum(latestQuake.magnitude, latestQuake.depth);
  }, [latestQuake]);
  
  const dominantFreq = useMemo(() => getDominantFrequency(spectrum), [spectrum]);
  const waveType = useMemo(() => {
    if (!latestQuake) return "N/A";
    return classifyWaveType(latestQuake.magnitude, latestQuake.depth);
  }, [latestQuake]);
  const cornerFreq = useMemo(() => {
    if (!latestQuake) return 0;
    return calculateCornerFrequency(latestQuake.magnitude);
  }, [latestQuake]);
  
  // Draw spectrum visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || spectrum.length === 0) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    
    // Background grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo((width / 10) * i, 0);
      ctx.lineTo((width / 10) * i, height);
      ctx.stroke();
    }
    for (let i = 0; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (height / 5) * i);
      ctx.lineTo(width, (height / 5) * i);
      ctx.stroke();
    }
    
    // Draw spectrum bars
    const barWidth = width / spectrum.length - 2;
    spectrum.forEach((s, i) => {
      const x = (width / spectrum.length) * i;
      const barHeight = s.amplitude * height * 0.9;
      
      // Gradient color based on frequency
      const hue = 200 - (s.frequency / 20) * 150; // Blue to red
      ctx.fillStyle = `hsla(${hue}, 80%, 50%, 0.8)`;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      
      // Glow effect for high amplitudes
      if (s.amplitude > 0.5) {
        ctx.shadowColor = `hsla(${hue}, 80%, 50%, 0.5)`;
        ctx.shadowBlur = 10;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        ctx.shadowBlur = 0;
      }
    });
    
    // Draw dominant frequency marker
    const domFreqX = (dominantFreq / 20) * width;
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(domFreqX, 0);
    ctx.lineTo(domFreqX, height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Label
    ctx.fillStyle = "#22c55e";
    ctx.font = "10px monospace";
    ctx.fillText(`${dominantFreq.toFixed(1)} Hz`, domFreqX + 5, 15);
  }, [spectrum, dominantFreq]);

  // Signal quality metrics
  const signalMetrics = useMemo(() => {
    const avgMag = recentQuakes.reduce((a, b) => a + b.magnitude, 0) / (recentQuakes.length || 1);
    const avgDepth = recentQuakes.reduce((a, b) => a + b.depth, 0) / (recentQuakes.length || 1);
    
    return {
      signalQuality: Math.min(100, 60 + avgMag * 5),
      dataCompleteness: 85 + Math.random() * 10,
      processingLatency: 0.5 + Math.random() * 0.5,
      noiseFloor: -120 + avgDepth * 0.2,
      dynamicRange: 80 + avgMag * 2,
    };
  }, [recentQuakes]);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Filter className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Signal Analysis</h2>
            <p className="text-muted-foreground text-sm">
              Frequency spectrum • Wave classification • Signal processing
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Frequency Spectrum */}
          <div className="lg:col-span-2 glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary" />
                Frequency Spectrum
              </h3>
              <div className="flex gap-2">
                {(["spectrum", "time", "filtered"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-xs rounded-lg transition-all ${
                      activeTab === tab 
                        ? "bg-primary/20 text-primary" 
                        : "bg-background/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={200} 
              className="w-full h-[200px] rounded-lg bg-background/50"
            />
            
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <p className="text-xl font-bold font-mono text-primary">{dominantFreq.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Dom. Freq (Hz)</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold font-mono text-seismic-moderate">{cornerFreq.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Corner Freq (Hz)</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold font-mono text-blue-400">{waveType.split(" ")[0]}</p>
                <p className="text-xs text-muted-foreground">Wave Type</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold font-mono text-purple-400">0.1-20</p>
                <p className="text-xs text-muted-foreground">Band (Hz)</p>
              </div>
            </div>
          </div>

          {/* Signal Quality Metrics */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-primary" />
              Signal Quality
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Signal Quality</span>
                  <span className="font-mono text-primary">{signalMetrics.signalQuality.toFixed(0)}%</span>
                </div>
                <Progress value={signalMetrics.signalQuality} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Data Completeness</span>
                  <span className="font-mono text-green-400">{signalMetrics.dataCompleteness.toFixed(0)}%</span>
                </div>
                <Progress value={signalMetrics.dataCompleteness} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-lg font-bold font-mono text-foreground">{signalMetrics.processingLatency.toFixed(2)}s</p>
                  <p className="text-xs text-muted-foreground">Latency</p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-lg font-bold font-mono text-foreground">{signalMetrics.dynamicRange.toFixed(0)} dB</p>
                  <p className="text-xs text-muted-foreground">Dynamic Range</p>
                </div>
              </div>
              
              <div className="bg-background/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Noise Floor</span>
                </div>
                <p className="text-xl font-bold font-mono text-foreground">
                  {signalMetrics.noiseFloor.toFixed(1)} dB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Type Analysis */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[
            { 
              type: "P-Wave", 
              desc: "Primary (Compressional)", 
              velocity: "5-8 km/s",
              icon: Zap,
              color: "text-blue-400"
            },
            { 
              type: "S-Wave", 
              desc: "Secondary (Shear)", 
              velocity: "3-5 km/s",
              icon: Waves,
              color: "text-green-400"
            },
            { 
              type: "Love Wave", 
              desc: "Surface (Horizontal)", 
              velocity: "2-4 km/s",
              icon: Activity,
              color: "text-yellow-400"
            },
            { 
              type: "Rayleigh Wave", 
              desc: "Surface (Rolling)", 
              velocity: "2-3 km/s",
              icon: Radio,
              color: "text-red-400"
            },
          ].map((wave, i) => (
            <div key={wave.type} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-background/50 ${wave.color}`}>
                  <wave.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{wave.type}</p>
                  <p className="text-xs text-muted-foreground">{wave.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Velocity</span>
                <Badge className="bg-background/50 text-foreground font-mono">
                  {wave.velocity}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SignalAnalysis;
