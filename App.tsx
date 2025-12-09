import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { initializeVision, processVideoFrame } from './services/visionService';
import InfoPanel from './components/InfoPanel';
import FogLayer from './components/FogLayer';
import SnowSystem from './components/SnowSystem';
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
  const [drawPoint, setDrawPoint] = useState<Point | null>(null);

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
      const { isMouthOpen, indexFingerTip, isTwoHandsDetected } = processVideoFrame(video, now);

      // Map coordinates from Video space to Screen space
      let screenFingerTip: Point | null = null;
      if (indexFingerTip) {
        screenFingerTip = mapVideoToScreen(indexFingerTip, video);
      }

      // --- State Machine Logic ---
      const currentState = appStateRef.current;

      // 1. CLEAR -> FOGGING
      if (currentState === AppState.CLEAR) {
        if (isMouthOpen) {
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
        
        // Snow Trigger (Two Hands)
        // If two hands are detected, trigger snow AND disable drawing
        if (isTwoHandsDetected) {
           if (currentState !== AppState.SNOWING) {
               setAppState(AppState.SNOWING);
           }
           // Disable drawing while holding two hands
           setDrawPoint(null);
        } else {
           // Normal drawing if single hand/finger
           setDrawPoint(screenFingerTip);
        }

        // Reset Trigger (Breath again)
        if (isMouthOpen && (now - lastInteractionTimeRef.current > RESET_COOLDOWN)) {
             if (!breathStartTimeRef.current) breathStartTimeRef.current = now;
             if (now - breathStartTimeRef.current > BREATH_TRIGGER_DURATION) {
                 setAppState(AppState.RESETTING);
                 breathStartTimeRef.current = null;
             }
        } else {
            if (!isMouthOpen) breathStartTimeRef.current = null;
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
         <Webcam
          ref={webcamRef}
          audio={false}
          className="w-full h-full object-cover filter blur-[2px] brightness-110 contrast-110 transform -scale-x-100"
          screenshotFormat="image/jpeg"
        />
      </div>

      {/* 2. Fog Layer (Canvas) */}
      <FogLayer 
        opacity={fogOpacity} 
        drawPoint={drawPoint} 
        isResetting={appState === AppState.RESETTING}
      />

      {/* 3. Snow Layer */}
      <SnowSystem active={appState === AppState.SNOWING} />

      {/* 4. UI Layer */}
      <InfoPanel />

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