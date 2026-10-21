'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Country, AnswerRecord } from '../types/game';
import { COUNTRIES } from '../data/countries';

interface InteractiveGlobeProps {
  targetCountry: Country | null;
  answers: Record<string, AnswerRecord>;
  onCountryHover: (country: Country | null, coords?: { x: number; y: number }) => void;
}

export default function InteractiveGlobe({
  targetCountry,
  answers,
  onCountryHover,
}: InteractiveGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [geoData, setGeoData] = useState<any>(null);

  // Map of ADM0_A3 -> Country object for fast lookup
  const countryMap = useRef<Map<string, Country>>(new Map());

  useEffect(() => {
    countryMap.current.clear();
    COUNTRIES.forEach((c) => {
      countryMap.current.set(c.code, c);
    });
  }, []);

  // Initialize Globe
  useEffect(() => {
    let isMounted = true;

    Promise.all([
      import('globe.gl'),
      fetch('/data/ne_110m.geojson').then((res) => res.json()),
    ])
      .then(([GlobeModule, data]) => {
        if (!isMounted || !containerRef.current) return;

        setGeoData(data);
        const Globe = GlobeModule.default;
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
          .atmosphereAltitude(0.2)
          .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
          .polygonsData(data.features)
          .polygonAltitude((feat: any) => {
            const code = feat.properties.ADM0_A3 || feat.properties.ISO_A3;
            if (targetCountry && code === targetCountry.code) return 0.045; // Pop up target
            if (answers[code]) return 0.02;
            return 0.008;
          })
          .polygonCapColor((feat: any) => {
            const code = feat.properties.ADM0_A3 || feat.properties.ISO_A3;
            // 1. Current Target: Acid Lime
            if (targetCountry && code === targetCountry.code) {
              return '#e5ff42';
            }
            // 2. Answered status
            const record = answers[code];
            if (record) {
              if (record.status === 'correct') return '#10b981'; // Emerald
              if (record.status === 'revealed') return '#f87171'; // Coral
              if (record.status === 'skipped') return '#fb923c'; // Amber
            }
            // 3. Default land
            return '#182b22';
          })
          .polygonSideColor((feat: any) => {
            const code = feat.properties.ADM0_A3 || feat.properties.ISO_A3;
            if (targetCountry && code === targetCountry.code) return 'rgba(229, 255, 66, 0.4)';
            const record = answers[code];
            if (record?.status === 'correct') return 'rgba(16, 185, 129, 0.3)';
            if (record?.status === 'revealed') return 'rgba(248, 113, 113, 0.3)';
            return '#0e1814';
          })
          .polygonStrokeColor((feat: any) => {
            const code = feat.properties.ADM0_A3 || feat.properties.ISO_A3;
            if (targetCountry && code === targetCountry.code) return '#ffffff';
            return 'rgba(245, 245, 241, 0.2)';
          })
          .onPolygonHover((feat: any, prevFeat: any) => {
            if (!feat) {
              onCountryHover(null);
              return;
            }
            const code = feat.properties.ADM0_A3 || feat.properties.ISO_A3;
            // Only allow hover card if the country has already been answered!
            if (answers[code]) {
              const country = countryMap.current.get(code);
              if (country) {
                onCountryHover(country);
              }
            } else {
              onCountryHover(null);
            }
          });

        const controls = globe.controls();
        if (controls) {
          controls.autoRotate = false; // User in control during game
          controls.enableZoom = true;
          controls.minDistance = 120;
          controls.maxDistance = 450;
        }

        globeRef.current = globe;

        const handleResize = () => {
          if (containerRef.current && globeRef.current) {
            globeRef.current.width(containerRef.current.clientWidth);
            globeRef.current.height(containerRef.current.clientHeight);
          }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      })
      .catch((err) => {
        console.error('Error initializing interactive globe:', err);
      });

    return () => {
      isMounted = false;
      if (globeRef.current) {
        try {
          globeRef.current._destructor?.();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Update polygon colors and altitudes when targetCountry or answers change
  useEffect(() => {
    if (!globeRef.current) return;

    // Trigger polygon re-render with updated colors
    globeRef.current
      .polygonAltitude((feat: any) => {
        const code = feat.properties.ADM0_A3 || feat.properties.ISO_A3;
        if (targetCountry && code === targetCountry.code) return 0.045;
        if (answers[code]) return 0.02;
        return 0.008;
      })
      .polygonCapColor((feat: any) => {
        const code = feat.properties.ADM0_A3 || feat.properties.ISO_A3;
        if (targetCountry && code === targetCountry.code) return '#e5ff42';
        const record = answers[code];
        if (record) {
          if (record.status === 'correct') return '#10b981';
          if (record.status === 'revealed') return '#f87171';
          if (record.status === 'skipped') return '#fb923c';
        }
        return '#182b22';
      })
      .polygonSideColor((feat: any) => {
        const code = feat.properties.ADM0_A3 || feat.properties.ISO_A3;
        if (targetCountry && code === targetCountry.code) return 'rgba(229, 255, 66, 0.4)';
        const record = answers[code];
        if (record?.status === 'correct') return 'rgba(16, 185, 129, 0.3)';
        if (record?.status === 'revealed') return 'rgba(248, 113, 113, 0.3)';
        return '#0e1814';
      });
  }, [targetCountry, answers]);

  // Smooth camera swoop to new target country
  useEffect(() => {
    if (!globeRef.current || !targetCountry) return;

    globeRef.current.pointOfView(
      {
        lat: targetCountry.lat,
        lng: targetCountry.lng,
        altitude: targetCountry.altitude,
      },
      1100 // 1.1s silky cinematic flight
    );
  }, [targetCountry]);

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden z-0">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
