'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Country, GameSettings, AnswerRecord, ActiveTrivia } from '../types/game';
import { answerFor, isCorrectAnswer, pickDistractors, shuffle } from '../lib/game';
import { motion } from 'motion/react';
import DecoCard from './DecoCard';
import Flag from './Flag';
import { Timer, Flame, Eye, SkipForward, ArrowLeft, Lightbulb, X, CheckCircle2, ChevronRight, MapPin } from 'lucide-react';

interface GameHUDProps {
  settings: GameSettings;
  targetCountry: Country;
  totalCountries: number;
  revealedCountry: Country | null;
  answers: Record<string, AnswerRecord>;
  streak: number;
  timeLeft: number;
  hoveredCountry: Country | null;
  activeTrivia: ActiveTrivia | null;
  onDismissTrivia: () => void;
  onSubmitAnswer: (isCorrect: boolean) => void;
  onSkip: () => void;
  onReveal: () => void;
  onConfirmNext: () => void;
  onExit: () => void;
}

export default function GameHUD({
  settings,
  targetCountry,
  totalCountries,
  revealedCountry,
  answers,
  streak,
  timeLeft,
  hoveredCountry,
  activeTrivia,
  onDismissTrivia,
  onSubmitAnswer,
  onSkip,
  onReveal,
  onConfirmNext,
  onExit,
}: GameHUDProps) {
  const [typedInput, setTypedInput] = useState('');
  const [mcqOptions, setMcqOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong' | 'reveal'; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Blocks input while a wrong-MCQ answer is shown, so it can't be submitted twice
  const lockedRef = useRef(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const answeredCount = Object.values(answers).filter((a) => a.status !== 'skipped').length;
  const isFlags = settings.mode === 'flags';

  const prompt = {
    countries: { label: 'Name the glowing country', placeholder: 'Type the country…' },
    capitals: { label: 'Name the capital', placeholder: 'Type the capital…' },
    flags: { label: 'Name the flag', placeholder: 'Type the country…' },
  }[settings.mode];

  const later = (fn: () => void, ms: number) => {
    timeoutsRef.current.push(setTimeout(fn, ms));
  };

  // Cancel pending feedback/submit timers on unmount (e.g. timer hits zero mid-feedback)
  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), []);

  // Generate MCQ options when targetCountry changes
  useEffect(() => {
    if (settings.inputType !== 'mcq') return;

    lockedRef.current = false;
    const correctAnswer = answerFor(targetCountry, settings.mode);
    const options = shuffle([correctAnswer, ...pickDistractors(targetCountry, settings.mode)]);
    setMcqOptions(options);
  }, [targetCountry, settings.mode, settings.inputType]);

  // Focus input automatically
  useEffect(() => {
    if (!revealedCountry && settings.inputType === 'type' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [targetCountry, revealedCountry, settings.inputType]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If a country answer is currently revealed, Enter or Space advances
      if (revealedCountry) {
        if (e.key === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          onConfirmNext();
        }
        return;
      }

      // If typing in input box
      if (document.activeElement === inputRef.current && settings.inputType === 'type') {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (typedInput.trim()) {
            handleTypeSubmit(typedInput);
          }
        }
        return;
      }

      // MCQ Number keys 1-4
      if (settings.inputType === 'mcq' && ['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        if (mcqOptions[index]) {
          handleMcqSelect(mcqOptions[index]);
        }
      }

      // Space to skip
      if (e.code === 'Space' && document.activeElement !== inputRef.current && !lockedRef.current) {
        e.preventDefault();
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }); // Re-bind each render so handlers never see stale props

  const handleTypeSubmit = (answer: string) => {
    if (isCorrectAnswer(targetCountry, settings.mode, answer)) {
      setFeedback({ type: 'correct', message: `✓ Correct! That is ${targetCountry.name}` });
      later(() => setFeedback(null), 1200);
      onSubmitAnswer(true);
      setTypedInput('');
    } else {
      setFeedback({ type: 'wrong', message: `✕ Not quite, try again or skip!` });
      later(() => setFeedback(null), 1200);
    }
  };

  const handleMcqSelect = (choice: string) => {
    if (lockedRef.current) return;

    if (isCorrectAnswer(targetCountry, settings.mode, choice)) {
      setFeedback({ type: 'correct', message: `✓ Correct! ${targetCountry.name}` });
      later(() => setFeedback(null), 1000);
      onSubmitAnswer(true);
    } else {
      lockedRef.current = true;
      setFeedback({
        type: 'wrong',
        message: `✕ Incorrect! It was ${answerFor(targetCountry, settings.mode)}`,
      });
      later(() => {
        setFeedback(null);
        onSubmitAnswer(false); // Fail moves to next
      }, 1400);
    }
  };

  const formatTimer = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const pill = 'bg-[#1c2c26]/90 backdrop-blur-md border border-[#daba89]/30 rounded-full shadow-xl';

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-3 md:p-5 select-none">
      {/* Top Header */}
      <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Left: Exit & Logo */}
        <div className="pointer-events-auto flex items-center gap-3 justify-self-start">
          <button
            onClick={onExit}
            className={`${pill} group flex items-center gap-2 pl-1.5 pr-4 py-1.5 text-[13px] font-light text-[#f5f5f1] hover:border-[#e5ff42]/60 transition-all`}
          >
            <span className="w-6 h-6 rounded-full bg-[#f5f5f1]/10 flex items-center justify-center transition-transform duration-300 group-hover:-translate-x-0.5">
              <ArrowLeft className="w-4 h-4" />
            </span>
            Menu
          </button>
                  </div>

        {/* Center Pill: Timer, Progress & Streak */}
        <div className={`${pill} pointer-events-auto flex items-center gap-3 md:gap-4 px-5 py-1.5 text-[13px]`}>
          {settings.durationSeconds > 0 && (
            <>
              <div
                className={`flex items-center gap-1.5 tabular-nums font-medium ${
                  timeLeft < 60 ? 'text-[#f87171] animate-pulse' : 'text-[#f5f5f1]'
                }`}
              >
                <Timer className="w-4 h-4 opacity-70" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
              <div className="w-px h-4 bg-[#daba89]/30" />
            </>
          )}

          <div className="flex items-baseline gap-1.5 tabular-nums">
            <span className="font-serif text-[19px] leading-none text-[#e5ff42]">{answeredCount}</span>
            <span className="font-light text-[#f5f5f1]/50">/ {totalCountries}</span>
          </div>

          {streak > 1 && (
            <>
              <div className="w-px h-4 bg-[#daba89]/30" />
              <div key={streak} className="flex items-center gap-1 font-medium text-[#e5ff42] animate-rise">
                <Flame className="w-4 h-4 fill-current" />
                <span className="tabular-nums">{streak}</span>
              </div>
            </>
          )}
        </div>

        {/* Right Info Indicator */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2 justify-self-end text-[12px] uppercase tracking-[0.1em] text-[#daba89]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e5ff42]" />
          <span>{settings.continent === 'all' ? 'World atlas' : settings.continent}</span>
        </div>
      </div>

      {/* Occasional Surprise Trivia Toast (Floats in top-right) */}
      {activeTrivia && (
        <div key={activeTrivia.id} className="pointer-events-auto absolute top-20 right-4 md:right-6 max-w-sm animate-rise z-30">
          <DecoCard cornerSize={28} className="shadow-2xl">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Flag country={activeTrivia.country} className="h-7 w-auto rounded-[2px]" />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.1em] text-[#daba89] flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" /> Did you know?
                    </p>
                    <p className="font-serif text-[22px] leading-tight">{activeTrivia.country.name}</p>
                  </div>
                </div>
                <button
                  onClick={onDismissTrivia}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[#f5f5f1]/50 hover:text-[#f5f5f1] hover:bg-[#f5f5f1]/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-[14px] leading-[1.5] text-[#f5f5f1]/75 font-light">{activeTrivia.text}</p>
            </div>
          </DecoCard>
        </div>
      )}

      {/* Answered Country Hover Card (Atlas Exploration) */}
      {hoveredCountry && (() => {
        const status = answers[hoveredCountry.code]?.status || 'correct';
        const meta = {
          correct: { color: 'text-[#10b981]', label: 'Guessed correctly', Icon: CheckCircle2 },
          revealed: { color: 'text-[#f87171]', label: 'Answer revealed', Icon: Eye },
          skipped: { color: 'text-[#fb923c]', label: 'Skipped', Icon: SkipForward },
        }[status];

        return (
          <div className="pointer-events-none absolute top-20 left-4 md:left-6 w-72 z-30 animate-rise [animation-duration:0.4s]">
            <DecoCard cornerSize={26} className="shadow-2xl">
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <Flag country={hoveredCountry} className="h-9 w-auto rounded-[2px]" />
                  <div>
                    <p className="font-serif text-[24px] leading-tight">{hoveredCountry.name}</p>
                    <p className="text-[13px] font-light text-[#f5f5f1]/60">{hoveredCountry.capital}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#daba89]/20 flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-1 text-[#daba89]">
                    <MapPin className="w-3.5 h-3.5" />
                    {hoveredCountry.continent}
                  </span>
                  <span className={`${meta.color} flex items-center gap-1`}>
                    <meta.Icon className="w-3.5 h-3.5" />
                    {meta.label}
                  </span>
                </div>
              </div>
            </DecoCard>
          </div>
        );
      })()}

      {/* Center: Reveal card & feedback */}
      <div className="w-full flex flex-col items-center justify-center my-auto px-4">
        {revealedCountry ? (
          <div className="pointer-events-auto max-w-md w-full animate-rise">
            <DecoCard cornerSize={48} className="shadow-2xl text-center">
              <div className="px-8 py-10">
                <Flag country={revealedCountry} className="h-16 w-auto mx-auto mb-4 rounded-[3px] shadow-lg" />
                <p className="text-[12px] uppercase tracking-[0.1em] text-[#daba89]">The answer was</p>
                <h3 className="font-serif text-[44px] leading-[1.04] tracking-[-0.02em] mt-1">{revealedCountry.name}</h3>
                <p className="mt-2 text-[15px] font-light text-[#f5f5f1]/60">
                  {revealedCountry.capital} · {revealedCountry.continent}
                </p>
                {revealedCountry.trivia && (
                  <p className="mt-6 text-[14px] leading-[1.55] text-[#f5f5f1]/75 font-light text-left border-l-2 border-[#daba89]/50 pl-4">
                    {revealedCountry.trivia}
                  </p>
                )}
                <button
                  onClick={onConfirmNext}
                  className="group mt-8 w-full flex items-center justify-center gap-2 pl-7 pr-2 py-2 rounded-full bg-[#e5ff42] text-[#1c2c26] text-[15px] font-medium hover:bg-[#d4ee38] transition-colors"
                >
                  <span className="flex-1 text-center">Next country</span>
                  <span className="text-[12px] text-[#1c2c26]/60 mr-2">Enter</span>
                  <span className="w-9 h-9 rounded-full bg-[#1c2c26] text-[#e5ff42] flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                    <ChevronRight className="w-5 h-5" />
                  </span>
                </button>
              </div>
            </DecoCard>
          </div>
        ) : feedback ? (
          <div
            key={feedback.message}
            className={`px-6 py-3 rounded-full text-[15px] font-medium shadow-2xl animate-rise [animation-duration:0.35s] ${
              feedback.type === 'correct'
                ? 'bg-[#10b981] text-[#0e1814]'
                : feedback.type === 'wrong'
                ? 'bg-[#f87171] text-[#0e1814]'
                : 'bg-[#e5ff42] text-[#1c2c26]'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}
      </div>

      {/* Bottom Question Card (Hidden when an answer is actively revealed) */}
      {!revealedCountry && (
        <div className="w-full max-w-lg mx-auto pointer-events-auto">
          <DecoCard cornerSize={24} className="shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
            <div className="px-4 py-4 md:px-5 flex flex-col items-center gap-3">
              {/* Flags mode: the flag swings in on a 3D hinge each round */}
              {isFlags && (
                <div className="pt-1 [perspective:900px]">
                  <motion.div
                    key={targetCountry.code}
                    initial={{ rotateY: -95, opacity: 0, scale: 0.9 }}
                    animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 160, damping: 17 }}
                    style={{ transformOrigin: 'left center' }}
                  >
                    <Flag
                      country={targetCountry}
                      conceal
                      className="h-28 md:h-36 w-auto max-w-[280px] md:max-w-[320px] object-contain rounded-[3px] ring-1 ring-black/30 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)]"
                    />
                  </motion.div>
                </div>
              )}

              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#daba89] mb-0.5">{prompt.label}</p>
                <h2 key={targetCountry.code} className="font-serif text-[20px] md:text-[24px] leading-[1.15] tracking-[-0.01em] animate-rise [animation-duration:0.5s]">
                  {settings.mode === 'countries' ? (
                    'Which country is this?'
                  ) : isFlags ? (
                    'Whose flag is this?'
                  ) : (
                    <>
                      What is the capital of <span className="text-[#e5ff42]">{targetCountry.name}</span>?
                    </>
                  )}
                </h2>
              </div>

              {settings.inputType === 'type' ? (
                <div className="w-full flex items-center rounded-full bg-[#f5f5f1] p-1 ring-2 ring-transparent focus-within:ring-[#e5ff42] transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    placeholder={prompt.placeholder}
                    className="w-full bg-transparent px-4 py-2 text-[15px] text-[#1c2c26] placeholder-[#1c2c26]/40 focus:outline-none"
                  />
                  <button
                    onClick={() => typedInput.trim() && handleTypeSubmit(typedInput)}
                    disabled={!typedInput.trim()}
                    className="shrink-0 px-5 py-2 rounded-full bg-[#1c2c26] text-[#e5ff42] text-[14px] font-medium hover:bg-[#275f4b] disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    Submit
                  </button>
                </div>
              ) : (
                /* MCQ: light pills on the dark card for contrast */
                <div key={targetCountry.code} className="w-full grid grid-cols-2 gap-2">
                  {mcqOptions.map((option, index) => (
                    <button
                      key={option}
                      onClick={() => handleMcqSelect(option)}
                      style={{ animationDelay: `${index * 50}ms` }}
                      className="group animate-rise [animation-duration:0.5s] flex items-center gap-2 rounded-full bg-[#f5f5f1] text-[#1c2c26] pl-1.5 pr-4 py-1.5 text-left hover:bg-[#e5ff42] hover:-translate-y-0.5 transition-all duration-300 ease-out-expo"
                    >
                      <span className="w-6 h-6 shrink-0 rounded-full bg-[#1c2c26] text-[#daba89] text-[12px] font-medium flex items-center justify-center group-hover:text-[#e5ff42] transition-colors">
                        {index + 1}
                      </span>
                      <span className="text-[14px] font-medium truncate">{option}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Skip & Reveal */}
              <div className="flex items-center gap-1 -mb-1 text-[13px] font-light">
                <button
                  onClick={() => !lockedRef.current && onSkip()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[#f5f5f1]/60 hover:text-[#f5f5f1] hover:bg-[#f5f5f1]/10 transition-all"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Skip <span className="text-[12px] text-[#f5f5f1]/35">Space</span>
                </button>
                <span className="w-px h-4 bg-[#daba89]/30" />
                <button
                  onClick={() => !lockedRef.current && onReveal()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[#f5f5f1]/60 hover:text-[#f87171] hover:bg-[#f87171]/10 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Reveal answer
                </button>
              </div>
            </div>
          </DecoCard>
        </div>
      )}
    </div>
  );
}
