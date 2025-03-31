
import React from 'react';

interface MetronomePendulumProps {
  isPlaying: boolean;
  bpm: number;
  currentBeat: number;
}

const MetronomePendulum: React.FC<MetronomePendulumProps> = ({ isPlaying, bpm, currentBeat }) => {
  // Calculate animation duration from BPM
  const beatDuration = 60 / bpm;
  
  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Beat indicator circle */}
        <div 
          className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-100
            ${isPlaying && currentBeat === 0 ? 'bg-metro-purple scale-110' : 'bg-metro-dark-blue border-2 border-metro-purple'}
          `}
        >
          <div 
            className={`w-32 h-32 rounded-full flex items-center justify-center 
              ${isPlaying && currentBeat === 0 ? 'bg-metro-light-purple' : 'bg-metro-dark-blue border border-metro-light-purple'}
            `}
          >
            <div 
              className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold
                ${isPlaying ? 'text-white' : 'text-muted-foreground'}
              `}
            >
              {Math.round(bpm)}
            </div>
          </div>
        </div>
        
        {/* Beat indicators positioned precisely on circle */}
        <div className="absolute w-full h-full pointer-events-none">
          {[0, 1, 2, 3].map((beat) => {
            // Calculate position based on circle geometry
            const angle = (beat * Math.PI / 2) - (Math.PI / 2); // Start from top, go clockwise
            const radius = 23; // Distance from center of container to dot center
            const xPos = Math.cos(angle) * radius;
            const yPos = Math.sin(angle) * radius;
            
            return (
              <div 
                key={beat}
                className={`absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2
                  ${isPlaying && currentBeat === beat ? 'bg-metro-purple animate-beat-pulse' : 'bg-muted'}
                `}
                style={{ 
                  left: `calc(50% + ${xPos}px)`,
                  top: `calc(50% + ${yPos}px)`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MetronomePendulum;
