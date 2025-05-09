
// Keys for localStorage
export const STORAGE_KEY_VOLUME = 'metronome-volume';
export const STORAGE_KEY_SOUND = 'metronome-sound';

// Audio file paths for different click sounds
export const CLICK_SOUNDS = {
  sine: "/sounds/sine-click.mp3",
  square: "/sounds/square-click.mp3",
  sawtooth: "/sounds/sawtooth-click.mp3",
  triangle: "/sounds/triangle-click.mp3",
};

export type SoundType = 'sine' | 'square' | 'sawtooth' | 'triangle';
