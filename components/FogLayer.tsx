import React, { useRef, useEffect, useState } from 'react';
import { Point } from '../types';

interface FogLayerProps {
  opacity: number;
  drawPoint: Point | null;
  isResetting: boolean;
}

interface Drip {
  x: number;
  y: number;
  speed: number;
  size: number;
  life: number;
}

const FogLayer: React.FC<FogLayerProps> = ({ opacity, drawPoint, isResetting }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  
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
      setLastPoint(null);
      dripsRef.current = []; // Clear drips
    }
  }, [isResetting]);

  // Animation Loop for Drips
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animateDrips = () => {
      if (dripsRef.current.length > 0) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.fillStyle = 'rgba(0,0,0,1)'; // Color doesn't matter for destination-out

        // Iterate backwards to allow splicing
        for (let i = dripsRef.current.length - 1; i >= 0; i--) {
          const drip = dripsRef.current[i];
          
          // Move drip
          drip.y += drip.speed;
          drip.life--;

          // Draw drip (eraser)
          ctx.beginPath();
          ctx.arc(drip.x, drip.y, drip.size, 0, Math.PI * 2);
          ctx.fill();

          // Chance to slightly wiggle x
          if (Math.random() > 0.8) {
             drip.x += (Math.random() - 0.5) * 2;
          }

          // Remove dead drips or off-screen drips
          if (drip.life <= 0 || drip.y > canvas.height) {
            dripsRef.current.splice(i, 1);
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(animateDrips);
    };

    animationFrameRef.current = requestAnimationFrame(animateDrips);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Handle Finger Drawing
  useEffect(() => {
    if (!drawPoint || opacity < 0.2) {
      setLastPoint(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = drawPoint.x * canvas.width;
    const y = drawPoint.y * canvas.height;

    // 1. Draw the Finger Stroke
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 70; 
    
    const drawStroke = (startX: number, startY: number, endX: number, endY: number) => {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(endX, endY, 35, 0, Math.PI * 2);
        ctx.fill();
    };

    if (lastPoint) {
      const startX = lastPoint.x * canvas.width;
      const startY = lastPoint.y * canvas.height;
      drawStroke(startX, startY, x, y);
    } else {
        ctx.beginPath();
        ctx.arc(x, y, 35, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. Spawn Drips (Probabilistic)
    // Only spawn if we are moving downwards or stationary to simulate accumulation
    // or just randomly along the stroke.
    if (Math.random() < 0.3) { // 30% chance per frame while drawing
       dripsRef.current.push({
         x: x + (Math.random() * 40 - 20), // Randomize width within stroke
         y: y + 20,
         speed: Math.random() * 2 + 1, // Speed
         size: Math.random() * 3 + 2, // Size of drip head
         life: Math.random() * 100 + 50 // Frames to live
       });
    }

    setLastPoint(drawPoint);
  }, [drawPoint, opacity, lastPoint]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-1000 ease-in-out"
      style={{ opacity: opacity }}
    />
  );
};

export default FogLayer;