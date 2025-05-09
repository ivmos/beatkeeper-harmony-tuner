
import { useState, useEffect } from 'react';
import { STORAGE_KEY_VOLUME } from '@/constants/audioConstants';

export const useAudioVolume = (gainNodeRef: React.MutableRefObject<GainNode | null>) => {
  // Initialize state with values from localStorage or defaults
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem(STORAGE_KEY_VOLUME);
    return savedVolume ? parseFloat(savedVolume) : 0.5;
  });
  const [isMuted, setIsMuted] = useState(false);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VOLUME, volume.toString());
  }, [volume]);

  // Effect to update gain node when volume or mute state changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, gainNodeRef]);

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

  return {
    volume,
    isMuted,
    handleVolumeChange,
    toggleMute
  };
};
