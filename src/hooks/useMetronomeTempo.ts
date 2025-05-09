
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

// Keys for localStorage
const STORAGE_KEY_BPM = 'metronome-bpm';

export interface UseMetronomeTempoProps {
  initialBpm?: number;
}

export const useMetronomeTempo = ({ initialBpm = 100 }: UseMetronomeTempoProps = {}) => {
  // Initialize state with values from localStorage or defaults
  const [bpm, setBpm] = useState(() => {
    const savedBpm = localStorage.getItem(STORAGE_KEY_BPM);
    return savedBpm ? parseInt(savedBpm) : initialBpm;
  });
  const [bpmInput, setBpmInput] = useState(() => {
    const savedBpm = localStorage.getItem(STORAGE_KEY_BPM);
    return savedBpm || initialBpm.toString();
  });
  const { toast } = useToast();

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BPM, bpm.toString());
  }, [bpm]);

  // Handle BPM change from slider
  const handleBpmChange = (value: number[]) => {
    const newBpm = value[0];
    setBpm(newBpm);
    setBpmInput(newBpm.toString()); // Update input field when slider changes
  };

  // Handle direct BPM input from keyboard
  const handleBpmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setBpmInput(inputValue); // Always update input field
    
    const newBpm = parseInt(inputValue);
    if (!isNaN(newBpm) && newBpm >= 30 && newBpm <= 250) {
      setBpm(newBpm);
    }
  };

  // Handle blur event for the input field
  const handleBpmInputBlur = () => {
    // Revert to valid BPM if input is invalid
    if (bpmInput === '' || isNaN(parseInt(bpmInput)) || parseInt(bpmInput) < 30 || parseInt(bpmInput) > 250) {
      setBpmInput(bpm.toString());
      toast({
        title: "Invalid BPM",
        description: "BPM must be between 30 and 250",
        variant: "destructive",
      });
    }
  };

  // Handle key press for the input field
  const handleBpmInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newBpm = parseInt(bpmInput);
      if (!isNaN(newBpm) && newBpm >= 30 && newBpm <= 250) {
        setBpm(newBpm);
      } else {
        setBpmInput(bpm.toString());
        toast({
          title: "Invalid BPM",
          description: "BPM must be between 30 and 250",
          variant: "destructive",
        });
      }
    }
  };

  // Update BPM from tap tempo component
  const updateBpmFromTap = (newBpm: number) => {
    setBpm(newBpm);
    setBpmInput(newBpm.toString()); // Update input field when tap tempo changes
    toast({
      title: "Tempo Updated",
      description: `BPM set to ${newBpm}`,
    });
  };

  return {
    bpm,
    setBpm,
    bpmInput,
    setBpmInput,
    handleBpmChange,
    handleBpmInputChange,
    handleBpmInputBlur,
    handleBpmInputKeyPress,
    updateBpmFromTap
  };
};
