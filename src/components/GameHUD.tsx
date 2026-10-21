'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Country, GameSettings, AnswerRecord, ActiveTrivia } from '../types/game';
import { COUNTRIES } from '../data/countries';
import GothicLogo from './GothicLogo';
import ArtDecoFrame from './ArtDecoFrame';
import { Timer, Flame, Eye, SkipForward, ArrowLeft, Lightbulb, X, CheckCircle2, ChevronRight, MapPin } from 'lucide-react';

interface GameHUDProps {
  settings: GameSettings;
  targetCountry: Country;
  revealedCountry: Country | null;
  answers: Record<string, AnswerRecord>;
  streak: number;
  timeLeft: number;
  hoveredCountry: Country | null;
  activeTrivia: ActiveTrivia | null;
  onDismissTrivia: () => void;
  onSubmitAnswer: (input: string) => void;
  onSkip: () => void;
  onReveal: () => void;
  onConfirmNext: () => void;
  onExit: () => void;
}

export default function GameHUD({
  settings,
  targetCountry,
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

  const answeredCount = Object.keys(answers).length;
  const totalCountries = COUNTRIES.filter(
    (c) => settings.continent === 'all' || c.continent === settings.continent
  ).length;

  // Generate MCQ options when targetCountry changes
  useEffect(() => {
    if (settings.inputType !== 'mcq') return;

    const isCapital = settings.mode === 'capitals';
    const correctAnswer = isCapital ? targetCountry.capital : targetCountry.name;

    // Pick 3 distractors, preferably from same continent
    const pool = COUNTRIES.filter(
      (c) =>
        c.code !== targetCountry.code &&
        (isCapital ? c.capital !== targetCountry.capital : c.name !== targetCountry.name)
    );

    // Shuffle pool
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
    const distractors = shuffledPool.slice(0, 3).map((c) => (isCapital ? c.capital : c.name));

    const options = [correctAnswer, ...distractors].sort(() => 0.5 - Math.random());
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
      if (e.code === 'Space' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mcqOptions, typedInput, settings.inputType, revealedCountry]);

  const handleTypeSubmit = (answer: string) => {
    const isCapital = settings.mode === 'capitals';
    const target = isCapital ? targetCountry.capital : targetCountry.name;
    const query = answer.trim().toLowerCase();

    const isMatch = isCapital
      ? target.toLowerCase() === query
      : target.toLowerCase() === query ||
        targetCountry.aliases.some((a) => a.toLowerCase() === query);

    if (isMatch) {
      setFeedback({ type: 'correct', message: `✓ Correct! That is ${targetCountry.name}` });
      setTimeout(() => setFeedback(null), 1200);
      onSubmitAnswer(answer);
      setTypedInput('');
    } else {
      setFeedback({ type: 'wrong', message: `✕ Not quite, try again or skip!` });
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  const handleMcqSelect = (choice: string) => {
    const isCapital = settings.mode === 'capitals';
    const target = isCapital ? targetCountry.capital : targetCountry.name;

    if (choice.toLowerCase() === target.toLowerCase()) {
      setFeedback({ type: 'correct', message: `✓ Correct! ${targetCountry.name}` });
      setTimeout(() => setFeedback(null), 1000);
      onSubmitAnswer(choice);
    } else {
      setFeedback({
        type: 'wrong',
        message: `✕ Incorrect! It was ${isCapital ? targetCountry.capital : targetCountry.name}`,
      });
      setTimeout(() => {
        setFeedback(null);
        onSubmitAnswer(choice); // Fail moves to next
      }, 1400);
    }
  };

  const formatTimer = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between">
        {/* Left: Exit & Gothic E Logo */}
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-4 py-2 bg-[#13201b]/90 border border-[#275f4b]/80 hover:border-[#e5ff42] text-xs font-mono uppercase tracking-wider text-[#f5f5f1] hover:text-[#e5ff42] transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Menu</span>
          </button>
          <GothicLogo size={28} className="text-[#f5f5f1]/80 hidden sm:block" />
        </div>

        {/* Center Pill: Timer, Progress & Streak */}
        <div className="pointer-events-auto flex items-center gap-3 md:gap-5 px-5 py-2.5 bg-[#13201b]/90 border border-[#275f4b]/80 shadow-2xl">
          {/* Timer */}
          {settings.durationSeconds > 0 && (
            <div
              className={`flex items-center gap-1.5 font-mono text-xs md:text-sm font-semibold tracking-wider ${
                timeLeft < 60 ? 'text-[#f87171] animate-pulse' : 'text-[#f5f5f1]'
              }`}
            >
              <Timer className="w-3.5 h-3.5 opacity-70" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          )}

          <div className="w-px h-4 bg-[#275f4b]/60" />

          {/* Progress */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium">
            <span className="text-[#628c7d]">SOLVED:</span>
            <span className="font-bold text-[#e5ff42]">
              {answeredCount} / {totalCountries}
            </span>
          </div>

          {/* Streak */}
          {streak > 1 && (
            <>
              <div className="w-px h-4 bg-[#275f4b]/60" />
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#e5ff42] animate-bounce">
                <Flame className="w-3.5 h-3.5 fill-current text-[#e5ff42]" />
                <span>{streak} STREAK</span>
              </div>
            </>
          )}
        </div>

        {/* Right Info Indicator */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2 text-[11px] font-mono uppercase text-[#628c7d]">
          <span className="w-1.5 h-1.5 bg-[#e5ff42]" />
          <span>{settings.continent === 'all' ? 'World Atlas' : settings.continent}</span>
        </div>
      </div>

      {/* Occasional Surprise Trivia Toast (Floats in top-right) */}
      {activeTrivia && (
        <div className="pointer-events-auto absolute top-20 right-6 max-w-sm animate-in fade-in slide-in-from-top-4 duration-300 z-30">
          <ArtDecoFrame
            badge="ARCHIVE // DISCOVERY"
            cornerSize={32}
            cornerColor="text-[#e5ff42]"
            className="p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeTrivia.country.flag}</span>
                <div>
                  <span className="text-xs uppercase font-mono font-bold tracking-wider text-[#e5ff42] flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" /> Did You Know?
                  </span>
                  <p className="text-xs font-bold text-[#f5f5f1]">{activeTrivia.country.name}</p>
                </div>
              </div>
              <button
                onClick={onDismissTrivia}
                className="text-[#f5f5f1]/40 hover:text-[#f5f5f1] transition-colors p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-[#f5f5f1]/80 font-light">
              {activeTrivia.text}
            </p>
          </ArtDecoFrame>
        </div>
      )}

      {/* Answered Country Hover Card (Atlas Exploration) */}
      {hoveredCountry && (() => {
        const record = answers[hoveredCountry.code];
        const status = record?.status || 'correct';
        const isCorrect = status === 'correct';
        const isRevealed = status === 'revealed';

        const borderColor = isCorrect
          ? 'border-[#10b981]/70'
          : isRevealed
          ? 'border-[#f87171]/70'
          : 'border-[#fb923c]/70';

        const badgeColor = isCorrect
          ? 'text-[#10b981]'
          : isRevealed
          ? 'text-[#f87171]'
          : 'text-[#fb923c]';

        const badgeLabel = isCorrect
          ? 'Guessed Correctly'
          : isRevealed
          ? 'Answer Revealed'
          : 'Skipped';

        return (
          <div className={`pointer-events-none absolute top-20 left-6 max-w-xs bg-[#13201b]/95 p-4 border ${borderColor} shadow-2xl animate-in fade-in duration-150 z-30`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{hoveredCountry.flag}</span>
              <div>
                <p className="text-sm font-serif italic font-bold text-[#f5f5f1]">{hoveredCountry.name}</p>
                <p className="text-xs font-mono text-[#628c7d]">Capital: <span className="text-[#f5f5f1] font-semibold">{hoveredCountry.capital}</span></p>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-[#275f4b]/50 flex items-center justify-between text-[11px] font-mono text-[#f5f5f1]/70">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#628c7d]" />
                {hoveredCountry.continent}
              </span>
              <span className={`${badgeColor} font-semibold flex items-center gap-1`}>
                {isCorrect ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isRevealed ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <SkipForward className="w-3.5 h-3.5" />
                )}
                {badgeLabel}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Center Target Notification, Feedback & Reveal Modal */}
      <div className="w-full flex flex-col items-center justify-center my-auto px-4">
        {/* Answer Revealed Card (When user clicks "What's the answer?") */}
        {revealedCountry ? (
          <div className="pointer-events-auto max-w-md w-full animate-in zoom-in-95 duration-200 my-auto">
            <ArtDecoFrame
              badge="INTEL // TARGET REVEALED"
              cornerSize={44}
              cornerColor="text-[#e5ff42]"
              className="p-6 text-center shadow-2xl"
            >
              <span className="text-5xl mb-2 block">{revealedCountry.flag}</span>
              <span className="text-xs font-mono uppercase tracking-widest text-[#e5ff42] font-bold">
                Classification Complete
              </span>
              <h3 className="text-3xl font-serif italic font-bold text-[#f5f5f1] mt-1 mb-1">
                {revealedCountry.name}
              </h3>
              <p className="text-sm font-mono text-[#628c7d] mb-4">
                CAPITAL: <span className="text-[#f5f5f1] font-semibold">{revealedCountry.capital}</span> • {revealedCountry.continent}
              </p>
              {revealedCountry.trivia && (
                <p className="text-xs text-[#f5f5f1]/80 italic bg-[#0e1814]/90 p-3 mb-5 border border-[#275f4b]/60 leading-relaxed text-left font-light">
                  💡 <span className="font-semibold text-[#e5ff42]">Atlas Archive:</span> {revealedCountry.trivia}
                </p>
              )}
              <button
                onClick={onConfirmNext}
                className="w-full py-3.5 bg-[#e5ff42] text-[#1c2c26] text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#d4ee38] transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Continue to Next Target (Enter / Space)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </ArtDecoFrame>
          </div>
        ) : feedback ? (
          <div
            className={`px-6 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold shadow-2xl animate-in zoom-in-95 duration-150 border ${
              feedback.type === 'correct'
                ? 'bg-[#10b981] text-[#1c2c26] border-[#10b981]'
                : feedback.type === 'wrong'
                ? 'bg-[#f87171] text-[#1c2c26] border-[#f87171]'
                : 'bg-[#e5ff42] text-[#1c2c26] border-[#e5ff42]'
            }`}
          >
            {feedback.message}
          </div>
        ) : null}
      </div>

      {/* Bottom Action Island (Hidden when an answer is actively revealed) */}
      {!revealedCountry && (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-3">
          {/* Prompt Title */}
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#e5ff42] font-semibold mb-1">
              {settings.mode === 'countries' ? '// IDENTIFY HIGHLIGHTED TERRITORY' : '// IDENTIFY COUNTRY CAPITAL'}
            </p>
            <h2 className="text-lg md:text-2xl font-serif italic text-[#f5f5f1]">
              {settings.mode === 'countries'
                ? 'What country is glowing on the globe?'
                : `What is the capital of ${targetCountry.name}?`}
            </h2>
          </div>

          {/* Dynamic Input: Type vs MCQ */}
          {settings.inputType === 'type' ? (
            <div className="w-full relative pointer-events-auto">
              {/* Input Bar (No dropdown list: pure recall typing!) */}
              <div className="relative flex items-center bg-[#13201b]/90 border border-[#275f4b]/80 focus-within:border-[#e5ff42] p-1.5 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder={
                    settings.mode === 'countries'
                      ? 'Type country name and press Enter...'
                      : 'Type capital city name and press Enter...'
                  }
                  className="w-full bg-transparent px-4 py-3 text-sm md:text-base text-[#f5f5f1] placeholder-[#f5f5f1]/30 focus:outline-none font-mono"
                />
                <button
                  onClick={() => typedInput.trim() && handleTypeSubmit(typedInput)}
                  disabled={!typedInput.trim()}
                  className="px-6 py-3 bg-[#e5ff42] text-[#1c2c26] text-xs font-bold font-mono uppercase tracking-wider hover:bg-[#d4ee38] disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  Submit
                </button>
              </div>
            </div>
          ) : (
            /* MCQ Option Cards */
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 pointer-events-auto">
              {mcqOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleMcqSelect(option)}
                  className="relative bg-[#13201b]/90 border border-[#275f4b]/80 hover:border-[#e5ff42] px-4 py-3.5 flex items-center justify-between text-left group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-[#0e1814] border border-[#275f4b]/60 text-xs font-mono font-bold text-[#e5ff42] flex items-center justify-center group-hover:bg-[#e5ff42] group-hover:text-[#1c2c26] transition-all">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-[#f5f5f1] group-hover:text-white">
                      {option}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#628c7d] opacity-0 group-hover:opacity-100 transition-opacity">
                    SELECT ↵
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Action Controls: Skip & Reveal */}
          <div className="flex items-center gap-3 pointer-events-auto pt-1">
            <button
              onClick={onSkip}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#13201b]/80 border border-[#275f4b]/60 hover:border-[#628c7d] text-xs font-mono uppercase tracking-wider text-[#f5f5f1]/70 hover:text-[#f5f5f1] transition-all"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip Country (Space)</span>
            </button>

            <button
              onClick={onReveal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#13201b]/80 border border-[#275f4b]/60 hover:border-[#f87171] text-xs font-mono uppercase tracking-wider text-[#f5f5f1]/70 hover:text-[#f87171] transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>What&apos;s the answer?</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
