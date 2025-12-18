import { useEffect } from 'react';
import { audio } from '../audio/AudioEngine';

export const LockdownManager = () => {
  useEffect(() => {
    // Attempt to unlock audio on the very first touch of ANY kind, just in case
    const oneTimeUnlock = () => {
      audio.unlock();
      window.removeEventListener('touchstart', oneTimeUnlock);
      window.removeEventListener('click', oneTimeUnlock);
    };
    window.addEventListener('touchstart', oneTimeUnlock, { passive: false });
    window.addEventListener('click', oneTimeUnlock);

    const preventDefault = (e: Event) => e.preventDefault();

    const preventTouchMove = (e: TouchEvent) => {
      // Check if the target or any parent has the 'allow-scroll' class
      let target = e.target as HTMLElement;
      let shouldAllow = false;
      
      while (target && target !== document.body) {
        if (target.classList && target.classList.contains('allow-scroll')) {
          shouldAllow = true;
          break;
        }
        target = target.parentElement as HTMLElement;
      }

      if (!shouldAllow) {
        e.preventDefault();
      }
    };

    const preventTouchStart = (e: TouchEvent) => {
      // Prevent pinch-to-zoom if multi-touch
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Options for addEventListener
    const options = { passive: false };

    // Prevent scrolling
    document.addEventListener('touchmove', preventTouchMove, options);
    
    // Prevent zooming interactions
    document.addEventListener('touchstart', preventTouchStart, options);
    document.addEventListener('gesturestart', preventDefault, options); // iOS specific

    // Prevent context menu (long press)
    document.addEventListener('contextmenu', preventDefault);

    return () => {
      document.removeEventListener('touchmove', preventTouchMove);
      document.removeEventListener('touchstart', preventTouchStart);
      document.removeEventListener('gesturestart', preventDefault);
      document.removeEventListener('contextmenu', preventDefault);
    };
  }, []);

  return null;
};
