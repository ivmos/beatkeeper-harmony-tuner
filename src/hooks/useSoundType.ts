
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
      try {
        // Use base64 encoded sounds to avoid network requests
        audioElementRef.current.src = CLICK_SOUNDS[soundType];
        
        console.log("Setting audio source to:", soundType);
        
        // Important to load the new source
        const loadPromise = audioElementRef.current.load();
        if (loadPromise !== undefined) {
          Promise.resolve(loadPromise).catch(err => {
            console.error("Error loading audio source:", err);
          });
        }
        
        // On iOS, we need to play and immediately pause to initialize audio
        // This is done after a user interaction
        const initializeAudioForIOS = () => {
          if (audioElementRef.current) {
            audioElementRef.current.play()
              .then(() => {
                // Successfully started playing, pause it immediately
                audioElementRef.current?.pause();
                audioElementRef.current!.currentTime = 0;
              })
              .catch(err => {
                console.warn("Could not initialize audio:", err);
                // No need to show error, as this is expected on first load
              });
          }
          document.removeEventListener('click', initializeAudioForIOS);
        };
        
        document.addEventListener('click', initializeAudioForIOS, { once: true });
        
      } catch (err) {
        console.error("Error setting audio source:", err);
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
