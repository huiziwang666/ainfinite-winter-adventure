import React, { useRef, useEffect, MutableRefObject } from 'react';
import { Point } from '../types';

interface FogLayerProps {
  opacity: number;
  drawPointRef: MutableRefObject<Point | null>;
  isResetting: boolean;
}

interface Drip {
  x: number;
  y: number;
  speed: number;
  size: number;
  life: number;
}

const FogLayer: React.FC<FogLayerProps> = ({ opacity, drawPointRef, isResetting }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<Point | null>(null);
  const opacityRef = useRef(opacity);

  // Keep opacity ref in sync
  opacityRef.current = opacity;

  // Store drips in a ref to persist across renders without causing re-renders
  const dripsRef = useRef<Drip[]>([]);
  const animationFrameRef = useRef<number>(0);

  // Initialize Fog
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fillFog = () => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(230, 240, 255, 1)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // Handle Resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      fillFog();
      dripsRef.current = []; // Clear drips on resize
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Reset
  useEffect(() => {
    if (isResetting) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(230, 240, 255, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      lastPointRef.current = null;
      dripsRef.current = []; // Clear drips
    }
  }, [isResetting]);

  // Combined Animation Loop for Drawing + Drips (reads from ref for zero-latency)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // --- Handle Finger Drawing ---
      const currentDrawPoint = drawPointRef.current;
      if (currentDrawPoint && opacityRef.current >= 0.2) {
        const x = currentDrawPoint.x * canvas.width;
        const y = currentDrawPoint.y * canvas.height;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 70;

        const lastPoint = lastPointRef.current;
        if (lastPoint) {
          const startX = lastPoint.x * canvas.width;
          const startY = lastPoint.y * canvas.height;
          // Draw stroke
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, 35, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, 35, 0, Math.PI * 2);
          ctx.fill();
        }

        // Spawn drips
        if (Math.random() < 0.3) {
          dripsRef.current.push({
            x: x + (Math.random() * 40 - 20),
            y: y + 20,
            speed: Math.random() * 2 + 1,
            size: Math.random() * 3 + 2,
            life: Math.random() * 100 + 50
          });
        }

        lastPointRef.current = currentDrawPoint;
      } else {
        lastPointRef.current = null;
      }

      // --- Animate Drips ---
      if (dripsRef.current.length > 0) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,1)';

        for (let i = dripsRef.current.length - 1; i >= 0; i--) {
          const drip = dripsRef.current[i];
          drip.y += drip.speed;
          drip.life--;

          ctx.beginPath();
          ctx.arc(drip.x, drip.y, drip.size, 0, Math.PI * 2);
          ctx.fill();

          if (Math.random() > 0.8) {
            drip.x += (Math.random() - 0.5) * 2;
          }

          if (drip.life <= 0 || drip.y > canvas.height) {
            dripsRef.current.splice(i, 1);
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-1000 ease-in-out"
      style={{ opacity: opacity }}
    />
  );
};

export default FogLayer;