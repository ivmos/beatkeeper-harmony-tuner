
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
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const soundsLoadedRef = useRef<Record<SoundType, boolean>>({
    sine: false,
    square: false,
    sawtooth: false,
    triangle: false
  });
  const { toast } = useToast();

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VOLUME, volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SOUND, soundType);
  }, [soundType]);

  // Create audio element for iOS background playback
  useEffect(() => {
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
      audioElementRef.current.loop = false;
      audioElementRef.current.preload = "auto";
      document.body.appendChild(audioElementRef.current);
    }
    
    // Update the audio element source when sound type changes
    if (audioElementRef.current) {
      audioElementRef.current.src = CLICK_SOUNDS[soundType];
      audioElementRef.current.load(); // Important to load the new source
    }
    
    return () => {
      stopMetronome();
      
      if (audioContext.current) {
        audioContext.current.close();
      }
      
      if (audioElementRef.current && audioElementRef.current.parentNode) {
        document.body.removeChild(audioElementRef.current);
      }
    };
  }, [soundType]);
  
  // Initialize audio context on component mount
  useEffect(() => {
    const initAudio = () => {
      if (!audioContext.current) {
        try {
          // Create audio context
          audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          // Create gain node
          gainNodeRef.current = audioContext.current.createGain();
          gainNodeRef.current.gain.value = isMuted ? 0 : volume;
          gainNodeRef.current.connect(audioContext.current.destination);
          
          // Connect audio element to the audio context for iOS background playback
          if (audioElementRef.current) {
            sourceNodeRef.current = audioContext.current.createMediaElementSource(audioElementRef.current);
            sourceNodeRef.current.connect(gainNodeRef.current);
          }
        } catch (error) {
          console.error("Error initializing audio context:", error);
          toast({
            title: "Audio Error",
            description: "Could not initialize audio system",
            variant: "destructive",
          });
        }
      }
    };

    // Initialize audio on first interaction
    const handleFirstInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Effect to update gain node when volume or mute state changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Resume audio context if needed
  const ensureAudioContext = () => {
    if (!audioContext.current) {
      initAudio();
      return false;
    }
    
    if (audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }
    
    return true;
  };

  // Initialize audio context
  const initAudio = () => {
    try {
      if (!audioContext.current) {
        // Create audio context
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create gain node
        gainNodeRef.current = audioContext.current.createGain();
        gainNodeRef.current.gain.value = isMuted ? 0 : volume;
        gainNodeRef.current.connect(audioContext.current.destination);
        
        // Connect audio element to the audio context for iOS background playback
        if (audioElementRef.current) {
          sourceNodeRef.current = audioContext.current.createMediaElementSource(audioElementRef.current);
          sourceNodeRef.current.connect(gainNodeRef.current);
        }
      }
      
      // Resume audio context if suspended (needed for iOS)
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
      
      return true;
    } catch (error) {
      console.error("Error initializing audio context:", error);
      toast({
        title: "Audio Error",
        description: "Could not initialize audio system",
        variant: "destructive",
      });
      return false;
    }
  };

  // Schedule a beat sound
  const scheduleNote = () => {
    if (audioElementRef.current && gainNodeRef.current) {
      // Play the audio element
      audioElementRef.current.currentTime = 0;
      
      // This promise-based approach handles autoplay restrictions better
      const playPromise = audioElementRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Playback started successfully
          })
          .catch(err => {
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
      }
      
      // Update beat counter
      setCurrentBeat((prevBeat) => (prevBeat + 1) % 4);
    }
  };

  // Calculate note timing and schedule
  const scheduler = () => {
    if (!audioContext.current) return;
    
    const secondsPerBeat = 60.0 / bpm;
    const currentTime = audioContext.current.currentTime;
    
    // Schedule this beat
    scheduleNote();
    
    // Update next note time
    nextNoteTimeRef.current = currentTime + secondsPerBeat;
  };

  // Start metronome loop
  const startMetronome = () => {
    // Try to initialize audio context
    if (!ensureAudioContext()) {
      toast({
        title: "Audio Error",
        description: "Please interact with the page to enable sound",
        variant: "destructive",
      });
      return;
    }
    
    // Clear any existing interval
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    
    // Calculate interval time in milliseconds
    const intervalTime = (60.0 / bpm) * 1000;
    
    // Start scheduler with precise timing
    intervalRef.current = window.setInterval(scheduler, intervalTime);
    
    // Trigger first beat immediately
    scheduler();
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
    
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
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

