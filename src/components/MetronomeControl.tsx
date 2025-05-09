
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Play, Pause } from "lucide-react";
import MetronomePendulum from './MetronomePendulum';
import TapTempo from './TapTempo';
import MetronomeStats from './MetronomeStats';
import VolumeControl from './VolumeControl';
import SoundSelector from './SoundSelector';
import { useMetronomeAudio } from '@/hooks/useMetronomeAudio';
import { useMetronomeTempo } from '@/hooks/useMetronomeTempo';
import { useMetronomeSession } from '@/hooks/useMetronomeSession';

const MetronomeControl: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Use our custom hooks
  const {
    bpm,
    bpmInput,
    handleBpmChange,
    handleBpmInputChange,
    handleBpmInputBlur,
    handleBpmInputKeyPress,
    updateBpmFromTap
  } = useMetronomeTempo();
  
  const {
    currentBeat,
    volume,
    isMuted,
    soundType,
    handleVolumeChange,
    toggleMute,
    handleSoundTypeChange
  } = useMetronomeAudio({ bpm, isPlaying });
  
  // Track session stats
  useMetronomeSession({ isPlaying });
  
  // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <div className="w-full flex justify-end mb-2">
        <MetronomeStats />
      </div>
      
      <div className="w-full h-72 flex items-center justify-center mb-6">
        <MetronomePendulum isPlaying={isPlaying} bpm={bpm} currentBeat={currentBeat} />
      </div>
      
      <div className="w-full mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Slider
            value={[bpm]}
            min={30}
            max={250}
            step={1}
            onValueChange={handleBpmChange}
            className="flex-1"
          />
          <Input
            type="text"
            value={bpmInput}
            onChange={handleBpmInputChange}
            onBlur={handleBpmInputBlur}
            onKeyDown={handleBpmInputKeyPress}
            className="w-20 text-center"
            aria-label="BPM value"
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground mt-1">
          <span>30</span>
          <span>Tempo</span>
          <span>250</span>
        </div>
      </div>
      
      <div className="flex gap-4 mb-6">
        <Button
          size="lg"
          className="w-24 h-24 rounded-full bg-metro-purple hover:bg-metro-light-purple"
          onClick={togglePlayPause}
        >
          {isPlaying ? <Pause size={32} /> : <Play size={32} />}
        </Button>
        
        <TapTempo updateBpm={updateBpmFromTap} />
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
        <SoundSelector 
          currentSound={soundType}
          onSoundChange={handleSoundTypeChange}
        />
        
        <VolumeControl 
          volume={volume} 
          isMuted={isMuted}
          onVolumeChange={handleVolumeChange}
          onToggleMute={toggleMute} 
        />
      </div>
      
      {/* Hidden audio element for iOS background playback */}
      <audio id="metronome-audio" preload="auto" style={{ display: 'none' }} />
    </div>
  );
};

export default MetronomeControl;
