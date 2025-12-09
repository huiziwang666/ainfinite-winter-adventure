export enum AppState {
  CLEAR = 'CLEAR',
  FOGGING = 'FOGGING',
  DRAWING = 'DRAWING',
  SNOWING = 'SNOWING',
  RESETTING = 'RESETTING'
}

export interface Point {
  x: number;
  y: number;
}

export interface VisionResult {
  isMouthOpen: boolean;
  indexFingerTip: Point | null; // Normalized 0-1
  isTwoHandsDetected: boolean;
}
