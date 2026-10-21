import React from 'react';

export type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface ArtDecoCornerProps {
  position?: CornerPosition;
  className?: string;
  size?: number;
}

/**
 * Exact Art Deco Radial Corner Bracket extracted from Rainmaker design system.
 * Features concentric stepped arcs, square inner facet, and extended framing rails.
 */
export function ArtDecoCorner({
  position = 'top-left',
  className = 'text-[#e5ff42]',
  size = 54,
}: ArtDecoCornerProps) {
  // Transformation based on position
  // The raw SVG's outer corner is at bottom-left (x=1.17, y=125.33)
  let transform = '';
  let positionClass = '';

  switch (position) {
    case 'top-left':
      // Flip vertically: corner is at (0, 0)
      transform = 'scale(1, -1)';
      positionClass = 'top-0 left-0';
      break;
    case 'top-right':
      // Flip both horizontally and vertically
      transform = 'scale(-1, -1)';
      positionClass = 'top-0 right-0';
      break;
    case 'bottom-left':
      // Default orientation
      transform = 'none';
      positionClass = 'bottom-0 left-0';
      break;
    case 'bottom-right':
      // Flip horizontally
      transform = 'scale(-1, 1)';
      positionClass = 'bottom-0 right-0';
      break;
  }

  return (
    <div
      className={`absolute ${positionClass} pointer-events-none select-none z-10 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 127 127"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform, transformOrigin: 'center' }}
      >
        <path
          stroke="currentColor"
          strokeWidth="1.5"
          d="M55.5805 118.224C55.5805 111.998 54.3541 105.832 51.9712 100.079C49.5882 94.3259 46.0956 89.0987 41.6925 84.6957C37.2895 80.2926 32.0623 76.7999 26.3094 74.417C20.5566 72.0341 14.3907 70.8076 8.16382 70.8076L8.16382 118.224L55.5805 118.224Z"
        />
        <path
          stroke="currentColor"
          strokeWidth="1.5"
          d="M116.919 118.224L61.8566 118.224C61.8566 111.173 60.4678 104.191 57.7695 97.677C55.0712 91.1627 51.1162 85.2437 46.1304 80.2578C41.1445 75.272 35.2255 71.317 28.7112 68.6187C22.1969 65.9204 15.2149 64.5316 8.16382 64.5316L8.16465 9.47028"
        />
        <rect
          width="23.9046"
          height="23.9041"
          stroke="currentColor"
          strokeWidth="1.5"
          transform="matrix(1 8.74228e-08 8.74228e-08 -1 14.4338 111.98)"
        />
        <path
          stroke="currentColor"
          strokeWidth="1.5"
          d="M21.4307 87.8994L21.4307 34.5252L14.3643 27.4588"
        />
        <path
          stroke="currentColor"
          strokeWidth="1.5"
          d="M38.3888 104.963L91.763 104.963L98.8294 112.029"
        />
        <path
          stroke="currentColor"
          strokeWidth="1.5"
          d="M14.4178 87.9116L14.4179 9.4463L8.17758 3.12101L8.17757 9.49437"
        />
        <path
          stroke="currentColor"
          strokeWidth="1.5"
          d="M38.377 111.975L116.842 111.975L123.168 118.216L116.794 118.216"
        />
        <path
          stroke="currentColor"
          strokeMiterlimit="10"
          strokeWidth="1.5"
          d="M14.457 112.048L14.457 48.2445L1.17096 34.9585L1.17095 125.334L91.5469 125.334L78.2609 112.048L14.6807 112.048L14.457 112.048Z"
        />
      </svg>
    </div>
  );
}

interface ArtDecoFrameProps {
  children: React.ReactNode;
  className?: string;
  corners?: ('top-left' | 'top-right' | 'bottom-left' | 'bottom-right')[];
  cornerSize?: number;
  cornerColor?: string;
  badge?: string;
}

/**
 * Architectural container that wraps elements with Rainmaker-style
 * sharp hairline technical borders, Art Deco corner brackets, and monospace index tags.
 */
export default function ArtDecoFrame({
  children,
  className = '',
  corners = ['top-left', 'top-right'],
  cornerSize = 46,
  cornerColor = 'text-[#e5ff42]',
  badge,
}: ArtDecoFrameProps) {
  return (
    <div
      className={`relative bg-[#13201b]/85 border border-[#275f4b]/80 backdrop-blur-md rounded-none transition-all duration-300 hover:border-[#628c7d] ${className}`}
    >
      {/* Corner Brackets */}
      {corners.map((pos) => (
        <ArtDecoCorner key={pos} position={pos} size={cornerSize} className={cornerColor} />
      ))}

      {/* Optional Top Hairline Tech Badge */}
      {badge && (
        <div className="px-5 pt-3.5 pb-1 flex items-center justify-between border-b border-[#275f4b]/40 text-[10px] font-mono tracking-widest uppercase text-[#628c7d]">
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-[#e5ff42]" />
            {badge}
          </span>
          <span className="text-[#275f4b] font-mono">+</span>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10">{children}</div>

      {/* Subtle corner crosshairs */}
      <span className="absolute -top-1.5 -left-1.5 text-[10px] font-mono text-[#275f4b] pointer-events-none select-none">
        +
      </span>
      <span className="absolute -top-1.5 -right-1.5 text-[10px] font-mono text-[#275f4b] pointer-events-none select-none">
        +
      </span>
      <span className="absolute -bottom-1.5 -left-1.5 text-[10px] font-mono text-[#275f4b] pointer-events-none select-none">
        +
      </span>
      <span className="absolute -bottom-1.5 -right-1.5 text-[10px] font-mono text-[#275f4b] pointer-events-none select-none">
        +
      </span>
    </div>
  );
}
