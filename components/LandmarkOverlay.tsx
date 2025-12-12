import React, { useRef, useEffect, MutableRefObject } from 'react';
import { Point } from '../types';

interface DetectionState {
  isMouthOpen: boolean;
  isTwoHands: boolean;
  handLandmarks: Point[][] | null;
  faceLandmarks: Point[] | null;
}

interface LandmarkOverlayProps {
  detectionRef: MutableRefObject<DetectionState>;
}

// Hand connections (MediaPipe hand landmark indices)
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm
  [5, 9], [9, 13], [13, 17]
];

// Key face landmarks for mouth outline
const MOUTH_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];

const LandmarkOverlay: React.FC<LandmarkOverlayProps> = ({ detectionRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Animation loop reads from ref every frame
    const animate = () => {
      const { handLandmarks, faceLandmarks, isMouthOpen, isTwoHands } = detectionRef.current;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      // Draw hands
      if (handLandmarks) {
        handLandmarks.forEach((hand) => {
          const color = isTwoHands ? '#00ff88' : '#00aaff';

          // Draw connections
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';

          HAND_CONNECTIONS.forEach(([start, end]) => {
            const p1 = hand[start];
            const p2 = hand[end];
            if (p1 && p2) {
              ctx.beginPath();
              ctx.moveTo(p1.x * w, p1.y * h);
              ctx.lineTo(p2.x * w, p2.y * h);
              ctx.stroke();
            }
          });

          // Draw joints
          hand.forEach((point, idx) => {
            ctx.beginPath();
            // Index fingertip is larger
            const radius = idx === 8 ? 10 : 5;
            ctx.arc(point.x * w, point.y * h, radius, 0, Math.PI * 2);
            ctx.fillStyle = idx === 8 ? '#ff4444' : color;
            ctx.fill();
          });
        });
      }

      // Draw face (mouth area)
      if (faceLandmarks && faceLandmarks.length > 0) {
        const mouthColor = isMouthOpen ? '#ff4444' : '#ffaa00';
        ctx.strokeStyle = mouthColor;
        ctx.lineWidth = 2;

        // Draw mouth outline
        ctx.beginPath();
        MOUTH_OUTER.forEach((idx, i) => {
          const point = faceLandmarks[idx];
          if (point) {
            if (i === 0) {
              ctx.moveTo(point.x * w, point.y * h);
            } else {
              ctx.lineTo(point.x * w, point.y * h);
            }
          }
        });
        ctx.closePath();
        ctx.stroke();

        // Fill mouth if open
        if (isMouthOpen) {
          ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
          ctx.fill();
        }

        // Draw dots on mouth corners
        [61, 291].forEach(idx => {
          const point = faceLandmarks[idx];
          if (point) {
            ctx.beginPath();
            ctx.arc(point.x * w, point.y * h, 4, 0, Math.PI * 2);
            ctx.fillStyle = mouthColor;
            ctx.fill();
          }
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-40"
    />
  );
};

export default LandmarkOverlay;
