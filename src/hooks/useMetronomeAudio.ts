
import { useState, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

// Keys for localStorage
const STORAGE_KEY_VOLUME = 'metronome-volume';
const STORAGE_KEY_SOUND = 'metronome-sound';

// Audio file for click sound
const CLICK_SOUNDS = {
  sine: "/sounds/sine-click.mp3",
  square: "/sounds/square-click.mp3",
  sawtooth: "/sounds/sawtooth-click.mp3",
  triangle: "/sounds/triangle-click.mp3",
};

export type SoundType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export interface UseMetronomeAudioProps {
  bpm: number;
  isPlaying: boolean;
}

export const useMetronomeAudio = ({ bpm, isPlaying }: UseMetronomeAudioProps) => {
  // Initialize state with values from localStorage or defaults
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);
    return savedVolume ? parseFloat(savedVolume) : 0.5;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [soundType, setSoundType] = useState<SoundType>(() => {
    const savedSound = localStorage.getItem(STORAGE_KEY_SOUND);
    return (savedSound as SoundType) || 'sine';
  });
  const [currentBeat, setCurrentBeat] = useState(0);
  
  const intervalRef = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const { toast } = useToast();

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VOLUME, volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SOUND, soundType);
  }, [soundType]);

  // Setup audio element for iOS background playback
  useEffect(() => {
    audioElementRef.current = new Audio();
    audioElementRef.current.src = CLICK_SOUNDS[soundType as keyof typeof CLICK_SOUNDS] || CLICK_SOUNDS.sine;
    audioElementRef.current.loop = false;
    audioElementRef.current.preload = "auto";
    
    // This is crucial for iOS background audio
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
    
    return () => {
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
  };

  // Stop metronome
  const stopMetronome = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCurrentBeat(0);
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

  // Handle sound type change
  const handleSoundTypeChange = (value: string) => {
    setSoundType(value as SoundType);
    toast({
      title: "Sound Changed",
      description: `Sound type set to ${value}`,
    });
  };

  // Update the metronome when isPlaying changes
  useEffect(() => {
    if (isPlaying) {
      startMetronome();
    } else {
      stopMetronome();
    }
  }, [isPlaying, bpm]);

  return {
    currentBeat,
    volume,
    isMuted,
    soundType,
    handleVolumeChange,
    toggleMute,
    handleSoundTypeChange
  };
};
