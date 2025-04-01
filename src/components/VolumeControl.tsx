
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
}

const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute
}) => {
  const handleVolumeChange = (value: number[]) => {
    onVolumeChange(value[0]);
  };

  return (
    <div className="w-full flex items-center gap-2 mb-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleMute}
        className="text-metro-purple hover:text-metro-light-purple"
      >
        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
      </Button>
      
      <Slider
        value={[isMuted ? 0 : volume]}
        min={0}
        max={1}
        step={0.01}
        onValueChange={(values) => handleVolumeChange(values)}
        className="flex-1"
      />
      
      <span className="text-xs text-muted-foreground w-8 text-center">
        {Math.round(isMuted ? 0 : volume * 100)}%
      </span>
    </div>
  );
};

export default VolumeControl;
