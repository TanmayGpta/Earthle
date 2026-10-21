'use client';

import React, { useEffect, useRef, useState } from 'react';

interface HeroGlobeProps {
  scrollProgress: number; // 0 to 1
}

export default function HeroGlobe({ scrollProgress }: HeroGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<any>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Load countries GeoJSON and initialize globe.gl
    Promise.all([
      import('globe.gl'),
      fetch('/data/ne_110m.geojson').then((res) => res.json()),
    ])
      .then(([GlobeModule, geoData]) => {
        if (!isMounted || !containerRef.current) return;

        const Globe = GlobeModule.default;

        // Clean up any existing canvas in container
        containerRef.current.innerHTML = '';

        const width = containerRef.current.clientWidth || window.innerWidth;
        const height = containerRef.current.clientHeight || window.innerHeight;

        const globe = new (Globe as any)(containerRef.current)
          .width(width)
          .height(height)
          .backgroundColor('rgba(0, 0, 0, 0)')
          .showGlobe(true)
          .showAtmosphere(true)
          .atmosphereColor('#628c7d')
          .atmosphereAltitude(0.18)
          .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg') // Dark subtle base
          .polygonsData(geoData.features)
          .polygonAltitude(0.008)
          .polygonCapColor(() => '#162820') // Deep spruce land
          .polygonSideColor(() => '#0f1a15')
          .polygonStrokeColor(() => 'rgba(245, 245, 241, 0.15)'); // Clean bone boundary

        // Auto-rotation
        const controls = globe.controls();
        if (controls) {
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.8;
          controls.enableZoom = false;
          controls.enablePan = false;
          controls.enableRotate = false; // Passive in hero mode
        }

        globe.pointOfView({ lat: 15, lng: 20, altitude: 2.2 }, 0);

        globeInstanceRef.current = globe;
        setDataLoaded(true);

        const handleResize = () => {
          if (containerRef.current && globeInstanceRef.current) {
            globeInstanceRef.current.width(containerRef.current.clientWidth);
            globeInstanceRef.current.height(containerRef.current.clientHeight);
          }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      })
      .catch((err) => {
        console.error('Failed to load hero globe:', err);
      });

    return () => {
      isMounted = false;
      if (globeInstanceRef.current) {
        try {
          globeInstanceRef.current._destructor?.();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Compute interpolated transform based on scroll
  // At scroll 0: globe is pushed down so only the top crest shows
  // At scroll 1: globe pulls up to top-center and scales down
  const translateY = 38 - scrollProgress * 44; // 38% down -> -6% up
  const scale = 1.35 - scrollProgress * 0.45; // 1.35 scale -> 0.9 scale
  const opacity = 1 - scrollProgress * 0.15;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center transition-transform duration-75 ease-out"
      style={{
        transform: `translateY(${translateY}%) scale(${scale})`,
        opacity,
      }}
    >
      <div
        ref={containerRef}
        className="w-[100vw] h-[100vh] max-w-[1200px] max-h-[1200px] flex items-center justify-center"
      />
      {!dataLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-[#e5ff42]/20 border-t-[#e5ff42] animate-spin" />
        </div>
      )}
    </div>
  );
}
