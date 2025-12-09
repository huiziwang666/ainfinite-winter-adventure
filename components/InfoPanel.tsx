import React from 'react';

const InfoPanel: React.FC = () => {
  return (
    <div className="absolute top-1/2 left-8 transform -translate-y-1/2 bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 w-80 shadow-lg border border-white/10 text-white z-50 pointer-events-none select-none">
      <h1 className="text-xl font-light tracking-widest text-white/90 mb-1 uppercase">
        AInfinite Winter Adventure
      </h1>
      <h2 className="text-xs font-bold tracking-widest text-white/60 mb-6">
        VISION READY. POINT TO DRAW.
      </h2>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">❄</span>
          <div>
            <span className="font-bold text-sm block">Breath</span>
            <span className="text-xs text-white/80">Open mouth to fog glass.</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-2xl">✏️</span>
          <div>
            <span className="font-bold text-sm block">Draw</span>
            <span className="text-xs text-white/80">Point index finger to draw.</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-2xl">🌨</span>
          <div>
            <span className="font-bold text-sm block">Snow</span>
            <span className="text-xs text-white/80">Hold two hands to make it snow.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;