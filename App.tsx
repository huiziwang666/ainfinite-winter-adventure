import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { initializeVision, processVideoFrame } from './services/visionService';
import InfoPanel from './components/InfoPanel';
import FogLayer from './components/FogLayer';
import SnowSystem from './components/SnowSystem';
import DetectionIndicator from './components/DetectionIndicator';
import { AppState, Point } from './types';

// Constants
const BREATH_TRIGGER_DURATION = 800; // ms to hold breath gesture to trigger fog
const RESET_COOLDOWN = 2000;

function App() {
  const webcamRef = useRef<Webcam>(null);
  const requestRef = useRef<number>(0);
  const [visionReady, setVisionReady] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.CLEAR);
  
  // State Refs for Loop (to avoid stale closures in animation frame)
  const appStateRef = useRef<AppState>(AppState.CLEAR);
  const breathStartTimeRef = useRef<number | null>(null);
  const lastInteractionTimeRef = useRef<number>(0);

  // Visual State
  const [fogOpacity, setFogOpacity] = useState(0);

  // REFS for zero-latency updates (bypass React render cycle)
  const drawPointRef = useRef<Point | null>(null);
  const snowActiveRef = useRef(false);

  // Detection State for UI display only (can have slight delay)
  const [isMouthOpen, setIsMouthOpen] = useState(false);
  const [isFingerDetected, setIsFingerDetected] = useState(false);
  const [isTwoHands, setIsTwoHands] = useState(false);

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  useEffect(() => {
    const load = async () => {
      await initializeVision();
      setVisionReady(true);
    };
    load();
  }, []);

  // Helper to map video coordinates to screen coordinates
  const mapVideoToScreen = (point: Point, video: HTMLVideoElement): Point => {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    if (videoWidth === 0 || videoHeight === 0) return point;

    // Calculate scale similar to object-cover
    const scale = Math.max(screenWidth / videoWidth, screenHeight / videoHeight);
    
    const scaledWidth = videoWidth * scale;
    const scaledHeight = videoHeight * scale;

    // Calculate centering offsets
    const offsetX = (screenWidth - scaledWidth) / 2;
    const offsetY = (screenHeight - scaledHeight) / 2;

    // Map point: Scale then translate
    const screenX = (point.x * scaledWidth) + offsetX;
    const screenY = (point.y * scaledHeight) + offsetY;

    // Normalize back to 0-1 for the Canvas component
    return {
      x: screenX / screenWidth,
      y: screenY / screenHeight
    };
  };

  const handleVisionLoop = () => {
    const now = Date.now();

    if (
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4 &&
      visionReady
    ) {
      const video = webcamRef.current.video;
      const visionResult = processVideoFrame(video, now);
      const { isMouthOpen: mouthOpen, indexFingerTip, isTwoHandsDetected } = visionResult;

      // Map coordinates from Video space to Screen space
      let screenFingerTip: Point | null = null;
      if (indexFingerTip) {
        screenFingerTip = mapVideoToScreen(indexFingerTip, video);
      }

      // Update detection state for UI display
      setIsMouthOpen(mouthOpen);
      setIsFingerDetected(!!screenFingerTip);
      setIsTwoHands(isTwoHandsDetected);

      // --- State Machine Logic ---
      const currentState = appStateRef.current;

      // 1. CLEAR -> FOGGING
      if (currentState === AppState.CLEAR) {
        if (mouthOpen) {
          if (!breathStartTimeRef.current) breathStartTimeRef.current = now;

          if (now - breathStartTimeRef.current > BREATH_TRIGGER_DURATION) {
            setAppState(AppState.FOGGING);
            breathStartTimeRef.current = null;
          }
        } else {
          breathStartTimeRef.current = null;
        }
      }

      // 2. FOGGING -> DRAWING (Transition handled by effect/opacity animation)
      if (currentState === AppState.FOGGING) {
         // Auto transition logic in UI effect, but logically we are "FOGGED"
         if (fogOpacity >= 0.8) {
             setAppState(AppState.DRAWING);
         }
      }

      // 3. DRAWING Logic
      if (currentState === AppState.DRAWING || currentState === AppState.SNOWING) {

        // Snow Trigger (Two Hands) - update ref immediately (no React delay)
        snowActiveRef.current = isTwoHandsDetected;
        if (isTwoHandsDetected) {
           if (currentState !== AppState.SNOWING) {
               setAppState(AppState.SNOWING);
           }
           // Disable drawing while holding two hands
           drawPointRef.current = null;
        } else {
           // Normal drawing if single hand/finger - update ref immediately
           drawPointRef.current = screenFingerTip;
        }

        // Reset Trigger (Breath again)
        if (mouthOpen && (now - lastInteractionTimeRef.current > RESET_COOLDOWN)) {
             if (!breathStartTimeRef.current) breathStartTimeRef.current = now;
             if (now - breathStartTimeRef.current > BREATH_TRIGGER_DURATION) {
                 setAppState(AppState.RESETTING);
                 breathStartTimeRef.current = null;
             }
        } else {
            if (!mouthOpen) breathStartTimeRef.current = null;
        }
      }

      // 4. RESETTING
      // Handled by effect mostly
    }
    requestRef.current = requestAnimationFrame(handleVisionLoop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(handleVisionLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [visionReady, fogOpacity]);

  // Visual Reactions to State Changes
  useEffect(() => {
    switch (appState) {
      case AppState.CLEAR:
        setFogOpacity(0);
        break;
      case AppState.FOGGING:
        // Bloom fog
        setFogOpacity(0.95);
        lastInteractionTimeRef.current = Date.now();
        break;
      case AppState.DRAWING:
        // Ensure fog stays
        setFogOpacity(0.95);
        break;
      case AppState.SNOWING:
        // Ensure fog stays
        setFogOpacity(0.95);
        break;
      case AppState.RESETTING:
        setFogOpacity(0);
        setTimeout(() => {
            setAppState(AppState.CLEAR);
        }, 1000); // Wait for fade out
        break;
    }
  }, [appState]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Background Audio - Snowy Road */}
      <audio 
        autoPlay 
        loop 
        src="/snowy-road.mp3" 
        style={{ display: 'none' }} 
      />

      {/* 1. Camera Layer */}
      <div className="absolute inset-0 z-0">
         {/* @ts-expect-error - react-webcam types are overly strict */}
         <Webcam
          ref={webcamRef}
          audio={false}
          className="w-full h-full object-cover filter blur-[2px] brightness-110 contrast-110 transform -scale-x-100"
          screenshotFormat="image/jpeg"
          videoConstraints={{ width: 640, height: 480 }}
        />
      </div>

      {/* 2. Fog Layer (Canvas) */}
      <FogLayer
        opacity={fogOpacity}
        drawPointRef={drawPointRef}
        isResetting={appState === AppState.RESETTING}
      />

      {/* 3. Snow Layer */}
      <SnowSystem activeRef={snowActiveRef} />

      {/* 4. UI Layer */}
      <InfoPanel />

      {/* 5. Detection Indicator for kids */}
      <DetectionIndicator
        isMouthOpen={isMouthOpen}
        isFingerDetected={isFingerDetected}
        isTwoHands={isTwoHands}
      />

      {/* Loading State */}
      {!visionReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 text-white">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">❄️</div>
            <p className="font-light tracking-widest uppercase">Initializing Vision...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;