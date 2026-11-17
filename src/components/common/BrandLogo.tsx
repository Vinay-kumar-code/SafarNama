import React, { useId } from 'react';

export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
export type BrandLogoVariant = 'badge' | 'icon';

export interface BrandLogoProps {
  /** Size preset ('xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl') or numeric pixel width/height */
  size?: BrandLogoSize;
  /** 'badge' renders inside squircle container; 'icon' renders transparent standalone emblem */
  variant?: BrandLogoVariant;
  /** Enables radiant saffron-coral ambient drop-shadow glow */
  glow?: boolean;
  /** Enables rhythmic ambient pulse */
  pulse?: boolean;
  /** Enables slow, subtle rotation on the internal compass rose */
  animated?: boolean;
  /** Custom classes on container element */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Accessible title (defaults to 'Travel Journal & Compass Emblem') */
  title?: string;
}

const sizeMap: Record<string, number> = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
  '2xl': 96,
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'badge',
  glow = false,
  pulse = false,
  animated = false,
  className = '',
  onClick,
  title = 'Travel Journal & Compass Emblem',
}) => {
  const rawId = useId();
  // Sanitize React useId (which may contain colons like :r1:) for valid SVG ID selectors
  const id = rawId.replace(/[^a-zA-Z0-9-_]/g, '');

  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 36;

  // Gradient IDs scoped to this instance to prevent collisions
  const bgId = `bl-bg-${id}`;
  const borderId = `bl-border-${id}`;
  const ambientId = `bl-ambient-${id}`;
  const pinId = `bl-pin-${id}`;
  const pinRimId = `bl-rim-${id}`;
  const goldId = `bl-gold-${id}`;
  const stampId = `bl-stamp-${id}`;
  const lensId = `bl-lens-${id}`;
  const facetNLId = `bl-fnl-${id}`;
  const facetNDId = `bl-fnd-${id}`;
  const facetELId = `bl-fel-${id}`;
  const facetEDId = `bl-fed-${id}`;
  const facetSLId = `bl-fsl-${id}`;
  const facetSDId = `bl-fsd-${id}`;
  const facetWLId = `bl-fwl-${id}`;
  const facetWDId = `bl-fwd-${id}`;
  const blurId = `bl-blur-${id}`;
  const shadowId = `bl-shadow-${id}`;

  const glowStyle: React.CSSProperties = glow
    ? {
        filter: 'drop-shadow(0 0 14px rgba(255, 110, 40, 0.45))',
      }
    : {};

  return (
    <div
      onClick={onClick}
      role="img"
      aria-label={title}
      className={`inline-flex items-center justify-center shrink-0 select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${pulse ? 'animate-pulse' : ''} ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        ...glowStyle,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        width="100%"
        height="100%"
        fill="none"
      >
        <defs>
          <style>{`
            @keyframes brand-spin-slow-${id} {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .brand-rotating-${id} {
              transform-origin: 256px 214px;
              animation: brand-spin-slow-${id} 24s linear infinite;
            }
          `}</style>

          {/* Background Radial Gradient */}
          <radialGradient id={bgId} cx="50%" cy="32%" r="78%">
            <stop offset="0%" stopColor="#1B152B" />
            <stop offset="45%" stopColor="#0E0F18" />
            <stop offset="100%" stopColor="#06070B" />
          </radialGradient>

          {/* Canvas Border Gradient */}
          <linearGradient id={borderId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF9E1B" stopOpacity="0.6" />
            <stop offset="35%" stopColor="#FF3366" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#FFB300" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FF5252" stopOpacity="0.2" />
          </linearGradient>

          {/* Ambient Glow Gradient */}
          <radialGradient id={ambientId} cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#FF5722" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#FF9800" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FF3366" stopOpacity="0" />
          </radialGradient>

          {/* Location Pin Multi-Stop Sunset Saffron-Coral Gradient */}
          <linearGradient id={pinId} x1="15%" y1="5%" x2="85%" y2="95%">
            <stop offset="0%" stopColor="#FFA726" />
            <stop offset="22%" stopColor="#FF7A00" />
            <stop offset="50%" stopColor="#FF3366" />
            <stop offset="78%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#9F1239" />
          </linearGradient>

          {/* Pin Rim Light Gradient */}
          <linearGradient id={pinRimId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF9C4" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#FFD54F" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#FF5252" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFD54F" stopOpacity="0.7" />
          </linearGradient>

          {/* Gold Gradient */}
          <linearGradient id={goldId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFDE7" />
            <stop offset="25%" stopColor="#FFE082" />
            <stop offset="60%" stopColor="#FFC107" />
            <stop offset="100%" stopColor="#FF8F00" />
          </linearGradient>

          {/* Stamp Rings Gradient */}
          <linearGradient id={stampId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB300" />
            <stop offset="50%" stopColor="#FF3366" />
            <stop offset="100%" stopColor="#FF8A00" />
          </linearGradient>

          {/* Lens Backdrop */}
          <radialGradient id={lensId} cx="45%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#1A1526" />
            <stop offset="65%" stopColor="#0B0C12" />
            <stop offset="100%" stopColor="#050609" />
          </radialGradient>

          {/* Facet Gradients for 3D Compass Rose */}
          <linearGradient id={facetNLId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#FFF176" />
            <stop offset="100%" stopColor="#FFC107" />
          </linearGradient>
          <linearGradient id={facetNDId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFA000" />
            <stop offset="55%" stopColor="#FF5722" />
            <stop offset="100%" stopColor="#C2185B" />
          </linearGradient>

          <linearGradient id={facetELId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFF9C4" />
            <stop offset="100%" stopColor="#FFB300" />
          </linearGradient>
          <linearGradient id={facetEDId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF5722" />
            <stop offset="60%" stopColor="#E91E63" />
            <stop offset="100%" stopColor="#880E4F" />
          </linearGradient>

          <linearGradient id={facetSLId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFB74D" />
            <stop offset="100%" stopColor="#F4511E" />
          </linearGradient>
          <linearGradient id={facetSDId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E91E63" />
            <stop offset="100%" stopColor="#880E4F" />
          </linearGradient>

          <linearGradient id={facetWLId} x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="100%" stopColor="#FF9800" />
          </linearGradient>
          <linearGradient id={facetWDId} x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF3D00" />
            <stop offset="100%" stopColor="#AD1457" />
          </linearGradient>

          <filter id={blurId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="22" result="blur" />
          </filter>

          <filter id={shadowId} x="-30%" y="-20%" width="160%" height="160%">
            <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#FF2E63" floodOpacity="0.35" />
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* 1. Optional Squircle Canvas Container */}
        {variant === 'badge' && (
          <rect
            x="14"
            y="14"
            width="484"
            height="484"
            rx="112"
            fill={`url(#${bgId})`}
            stroke={`url(#${borderId})`}
            strokeWidth="2.5"
          />
        )}

        {/* 2. Ambient Atmosphere Radial Glow */}
        <circle cx="256" cy="236" r="165" fill={`url(#${ambientId})`} filter={`url(#${blurId})`} />

        {/* 3. Travel Journal Stamp Rings & Passport Notches */}
        <circle
          cx="256"
          cy="236"
          r="184"
          fill="none"
          stroke={`url(#${stampId})`}
          strokeWidth="2.2"
          strokeDasharray="4 6"
          opacity="0.55"
        />
        <circle
          cx="256"
          cy="236"
          r="168"
          fill="none"
          stroke={`url(#${goldId})`}
          strokeWidth="1.2"
          opacity="0.3"
        />

        {/* Travel Journal Page Curves (Wings flanking the emblem) */}
        <path
          d="M 132 236 C 132 152 184 102 256 102"
          fill="none"
          stroke={`url(#${stampId})`}
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.45"
        />
        <path
          d="M 380 236 C 380 152 328 102 256 102"
          fill="none"
          stroke={`url(#${stampId})`}
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.45"
        />
        {/* Journal Stitches */}
        <path
          d="M 148 236 C 148 168 190 122 256 122"
          fill="none"
          stroke={`url(#${goldId})`}
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity="0.25"
        />
        <path
          d="M 364 236 C 364 168 322 122 256 122"
          fill="none"
          stroke={`url(#${goldId})`}
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity="0.25"
        />

        {/* Tilted Globe / Map Coordinate Orbit */}
        <ellipse
          cx="256"
          cy="236"
          rx="186"
          ry="68"
          transform="rotate(-24 256 236)"
          fill="none"
          stroke={`url(#${goldId})`}
          strokeWidth="1.4"
          strokeDasharray="5 7"
          opacity="0.35"
        />

        {/* Cardinal Compass Diamond Markers on Outer Stamp Ring */}
        <polygon points="256,44 262,52 256,60 250,52" fill={`url(#${goldId})`} />
        <polygon points="256,412 262,420 256,428 250,420" fill="#FF4458" />
        <polygon points="432,236 440,230 448,236 440,242" fill={`url(#${goldId})`} />
        <polygon points="64,236 72,230 80,236 72,242" fill={`url(#${goldId})`} />

        {/* Diagonal Compass Coordinates (NE, SE, SW, NW dots) */}
        <circle cx="378" cy="122" r="3" fill="#FFE082" opacity="0.6" />
        <circle cx="134" cy="122" r="3" fill="#FFE082" opacity="0.6" />
        <circle cx="378" cy="350" r="3" fill="#FF5252" opacity="0.6" />
        <circle cx="134" cy="350" r="3" fill="#FF5252" opacity="0.6" />

        {/* 4. Location Pin Teardrop Silhouette */}
        <g filter={`url(#${shadowId})`}>
          <path
            d="M 256 124 C 306.8 124 348 165.2 348 216 C 348 276 290 350 256 404 C 222 350 164 276 164 216 C 164 165.2 205.2 124 256 124 Z"
            fill={`url(#${pinId})`}
          />
          <path
            d="M 256 124 C 306.8 124 348 165.2 348 216 C 348 276 290 350 256 404 C 222 350 164 276 164 216 C 164 165.2 205.2 124 256 124 Z"
            fill="none"
            stroke={`url(#${pinRimId})`}
            strokeWidth="2"
          />
        </g>

        {/* Coordinate Anchor Ripple below tip */}
        <ellipse cx="256" cy="426" rx="36" ry="9" fill="#FF3366" opacity="0.2" filter={`url(#${blurId})`} />
        <ellipse cx="256" cy="426" rx="22" ry="5.5" fill="none" stroke={`url(#${goldId})`} strokeWidth="1.2" opacity="0.5" />
        <circle cx="256" cy="426" r="3" fill={`url(#${goldId})`} />

        {/* 5. Inner Aperture & Travel Lens */}
        <circle cx="256" cy="214" r="66" fill={`url(#${lensId})`} stroke={`url(#${goldId})`} strokeWidth="3" />
        <circle
          cx="256"
          cy="214"
          r="58"
          fill="none"
          stroke={`url(#${stampId})`}
          strokeWidth="1.4"
          strokeDasharray="3 4"
          opacity="0.75"
        />

        {/* 6. 8-Point Faceted Geometric Compass Rose */}
        <g className={animated ? `brand-rotating-${id}` : ''}>
          {/* Secondary 4 Diagonal Points (NE, SE, SW, NW) */}
          <polygon points="256,214 276,194 266,204" fill={`url(#${facetNLId})`} opacity="0.9" />
          <polygon points="256,214 276,194 268,212" fill={`url(#${facetNDId})`} opacity="0.8" />

          <polygon points="256,214 276,234 268,216" fill={`url(#${facetELId})`} opacity="0.9" />
          <polygon points="256,214 276,234 266,224" fill={`url(#${facetEDId})`} opacity="0.8" />

          <polygon points="256,214 236,234 246,224" fill={`url(#${facetSLId})`} opacity="0.9" />
          <polygon points="256,214 236,234 244,216" fill={`url(#${facetSDId})`} opacity="0.8" />

          <polygon points="256,214 236,194 244,212" fill={`url(#${facetWLId})`} opacity="0.9" />
          <polygon points="256,214 236,194 246,204" fill={`url(#${facetWDId})`} opacity="0.8" />

          {/* Primary 4 Cardinal Points */}
          <polygon points="256,214 256,164 248,214" fill={`url(#${facetNLId})`} />
          <polygon points="256,214 256,164 264,214" fill={`url(#${facetNDId})`} />

          <polygon points="256,214 256,264 264,214" fill={`url(#${facetSLId})`} />
          <polygon points="256,214 256,264 248,214" fill={`url(#${facetSDId})`} />

          <polygon points="256,214 306,214 256,206" fill={`url(#${facetELId})`} />
          <polygon points="256,214 306,214 256,222" fill={`url(#${facetEDId})`} />

          <polygon points="256,214 206,214 256,222" fill={`url(#${facetWLId})`} />
          <polygon points="256,214 206,214 256,206" fill={`url(#${facetWDId})`} />

          {/* 7. Central Compass Jewel Pivot */}
          <circle cx="256" cy="214" r="11" fill={`url(#${goldId})`} />
          <circle cx="256" cy="214" r="6.5" fill="#FFFDF2" />
          <circle cx="256" cy="214" r="3.2" fill="#FF3366" />
        </g>
      </svg>
    </div>
  );
};

export default BrandLogo;
