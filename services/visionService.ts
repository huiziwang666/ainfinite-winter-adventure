import { FilesetResolver, FaceLandmarker, HandLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { Point, VisionResult } from "../types";

let faceLandmarker: FaceLandmarker | null = null;
let handLandmarker: HandLandmarker | null = null;
let isLoaded = false;

// Configuration
const FACE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const HAND_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
// Use a specific version for WASM to ensure compatibility
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";

export const initializeVision = async () => {
  if (isLoaded) return;

  const vision = await FilesetResolver.forVisionTasks(WASM_URL);

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: FACE_MODEL_URL,
      delegate: "GPU"
    },
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: 1
  });

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: HAND_MODEL_URL,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.3, // Lowered for better detection
    minHandPresenceConfidence: 0.3,
    minTrackingConfidence: 0.3
  });

  isLoaded = true;
};

export const processVideoFrame = (video: HTMLVideoElement, timestamp: number): VisionResult => {
  const result: VisionResult = {
    isMouthOpen: false,
    indexFingerTip: null,
    isTwoHandsDetected: false
  };

  if (!isLoaded || !faceLandmarker || !handLandmarker) return result;

  // 1. Face Analysis (Breath Detection)
  try {
    const faceResult = faceLandmarker.detectForVideo(video, timestamp);
    
    if (faceResult.faceBlendshapes && faceResult.faceBlendshapes.length > 0) {
      const categories = faceResult.faceBlendshapes[0].categories;
      const jawOpen = categories.find(c => c.categoryName === 'jawOpen')?.score || 0;
      
      if (jawOpen > 0.4) {
        result.isMouthOpen = true;
      }
    }
  } catch (e) {
    console.warn("Face detection error", e);
  }

  // 2. Hand Analysis (Drawing & Snow)
  try {
    const handResult = handLandmarker.detectForVideo(video, timestamp);

    if (handResult.landmarks && handResult.landmarks.length > 0) {
      // Check for Two Hands (Snow Trigger)
      if (handResult.landmarks.length >= 2) {
        result.isTwoHandsDetected = true;
      }

      // Check for Index Finger (Drawing)
      const primaryHand = handResult.landmarks[0];
      const indexTip = primaryHand[8]; // Index finger tip
      
      // We return the coordinate relative to the VIDEO frame.
      // We mirror X here because the user sees a mirrored video.
      result.indexFingerTip = {
        x: 1 - indexTip.x, 
        y: indexTip.y
      };
    }
  } catch (e) {
    console.warn("Hand detection error", e);
  }

  return result;
};