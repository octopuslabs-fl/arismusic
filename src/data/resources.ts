export type ResourceCategory = 'animal' | 'instrument' | 'vehicle' | 'object' | 'nature';

export interface SoundProfile {
  id: string;
  type: 'synth' | 'file'; // 'synth' uses our AudioEngine, 'file' uses a loaded buffer
  src?: string; // Path for 'file' type
  // Synth properties
  freq?: number;
  waveType?: OscillatorType;
}

export interface GameResource {
  id: string;
  name: string;
  imagePath: string; // Path relative to public/ or src/assets/
  category: ResourceCategory;
  sound: SoundProfile;
  color: string; // Dominant color for UI accents
}

// Registry will be populated as we acquire assets
export const RESOURCES: GameResource[] = [];

// Helper to find resources by category
export const getResourcesByCategory = (category: ResourceCategory) => {
  return RESOURCES.filter(r => r.category === category);
};
