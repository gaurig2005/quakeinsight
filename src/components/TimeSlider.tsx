import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface TimeSliderProps {
  minYear: number;
  maxYear: number;
  currentYear: number;
  onYearChange: (year: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
}

const TimeSlider = ({
  minYear,
  maxYear,
  currentYear,
  onYearChange,
  isPlaying,
  onPlayToggle,
}: TimeSliderProps) => {
  return (
    <div className="glass-card rounded-lg p-3 flex items-center gap-3">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onYearChange(minYear)}
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onPlayToggle}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onYearChange(maxYear)}
        >
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1">
        <Slider
          min={minYear}
          max={maxYear}
          step={1}
          value={[currentYear]}
          onValueChange={(v) => onYearChange(v[0])}
        />
      </div>
      <span className="text-sm font-mono text-primary min-w-[4ch] text-right">
        {currentYear}
      </span>
    </div>
  );
};

export default TimeSlider;
