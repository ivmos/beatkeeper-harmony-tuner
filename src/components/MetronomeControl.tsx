
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MetronomePendulum from './MetronomePendulum';
import TapTempo from './TapTempo';
import MetronomeStats from './MetronomeStats';
import VolumeControl from './VolumeControl';
import SoundSelector from './SoundSelector';
import { startSession, endCurrentSession } from '@/utils/statsUtils';

// Keys for localStorage
const STORAGE_KEY_BPM = 'metronome-bpm';
const STORAGE_KEY_VOLUME = 'metronome-volume';
const STORAGE_KEY_SOUND = 'metronome-sound';

// Audio file for click sound
const CLICK_SOUNDS = {
  sine: "/sounds/sine-click.mp3",
  square: "/sounds/square-click.mp3",
  sawtooth: "/sounds/sawtooth-click.mp3",
  triangle: "/sounds/triangle-click.mp3",
};

const MetronomeControl: React.FC = () => {
  // Initialize state with values from localStorage or defaults
  const [bpm, setBpm] = useState(() => {
    const savedBpm = localStorage.getItem(STORAGE_KEY_BPM);
    return savedBpm ? parseInt(savedBpm) : 100;
  });
  const [bpmInput, setBpmInput] = useState(() => {
    const savedBpm = localStorage.getItem(STORAGE_KEY_BPM);
    return savedBpm || "100";
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);
    return savedVolume ? parseFloat(savedVolume) : 0.5;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [soundType, setSoundType] = useState(() => {
    const savedSound = localStorage.getItem(STORAGE_KEY_SOUND);
    return savedSound || 'sine';
  });
  const intervalRef = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const { toast } = useToast();

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BPM, bpm.toString());
  }, [bpm]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VOLUME, volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SOUND, soundType);
  }, [soundType]);

  // Track session stats when the component mounts/unmounts
  useEffect(() => {
    // Setup audio element for iOS background playback
    audioElementRef.current = new Audio();
    audioElementRef.current.src = CLICK_SOUNDS[soundType as keyof typeof CLICK_SOUNDS] || CLICK_SOUNDS.sine;
    audioElementRef.current.loop = false;
    audioElementRef.current.preload = "auto";
    
    // This is crucial for iOS background audio
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
    
    // Cleanup function runs when component unmounts
    return () => {
      if (isPlaying) {
        endCurrentSession();
      }
      stopMetronome();
      
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  // Update audio element source when sound type changes
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.src = CLICK_SOUNDS[soundType as keyof typeof CLICK_SOUNDS] || CLICK_SOUNDS.sine;
    }
  }, [soundType]);

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
      // Create audio context
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Connect audio element to the audio context for iOS background playback
      if (audioElementRef.current && !sourceNodeRef.current) {
        sourceNodeRef.current = audioContext.current.createMediaElementSource(audioElementRef.current);
        
        // Create gain node
        gainNodeRef.current = audioContext.current.createGain();
        gainNodeRef.current.gain.value = isMuted ? 0 : volume;
        
        // Connect the source to the gain node and then to the destination
        sourceNodeRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContext.current.destination);
      }
    }
    
    // Resume audio context if suspended (needed for iOS)
    if (audioContext.current && audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }
    
    return audioContext.current;
  };

  // Schedule a beat sound
  const scheduleNote = (time: number) => {
    if (audioElementRef.current) {
      const currTime = audioContext.current?.currentTime || 0;
      
      // Play the audio element
      audioElementRef.current.currentTime = 0;
      audioElementRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
        
        // Try to handle browser autoplay policy
        if (err.name === 'NotAllowedError') {
          toast({
            title: "Audio Playback Blocked",
            description: "Please interact with the page to enable sound",
            variant: "destructive",
          });
        }
      });
      
      // Update beat counter
      setCurrentBeat((prevBeat) => (prevBeat + 1) % 4);
    }
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

  // Handle BPM change from slider
  const handleBpmChange = (value: number[]) => {
    const newBpm = value[0];
    setBpm(newBpm);
    setBpmInput(newBpm.toString()); // Update input field when slider changes
    
    // If playing, restart to apply new tempo
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
  };

  // Handle direct BPM input from keyboard
  const handleBpmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setBpmInput(inputValue); // Always update input field
    
    const newBpm = parseInt(inputValue);
    if (!isNaN(newBpm) && newBpm >= 30 && newBpm <= 250) {
      setBpm(newBpm);
      
      // If playing, restart to apply new tempo
      if (isPlaying) {
        stopMetronome();
        startMetronome();
      }
    }
  };

  // Handle blur event for the input field
  const handleBpmInputBlur = () => {
    // Revert to valid BPM if input is invalid
    if (bpmInput === '' || isNaN(parseInt(bpmInput)) || parseInt(bpmInput) < 30 || parseInt(bpmInput) > 250) {
      setBpmInput(bpm.toString());
      toast({
        title: "Invalid BPM",
        description: "BPM must be between 30 and 250",
        variant: "destructive",
      });
    }
  };

  // Handle key press for the input field
  const handleBpmInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newBpm = parseInt(bpmInput);
      if (!isNaN(newBpm) && newBpm >= 30 && newBpm <= 250) {
        setBpm(newBpm);
        
        // If playing, restart to apply new tempo
        if (isPlaying) {
          stopMetronome();
          startMetronome();
        }
      } else {
        setBpmInput(bpm.toString());
        toast({
          title: "Invalid BPM",
          description: "BPM must be between 30 and 250",
          variant: "destructive",
        });
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
    setBpmInput(newBpm.toString()); // Update input field when tap tempo changes
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
