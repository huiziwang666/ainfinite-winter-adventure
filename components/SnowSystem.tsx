import React, { useRef, useEffect } from 'react';

interface SnowSystemProps {
  active: boolean;
}

const SnowSystem: React.FC<SnowSystemProps> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      rotation: number;
    }> = [];

    const initParticles = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
    };

    const createParticle = () => {
      if (!active) return;
      // Add new particles if active
      if (particles.length < 100) { // Limit particles for text rendering performance
        particles.push({
          x: Math.random() * canvas.width,
          y: -50,
          size: Math.random() * 40 + 20, // INCREASED: Size between 20px and 60px
          speedY: Math.random() * 1.5 + 0.5, // Gentle fall
          speedX: Math.random() * 2 - 1, // Sway
          opacity: Math.random() * 0.5 + 0.4,
          rotation: Math.random() * 360
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (active) {
        createParticle();
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Update
        p.y += p.speedY;
        p.x += Math.sin(p.y * 0.01) * 0.5 + p.speedX * 0.2; // Add wavy motion

        // Render
        ctx.font = `${p.size}px serif`;
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fillText('❄', p.x, p.y);

        // Remove off-screen
        if (p.y > canvas.height + 50) {
          particles.splice(i, 1);
          i--;
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    const handleResize = () => {
       canvas.width = window.innerWidth;
       canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-30 transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}
    />
  );
};

export default SnowSystem;