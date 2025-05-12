
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEY_SOUND, SoundType, CLICK_SOUNDS } from '@/constants/audioConstants';

export const useSoundType = (audioElementRef: React.MutableRefObject<HTMLAudioElement | null>) => {
  const [soundType, setSoundType] = useState<SoundType>(() => {
    const savedSound = localStorage.getItem(STORAGE_KEY_SOUND);
    return (savedSound as SoundType) || 'sine';
  });
  const { toast } = useToast();

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SOUND, soundType);
  }, [soundType]);

  // Update the audio element source when sound type changes
  useEffect(() => {
    if (audioElementRef.current) {
      console.log("Setting audio source to:", CLICK_SOUNDS[soundType]);
      audioElementRef.current.src = CLICK_SOUNDS[soundType];
      
      // Important to load the new source
      const loadPromise = audioElementRef.current.load();
      if (loadPromise !== undefined) {
        Promise.resolve(loadPromise).catch(err => {
          console.error("Error loading audio source:", err);
        });
      }
    }
  }, [soundType, audioElementRef]);

  // Handle sound type change
  const handleSoundTypeChange = (value: string) => {
    setSoundType(value as SoundType);
    toast({
      title: "Sound Changed",
      description: `Sound type set to ${value}`,
    });
  };

  return {
    soundType,
    handleSoundTypeChange
  };
};
