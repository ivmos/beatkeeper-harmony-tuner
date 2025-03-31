
import React, { useEffect, useRef } from 'react';

interface MetronomePendulumProps {
  isPlaying: boolean;
  bpm: number;
  currentBeat: number;
}

const MetronomePendulum: React.FC<MetronomePendulumProps> = ({ isPlaying, bpm, currentBeat }) => {
  const pendulumRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pendulumRef.current) return;
    
    const pendulum = pendulumRef.current;
    
    if (isPlaying) {
      // Calculate duration from BPM (one complete swing takes two beats)
      const durationInSeconds = (60 / bpm) * 2;
      
      // Reset any existing animation
      pendulum.style.animation = 'none';
      
      // Force a reflow (repaint) to ensure the animation restarts properly
      void pendulum.offsetWidth;
      
      // Apply animation with dynamic duration
      pendulum.style.animation = `pendulum-swing-right ${durationInSeconds}s ease-in-out infinite`;
    } else {
      // Stop animation when not playing
      pendulum.style.animation = 'none';
      pendulum.style.transform = 'rotate(0deg)';
    }
  }, [isPlaying, bpm]);

  return (
    <div className="w-full h-full flex justify-center items-start">
      <div className="relative w-6 h-full">
        {/* Pendulum arm */}
        <div 
          ref={pendulumRef}
          className="pendulum-arm absolute top-0 left-1/2 w-1 h-56 bg-gradient-to-b from-metro-purple to-metro-light-purple rounded-full"
          style={{ transformOrigin: 'top center', transform: 'translateX(-50%)' }}
        >
          {/* Pendulum weight */}
          <div className="absolute bottom-0 left-1/2 w-12 h-12 rounded-full bg-metro-purple transform -translate-x-1/2 flex items-center justify-center shadow-lg">
            <div className="w-6 h-6 rounded-full bg-white opacity-30"></div>
          </div>
        </div>
        
        {/* Center pin */}
        <div className="absolute top-0 left-1/2 w-6 h-6 bg-metro-light-purple rounded-full transform -translate-x-1/2 z-10 shadow-md"></div>
      </div>
    </div>
  );
};

export default MetronomePendulum;
