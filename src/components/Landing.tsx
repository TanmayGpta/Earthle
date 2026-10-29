'use client';

import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, Play } from 'lucide-react';
import { GameSettings } from '../types/game';
import { COUNTRIES } from '../data/countries';
import DecoCard from './DecoCard';
import Reveal from './Reveal';

interface LandingProps {
  settings: GameSettings;
  onSettingsChange: (patch: Partial<GameSettings>) => void;
  availableCount: number;
  worldCount: number;
  onStart: (patch?: Partial<GameSettings>) => void;
}

const REGIONS = [
  { value: 'all', label: 'World' },
  { value: 'Africa', label: 'Africa' },
  { value: 'Americas', label: 'Americas' },
  { value: 'Asia', label: 'Asia' },
  { value: 'Europe', label: 'Europe' },
  { value: 'Oceania', label: 'Oceania' },
];

const DURATIONS = [
  { value: 300, label: '5 min' },
  { value: 900, label: '15 min' },
  { value: 0, label: 'No timer' },
];

// Noun + verb pairs, after Rainmaker's Software / Drone / Radar strip
const STEPS = [
  { n: '01', noun: 'Spot', verb: 'Locate', body: 'A territory glows lime on a live 3D globe. The camera flies you straight to it.' },
  { n: '02', noun: 'Name', verb: 'Recall', body: 'Type it from memory, or pick from four look-alike neighbours. Keys 1–4 for speed.' },
  { n: '03', noun: 'Learn', verb: 'Retain', body: 'Misses are revealed, not punished. Streaks unlock trivia about the place you just found.' },
];

const HEADLINE = ['Spot it.', 'Name it.', 'Know the world.'];

// Deterministic sample (random here would break SSR hydration)
const TICKER = COUNTRIES.filter((c, i) => c.continent !== 'Antarctica' && i % 4 === 0);

// Pill segmented control used in the configurator
function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="text-[12px] uppercase tracking-[0.1em] text-[#628c7d] mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={String(o.value)}
              onClick={() => onChange(o.value)}
              aria-pressed={active}
              className={`px-5 py-2.5 rounded-full text-[15px] transition-all duration-300 ease-out-expo ${
                active
                  ? 'bg-[#1c2c26] text-[#e5ff42] shadow-[0_8px_24px_-12px_rgba(28,44,38,0.8)]'
                  : 'bg-transparent text-[#1c2c26] border border-[#1c2c26]/15 hover:border-[#1c2c26]/50'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Landing({ settings, onSettingsChange, availableCount, worldCount, onStart }: LandingProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const timerLabel = settings.durationSeconds > 0 ? `${settings.durationSeconds / 60}-minute run` : 'untimed run';

  return (
    <div className="relative">
      {/* ---------------- NAV ---------------- */}
      <header
        className={`fixed top-0 inset-x-0 z-30 transition-all duration-500 ease-out-expo ${
          scrolled ? 'bg-[#1c2c26]/80 backdrop-blur-md border-b border-[#275f4b]/50' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto px-6 md:px-12 h-16 md:h-20 grid grid-cols-[1fr_auto_1fr] items-center">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 justify-self-start">
            <span className="font-serif text-[26px] leading-none tracking-[-0.01em]">Earthle</span>
          </button>

          <nav className="hidden md:flex items-center gap-8 text-[15px] font-light text-[#f5f5f1]/80">
            <button onClick={() => scrollTo('how')} className="hover:text-[#e5ff42] transition-colors">How it works</button>
            <button onClick={() => scrollTo('modes')} className="hover:text-[#e5ff42] transition-colors">Modes</button>
            <button onClick={() => scrollTo('promise')} className="hover:text-[#e5ff42] transition-colors">Promise</button>
          </nav>

          <button
            onClick={() => onStart()}
            className="justify-self-end group flex items-center gap-2 pl-5 pr-2 py-2 rounded-full bg-[#e5ff42] text-[#1c2c26] text-[15px] font-medium hover:bg-[#d4ee38] transition-colors"
          >
            Play now
            <span className="w-7 h-7 rounded-full bg-[#1c2c26] text-[#e5ff42] flex items-center justify-center transition-transform duration-300 group-hover:rotate-45">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </header>

      {/* ---------------- HERO (centered over the globe) ---------------- */}
      <section className="relative z-10 min-h-[100svh] flex flex-col items-center justify-center text-center px-6 md:px-12 pt-24 pb-10 pointer-events-none">
        {/* Soft radial vignette keeps type legible over the globe */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_45%_at_50%_45%,rgba(28,44,38,0.75),transparent_70%)]" />

        <div className="max-w-5xl my-auto pointer-events-auto">
          <p className="text-[12px] uppercase tracking-[0.1em] text-[#e5ff42] mb-6 animate-rise">
            A spatial geography game
          </p>
          <h1 className="font-serif text-[56px] md:text-[88px] lg:text-[108px] leading-[0.98] tracking-[-0.02em] text-balance">
            {HEADLINE.map((line, i) => (
              <span
                key={line}
                className={`block animate-rise ${i === HEADLINE.length - 1 ? 'text-[#e5ff42]' : ''}`}
                style={{ animationDelay: `${150 + i * 140}ms` }}
              >
                {line}
              </span>
            ))}
          </h1>

          <p
            className="mt-8 max-w-xl mx-auto text-[18px] md:text-[21px] leading-[1.45] font-light text-[#f5f5f1]/80 text-pretty animate-rise"
            style={{ animationDelay: '600ms' }}
          >
            A country lights up on a spinning globe. You name it. No distance hints, no guessing games —
            just you and the map.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-rise" style={{ animationDelay: '750ms' }}>
            <button
              onClick={() => onStart()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-[#e5ff42] text-[#1c2c26] text-[16px] font-medium hover:bg-[#d4ee38] hover:scale-[1.03] transition-all duration-300 ease-out-expo"
            >
              <Play className="w-4 h-4 fill-current" />
              Start a run
            </button>
            <button
              onClick={() => scrollTo('modes')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-full border border-[#f5f5f1]/30 bg-[#1c2c26]/40 text-[16px] font-light hover:border-[#e5ff42] hover:text-[#e5ff42] backdrop-blur-sm transition-all duration-300"
            >
              Choose a mode
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pointer-events-auto text-[13px] font-light text-[#f5f5f1]/60 animate-rise" style={{ animationDelay: '900ms' }}>
          {worldCount} countries · 6 regions · no sign-up
          <span className="block mt-2 text-[#f5f5f1]/40 animate-bounce">↓</span>
        </div>
      </section>

      {/* ---------------- TICKER ---------------- */}
      <div className="relative z-10 bg-[#1c2c26] border-y border-[#275f4b]/60 py-4 overflow-hidden" aria-hidden>
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {[...TICKER, ...TICKER].map((c, i) => (
            <span key={i} className="flex items-center gap-3 px-6 text-[15px] font-light text-[#f5f5f1]/70 whitespace-nowrap">
              <span className="text-xl">{c.flag}</span>
              {c.name}
              <span className="text-[#275f4b]">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ---------------- HOW IT WORKS (promise-style cards on cloud) ---------------- */}
      <section id="how" className="relative z-10 bg-[#e0ded7] text-[#1c2c26] px-6 md:px-12 py-24 md:py-36 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-[12px] uppercase tracking-[0.1em] text-[#275f4b] mb-4">How it works</p>
            <h2 className="font-serif text-[44px] md:text-[72px] leading-[1.04] tracking-[-0.02em] max-w-3xl text-balance">
              Geography you feel, not memorise.
            </h2>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 120} className="h-full">
                <DecoCard className="group h-full transition-transform duration-500 ease-out-expo hover:-translate-y-1.5">
                  <div className="p-9 md:p-10 flex flex-col justify-between min-h-[340px]">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[#daba89] font-medium">{s.n}</span>
                      <span className="uppercase tracking-[0.1em] text-[#daba89]/80">{s.verb}</span>
                    </div>
                    <div>
                      <h3 className="font-serif text-[48px] md:text-[56px] leading-none tracking-[-0.02em] mb-4 transition-colors duration-300 group-hover:text-[#e5ff42]">
                        {s.noun}
                      </h3>
                      <p className="text-[17px] leading-[1.5] font-light text-[#f5f5f1]/70 text-pretty">{s.body}</p>
                    </div>
                  </div>
                </DecoCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- MODES (light mist section) ---------------- */}
      <section id="modes" className="relative z-10 bg-[#f5f5f1] text-[#1c2c26] px-6 md:px-12 py-24 md:py-36">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-start">
          <Reveal className="lg:sticky lg:top-32">
            <p className="text-[12px] uppercase tracking-[0.1em] text-[#275f4b] mb-4">Modes</p>
            <h2 className="font-serif text-[44px] md:text-[72px] leading-[1.04] tracking-[-0.02em] text-balance">
              Set your expedition.
            </h2>
            <p className="mt-6 text-[18px] md:text-[20px] leading-[1.5] font-light text-[#1c2c26]/70 max-w-md text-pretty">
              Countries or capitals, the whole world or one region. Every run is shuffled from a fresh random seed,
              so no two are the same.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-3xl bg-white border border-[#1c2c26]/10 p-6 md:p-10 shadow-[0_30px_80px_-40px_rgba(28,44,38,0.45)] flex flex-col gap-8">
              <Segmented
                label="Quiz on"
                value={settings.mode}
                onChange={(mode) => onSettingsChange({ mode })}
                options={[
                  { value: 'countries', label: 'Country names' },
                  { value: 'capitals', label: 'Capitals' },
                ]}
              />
              <Segmented
                label="Answer by"
                value={settings.inputType}
                onChange={(inputType) => onSettingsChange({ inputType })}
                options={[
                  { value: 'mcq', label: 'Multiple choice' },
                  { value: 'type', label: 'Typing' },
                ]}
              />
              <Segmented
                label="Region"
                value={settings.continent}
                onChange={(continent) => onSettingsChange({ continent })}
                options={REGIONS}
              />
              <Segmented
                label="Clock"
                value={settings.durationSeconds}
                onChange={(durationSeconds) => onSettingsChange({ durationSeconds })}
                options={DURATIONS}
              />

              <div className="pt-6 border-t border-[#1c2c26]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-[15px] font-light text-[#1c2c26]/60">
                  <span className="font-serif text-[28px] text-[#1c2c26] align-middle mr-1">{availableCount}</span>
                  countries · {timerLabel}
                </p>
                <button
                  onClick={() => onStart()}
                  className="group flex items-center justify-center gap-2 pl-7 pr-2 py-2 rounded-full bg-[#1c2c26] text-[#f5f5f1] text-[16px] hover:bg-[#275f4b] transition-colors"
                >
                  Launch run
                  <span className="w-10 h-10 rounded-full bg-[#e5ff42] text-[#1c2c26] flex items-center justify-center transition-transform duration-300 group-hover:rotate-45">
                    <ArrowUpRight className="w-5 h-5" />
                  </span>
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- PROMISE (Rainmaker's "truth" card) ---------------- */}
      <section id="promise" className="relative z-10 bg-[#e0ded7] text-[#1c2c26] px-6 md:px-12 py-24 md:py-32">
        <Reveal className="max-w-4xl mx-auto">
          <DecoCard cornerSize={56} className="px-8 md:px-16 py-16 md:py-20 text-center">
            <p className="text-[12px] uppercase tracking-[0.1em] text-[#daba89] mb-5">Our promise</p>
            <h2 className="font-serif text-[40px] md:text-[64px] leading-[1.04] tracking-[-0.02em] text-balance">
              No accounts. No ads. Nothing saved.
            </h2>
            <p className="mt-6 text-[18px] leading-[1.5] font-light text-[#f5f5f1]/70 max-w-xl mx-auto text-pretty">
              Earthle runs entirely in your browser. Close the tab and your run is gone — the only thing you keep is
              what you learned.
            </p>
          </DecoCard>
        </Reveal>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="relative z-10 bg-[#1c2c26] pt-20 overflow-hidden select-none">
        <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-10 text-[15px] font-light">
          <div className="col-span-2">
            <p className="font-serif text-[36px] md:text-[44px] leading-[1.05] tracking-[-0.02em] max-w-sm">
              Geography. Made instinctive.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[12px] uppercase tracking-[0.1em] text-[#628c7d] mb-1">Play</p>
            <button onClick={() => onStart({ mode: 'countries' })} className="text-left text-[#f5f5f1]/80 hover:text-[#e5ff42]">Countries</button>
            <button onClick={() => onStart({ mode: 'capitals' })} className="text-left text-[#f5f5f1]/80 hover:text-[#e5ff42]">Capitals</button>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[12px] uppercase tracking-[0.1em] text-[#628c7d] mb-1">Explore</p>
            <button onClick={() => scrollTo('how')} className="text-left text-[#f5f5f1]/80 hover:text-[#e5ff42]">How it works</button>
            <button onClick={() => scrollTo('modes')} className="text-left text-[#f5f5f1]/80 hover:text-[#e5ff42]">Modes</button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 md:px-12 mt-16 pt-6 border-t border-[#275f4b]/60 flex flex-col sm:flex-row justify-between gap-2 text-[13px] font-light text-[#628c7d]">
          <p>© 2026 Earthle</p>
          <p>Borders: Natural Earth · Made with a globe and curiosity</p>
        </div>

        {/* Monumental wordmark */}
        <h2 className="font-serif text-[24vw] leading-[0.75] tracking-[-0.04em] text-[#275f4b] text-center translate-y-[5%] mt-8 pointer-events-none">
          Earthle
        </h2>
      </footer>
    </div>
  );
}
