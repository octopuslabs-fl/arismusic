import { useState, useEffect, useRef } from 'react';

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

export const useMultiTouch = () => {
  const [touches, setTouches] = useState<TouchPoint[]>([]);
  // Track if we've ever seen a touch event to disable mouse emulation
  const hasTouchRef = useRef(false);

  useEffect(() => {
    let isMouseDown = false;

    // --- Touch Handling ---
    const handleTouch = (e: TouchEvent) => {
      hasTouchRef.current = true; // Mark that this is a touch device
      
      const newTouches: TouchPoint[] = [];
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        newTouches.push({
          id: t.identifier,
          x: t.clientX,
          y: t.clientY
        });
      }
      setTouches(newTouches);
    };

    // --- Mouse Handling ---
    const handleMouseDown = (e: MouseEvent) => {
      if (hasTouchRef.current) return; // Ignore if we are on a touch device
      
      isMouseDown = true;
      setTouches([{ id: 999, x: e.clientX, y: e.clientY }]); // Arbitrary ID for mouse
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (hasTouchRef.current) return;
      if (!isMouseDown) return;
      setTouches([{ id: 999, x: e.clientX, y: e.clientY }]);
    };

    const handleMouseUp = () => {
      if (hasTouchRef.current) return;
      isMouseDown = false;
      setTouches([]);
    };

    const options = { passive: false };
    
    // Attach listeners
    window.addEventListener('touchstart', handleTouch, options);
    window.addEventListener('touchmove', handleTouch, options);
    window.addEventListener('touchend', handleTouch, options);
    window.addEventListener('touchcancel', handleTouch, options);

    // Mouse listeners for desktop support
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);

    return () => {
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchend', handleTouch);
      window.removeEventListener('touchcancel', handleTouch);

      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, []);

  return touches;
};
