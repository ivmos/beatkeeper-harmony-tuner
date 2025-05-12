
import { useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { CLICK_SOUNDS, SoundType } from '@/constants/audioConstants';

export const useAudioContext = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const { toast } = useToast();

  const initAudio = () => {
    try {
      if (!audioContext.current) {
        // Create audio context
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create gain node
        gainNodeRef.current = audioContext.current.createGain();
        gainNodeRef.current.connect(audioContext.current.destination);
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

  const ensureAudioContext = () => {
    if (!audioContext.current) {
      return initAudio();
    }
    
    if (audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }
    
    return true;
  };

  // Initialize audio element
  useEffect(() => {
    if (!audioElementRef.current) {
      // Create a new audio element
      audioElementRef.current = new Audio();
      audioElementRef.current.loop = false;
      audioElementRef.current.preload = "auto";
      
      // Set initial sound (default to sine)
      audioElementRef.current.src = CLICK_SOUNDS['sine'];
      
      // Add to body for iOS background playback
      document.body.appendChild(audioElementRef.current);
      
      // When the audio element is ready, connect it to the audio context
      audioElementRef.current.addEventListener('canplaythrough', () => {
        if (audioContext.current && !sourceNodeRef.current && audioElementRef.current) {
          try {
            sourceNodeRef.current = audioContext.current.createMediaElementSource(audioElementRef.current);
            sourceNodeRef.current.connect(gainNodeRef.current!);
          } catch (error) {
            console.warn("Could not create media element source:", error);
            // This might happen if the audio element is already connected
          }
        }
      });
    }
    
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
      
      if (audioElementRef.current && audioElementRef.current.parentNode) {
        document.body.removeChild(audioElementRef.current);
      }
    };
  }, []);

  // Initialize audio context on first interaction
  useEffect(() => {
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

  return {
    audioContext,
    gainNodeRef,
    audioElementRef,
    sourceNodeRef,
    initAudio,
    ensureAudioContext
  };
};
