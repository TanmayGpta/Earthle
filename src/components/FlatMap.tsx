'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo';
import type { Feature, FeatureCollection } from 'geojson';
import { motion } from 'motion/react';
import { Minus, Plus, Maximize } from 'lucide-react';
import { Country, AnswerRecord } from '../types/game';
import { COUNTRIES } from '../data/countries';

interface FlatMapProps {
  answers: Record<string, AnswerRecord>;
  // Country to mark with a pulsing ring (small islands are invisible at world zoom)
  focusCountry: Country | null;
  onCountryHover: (country: Country | null) => void;
}

type View = { k: number; x: number; y: number; ms: number };

const COUNTRY_MAP = new Map(COUNTRIES.map((c) => [c.code, c]));
const featCode = (f: Feature): string => f.properties?.ADM0_A3 || f.properties?.ISO_A3;

const MIN_K = 1;
const MAX_K = 14;
const HOME: View = { k: 1, x: 0, y: 0, ms: 600 };
const PAD = 16;
const PAD_TOP = 64;

const STATUS_FILL: Record<AnswerRecord['status'], string> = {
  correct: '#10b981',
  revealed: '#f87171',
  skipped: '#fb923c',
};

// Static world map with wheel/drag/pinch zoom. Same palette as the globe.
export default function FlatMap({ answers, focusCountry, onCountryHover }: FlatMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setViewState] = useState<View>(HOME);
  const [hovered, setHovered] = useState<string | null>(null);

  // Live copy for event handlers that fire faster than React re-renders (wheel, pinch)
  const viewRef = useRef(view);
  const setView = (v: View) => {
    viewRef.current = v;
    setViewState(v);
  };
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; mid: { x: number; y: number } } | null>(null);

  useEffect(() => {
    fetch('/data/ne_110m.geojson')
      .then((res) => res.json())
      .then((data: FeatureCollection) => setFeatures(data.features.filter((f) => featCode(f) !== 'ATA')))
      .catch((err) => console.error('Error loading map:', err));
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fit all land inside the panel (the parent decides the panel's size); top clears the HUD pill
  const { paths, project, graticule, bounds } = useMemo(() => {
    const { w, h } = size;
    if (!w || !h || !features.length) return { paths: [], project: null, graticule: '', bounds: null };
    const land: FeatureCollection = { type: 'FeatureCollection', features };
    const projection = geoNaturalEarth1().fitExtent([[PAD, PAD_TOP], [w - PAD, h - PAD]], land);
    const path = geoPath(projection);
    return {
      paths: features.map((f) => ({ code: featCode(f), d: path(f) ?? '' })),
      project: projection,
      graticule: path(geoGraticule10()) ?? '',
      bounds: path.bounds(land),
    };
  }, [features, size]);

  // Pan limits: land edges may come at most `pad` px inside the screen edges
  const clamp = (v: View): View => {
    const k = Math.min(MAX_K, Math.max(MIN_K, v.k));
    if (!bounds) return { ...v, k };
    const [[x0, y0], [x1, y1]] = bounds;
    const limit = (t: number, lo: number, hi: number, padLo: number, padHi: number, extent: number) => {
      const a = extent - padHi - hi * k; // far edge reaches the screen's far side
      const b = padLo - lo * k; // near edge reaches the screen's near side
      return Math.min(Math.max(a, b), Math.max(Math.min(a, b), t));
    };
    return {
      k,
      x: limit(v.x, x0, x1, PAD, PAD, size.w),
      y: limit(v.y, y0, y1, PAD_TOP, PAD, size.h),
      ms: v.ms,
    };
  };

  // Zoom by `factor` keeping screen point (px, py) fixed
  const zoomAt = (factor: number, px: number, py: number, ms: number) => {
    const v = viewRef.current;
    const k = Math.min(MAX_K, Math.max(MIN_K, v.k * factor));
    const r = k / v.k;
    setView(clamp({ k, x: px - (px - v.x) * r, y: py - (py - v.y) * r, ms }));
  };

  // Non-passive wheel listener so the page itself never zooms/scrolls
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left, e.clientY - rect.top, 120);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  const localPoint = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const twoFinger = () => {
    const [a, b] = [...pointers.current.values()];
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, localPoint(e));
    gesture.current = pointers.current.size === 2 ? twoFinger() : null;
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const p = localPoint(e);
    pointers.current.set(e.pointerId, p);
    const v = viewRef.current;

    if (pointers.current.size === 2 && gesture.current) {
      // Pinch: scale around the midpoint and follow its movement
      const g = twoFinger();
      const k = Math.min(MAX_K, Math.max(MIN_K, v.k * (g.dist / gesture.current.dist)));
      const r = k / v.k;
      const { mid } = gesture.current;
      setView(clamp({ k, x: g.mid.x - (mid.x - v.x) * r, y: g.mid.y - (mid.y - v.y) * r, ms: 0 }));
      gesture.current = g;
    } else if (pointers.current.size === 1) {
      setView(clamp({ ...v, x: v.x + p.x - prev.x, y: v.y + p.y - prev.y, ms: 0 }));
    }
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    gesture.current = pointers.current.size === 2 ? twoFinger() : null;
  };

  const hover = (code: string | null) => {
    if (pointers.current.size) return; // ignore while dragging
    setHovered(code);
    // Info card only for countries already answered (same rule as the globe)
    onCountryHover(code && answers[code] ? COUNTRY_MAP.get(code) ?? null : null);
  };

  const focusPoint = focusCountry && project ? project([focusCountry.lng, focusCountry.lat]) : null;
  const center = () => [size.w / 2, size.h / 2] as const;
  const btn =
    'w-10 h-10 flex items-center justify-center rounded-full bg-[#1c2c26]/90 backdrop-blur-md border border-[#daba89]/30 text-[#f5f5f1] hover:border-[#e5ff42]/60 hover:text-[#e5ff42] transition-colors disabled:opacity-30 disabled:pointer-events-none';

  return (
    <div className="absolute inset-0 overflow-hidden z-0 bg-[#13201b]">
      <svg
        ref={svgRef}
        className="w-full h-full touch-none select-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => hover(null)}
      >
        <g
          style={{
            transition: view.ms ? `transform ${view.ms}ms cubic-bezier(0.16, 1, 0.3, 1)` : 'none',
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
            transformOrigin: '0 0',
          }}
        >
          <path d={graticule} fill="none" stroke="#275f4b" strokeOpacity={0.35} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />

          {paths.map(({ code, d }) => {
            const status = answers[code]?.status;
            const isHovered = code === hovered;
            return (
              <path
                key={code}
                d={d}
                fill={status ? STATUS_FILL[status] : isHovered ? '#33574a' : '#274137'}
                stroke={isHovered ? '#ffffff' : 'rgba(245, 245, 241, 0.25)'}
                strokeWidth={isHovered ? 1.2 : 0.6}
                vectorEffect="non-scaling-stroke"
                onPointerEnter={() => hover(code)}
                style={{ transition: 'fill 400ms ease' }}
              />
            );
          })}

          {/* One-second ping on the latest answer, sized in screen pixels, then gone */}
          {focusPoint && (
            <g key={focusCountry!.code} transform={`translate(${focusPoint[0]} ${focusPoint[1]}) scale(${1 / view.k})`} pointerEvents="none">
              <motion.circle
                fill="none"
                stroke="#e5ff42"
                strokeWidth={2}
                initial={{ r: 4, opacity: 1 }}
                animate={{ r: 22, opacity: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
              <motion.circle
                r={4}
                fill="#e5ff42"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.7, delay: 0.7 }}
              />
            </g>
          )}
        </g>
      </svg>

      {/* Zoom controls: bottom-left is open South Pacific, so they never cover land */}
      <div className="absolute left-3 bottom-3 md:left-4 md:bottom-4 flex gap-2 z-20">
        <button className={btn} aria-label="Zoom in" disabled={view.k >= MAX_K} onClick={() => zoomAt(1.6, ...center(), 400)}>
          <Plus className="w-4 h-4" />
        </button>
        <button className={btn} aria-label="Zoom out" disabled={view.k <= MIN_K} onClick={() => zoomAt(1 / 1.6, ...center(), 400)}>
          <Minus className="w-4 h-4" />
        </button>
        <button className={btn} aria-label="Default view" title="Default view" onClick={() => setView(HOME)}>
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
