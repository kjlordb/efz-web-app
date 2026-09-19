import React, { useState, useRef, useEffect } from 'react';

export type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BrandLogoProps {
  size?: LogoSize;
  useVideo?: boolean;
  imageVariant?: '3d' | 'flat';
  withMotion?: boolean;
  glowEffect?: boolean;
  showOrbitalRing?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  sm: {
    wrapper: 'w-12 h-12', // 48px bounded footprint
    core: 'w-9 h-9',       // 36px core
    ringOuter: 'inset-0.5',
    ringInner: 'inset-1.5',
    orbitDot: 'w-1 h-1',
    padding: 'p-[1.5px]'
  },
  md: {
    wrapper: 'w-16 h-16', // 64px bounded footprint (fits in 80px navbar with 8px clearance)
    core: 'w-12 h-12',    // 48px core
    ringOuter: 'inset-0.5',
    ringInner: 'inset-2',
    orbitDot: 'w-1.5 h-1.5',
    padding: 'p-[2px]'
  },
  lg: {
    wrapper: 'w-32 h-32', // 128px bounded footprint (centered in 288px sidebar)
    core: 'w-24 h-24',    // 96px core
    ringOuter: 'inset-1',
    ringInner: 'inset-3.5',
    orbitDot: 'w-2 h-2',
    padding: 'p-[2.5px]'
  },
  xl: {
    wrapper: 'w-44 h-44', // 176px bounded footprint (Dashboard banner)
    core: 'w-34 h-34',    // 136px core
    ringOuter: 'inset-1.5',
    ringInner: 'inset-5',
    orbitDot: 'w-2.5 h-2.5',
    padding: 'p-[3px]'
  },
  '2xl': {
    wrapper: 'w-56 h-56', // 224px bounded footprint
    core: 'w-42 h-42',    // 168px core
    ringOuter: 'inset-2',
    ringInner: 'inset-6',
    orbitDot: 'w-3 h-3',
    padding: 'p-[3.5px]'
  }
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  useVideo = true,
  imageVariant = '3d',
  withMotion = true,
  glowEffect = true,
  showOrbitalRing = true,
  className = '',
  onClick
}) => {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentSize = sizeMap[size] || sizeMap.md;

  const fallbackImage = imageVariant === '3d' ? '/efz-3d-gold.png' : '/logo.png';

  // Ensure autoplay starts without user interaction restrictions
  useEffect(() => {
    if (useVideo && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback: video remains muted and ready
      });
    }
  }, [useVideo]);

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none group transition-transform duration-500 ease-out cursor-default ${currentSize.wrapper} ${
        withMotion ? 'hover:scale-105' : ''
      } ${className}`}
    >
      {/* 1. Ambient Dual-Tone Glow (Gold + Teal Aura) — Contained */}
      {glowEffect && (
        <div
          className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-700 ${
            withMotion ? 'animate-aura-pulse' : 'opacity-60'
          }`}
          style={{
            background:
              'radial-gradient(circle, rgba(248,207,67,0.45) 0%, rgba(14,84,96,0.35) 55%, transparent 75%)',
            filter: 'blur(8px)'
          }}
        />
      )}

      {/* 2. Outer Counter-Orbit Tech Ring with Golden Starlets — Contained */}
      {showOrbitalRing && withMotion && (
        <div
          className={`absolute ${currentSize.ringOuter} rounded-full border border-teal-500/35 animate-spin-slow-reverse pointer-events-none opacity-80 group-hover:opacity-100 group-hover:border-teal-400/60 transition-colors`}
        >
          {/* Orbital Accent Gem 1 */}
          <span
            className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 ${currentSize.orbitDot} bg-amber-400 rounded-full shadow-[0_0_6px_#f8cf43]`}
          />
          {/* Orbital Accent Gem 2 */}
          <span
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 ${currentSize.orbitDot} bg-teal-300 rounded-full shadow-[0_0_6px_#38b1cb]`}
          />
        </div>
      )}

      {/* 3. Primary Clockwise Orbit Ring with Dashes — Contained */}
      {showOrbitalRing && withMotion && (
        <div
          className={`absolute ${currentSize.ringInner} rounded-full border border-dashed border-amber-400/50 animate-spin-slow pointer-events-none group-hover:border-amber-300 transition-colors`}
        />
      )}

      {/* 4. Motion-Floating Logo Core Container */}
      <div
        className={`relative ${currentSize.core} ${
          withMotion ? 'animate-float-gentle' : ''
        }`}
      >
        {/* Metallic Bevel Ring (Gold to Teal Gradient Border) */}
        <div
          className={`w-full h-full rounded-full ${currentSize.padding} bg-gradient-to-tr from-amber-400 via-amber-200 to-teal-700 shadow-xl shadow-slate-950/50 relative overflow-hidden transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(248,207,67,0.5)]`}
        >
          {/* Inner Backing Plate */}
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
            {/* Motion Video Layer (Generate_a_premium_motion-grap.mp4) */}
            {useVideo && !videoError ? (
              <video
                ref={videoRef}
                src="/motion-logo.mp4"
                poster={fallbackImage}
                autoPlay
                loop
                muted
                playsInline
                onError={() => setVideoError(true)}
                className="w-full h-full object-cover scale-105 relative z-10 transition-transform duration-500 ease-out group-hover:scale-115"
              />
            ) : (
              /* Photorealistic 3D Brushed Gold Masterpiece Image */
              <img
                src={fallbackImage}
                alt="EFZ Davao Computer Sales"
                className="w-full h-full object-cover relative z-10 transition-transform duration-500 ease-out group-hover:scale-105"
              />
            )}

            {/* 5. Specular Metallic Light-Sweep (Glass Sheen Effect) */}
            {withMotion && (
              <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-full">
                <div
                  className="w-[200%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer-sweep pointer-events-none"
                  style={{ transform: 'skewX(-20deg)' }}
                />
              </div>
            )}

            {/* 6. Subtle 3D Spherical Curved Lens Glare */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/25 via-white/5 to-transparent rounded-t-full pointer-events-none z-20" />
          </div>
        </div>
      </div>
    </div>
  );
};
