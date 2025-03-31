
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
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Beat indicator circle */}
        <div 
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-100
            ${isPlaying && currentBeat === 0 ? 'bg-metro-purple scale-110' : 'bg-metro-dark-blue border-2 border-metro-purple'}
          `}
        >
          <div 
            className={`w-24 h-24 rounded-full flex items-center justify-center 
              ${isPlaying && currentBeat === 0 ? 'bg-metro-light-purple' : 'bg-metro-dark-blue border border-metro-light-purple'}
            `}
          >
            <div 
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold
                ${isPlaying ? 'text-white' : 'text-muted-foreground'}
              `}
            >
              {Math.round(bpm)}
            </div>
          </div>
        </div>
        
        {/* Beat indicators */}
        <div className="absolute w-full h-full">
          {[0, 1, 2, 3].map((beat) => (
            <div 
              key={beat}
              className={`absolute w-4 h-4 rounded-full 
                ${isPlaying && currentBeat === beat ? 'bg-metro-purple animate-beat-pulse' : 'bg-muted'}
              `}
              style={{ 
                top: beat === 0 ? '-8px' : beat === 2 ? 'calc(100% - 8px)' : '50%',
                left: beat === 3 ? '-8px' : beat === 1 ? 'calc(100% - 8px)' : '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MetronomePendulum;
