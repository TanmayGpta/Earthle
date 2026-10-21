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
          .polygonCapColor(() => '#274137') // Rainmaker forest land
          .polygonSideColor(() => '#1a2c25')
          .polygonStrokeColor(() => 'rgba(245, 245, 241, 0.18)'); // Clean bone boundary // Clean bone boundary

        // Auto-rotation
        const controls = globe.controls();
        if (controls) {
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.8;
          controls.enableZoom = false;
          controls.enablePan = false;
          controls.enableRotate = false; // Passive in hero mode
        }

        globe.pointOfView({ lat: 15, lng: 20, altitude: 1.7 }, 0);

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

  // Compute multi-stage interpolated transform based on scroll
  // Stage 1 (0 to 0.5): Globe decreases and lifts up while hero content is in focus
  // Stage 2 (0.5 to 1.0): Globe remains docked as an elegant header piece while mode cards are browsed
  let translateY = 32;
  let scale = 1.6;

  if (scrollProgress <= 0.5) {
    const p = scrollProgress / 0.5;
    const ease = 1 - Math.pow(1 - p, 2); // Quadratic ease-out
    translateY = 32 - ease * 50; // 32% (half-earth) -> -18% (docked)
    scale = 1.6 - ease * 0.75;   // 1.6 (grand) -> 0.85 (docked)
  } else {
    const p = (scrollProgress - 0.5) / 0.5;
    translateY = -18 - p * 3;     // -18% -> -21%
    scale = 0.85 - p * 0.05;      // 0.85 -> 0.80
  }
  const opacity = 1 - scrollProgress * 0.08;

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
        className="w-[100vw] h-[100vh] flex items-center justify-center"
      />
      {!dataLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-[#e5ff42]/20 border-t-[#e5ff42] animate-spin" />
        </div>
      )}
    </div>
  );
}
