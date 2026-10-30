'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { ArrowLeft, Flag as FlagIcon, Lightbulb, Timer } from 'lucide-react';
import { Country, GameSettings, AnswerRecord } from '../types/game';
import { compact, matchBlitz, resolveBlitzEnter } from '../lib/game';
import DecoCard from './DecoCard';
import Flag from './Flag';

interface BlitzHUDProps {
  settings: GameSettings;
  countries: Country[];
  answers: Record<string, AnswerRecord>;
  timeLeft: number;
  hoveredCountry: Country | null;
  reviewing: boolean;
  showingMissing: boolean;
  onShowMissing: () => void;
  onFound: (country: Country) => void;
  onFinish: () => void;
  onExit: () => void;
}

const formatTimer = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const NO_TAIL: { typed: string; names: string[] } = { typed: '', names: [] };

// Left panel of the Blitz split screen: type anything, found countries light up on the map
export default function BlitzHUD({
  settings,
  countries,
  answers,
  timeLeft,
  hoveredCountry,
  reviewing,
  showingMissing,
  onShowMissing,
  onFound,
  onFinish,
  onExit,
}: BlitzHUDProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const shake = useAnimationControls();
  const tail = useRef(NO_TAIL);

  const remaining = useMemo(() => countries.filter((c) => !answers[c.code]), [countries, answers]);
  // Most recent first
  const found = useMemo(
    () =>
      countries
        .filter((c) => answers[c.code]?.status === 'correct')
        .sort((a, b) => answers[b.code].timestamp - answers[a.code].timestamp),
    [countries, answers]
  );

  const { match, waiting } = matchBlitz(input, remaining);
  const query = compact(input);
  const alreadyFound =
    !match && !!query && found.some((c) => [c.name, ...c.aliases].some((n) => compact(n) === query));

  // Any letter typed anywhere goes to the input, e.g. after dragging the map
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const accept = (country: Country, typed: string) => {
    onFound(country);
    setInput('');
    tail.current = { typed: compact(typed), names: [country.name, ...country.aliases].map(compact) };
  };

  const handleChange = (value: string) => {
    // Still finishing the name just accepted ("dominican" + " republic"): absorb it, don't treat it as a new guess
    const full = tail.current.typed + compact(value);
    if (compact(value) && tail.current.names.some((n) => n.startsWith(full))) {
      const done = tail.current.names.includes(full);
      setInput(done ? '' : value);
      if (done) tail.current = NO_TAIL;
      return;
    }
    tail.current = NO_TAIL;

    const next = matchBlitz(value, remaining);
    if (next.match && !next.waiting) accept(next.match, value);
    else setInput(value);
  };

  const handleEnter = () => {
    if (!query) return;
    const country = resolveBlitzEnter(input, remaining);
    if (country) accept(country, input);
    else if (alreadyFound) setInput('');
    else shake.start({ x: [0, -7, 7, -4, 4, 0], transition: { duration: 0.3 } });
  };

  const spotlight = hoveredCountry ?? found[0] ?? null;
  const timed = settings.durationSeconds > 0;

  return (
    <div className="absolute inset-x-0 bottom-0 h-[44%] md:inset-y-0 md:right-auto md:h-auto md:w-[380px] z-10 flex flex-col gap-3 md:gap-4 p-3 md:p-5 bg-[#1c2c26] border-t md:border-t-0 border-[#275f4b]/50">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onExit}
          className="group flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full border border-[#daba89]/30 text-[13px] font-light text-[#f5f5f1] hover:border-[#e5ff42]/60 transition-all"
        >
          <span className="w-6 h-6 rounded-full bg-[#f5f5f1]/10 flex items-center justify-center transition-transform duration-300 group-hover:-translate-x-0.5">
            <ArrowLeft className="w-4 h-4" />
          </span>
          Menu
        </button>
        {!reviewing && (
          <button
            onClick={onFinish}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-light text-[#f5f5f1]/60 hover:text-[#f87171] hover:bg-[#f87171]/10 transition-all"
          >
            <FlagIcon className="w-3.5 h-3.5" />
            End run
          </button>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <p className="flex items-baseline gap-2 tabular-nums">
          <span key={found.length} className="font-serif text-[44px] md:text-[64px] leading-none tracking-[-0.02em] text-[#e5ff42] animate-rise [animation-duration:0.3s]">
            {found.length}
          </span>
          <span className="font-light text-[#f5f5f1]/50">/ {countries.length}</span>
        </p>
        {timed && (
          <span
            className={`flex items-center gap-1.5 pb-1 tabular-nums text-[15px] font-medium ${
              timeLeft < 60 ? 'text-[#f87171] animate-pulse' : 'text-[#f5f5f1]'
            }`}
          >
            <Timer className="w-4 h-4 opacity-70" />
            {formatTimer(timeLeft)}
          </span>
        )}
      </div>

      {!reviewing && (
        <div>
          <motion.div
            animate={shake}
            className="flex items-center rounded-full bg-[#f5f5f1] p-1 ring-2 ring-transparent focus-within:ring-[#e5ff42] transition-shadow"
          >
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={input}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleEnter();
                } else if (e.key === 'Tab') {
                  e.preventDefault();
                  onShowMissing();
                }
              }}
              placeholder="Type any country…"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Type a country name"
              className="w-full bg-transparent px-4 py-2 text-[15px] text-[#1c2c26] placeholder-[#1c2c26]/40 focus:outline-none"
            />
          </motion.div>
          <p className="mt-1.5 px-4 h-5 text-[12px] font-light text-[#daba89]">
            {waiting && match
              ? `Enter for ${match.name}, or keep typing`
              : alreadyFound
                ? 'Already found'
                : ''}
          </p>
          <button
            onMouseDown={(e) => e.preventDefault()} // keep focus in the input
            onClick={onShowMissing}
            disabled={showingMissing}
            className="mt-1 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border border-[#daba89]/30 text-[13px] font-light text-[#f5f5f1]/80 hover:border-[#e5ff42]/60 hover:text-[#e5ff42] disabled:border-[#e5ff42]/60 disabled:text-[#e5ff42] transition-all"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Show what&apos;s left <span className="text-[12px] text-[#f5f5f1]/35">Tab</span>
          </button>
        </div>
      )}

      {/* Latest find, or the country under the cursor */}
      {spotlight && (
        <div className="hidden md:block">
          <DecoCard cornerSize={20}>
            <div key={spotlight.code} className="p-4 flex items-center gap-3 animate-rise [animation-duration:0.3s]">
              <Flag country={spotlight} className="h-9 w-auto rounded-[2px]" />
              <div className="min-w-0">
                <p className="font-serif text-[22px] leading-tight truncate">{spotlight.name}</p>
                <p className="text-[13px] font-light text-[#f5f5f1]/60 truncate">{spotlight.capital}</p>
              </div>
            </div>
          </DecoCard>
        </div>
      )}

      {/* Everything found so far */}
      <ul className="flex-1 min-h-0 overflow-y-auto flex flex-wrap content-start gap-1.5">
        {found.map((c) => (
          <li
            key={c.code}
            className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-[#f5f5f1]/5 border border-[#275f4b]/60 text-[12px] font-light text-[#f5f5f1]/80 animate-rise [animation-duration:0.3s]"
          >
            <Flag country={c} className="h-3 w-auto rounded-[1px]" />
            {c.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
