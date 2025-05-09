
import { useEffect } from 'react';
import { startSession, endCurrentSession } from '@/utils/statsUtils';

export interface UseMetronomeSessionProps {
  isPlaying: boolean;
}

export const useMetronomeSession = ({ isPlaying }: UseMetronomeSessionProps) => {
  // Track session stats when isPlaying changes
  useEffect(() => {
    if (isPlaying) {
      startSession();
    } else {
      endCurrentSession();
    }
  }, [isPlaying]);
};
