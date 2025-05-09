
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
  
  const intervalRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const { toast } = useToast();

  // Use our custom hooks
  const {
    audioContext,
    gainNodeRef,
    audioElementRef,
    sourceNodeRef,
    ensureAudioContext
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
