
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SoundSelectorProps {
  currentSound: string;
  onSoundChange: (value: string) => void;
}

const SoundSelector: React.FC<SoundSelectorProps> = ({
  currentSound,
  onSoundChange
}) => {
  return (
    <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-1.5 w-full">
      <span className="text-xs font-medium pl-1.5 text-muted-foreground">Sound:</span>
      <Select value={currentSound} onValueChange={onSoundChange}>
        <SelectTrigger className="h-7 flex-1 bg-background/40">
          <SelectValue placeholder="Select sound" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sine">Sine Wave</SelectItem>
          <SelectItem value="square">Square Wave</SelectItem>
          <SelectItem value="sawtooth">Sawtooth Wave</SelectItem>
          <SelectItem value="triangle">Triangle Wave</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default SoundSelector;
