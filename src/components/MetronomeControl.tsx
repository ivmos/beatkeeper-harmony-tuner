
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MetronomePendulum from './MetronomePendulum';
import TapTempo from './TapTempo';
import MetronomeStats from './MetronomeStats';
import VolumeControl from './VolumeControl';
import SoundSelector from './SoundSelector';
import { startSession, endCurrentSession } from '@/utils/statsUtils';

const MetronomeControl: React.FC = () => {
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.5); // Default volume at 50%
  const [isMuted, setIsMuted] = useState(false);
  const [soundType, setSoundType] = useState('sine'); // Default sound type
  const intervalRef = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const { toast } = useToast();

  // Track session stats when the component mounts/unmounts
  useEffect(() => {
    // Cleanup function runs when component unmounts
    return () => {
      if (isPlaying) {
        endCurrentSession();
      }
    };
  }, []);

  // Monitor isPlaying state for stats tracking
  useEffect(() => {
    if (isPlaying) {
      startSession();
    } else {
      endCurrentSession();
    }
  }, [isPlaying]);

  // Effect to update gain node when volume or mute state changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Initialize audio context on first user interaction
  const initAudio = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a main gain node that will control the volume
      gainNodeRef.current = audioContext.current.createGain();
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
      gainNodeRef.current.connect(audioContext.current.destination);
    }
    return audioContext.current;
  };

  // Schedule a beat sound
  const scheduleNote = (time: number) => {
    const context = audioContext.current;
    if (!context || !gainNodeRef.current) return;
    
    const oscillator = context.createOscillator();
    const noteGain = context.createGain();
    
    // Connect oscillator to the note's gain node
    oscillator.connect(noteGain);
    
    // Connect the note's gain node to the main gain node
    noteGain.connect(gainNodeRef.current);
    
    // Set the oscillator type based on user selection
    oscillator.type = soundType as OscillatorType;
    
    // Use different frequencies for accented beats
    oscillator.frequency.value = currentBeat === 0 ? 1000 : 800;
    
    // This gain node controls the envelope of the individual note
    noteGain.gain.value = 1;
    noteGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    
    oscillator.start(time);
    oscillator.stop(time + 0.05);
    
    // Update beat counter
    setCurrentBeat((prevBeat) => (prevBeat + 1) % 4);
  };

  // Calculate note timing and schedule
  const scheduler = () => {
    const context = audioContext.current;
    if (!context) return;
    
    const secondsPerBeat = 60.0 / bpm;
    
    while (nextNoteTimeRef.current < context.currentTime + 0.1) {
      scheduleNote(nextNoteTimeRef.current);
      nextNoteTimeRef.current += secondsPerBeat;
    }
  };

  // Start metronome loop
  const startMetronome = () => {
    const context = initAudio();
    nextNoteTimeRef.current = context.currentTime;
    
    // Clear any existing interval
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    
    // Start scheduler
    intervalRef.current = window.setInterval(scheduler, 25);
    setIsPlaying(true);
  };

  // Stop metronome
  const stopMetronome = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  // Handle BPM change
  const handleBpmChange = (value: number[]) => {
    const newBpm = value[0];
    setBpm(newBpm);
    
    // If playing, restart to apply new tempo
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
  };

  // Handle direct BPM input
  const handleBpmInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(e.target.value);
    if (!isNaN(newBpm) && newBpm >= 30 && newBpm <= 250) {
      setBpm(newBpm);
      
      // If playing, restart to apply new tempo
      if (isPlaying) {
        stopMetronome();
        startMetronome();
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (isMuted && value > 0) {
      setIsMuted(false);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Update BPM from tap tempo component
  const updateBpmFromTap = (newBpm: number) => {
    setBpm(newBpm);
    toast({
      title: "Tempo Updated",
      description: `BPM set to ${newBpm}`,
    });
    
    // If playing, restart to apply new tempo
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
  };

  // Handle sound type change
  const handleSoundTypeChange = (value: string) => {
    setSoundType(value);
    toast({
      title: "Sound Changed",
      description: `Sound type set to ${value}`,
    });
    
    // If playing, apply the new sound type immediately
    if (isPlaying) {
      // No need to stop and restart the metronome - the next beat
      // will automatically use the new sound type since we're updating state
    }
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
        <Slider
          value={[bpm]}
          min={30}
          max={250}
          step={1}
          onValueChange={handleBpmChange}
          className="w-full"
        />
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
    </div>
  );
};

export default MetronomeControl;
