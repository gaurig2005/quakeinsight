import { useEffect, useRef, useState, useMemo } from "react";
import { Activity, Waves, Zap, TrendingUp, Volume2, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface WaveformProps {
  magnitude: number;
  depth: number;
  time: string;
  location: string;
  isLive?: boolean;
}

// Generate synthetic seismic waveform based on earthquake parameters
const generateWaveform = (magnitude: number, depth: number, sampleCount: number = 200): number[] => {
  const waveform: number[] = [];
  const frequency = Math.max(0.5, 3 - magnitude * 0.3); // Lower frequency for larger quakes
  const amplitude = Math.min(1, magnitude / 8); // Normalized amplitude
  const decay = 0.02 + (depth / 100) * 0.03; // Deeper = faster decay
  
  // P-wave arrival (primary wave)
  const pWaveStart = Math.floor(sampleCount * 0.1);
  const pWaveEnd = Math.floor(sampleCount * 0.3);
  
  // S-wave arrival (secondary wave, stronger)
  const sWaveStart = Math.floor(sampleCount * 0.35);
  const sWaveEnd = Math.floor(sampleCount * 0.7);
  
  // Surface waves (longest period)
  const surfaceWaveStart = Math.floor(sampleCount * 0.6);
  
  for (let i = 0; i < sampleCount; i++) {
    let value = 0;
    
    // Background noise
    value += (Math.random() - 0.5) * 0.05;
    
    // P-wave
    if (i >= pWaveStart && i < pWaveEnd) {
      const progress = (i - pWaveStart) / (pWaveEnd - pWaveStart);
      const envelope = Math.sin(progress * Math.PI);
      value += Math.sin(i * frequency * 0.8) * amplitude * 0.4 * envelope * Math.exp(-decay * (i - pWaveStart));
    }
    
    // S-wave (stronger, slower)
    if (i >= sWaveStart && i < sWaveEnd) {
      const progress = (i - sWaveStart) / (sWaveEnd - sWaveStart);
      const envelope = Math.sin(progress * Math.PI);
      value += Math.sin(i * frequency * 0.5) * amplitude * 0.9 * envelope * Math.exp(-decay * 0.5 * (i - sWaveStart));
    }
    
    // Surface waves
    if (i >= surfaceWaveStart) {
      const progress = (i - surfaceWaveStart) / (sampleCount - surfaceWaveStart);
      value += Math.sin(i * frequency * 0.2) * amplitude * 0.6 * Math.exp(-decay * 0.3 * (i - surfaceWaveStart));
    }
    
    waveform.push(Math.max(-1, Math.min(1, value)));
  }
  
  return waveform;
};

// Calculate ground acceleration (PGA) in cm/s²
const calculatePGA = (magnitude: number, depth: number, distance: number = 50): number => {
  // Simplified attenuation model based on magnitude and depth
  const logPGA = 0.72 * magnitude - 0.0039 * distance - Math.log10(Math.sqrt(distance * distance + depth * depth)) + 1.0;
  return Math.pow(10, logPGA);
};

// Calculate signal-to-noise ratio
const calculateSNR = (waveform: number[]): number => {
  const signal = waveform.slice(Math.floor(waveform.length * 0.2), Math.floor(waveform.length * 0.7));
  const noise = waveform.slice(0, Math.floor(waveform.length * 0.1));
  
  const signalPower = signal.reduce((sum, v) => sum + v * v, 0) / signal.length;
  const noisePower = noise.reduce((sum, v) => sum + v * v, 0) / noise.length || 0.001;
  
  return 10 * Math.log10(signalPower / noisePower);
};

export const SeismicWaveform = ({ magnitude, depth, time, location, isLive }: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [offset, setOffset] = useState(0);
  
  const waveform = useMemo(() => generateWaveform(magnitude, depth), [magnitude, depth]);
  const pga = useMemo(() => calculatePGA(magnitude, depth), [magnitude, depth]);
  const snr = useMemo(() => calculateSNR(waveform), [waveform]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      
      // Grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      for (let y = 0; y <= 4; y++) {
        ctx.beginPath();
        ctx.moveTo(0, (height / 4) * y);
        ctx.lineTo(width, (height / 4) * y);
        ctx.stroke();
      }
      
      // Waveform
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#22c55e");
      gradient.addColorStop(0.3, "#f59e0b");
      gradient.addColorStop(0.6, "#ef4444");
      gradient.addColorStop(1, "#22c55e");
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const step = width / waveform.length;
      const centerY = height / 2;
      const scale = height * 0.4;
      
      waveform.forEach((value, i) => {
        const x = i * step;
        const animatedValue = isLive 
          ? value + Math.sin((i + offset) * 0.1) * 0.02 
          : value;
        const y = centerY - animatedValue * scale;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      
      ctx.stroke();
      
      // Glow effect
      ctx.strokeStyle = "rgba(34, 197, 94, 0.3)";
      ctx.lineWidth = 6;
      ctx.stroke();
      
      if (isLive) {
        setOffset(prev => prev + 1);
        animationRef.current = requestAnimationFrame(draw);
      }
    };
    
    draw();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [waveform, isLive, offset]);
  
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-foreground">Seismic Waveform</h4>
          {isLive && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Radio className="w-3 h-3 mr-1 animate-pulse" />
              LIVE
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{location}</span>
      </div>
      
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={120} 
        className="w-full h-[120px] rounded-lg bg-background/50"
      />
      
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-primary mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-lg font-bold font-mono">{pga.toFixed(1)}</span>
          </div>
          <p className="text-xs text-muted-foreground">PGA (cm/s²)</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-seismic-moderate mb-1">
            <Volume2 className="w-4 h-4" />
            <span className="text-lg font-bold font-mono">{snr.toFixed(1)}</span>
          </div>
          <p className="text-xs text-muted-foreground">SNR (dB)</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-seismic-high mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-lg font-bold font-mono">M{magnitude.toFixed(1)}</span>
          </div>
          <p className="text-xs text-muted-foreground">Magnitude</p>
        </div>
      </div>
    </div>
  );
};

export default SeismicWaveform;
