import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";

interface TapTempoProps {
  updateBpm: (bpm: number) => void;
}

const TapTempo: React.FC<TapTempoProps> = ({ updateBpm }) => {
  const [taps, setTaps] = useState<number[]>([]);
  const [tapCount, setTapCount] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  // Reset taps if user stops tapping for 2 seconds
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleTap = () => {
    const now = Date.now();
    
    // Reset if this is first tap or it's been more than 2 seconds
    if (taps.length === 0 || now - taps[taps.length - 1] > 2000) {
      setTaps([now]);
      setTapCount(1);
      return;
    }
    
    // Add tap to history
    const newTaps = [...taps, now];
    
    // Only keep the last 4 taps for calculation
    if (newTaps.length > 4) {
      newTaps.shift();
    }
    
    setTaps(newTaps);
    setTapCount(tapCount + 1);
    
    // Calculate BPM if we have at least 2 taps
    if (newTaps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      
      // Calculate average interval
      const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      
      // Convert to BPM
      const bpm = Math.round(60000 / averageInterval);
      
      // Clamp BPM to valid range and update
      const clampedBpm = Math.min(Math.max(bpm, 30), 250);
      updateBpm(clampedBpm);
    }
    
    // Reset after 2 seconds of inactivity
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      setTaps([]);
      setTapCount(0);
    }, 2000);
  };

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-24 h-24 rounded-full border-2 border-metro-purple text-metro-purple hover:bg-metro-purple/10"
      onClick={handleTap}
    >
      TAP
    </Button>
  );
};

export default TapTempo;
