
import { useState, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAudioContext } from '@/hooks/useAudioContext';
import { useAudioVolume } from '@/hooks/useAudioVolume';
import { useSoundType } from '@/hooks/useSoundType';
import { SoundType } from '@/constants/audioConstants';

export interface UseMetronomeAudioProps {
  bpm: number;
  isPlaying: boolean;
}

export const useMetronomeAudio = ({ bpm, isPlaying }: UseMetronomeAudioProps) => {
  const [currentBeat, setCurrentBeat] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [wasPlaying, setWasPlaying] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const { toast } = useToast();

  // Use our custom hooks
  const {
    audioContext,
    gainNodeRef,
    audioElementRef,
    sourceNodeRef,
    ensureAudioContext,
    audioInitializedRef
  } = useAudioContext();

  const {
    volume,
    isMuted,
    handleVolumeChange,
    toggleMute
  } = useAudioVolume(gainNodeRef);

  const {
    soundType,
    handleSoundTypeChange
  } = useSoundType(audioElementRef);

  // Add an event listener to initialize audio on user interaction
  useEffect(() => {
    const initAudioOnUserInteraction = () => {
      ensureAudioContext();
      setAudioReady(true);
      
      // Remove the event listeners once audio is initialized
      document.removeEventListener('click', initAudioOnUserInteraction);
      document.removeEventListener('touchstart', initAudioOnUserInteraction);
    };
    
    // Add event listeners for initializing audio on user interaction
    document.addEventListener('click', initAudioOnUserInteraction);
    document.addEventListener('touchstart', initAudioOnUserInteraction);
    
    return () => {
      document.removeEventListener('click', initAudioOnUserInteraction);
      document.removeEventListener('touchstart', initAudioOnUserInteraction);
    };
  }, []);

  // Handle visibility change (app suspension)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // App is suspended, store current playing state
        setWasPlaying(isPlaying);
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (document.visibilityState === 'visible') {
        // App is resumed
        // Ensure audio context is running
        ensureAudioContext();
        
        // If it was playing before suspension, restart the metronome
        if (wasPlaying && isPlaying) {
          stopMetronome();
          startMetronome();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, wasPlaying, bpm]);

  // Schedule a beat sound
  const scheduleNote = () => {
    if (!audioReady && !audioInitializedRef.current) {
      // Audio context not initialized yet, show message
      toast({
        title: "Audio not ready",
        description: "Please interact with the page to enable sound",
        variant: "destructive",
      });
      return;
    }
    
    if (audioElementRef.current) {
      try {
        // Reset audio position to start
        audioElementRef.current.currentTime = 0;
        
        // Make sure the audio element has a valid source
        if (!audioElementRef.current.src) {
          console.error("Audio element has no source!");
          return;
        }
        
        // Ensure audio context is resumed (needed after suspension)
        ensureAudioContext();
        
        // Directly create an oscillator for instant sound if needed
        if (audioContext.current && gainNodeRef.current) {
          const oscillator = audioContext.current.createOscillator();
          oscillator.type = soundType as OscillatorType;
          oscillator.frequency.setValueAtTime(880, audioContext.current.currentTime);
          
          oscillator.connect(gainNodeRef.current);
          oscillator.start();
          oscillator.stop(audioContext.current.currentTime + 0.05);
        }
        
        // Also try the audio element approach
        const playPromise = audioElementRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.error("Error playing audio:", err);
            
            // On iOS, try to initialize the audio context again
            if (err.name === 'NotAllowedError') {
              // We don't show a toast here as we're already using the oscillator fallback
            }
          });
        }
      } catch (error) {
        console.error("Error scheduling note:", error);
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
