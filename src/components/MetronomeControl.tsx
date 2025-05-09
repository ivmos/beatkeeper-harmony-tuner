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
import { useAudioContext } from '@/hooks/useAudioContext';
import { useAudioVolume } from '@/hooks/useAudioVolume';
import { useSoundType } from '@/hooks/useSoundType';
import { useMetronomeTempo } from '@/hooks/useMetronomeTempo';
import { useMetronomeSession } from '@/hooks/useMetronomeSession';

const MetronomeControl: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  
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
  
  // Audio context management
  const {
    audioContext,
    gainNodeRef,
    audioElementRef,
    sourceNodeRef,
    ensureAudioContext
  } = useAudioContext();
  
  // Volume control
  const {
    volume,
    isMuted,
    handleVolumeChange,
    toggleMute
  } = useAudioVolume(gainNodeRef);
  
  // Sound type selection
  const {
    soundType,
    handleSoundTypeChange
  } = useSoundType(audioElementRef);
  
  // Track session stats
  useMetronomeSession({ isPlaying });
  
  // Schedule the next beat
  const intervalRef = React.useRef<number | null>(null);
  
  // Schedule a beat sound
  const scheduleNote = React.useCallback(() => {
    if (audioElementRef.current && gainNodeRef.current) {
      // Play the audio element
      audioElementRef.current.currentTime = 0;
      
      // This promise-based approach handles autoplay restrictions better
      const playPromise = audioElementRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Error playing audio:", err);
        });
      }
      
      // Update beat counter
      setCurrentBeat((prevBeat) => (prevBeat + 1) % 4);
    }
  }, [audioElementRef, gainNodeRef]);

  // Start metronome loop
  const startMetronome = React.useCallback(() => {
    // Try to initialize audio context
    if (!ensureAudioContext()) {
      return;
    }
    
    // Clear any existing interval
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    
    // Calculate interval time in milliseconds
    const intervalTime = (60.0 / bpm) * 1000;
    
    // Start scheduler with precise timing
    intervalRef.current = window.setInterval(scheduleNote, intervalTime);
    
    // Trigger first beat immediately
    scheduleNote();
  }, [bpm, ensureAudioContext, scheduleNote]);

  // Stop metronome
  const stopMetronome = React.useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCurrentBeat(0);
  }, []);

  // Update the metronome when isPlaying changes
  React.useEffect(() => {
    if (isPlaying) {
      startMetronome();
    } else {
      stopMetronome();
    }
    
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, bpm, startMetronome, stopMetronome]);
  
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
