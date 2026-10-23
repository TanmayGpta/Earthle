import React from 'react';
import { ArtDecoCorner } from './ArtDecoFrame';

interface DecoCardProps {
  children: React.ReactNode;
  className?: string;
  cornerSize?: number;
  cornerColor?: string;
}

// Forest card with wheat Art Deco corners — the "Our promise" look, reused across the app
export default function DecoCard({
  children,
  className = '',
  cornerSize = 44,
  cornerColor = 'text-[#daba89]',
}: DecoCardProps) {
  return (
    <div className={`relative rounded-3xl bg-[#1c2c26] text-[#f5f5f1] overflow-hidden grain ${className}`}>
      <ArtDecoCorner position="top-left" size={cornerSize} className={cornerColor} />
      <ArtDecoCorner position="top-right" size={cornerSize} className={cornerColor} />
      <ArtDecoCorner position="bottom-left" size={cornerSize} className={cornerColor} />
      <ArtDecoCorner position="bottom-right" size={cornerSize} className={cornerColor} />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
