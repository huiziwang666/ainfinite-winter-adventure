import React from 'react';

interface DetectionIndicatorProps {
  isMouthOpen: boolean;
  isFingerDetected: boolean;
  isTwoHands: boolean;
}

const DetectionIndicator: React.FC<DetectionIndicatorProps> = ({
  isMouthOpen,
  isFingerDetected,
  isTwoHands
}) => {
  return (
    <div className="absolute bottom-4 left-4 z-50 bg-black/60 rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-3 text-white">
        {/* Mouth indicator */}
        <div className="flex items-center gap-3">
          <span className={`text-3xl transition-transform duration-150 ${isMouthOpen ? 'scale-125' : 'scale-100'}`}>
            {isMouthOpen ? '😮' : '😶'}
          </span>
          <span className={`text-sm font-medium ${isMouthOpen ? 'text-green-400' : 'text-gray-400'}`}>
            {isMouthOpen ? 'Breathing!' : 'Mouth'}
          </span>
        </div>

        {/* Finger indicator */}
        <div className="flex items-center gap-3">
          <span className={`text-3xl transition-transform duration-150 ${isFingerDetected ? 'scale-125' : 'scale-100'}`}>
            {isFingerDetected ? '☝️' : '✋'}
          </span>
          <span className={`text-sm font-medium ${isFingerDetected ? 'text-green-400' : 'text-gray-400'}`}>
            {isFingerDetected ? 'Drawing!' : 'Finger'}
          </span>
        </div>

        {/* Two hands indicator */}
        <div className="flex items-center gap-3">
          <span className={`text-3xl transition-transform duration-150 ${isTwoHands ? 'scale-125' : 'scale-100'}`}>
            {isTwoHands ? '🙌' : '👐'}
          </span>
          <span className={`text-sm font-medium ${isTwoHands ? 'text-green-400' : 'text-gray-400'}`}>
            {isTwoHands ? 'Snowing!' : 'Two Hands'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DetectionIndicator;
