import React from 'react';

interface GothicLogoProps {
  className?: string;
  size?: number | string;
}

/**
 * 3-Arm Gothic Blackletter "E" lettermark.
 * Features an authentic medieval fractured stem, angular roof, middle tongue,
 * and sweeping base so it is unmistakably recognized as an "E" (not a "C").
 */
export default function GothicLogo({ className = 'text-[#f5f5f1]', size = 36 }: GothicLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 344 770"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-colors duration-300 ${className}`}
      aria-label="Earthle Gothic Logo E"
    >
      <path d="M138.0 97.0Q128.0 97.0 120.0 107.0L120.0 371.0L261.0 371.0L261.0 395.0L211.0 420.0L120.0 420.0L120.0 520.0Q120.0 631.0 142.0 650.0Q175.0 678.0 214.0 682.0Q253.0 686.0 298.0 686.0L298.0 715.0Q293.0 715.0 224.0 742.5Q155.0 770.0 140.0 770.0Q109.0 770.0 54.5 722.0Q0.0 674.0 0.0 618.0L0.0 92.0Q0.0 85.0 114.5 42.5Q229.0 0.0 246.0 0.0Q252.0 0.0 260.0 29.0Q268.0 58.0 278.5 99.0Q289.0 140.0 300.5 159.5Q312.0 179.0 344.0 179.0L344.0 199.0Q322.0 209.0 269.5 234.5Q217.0 260.0 213.0 260.0Q198.0 260.0 175.0 178.5Q152.0 97.0 138.0 97.0Z" />
    </svg>
  );
}
