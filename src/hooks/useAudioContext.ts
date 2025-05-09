
import { useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

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

  const ensureAudioContext = () => {
    if (!audioContext.current) {
      return initAudio();
    }
    
    if (audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }
    
    return true;
  };

  // Initialize audio element for iOS background playback
  useEffect(() => {
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
      audioElementRef.current.loop = false;
      audioElementRef.current.preload = "auto";
      document.body.appendChild(audioElementRef.current);
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
