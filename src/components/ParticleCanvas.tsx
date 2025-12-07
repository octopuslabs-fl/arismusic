import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface ParticleHandle {
  burst: (x: number, y: number, color: string) => void;
  burstMulticolor: (x: number, y: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const HAPPY_PALETTE = [
  '#22c55e', // Green
  '#eab308', // Yellow
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ffffff', // White
];

export const ParticleCanvas = forwardRef<ParticleHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationFrameId = useRef<number>(0);

  const spawnParticles = (x: number, y: number, color: string, count: number = 20) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.5, // Increased initial life
        maxLife: 1.5,
        size: Math.random() * 10 + 5, // Big chunky particles for toddlers
        color,
      });
    }
  };

  const burst = (x: number, y: number, color: string) => {
    spawnParticles(x, y, color, 20);
  };

  const burstMulticolor = (x: number, y: number) => {
    // Spawn a mix of happy colors
    HAPPY_PALETTE.forEach(color => {
      spawnParticles(x, y, color, 5); // 5 particles per color = 35 total
    });
  };

  useImperativeHandle(ref, () => ({
    burst,
    burstMulticolor
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handler
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Animation Loop
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.01; // Slower fade out speed
        p.size *= 0.98; // Slower shrink
        
        // Gravity
        p.vy += 0.2;

        if (p.life <= 0 || p.size < 0.5) {
          particles.current.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
      animationFrameId.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-50"
    />
  );
});
