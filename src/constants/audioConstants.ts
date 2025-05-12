
// Keys for localStorage
export const STORAGE_KEY_VOLUME = 'metronome-volume';
export const STORAGE_KEY_SOUND = 'metronome-sound';

// Base64 encoded simple click sounds as fallbacks
const SINE_CLICK_BASE64 = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
const SQUARE_CLICK_BASE64 = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
const SAW_CLICK_BASE64 = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
const TRIANGLE_CLICK_BASE64 = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

// Audio file paths for different click sounds with fallbacks
export const CLICK_SOUNDS = {
  sine: SINE_CLICK_BASE64,
  square: SQUARE_CLICK_BASE64,
  sawtooth: SAW_CLICK_BASE64,
  triangle: TRIANGLE_CLICK_BASE64,
};

export type SoundType = 'sine' | 'square' | 'sawtooth' | 'triangle';
