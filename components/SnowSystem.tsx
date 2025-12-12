import React, { useRef, useEffect, MutableRefObject } from 'react';

interface SnowSystemProps {
  activeRef: MutableRefObject<boolean>;
}

const SnowSystem: React.FC<SnowSystemProps> = ({ activeRef }) => {
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
      // Read directly from ref for instant response
      if (!activeRef.current) return;
      // Add new particles if active
      if (particles.length < 100) { // Limit particles for text rendering performance
        particles.push({
          x: Math.random() * canvas.width,
          y: -50,
          size: Math.random() * 40 + 20, // INCREASED: Size between 20px and 60px
          speedY: Math.random() * 4 + 3, // Fast fall
          speedX: Math.random() * 2 - 1, // Sway
          opacity: Math.random() * 0.5 + 0.4,
          rotation: Math.random() * 360
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Read from ref every frame
      if (activeRef.current) {
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-30"
    />
  );
};

export default SnowSystem;