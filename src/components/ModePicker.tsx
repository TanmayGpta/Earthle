'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import { ArrowUpRight, ChevronDown, Swords } from 'lucide-react';
import { Country, GameMode, GameSettings, InputType } from '../types/game';
import { COUNTRIES } from '../data/countries';
import { getCountryPool } from '../lib/game';
import { cleanCode, DuelConfig, DuelOrder, isFullCode } from '../lib/useDuel';
import Flag from './Flag';

type MainMode = 'atlas' | 'flags' | 'blitz' | 'duel';

const MAIN_MODES: { id: MainMode; title: string; kicker: string; body: string }[] = [
  { id: 'atlas', title: 'Atlas', kicker: 'The globe', body: 'A country glows on the globe. Name it, or its capital.' },
  { id: 'flags', title: 'Flags', kicker: 'Vexillology', body: 'A flag swings into view. Tell us whose it is.' },
  { id: 'blitz', title: 'Blitz', kicker: 'Speed run', body: 'One clock. Type every country you know and watch the map light up.' },
  { id: 'duel', title: 'Duel', kicker: 'Head to head', body: 'Share a code. Same start, same 15-minute clock. Most correct wins.' },
];

type Option<T> = { value: T; label: string };

const TOPICS: Option<GameMode>[] = [
  { value: 'countries', label: 'countries' },
  { value: 'capitals', label: 'capitals' },
  { value: 'us_states', label: 'US states & capitals' },
];
export const REGIONS: Option<string>[] = [
  { value: 'all', label: 'the World' },
  { value: 'Africa', label: 'Africa' },
  { value: 'Americas', label: 'the Americas' },
  { value: 'Asia', label: 'Asia' },
  { value: 'Europe', label: 'Europe' },
  { value: 'Oceania', label: 'Oceania' },
];
export const INPUTS: Option<InputType>[] = [
  { value: 'type', label: 'typing' },
  { value: 'mcq', label: 'multiple choice' },
];
export const DUEL_MODES: Option<GameMode>[] = [
  { value: 'countries', label: 'Atlas countries' },
  { value: 'capitals', label: 'Atlas capitals' },
  { value: 'us_states', label: 'US states & capitals' },
  { value: 'flags', label: 'Flags' },
  { value: 'blitz', label: 'Blitz' },
];
export const ORDERS: Option<DuelOrder>[] = [
  { value: 'same', label: 'the same order' },
  { value: 'random', label: 'a different order each' },
];
const CLOCKS: Option<number>[] = [
  { value: 300, label: 'in 5 minutes' },
  { value: 900, label: 'in 15 minutes' },
  { value: 0, label: 'at your own pace' },
];

const byCode = (code: string) => COUNTRIES.find((c) => c.code === code) as Country;
const FAN = ['JPN', 'BRA', 'SWE'].map(byCode);

const mainModeOf = (mode: GameMode): MainMode => (mode === 'flags' || mode === 'blitz' ? mode : 'atlas');

/* ---------------- Card art ---------------- */

// Wireframe globe: meridians breathe out of phase so it reads as spinning
function AtlasArt() {
  return (
    <svg viewBox="-50 -50 100 100" className="w-28 h-28" fill="none" stroke="currentColor" strokeWidth={1.2}>
      <circle r={44} />
      {[-22, 0, 22].map((y) => (
        <ellipse key={y} cy={y} rx={Math.sqrt(44 * 44 - y * y)} ry={4} opacity={0.5} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <motion.ellipse
          key={i}
          ry={44}
          initial={{ rx: 44 * Math.abs(Math.sin((i * Math.PI) / 4)) }}
          animate={{ rx: [0, 44, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 }}
          opacity={0.7}
        />
      ))}
      <motion.circle
        cx={14}
        cy={-12}
        r={4}
        fill="#e5ff42"
        stroke="none"
        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  );
}

// Three flags that fan out when the card is hovered (driven by the card's variants)
function FlagsArt() {
  const spread = [-1, 0, 1];
  return (
    <div className="relative w-40 h-28 [perspective:600px]">
      {FAN.map((country, i) => (
        <motion.div
          key={country.code}
          className="absolute left-1/2 top-1/2 -ml-[36px] -mt-[24px]"
          style={{ zIndex: i === 1 ? 2 : 1 }}
          variants={{
            rest: { x: spread[i] * 18, y: 0, rotate: spread[i] * 8, rotateY: 0 },
            hover: { x: spread[i] * 50, y: i === 1 ? -8 : 0, rotate: spread[i] * 14, rotateY: spread[i] * -18 },
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          <Flag country={country} className="w-[72px] h-[48px] rounded-[3px] ring-1 ring-black/20 shadow-lg" />
        </motion.div>
      ))}
    </div>
  );
}

// Stopwatch whose hand sweeps round
function BlitzArt() {
  return (
    <svg viewBox="-50 -50 100 100" className="w-28 h-28" fill="none" stroke="currentColor" strokeWidth={1.2}>
      <circle cy={6} r={38} />
      <path d="M-8 -42 H8 M0 -42 V-32" />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} y1={-32} y2={-27} transform={`translate(0 6) rotate(${i * 90})`} opacity={0.5} />
      ))}
      <g transform="translate(0 6)">
        <line y2={-26} stroke="#e5ff42" strokeWidth={2} strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
        </line>
      </g>
    </svg>
  );
}

const ART: Record<MainMode, React.ReactNode> = {
  atlas: <AtlasArt />,
  flags: <FlagsArt />,
  blitz: <BlitzArt />,
  duel: <Swords className="w-20 h-20" strokeWidth={1} />,
};

/* ---------------- Tilt card ---------------- */

// Card leans toward the cursor with a moving glare (react-bits "Tilted Card" idea)
function TiltCard({
  children,
  selected,
  onSelect,
}: {
  children: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const spring = { stiffness: 220, damping: 20 };
  const rotateX = useSpring(useTransform(my, [0, 1], [9, -9]), spring);
  const rotateY = useSpring(useTransform(mx, [0, 1], [-11, 11]), spring);
  const glare = useTransform(
    [mx, my],
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.28), transparent 55%)`
  );

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      aria-pressed={selected}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={`relative h-full w-full text-left rounded-3xl overflow-hidden transition-colors duration-500 ease-out-expo ${
        selected
          ? 'bg-[#1c2c26] text-[#f5f5f1] shadow-[0_30px_60px_-30px_rgba(28,44,38,0.9)]'
          : 'bg-white text-[#1c2c26] border border-[#1c2c26]/10 hover:border-[#1c2c26]/30'
      }`}
    >
      {children}
      <motion.span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: glare }} variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }} />
    </motion.button>
  );
}

/* ---------------- Sentence chip ---------------- */

// Which chip is open; closes on outside click or Escape
export function useChipMenu() {
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!openId) return;
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element).closest('[data-chip]')) setOpenId(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenId(null);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openId]);

  return { openId, setOpenId };
}

// An inline word in the setup sentence that opens a small option list
export function Chip<T extends string | number>({
  id,
  openId,
  setOpenId,
  value,
  options,
  onChange,
}: {
  id: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}) {
  const open = openId === id;
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <span data-chip className="relative inline-block whitespace-nowrap align-baseline">
      <button
        type="button"
        onClick={() => setOpenId(open ? null : id)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-baseline gap-1 px-2 rounded-xl italic transition-colors duration-300 ${
          open ? 'bg-[#e5ff42] text-[#1c2c26]' : 'text-[#275f4b] hover:bg-[#e5ff42]/60'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={String(current.value)}
            initial={{ y: '45%', opacity: 0, filter: 'blur(6px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: '-45%', opacity: 0, filter: 'blur(6px)' }}
            transition={{ duration: 0.18 }}
            className="inline-block border-b-2 border-dashed border-current/40 leading-[1.05]"
          >
            {current.label}
          </motion.span>
        </AnimatePresence>
        <ChevronDown className={`w-[0.5em] h-[0.5em] self-center transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 top-full mt-2 z-30 min-w-[210px] p-1.5 rounded-2xl bg-[#1c2c26] shadow-[0_24px_50px_-20px_rgba(0,0,0,0.6)] origin-top-left font-sans not-italic text-[15px] leading-normal tracking-normal"
          >
            {options.map((o) => {
              const active = o.value === value;
              return (
                <div key={String(o.value)}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(o.value);
                      setOpenId(null);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl text-left transition-colors ${
                      active ? 'text-[#e5ff42]' : 'text-[#f5f5f1]/80 hover:bg-[#f5f5f1]/10 hover:text-[#f5f5f1]'
                    }`}
                  >
                    {o.label}
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-[#e5ff42]" />}
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

/* ---------------- Duel setup ---------------- */

// Create a duel (same sentence style as a run), or join one with a code
function DuelSetup({
  chip,
  error,
  onCreate,
  onJoin,
}: {
  chip: ReturnType<typeof useChipMenu>;
  error: string | null;
  onCreate: (settings: Pick<DuelConfig, 'mode' | 'continent' | 'order'>) => void;
  onJoin: (code: string) => void;
}) {
  const [mode, setMode] = useState<GameMode>('countries');
  const [continent, setContinent] = useState('all');
  const [order, setOrder] = useState<DuelOrder>('same');
  const [code, setCode] = useState('');
  const count = getCountryPool({ mode, continent }).length;

  return (
    <div className="mt-5 rounded-3xl bg-white border border-[#1c2c26]/10 p-6 md:p-10 shadow-[0_30px_80px_-40px_rgba(28,44,38,0.45)]">
      <p className="text-[12px] uppercase tracking-[0.1em] text-[#628c7d] mb-4">Your duel · tap a word to change it</p>

      <div className="font-serif text-[30px] md:text-[46px] leading-[1.35] tracking-[-0.01em] text-[#1c2c26] text-balance">
        A 15-minute duel on <Chip id="duel-mode" {...chip} value={mode} options={DUEL_MODES} onChange={setMode} /> of{' '}
        <Chip id="duel-region" {...chip} value={continent} options={REGIONS} onChange={setContinent} />
        {mode !== 'blitz' && (
          <>
            , in <Chip id="duel-order" {...chip} value={order} options={ORDERS} onChange={setOrder} />
          </>
        )}
        .
      </div>

      <div className="mt-8 pt-6 border-t border-[#1c2c26]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-[15px] font-light text-[#1c2c26]/60">
          <span className="font-serif text-[28px] text-[#1c2c26] align-middle mr-1">{count}</span>
          {mode === 'flags' ? 'flags' : mode === 'capitals' ? 'capitals' : 'countries'} in this duel
        </p>
        <button
          onClick={() => onCreate({ mode, continent, order })}
          className="group flex items-center justify-center gap-2 pl-7 pr-2 py-2 rounded-full bg-[#1c2c26] text-[#f5f5f1] text-[16px] hover:bg-[#275f4b] transition-colors"
        >
          Create duel
          <span className="w-10 h-10 rounded-full bg-[#e5ff42] text-[#1c2c26] flex items-center justify-center transition-transform duration-300 group-hover:rotate-45">
            <ArrowUpRight className="w-5 h-5" />
          </span>
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isFullCode(code)) onJoin(code);
        }}
        className="mt-6 pt-6 border-t border-[#1c2c26]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <label htmlFor="duel-code" className="text-[15px] font-light text-[#1c2c26]/60">
          Got a code from a friend?
        </label>
        <div className="flex items-center rounded-full bg-[#1c2c26]/5 p-1">
          <input
            id="duel-code"
            value={code}
            onChange={(e) => setCode(cleanCode(e.target.value))}
            placeholder="CODE"
            autoComplete="off"
            spellCheck={false}
            className="w-28 bg-transparent px-4 py-2 text-[16px] tracking-[0.15em] text-[#1c2c26] placeholder-[#1c2c26]/30 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!isFullCode(code)}
            className="px-5 py-2 rounded-full bg-[#1c2c26] text-[#e5ff42] text-[14px] font-medium hover:bg-[#275f4b] disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            Join
          </button>
        </div>
      </form>

      {error && <p role="alert" className="mt-4 text-[14px] text-[#dc2626]">{error}</p>}
    </div>
  );
}

/* ---------------- Picker ---------------- */

interface ModePickerProps {
  settings: GameSettings;
  onSettingsChange: (patch: Partial<GameSettings>) => void;
  availableCount: number;
  onStart: () => void;
  duelError: string | null;
  onCreateDuel: (settings: Pick<DuelConfig, 'mode' | 'continent' | 'order'>) => void;
  onJoinDuel: (code: string) => void;
}

export default function ModePicker({
  settings,
  onSettingsChange,
  availableCount,
  onStart,
  duelError,
  onCreateDuel,
  onJoinDuel,
}: ModePickerProps) {
  const chip = useChipMenu();
  const { setOpenId } = chip;
  // Duel keeps its own setup, so selecting it leaves the solo settings alone
  const [duelSelected, setDuelSelected] = useState(false);
  // Remember countries vs capitals while the player peeks at other modes
  const atlasTopic = useRef<GameMode>(settings.mode === 'capitals' ? 'capitals' : 'countries');
  const mainMode = duelSelected ? 'duel' : mainModeOf(settings.mode);

  const selectMain = (id: MainMode) => {
    setOpenId(null);
    setDuelSelected(id === 'duel');
    if (id !== 'duel') onSettingsChange({ mode: id === 'flags' || id === 'blitz' ? id : atlasTopic.current });
  };

  return (
    <MotionConfig reducedMotion="user">
      {/* Main modes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MAIN_MODES.map((m) => {
          const selected = m.id === mainMode;
          const body = (
            <div className="p-6 md:p-7 flex flex-col h-full min-h-[300px]">
              <div className={`h-32 flex items-center justify-center ${selected ? 'text-[#628c7d]' : 'text-[#1c2c26]/70'}`}>
                {ART[m.id]}
              </div>
              <div className="mt-auto pt-6 flex items-center justify-between text-[12px] uppercase tracking-[0.1em]">
                <span className={selected ? 'text-[#e5ff42]' : 'text-[#275f4b]'}>{m.kicker}</span>
                {selected && (
                  <motion.span
                    layoutId="mode-selected"
                    className="px-2.5 py-1 rounded-full bg-[#e5ff42] text-[#1c2c26] text-[11px]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  >
                    Selected
                  </motion.span>
                )}
              </div>
              <h3 className="font-serif text-[44px] leading-none tracking-[-0.02em] mt-2">{m.title}</h3>
              <p className={`mt-3 text-[15px] leading-[1.5] font-light ${selected ? 'text-[#f5f5f1]/70' : 'text-[#1c2c26]/60'}`}>
                {m.body}
              </p>
            </div>
          );

          return (
            <TiltCard key={m.id} selected={selected} onSelect={() => selectMain(m.id)}>
              {body}
            </TiltCard>
          );
        })}
      </div>

      {mainMode === 'duel' ? (
        <DuelSetup chip={chip} error={duelError} onCreate={onCreateDuel} onJoin={onJoinDuel} />
      ) : (
      /* Run setup, written as a sentence */
      <div className="mt-5 rounded-3xl bg-white border border-[#1c2c26]/10 p-6 md:p-10 shadow-[0_30px_80px_-40px_rgba(28,44,38,0.45)]">
        <p className="text-[12px] uppercase tracking-[0.1em] text-[#628c7d] mb-4">Your run · tap a word to change it</p>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mainMode}
            initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-[30px] md:text-[46px] leading-[1.35] tracking-[-0.01em] text-[#1c2c26] text-balance"
          >
            {mainMode === 'blitz' ? 'Name every country' : 'Name the'}{' '}
            {mainMode === 'flags' && 'flags'}
            {mainMode === 'atlas' && (
              <Chip
                id="topic"
                {...chip}
                value={settings.mode}
                options={TOPICS}
                onChange={(mode) => {
                  atlasTopic.current = mode;
                  onSettingsChange({ mode });
                }}
              />
            )}{' '}
            {settings.mode !== 'us_states' && (
              <>
                {' '}of <Chip id="region" {...chip} value={settings.continent} options={REGIONS} onChange={(continent) => onSettingsChange({ continent })} />
              </>
            )}
            {mainMode !== 'blitz' && settings.mode !== 'us_states' && (
              <>
                {' '}by <Chip id="input" {...chip} value={settings.inputType} options={INPUTS} onChange={(inputType) => onSettingsChange({ inputType })} />
              </>
            )}
            {settings.mode === 'us_states' && ' by typing state & capital'}
            ,{' '}
            <Chip id="clock" {...chip} value={settings.durationSeconds} options={CLOCKS} onChange={(durationSeconds) => onSettingsChange({ durationSeconds })} />.
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 pt-6 border-t border-[#1c2c26]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-[15px] font-light text-[#1c2c26]/60">
            <span className="font-serif text-[28px] text-[#1c2c26] align-middle mr-1">{availableCount}</span>
            {mainMode === 'flags' ? 'flags' : settings.mode === 'capitals' ? 'capitals' : settings.mode === 'us_states' ? 'states' : 'countries'} in this run
          </p>
          <button
            onClick={onStart}
            className="group flex items-center justify-center gap-2 pl-7 pr-2 py-2 rounded-full bg-[#1c2c26] text-[#f5f5f1] text-[16px] hover:bg-[#275f4b] transition-colors"
          >
            Launch run
            <span className="w-10 h-10 rounded-full bg-[#e5ff42] text-[#1c2c26] flex items-center justify-center transition-transform duration-300 group-hover:rotate-45">
              <ArrowUpRight className="w-5 h-5" />
            </span>
          </button>
        </div>
      </div>
      )}
    </MotionConfig>
  );
}
