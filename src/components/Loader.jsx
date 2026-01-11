import React from 'react';

export default function Loader({ text = "INITIALIZING VOID PROTOCOLS..." }) {
  return (
    <div className="min-h-[70vh] md:min-h-[80vh] w-full flex flex-col items-center justify-center p-8">
      
      {/* VIDEO CONTAINER */}
      <div className="relative w-64 h-64 md:w-96 md:h-96 mb-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="relative z-10 w-full h-full object-contain"
        >
          <source src="/planet.mp4" type="video/mp4" />
        </video>
      </div>

      {/* TEXT LOADING ANIMATION */}
      <div className="flex flex-col items-center gap-2">
        {/* ADDED 'text-center' to fix uneven text wrapping */}
        <p className="text-xs md:text-sm font-mono font-bold text-white tracking-[0.2em] animate-pulse text-center">
          {text}
        </p>
        
        {/* Loading Bar */}
        <div className="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-white/50 w-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}