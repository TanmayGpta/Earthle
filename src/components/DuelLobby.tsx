'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import { InputType } from '../types/game';
import { DuelState } from '../lib/useDuel';
import { Chip, DUEL_MODES, INPUTS, ORDERS, REGIONS, useChipMenu } from './ModePicker';

interface DuelLobbyProps {
  duel: DuelState;
  inputType: InputType;
  onInputChange: (inputType: InputType) => void;
  onReady: (ready: boolean) => void;
  onLeave: () => void;
}

const labelOf = <T,>(options: { value: T; label: string }[], value: T) =>
  options.find((o) => o.value === value)?.label ?? '';

// Waiting room: share the code, pick how you answer, both press Start
export default function DuelLobby({ duel, inputType, onInputChange, onReady, onLeave }: DuelLobbyProps) {
  const chip = useChipMenu();
  const [copied, setCopied] = useState(false);
  const { code, config, phase, rivalHere, meReady, rivalReady } = duel;
  const isBlitz = config?.mode === 'blitz';

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const summary =
    config &&
    [
      labelOf(DUEL_MODES, config.mode),
      labelOf(REGIONS, config.continent),
      ...(isBlitz ? [] : [labelOf(ORDERS, config.order)]),
      '15 minutes',
    ].join(' · ');

  const status = !rivalHere
    ? phase === 'opening' ? 'Connecting…' : 'Waiting for your rival to join'
    : meReady
      ? 'Waiting for your rival to press Start'
      : rivalReady
        ? 'Your rival is ready'
        : 'Your rival is here';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1c2c26] flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white text-[#1c2c26] p-6 md:p-10 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)]">
        <button
          onClick={onLeave}
          className="flex items-center gap-1.5 -ml-1 text-[13px] font-light text-[#1c2c26]/60 hover:text-[#1c2c26] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Leave duel
        </button>

        <p className="mt-6 text-[12px] uppercase tracking-[0.1em] text-[#628c7d]">Duel code</p>
        <div className="mt-1 flex items-center gap-3">
          <p className="font-serif text-[56px] md:text-[72px] leading-none tracking-[0.06em]">{code}</p>
          <button
            onClick={copyCode}
            aria-label="Copy duel code"
            className="w-10 h-10 shrink-0 rounded-full border border-[#1c2c26]/15 flex items-center justify-center hover:bg-[#e5ff42] transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        {summary && <p className="mt-3 text-[15px] font-light text-[#1c2c26]/60">{summary}</p>}

        {config && (
          <div className="mt-8 font-serif text-[30px] md:text-[40px] leading-[1.35] tracking-[-0.01em]">
            {isBlitz ? (
              'Blitz is typing only.'
            ) : (
              <>
                You&apos;ll answer by{' '}
                <Chip id="duel-input" {...chip} value={inputType} options={INPUTS} onChange={onInputChange} />.
              </>
            )}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-[#1c2c26]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-[15px] font-light text-[#1c2c26]/70">
            <span className={`w-2 h-2 rounded-full ${rivalHere ? 'bg-[#10b981]' : 'bg-[#fb923c] animate-pulse'}`} />
            {status}
          </p>
          <button
            onClick={() => onReady(!meReady)}
            disabled={!rivalHere}
            className={`shrink-0 px-8 py-3.5 rounded-full text-[16px] transition-colors disabled:opacity-30 disabled:pointer-events-none ${
              meReady ? 'bg-[#e5ff42] text-[#1c2c26] hover:bg-[#d4ee38]' : 'bg-[#1c2c26] text-[#f5f5f1] hover:bg-[#275f4b]'
            }`}
          >
            {meReady ? 'Ready · tap to cancel' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Covers the board until the shared clock starts: hides the first question and swallows key presses
export function DuelCountdown({ startsAt }: { startsAt: number }) {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.ceil((startsAt - Date.now()) / 1000));
  const counting = secondsLeft > 0;

  useEffect(() => {
    if (!counting) return;
    const timer = setInterval(() => setSecondsLeft(Math.ceil((startsAt - Date.now()) / 1000)), 100);
    const swallow = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener('keydown', swallow, true);
    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', swallow, true);
    };
  }, [counting, startsAt]);

  if (!counting) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-[#1c2c26] flex flex-col items-center justify-center select-none">
      <p className="text-[12px] uppercase tracking-[0.1em] text-[#daba89]">Duel starts in</p>
      <p key={secondsLeft} className="font-serif text-[140px] leading-none text-[#e5ff42] animate-rise [animation-duration:0.4s]">
        {secondsLeft}
      </p>
    </div>
  );
}
