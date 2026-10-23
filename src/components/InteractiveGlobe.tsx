'use client';

import React, { useEffect, useRef } from 'react';
import { Country, AnswerRecord } from '../types/game';
import { COUNTRIES } from '../data/countries';

interface InteractiveGlobeProps {
  targetCountry: Country | null;
  answers: Record<string, AnswerRecord>;
  onCountryHover: (country: Country | null, coords?: { x: number; y: number }) => void;
}

// Map of ADM0_A3 -> Country object for fast lookup
const COUNTRY_MAP = new Map(COUNTRIES.map((c) => [c.code, c]));

const featCode = (feat: any): string => feat.properties.ADM0_A3 || feat.properties.ISO_A3;

export default function InteractiveGlobe({
  targetCountry,
  answers,
  onCountryHover,
}: InteractiveGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);

  // Accessors read from refs so they always see the latest props
  const targetRef = useRef(targetCountry);
  const answersRef = useRef(answers);
  const hoveredCodeRef = useRef<string | null>(null);
  const onHoverRef = useRef(onCountryHover);

  // Sync refs before the other effects below run (effects run in declaration order)
  useEffect(() => {
    targetRef.current = targetCountry;
    answersRef.current = answers;
    onHoverRef.current = onCountryHover;
  });

  // Re-assign polygon accessors (new function identities force globe.gl to re-evaluate)
  const refreshPolygons = () => {
    const globe = globeRef.current;
    if (!globe) return;

    globe
      .polygonAltitude((feat: any) => {
        const code = featCode(feat);
        if (code === targetRef.current?.code) return 0.045; // Pop up target
        if (code === hoveredCodeRef.current) return 0.025;
        if (answersRef.current[code]) return 0.02;
        return 0.008;
      })
      .polygonCapColor((feat: any) => {
        const code = featCode(feat);
        // 1. Current Target: Acid Lime
        if (code === targetRef.current?.code) return '#e5ff42';
        // 2. Answered status
        const record = answersRef.current[code];
        if (record?.status === 'correct') return '#10b981'; // Emerald
        if (record?.status === 'revealed') return '#f87171'; // Coral
        if (record?.status === 'skipped') return '#fb923c'; // Amber
        // 3. Default land (slightly lifted when hovered)
        return code === hoveredCodeRef.current ? '#33574a' : '#274137';
      })
      .polygonSideColor((feat: any) => {
        const code = featCode(feat);
        if (code === targetRef.current?.code) return 'rgba(229, 255, 66, 0.4)';
        const record = answersRef.current[code];
        if (record?.status === 'correct') return 'rgba(16, 185, 129, 0.3)';
        if (record?.status === 'revealed') return 'rgba(248, 113, 113, 0.3)';
        if (record?.status === 'skipped') return 'rgba(251, 146, 60, 0.3)';
        return '#1a2c25';
      })
      .polygonStrokeColor((feat: any) => {
        const code = featCode(feat);
        if (code === hoveredCodeRef.current || code === targetRef.current?.code) return '#ffffff';
        return 'rgba(245, 245, 241, 0.25)';
      });
  };

  const flyToTarget = (ms: number) => {
    const target = targetRef.current;
    if (!globeRef.current || !target) return;
    globeRef.current.pointOfView({ lat: target.lat, lng: target.lng, altitude: target.altitude }, ms);
  };

  // Initialize Globe
  useEffect(() => {
    let isMounted = true;
    let handleResize: (() => void) | null = null;

    Promise.all([
      import('globe.gl'),
      fetch('/data/ne_110m.geojson').then((res) => res.json()),
    ])
      .then(([GlobeModule, data]) => {
        if (!isMounted || !containerRef.current) return;

        const Globe = GlobeModule.default;
        const container = containerRef.current;
        container.innerHTML = '';

        const globe = new (Globe as any)(container)
          .width(container.clientWidth || window.innerWidth)
          .height(container.clientHeight || window.innerHeight)
          .backgroundColor('rgba(0, 0, 0, 0)')
          .showGlobe(true)
          .showAtmosphere(true)
          .atmosphereColor('#628c7d')
          .atmosphereAltitude(0.2)
          .globeImageUrl('/img/earth-dark.jpg')
          .polygonsData(data.features)
          .polygonsTransitionDuration(250)
          .onPolygonHover((feat: any) => {
            const code = feat ? featCode(feat) : null;
            if (code !== hoveredCodeRef.current) {
              hoveredCodeRef.current = code;
              refreshPolygons();
            }

            // Only show the info card if the country has already been answered
            const country = code && answersRef.current[code] ? COUNTRY_MAP.get(code) : undefined;
            onHoverRef.current(country ?? null);
            container.style.cursor = code ? 'pointer' : 'grab';
          });

        const controls = globe.controls();
        if (controls) {
          controls.autoRotate = false; // User in control during game
          controls.enableZoom = true;
          controls.minDistance = 120;
          controls.maxDistance = 450;
        }

        globeRef.current = globe;
        refreshPolygons();
        flyToTarget(0);

        handleResize = () => {
          if (containerRef.current && globeRef.current) {
            globeRef.current.width(containerRef.current.clientWidth);
            globeRef.current.height(containerRef.current.clientHeight);
          }
        };
        window.addEventListener('resize', handleResize);
      })
      .catch((err) => {
        console.error('Error initializing interactive globe:', err);
      });

    return () => {
      isMounted = false;
      if (handleResize) window.removeEventListener('resize', handleResize);
      try {
        globeRef.current?._destructor?.();
      } catch (e) {
        // ignore
      }
      globeRef.current = null;
    };
  }, []);

  // Update polygon colors and altitudes when targetCountry or answers change
  useEffect(() => {
    refreshPolygons();
  }, [targetCountry, answers]);

  // Smooth camera swoop to new target country
  useEffect(() => {
    flyToTarget(1100); // 1.1s silky cinematic flight
  }, [targetCountry]);

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden z-0">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
