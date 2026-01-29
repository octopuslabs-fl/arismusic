import { TouchPoint } from './hooks/useMultiTouch';

export type ScreenId = 'menu' | 'freeplay' | 'quiz' | 'resource-display' | 'canvas';

export interface GameScreenProps {
  /** Current active touches on the screen */
  touches: TouchPoint[];
  /** Function to trigger a particle burst at specific coordinates */
  burst: (x: number, y: number, color: string) => void;
  /** Function to trigger a standardized multicolor happy burst */
  burstMulticolor: (x: number, y: number) => void;
  /** Function to return to the main menu */
  onExit: () => void;
}
