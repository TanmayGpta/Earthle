'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Country, GameSettings, AnswerRecord, ActiveTrivia } from '../types/game';
import { getCountryPool, createRng, newSeed, shuffle } from '../lib/game';
import GameHUD from '../components/GameHUD';
import GameOverModal from '../components/GameOverModal';
import GothicLogo from '../components/GothicLogo';
import ArtDecoFrame, { ArtDecoCorner } from '../components/ArtDecoFrame';
import { Play, Compass, Globe2, ShieldCheck, Zap, ArrowDown, ChevronRight, Globe, MapPin } from 'lucide-react';

// Dynamic import for 3D Globe components to prevent SSR issues
const HeroGlobe = dynamic(() => import('../components/HeroGlobe'), { ssr: false });
const InteractiveGlobe = dynamic(() => import('../components/InteractiveGlobe'), { ssr: false });

export default function EarthleHome() {
  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isReviewingAtlas, setIsReviewingAtlas] = useState(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    mode: 'countries',
    inputType: 'mcq',
    continent: 'all',
    durationSeconds: 900, // 15 mins default
  });

  // Landing Scroll State
  const [scrollProgress, setScrollProgress] = useState(0);

  // Active game session data
  const [countryQueue, setCountryQueue] = useState<Country[]>([]);
  const [currentCountryIndex, setCurrentCountryIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(900);
  const [timeSpent, setTimeSpent] = useState(0);
  const [runSeed, setRunSeed] = useState(0);

  // Hover & Trivia interaction
  const [hoveredCountry, setHoveredCountry] = useState<Country | null>(null);
  const [activeTrivia, setActiveTrivia] = useState<ActiveTrivia | null>(null);
  const [revealedCountry, setRevealedCountry] = useState<Country | null>(null);

  // Track scroll on landing page (with staged choreography)
  useEffect(() => {
    if (isPlaying) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const progress = Math.min(1, Math.max(0, scrollY / (windowHeight * 1.15)));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPlaying]);

  // Lock body scroll when playing
  useEffect(() => {
    if (isPlaying) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isPlaying]);

  // Countries playable under current settings
  const availableCountries = useMemo(
    () => getCountryPool(settings),
    [settings.mode, settings.continent]
  );

  // Start / Launch Game
  const startGame = (customSettings?: Partial<GameSettings>) => {
    const activeSettings = { ...settings, ...customSettings };
    setSettings(activeSettings);

    // Fresh random seed every run; nothing is persisted
    const seed = newSeed();
    setRunSeed(seed);
    setCountryQueue(shuffle(getCountryPool(activeSettings), createRng(seed)));
    setCurrentCountryIndex(0);
    setAnswers({});
    setStreak(0);
    setMaxStreak(0);
    setTimeLeft(activeSettings.durationSeconds);
    setTimeSpent(0);
    setIsGameOver(false);
    setIsReviewingAtlas(false);
    setActiveTrivia(null);
    setHoveredCountry(null);
    setRevealedCountry(null);
    setIsPlaying(true);
  };

  // Target Country
  const targetCountry = countryQueue[currentCountryIndex] || null;

  // Game clock: elapsed time always ticks, countdown only when timed
  useEffect(() => {
    if (!isPlaying || isGameOver || isReviewingAtlas) return;
    const timed = settings.durationSeconds > 0; // 0 = unlimited zen mode

    const timer = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
      if (!timed) return;
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isGameOver, isReviewingAtlas, settings.durationSeconds]);

  // Move to next country in queue or finish game
  const advanceToNext = () => {
    if (currentCountryIndex + 1 < countryQueue.length) {
      setCurrentCountryIndex((prev) => prev + 1);
    } else {
      setIsGameOver(true);
    }
  };

  const recordAnswer = (code: string, status: AnswerRecord['status']) => {
    setAnswers((prev) => ({
      ...prev,
      [code]: {
        countryCode: code,
        status,
        attempts: (prev[code]?.attempts ?? 0) + 1,
        timestamp: Date.now(),
      },
    }));
  };

  // Submit Answer (correctness is decided by the HUD)
  const handleSubmitAnswer = (isCorrect: boolean) => {
    if (!targetCountry) return;

    recordAnswer(targetCountry.code, isCorrect ? 'correct' : 'revealed');

    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setMaxStreak((prev) => Math.max(prev, nextStreak));

      // Occasional surprise trivia (18% random chance or on milestone streak)
      if ((Math.random() < 0.18 || nextStreak % 5 === 0) && targetCountry.trivia) {
        setActiveTrivia({
          country: targetCountry,
          text: targetCountry.trivia,
          id: String(Date.now()),
        });
      }
    } else {
      setStreak(0);
    }

    advanceToNext();
  };

  // Skip Country (marked skipped, moves to back of queue)
  const handleSkip = () => {
    if (!targetCountry) return;
    setStreak(0);
    recordAnswer(targetCountry.code, 'skipped');

    // Re-insert into queue at the end
    setCountryQueue((prev) => {
      const remaining = [...prev];
      const [skipped] = remaining.splice(currentCountryIndex, 1);
      return [...remaining, skipped];
    });
  };

  // Reveal Answer ("What's the answer?")
  const handleReveal = () => {
    if (!targetCountry) return;

    setStreak(0);
    recordAnswer(targetCountry.code, 'revealed');

    // Show the revealed country card so the player can actually learn what the country was!
    setRevealedCountry(targetCountry);
  };

  // Continue to next question after reviewing revealed answer
  const handleConfirmNext = () => {
    setRevealedCountry(null);
    advanceToNext();
  };

  // Exit Game
  const handleExit = () => {
    setIsPlaying(false);
    setIsGameOver(false);
    setIsReviewingAtlas(false);
  };

  return (
    <main className="relative min-h-screen bg-[#1c2c26] text-[#f5f5f1] overflow-x-hidden selection:bg-[#e5ff42] selection:text-[#1c2c26]">
      {/* ---------------- ACTIVE GAME MODE ---------------- */}
      {isPlaying ? (
        <div className="fixed inset-0 z-40 bg-[#1c2c26]">
          {/* Interactive 3D WebGL Globe */}
          {targetCountry && (
            <InteractiveGlobe
              targetCountry={targetCountry}
              answers={answers}
              onCountryHover={(country) => setHoveredCountry(country)}
            />
          )}

          {/* In-Game HUD */}
          {targetCountry && !isGameOver && (
            <GameHUD
              settings={settings}
              targetCountry={targetCountry}
              totalCountries={countryQueue.length}
              revealedCountry={revealedCountry}
              answers={answers}
              streak={streak}
              timeLeft={timeLeft}
              hoveredCountry={hoveredCountry}
              activeTrivia={activeTrivia}
              onDismissTrivia={() => setActiveTrivia(null)}
              onSubmitAnswer={handleSubmitAnswer}
              onSkip={handleSkip}
              onReveal={handleReveal}
              onConfirmNext={handleConfirmNext}
              onExit={handleExit}
            />
          )}

          {/* Game Over Summary Modal */}
          {isGameOver && (
            <GameOverModal
              settings={settings}
              answers={answers}
              totalCountries={countryQueue.length}
              runSeed={runSeed}
              maxStreak={maxStreak}
              timeSpentSeconds={timeSpent}
              onPlayAgain={() => startGame()}
              onReviewAtlas={() => {
                setIsGameOver(false);
                setIsReviewingAtlas(true);
              }}
            />
          )}

          {/* Review Mode Banner (Allows spinning globe to inspect answered world) */}
          {isReviewingAtlas && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 glass-panel px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl">
              <span className="text-sm font-semibold text-[#f5f5f1]">
                Atlas Review: Hover over green/coral countries to explore
              </span>
              <button
                onClick={handleExit}
                className="px-4 py-1.5 rounded-full bg-[#e5ff42] text-[#1c2c26] text-xs font-bold hover:bg-[#d4ee38]"
              >
                Return to Menu
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ---------------- LANDING / PRESENTATION MODE ---------------- */
        <div className="relative min-h-[220vh]">
          {/* Spinning 3D Half-Earth Canvas */}
          <HeroGlobe scrollProgress={scrollProgress} />

          {/* SECTION 1: HERO VIEW (Initial Load) */}
          <section className="relative z-10 min-h-screen flex flex-col justify-between pt-3 md:pt-4 px-6 md:px-12 pb-6 md:pb-12 pointer-events-none">
            {/* Top Bar (Matches Rainmaker top header with Gothic E lettermark) */}
            <header className="w-full grid grid-cols-3 items-center pointer-events-auto">
              {/* Left indicator with Gothic "E" Logo */}
              <div className="flex items-center gap-3">
                <GothicLogo size={36} className="text-[#f5f5f1] hover:text-[#e5ff42] cursor-pointer" />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#e5ff42] font-semibold">
                    Cartography // 01
                  </span>
                  <span className="text-[11px] font-sans tracking-wide text-[#628c7d]">
                    Spatial Memory Atlas
                  </span>
                </div>
              </div>

              {/* Center Brand Title in same style as Rainmaker */}
              <div className="flex justify-center items-center">
                <span className="font-serif uppercase text-[26px] md:text-[33px] text-[#f5f5f1] tracking-normal font-normal leading-none select-none">
                  Earthle
                </span>
              </div>

              {/* Right CTA */}
              <div className="flex justify-end">
                <button
                  onClick={() => startGame()}
                  className="px-6 py-2.5 bg-[#e5ff42] text-[#1c2c26] text-xs font-bold uppercase tracking-wider hover:bg-[#d4ee38] transition-all flex items-center gap-2 shadow-lg hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Quick Run</span>
                </button>
              </div>
            </header>

            {/* Hero Main Typography */}
            <div className="max-w-4xl mx-auto text-center my-auto pointer-events-auto">
              <p className="text-xs md:text-sm uppercase font-bold tracking-[0.25em] text-[#e5ff42] mb-4">
                Spatial Memory & Cartography
              </p>
              <h1 className="font-serif italic text-5xl md:text-8xl lg:text-9xl leading-[0.95] text-[#f5f5f1] tracking-tight mb-6">
                Make Geography Instinctive.
              </h1>
              <p className="max-w-xl mx-auto text-sm md:text-lg text-[#f5f5f1]/80 font-light leading-relaxed mb-8">
                Identify glowing territories on a spinning 3D globe. No trial-and-error
                distance guessing—pure spatial visual recall.
              </p>

              {/* Dual CTAs (Architectural / Sharp) */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => startGame()}
                  className="w-full sm:w-auto px-8 py-4 bg-[#e5ff42] text-[#1c2c26] text-xs md:text-sm font-extrabold uppercase tracking-widest hover:bg-[#d4ee38] shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Quiz (15m Sprint)</span>
                </button>

                <button
                  onClick={() => {
                    window.scrollTo({
                      top: window.innerHeight * 0.9,
                      behavior: 'smooth',
                    });
                  }}
                  className="w-full sm:w-auto px-7 py-4 bg-[#13201b]/80 border border-[#275f4b] hover:border-[#e5ff42] text-xs md:text-sm font-bold uppercase tracking-wider text-[#f5f5f1] hover:text-[#e5ff42] transition-all flex items-center justify-center gap-2 backdrop-blur-md"
                >
                  <span>Explore Modes</span>
                  <ArrowDown className="w-4 h-4 text-[#628c7d]" />
                </button>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="text-center pb-4 text-xs font-mono tracking-widest text-[#f5f5f1]/60 pointer-events-auto">
              SCROLL TO CONFIGURE MODES ↓
            </div>
          </section>

          {/* SECTION 2: DOCKED MODES & FULL-WIDTH FOOTER */}
          <section className="relative z-10 min-h-screen flex flex-col justify-between pt-16 pb-0 w-full overflow-hidden">
            {/* Inner Content Constrained to max-w-6xl for optimal readability */}
            <div className="w-full max-w-6xl mx-auto px-6 md:px-12 flex flex-col justify-between my-auto">
              {/* Mode Cards Header */}
              <div className="text-center mb-10">
                <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#e5ff42] font-semibold">
                  // 02 CONFIGURATION
                </span>
                <h2 className="font-serif italic text-4xl md:text-5xl text-[#f5f5f1] mt-1">
                  Choose Your Game Style
                </h2>
              </div>

              {/* Mode Configuration Grid: Architectural Art Deco Frames */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-auto">
                {/* Card 1: Quiz Target */}
                <ArtDecoFrame
                  badge="01 // TARGET OBJECTIVE"
                  cornerSize={44}
                  cornerColor="text-[#e5ff42]"
                  className="p-6 flex flex-col justify-between shadow-2xl"
                >
                  <div className="pt-2">
                    <h3 className="text-2xl font-serif italic text-[#f5f5f1] mb-2">Quiz Target</h3>
                    <p className="text-xs text-[#f5f5f1]/70 leading-relaxed mb-6 font-light">
                      Choose whether you identify country names or their official sovereign capital cities.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#0e1814]/90 p-1 border border-[#275f4b]/60">
                    <button
                      onClick={() => setSettings((s) => ({ ...s, mode: 'countries' }))}
                      className={`py-3 text-xs font-mono uppercase tracking-wider font-bold transition-all ${
                        settings.mode === 'countries'
                          ? 'bg-[#e5ff42] text-[#1c2c26]'
                          : 'text-[#f5f5f1]/70 hover:text-white hover:bg-[#1c2c26]'
                      }`}
                    >
                      Country Names
                    </button>
                    <button
                      onClick={() => setSettings((s) => ({ ...s, mode: 'capitals' }))}
                      className={`py-3 text-xs font-mono uppercase tracking-wider font-bold transition-all ${
                        settings.mode === 'capitals'
                          ? 'bg-[#e5ff42] text-[#1c2c26]'
                          : 'text-[#f5f5f1]/70 hover:text-white hover:bg-[#1c2c26]'
                      }`}
                    >
                      Capitals
                    </button>
                  </div>
                </ArtDecoFrame>

                {/* Card 2: Input Mechanic */}
                <ArtDecoFrame
                  badge="02 // INPUT MECHANIC"
                  cornerSize={44}
                  cornerColor="text-[#e5ff42]"
                  className="p-6 flex flex-col justify-between shadow-2xl"
                >
                  <div className="pt-2">
                    <h3 className="text-2xl font-serif italic text-[#f5f5f1] mb-2">Input Mechanic</h3>
                    <p className="text-xs text-[#f5f5f1]/70 leading-relaxed mb-6 font-light">
                      Type-in demands pure spatial memory without clues. MCQ provides 4 rapid-fire cards (Keys 1-4).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#0e1814]/90 p-1 border border-[#275f4b]/60">
                    <button
                      onClick={() => setSettings((s) => ({ ...s, inputType: 'mcq' }))}
                      className={`py-3 text-xs font-mono uppercase tracking-wider font-bold transition-all ${
                        settings.inputType === 'mcq'
                          ? 'bg-[#e5ff42] text-[#1c2c26]'
                          : 'text-[#f5f5f1]/70 hover:text-white hover:bg-[#1c2c26]'
                      }`}
                    >
                      Multiple Choice (4)
                    </button>
                    <button
                      onClick={() => setSettings((s) => ({ ...s, inputType: 'type' }))}
                      className={`py-3 text-xs font-mono uppercase tracking-wider font-bold transition-all ${
                        settings.inputType === 'type'
                          ? 'bg-[#e5ff42] text-[#1c2c26]'
                          : 'text-[#f5f5f1]/70 hover:text-white hover:bg-[#1c2c26]'
                      }`}
                    >
                      Type-In
                    </button>
                  </div>
                </ArtDecoFrame>

                {/* Card 3: Region Focus */}
                <ArtDecoFrame
                  badge="03 // TERRITORY SCOPE"
                  cornerSize={44}
                  cornerColor="text-[#e5ff42]"
                  className="p-6 flex flex-col justify-between shadow-2xl"
                >
                  <div className="pt-2">
                    <h3 className="text-2xl font-serif italic text-[#f5f5f1] mb-2">Territory Scope</h3>
                    <p className="text-xs text-[#f5f5f1]/70 leading-relaxed mb-6 font-light">
                      Focus on specific continental landmasses or challenge every country on the map.
                    </p>
                  </div>

                  <div className="relative">
                    <select
                      value={settings.continent}
                      onChange={(e) => setSettings((s) => ({ ...s, continent: e.target.value }))}
                      className="w-full bg-[#0e1814]/90 border border-[#275f4b]/60 px-4 py-3 text-xs font-mono uppercase tracking-wider font-bold text-[#f5f5f1] focus:outline-none focus:border-[#e5ff42]"
                    >
                      <option value="all">Entire World ({getCountryPool({ mode: settings.mode, continent: 'all' }).length} Countries)</option>
                      <option value="Europe">Europe</option>
                      <option value="Asia">Asia</option>
                      <option value="Africa">Africa</option>
                      <option value="Americas">Americas</option>
                      <option value="Oceania">Oceania</option>
                    </select>
                  </div>
                </ArtDecoFrame>
              </div>

              {/* Launch Expedition CTA */}
              <div className="w-full flex flex-col items-center gap-3 mt-10 mb-6">
                <button
                  onClick={() => startGame()}
                  className="w-full max-w-md py-4 bg-[#e5ff42] text-[#1c2c26] font-extrabold text-sm uppercase tracking-widest hover:bg-[#d4ee38] shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2 group"
                >
                  <span>Launch Custom Expedition</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-xs font-mono tracking-wider text-[#628c7d]">
                  {settings.durationSeconds > 0 ? `${Math.round(settings.durationSeconds / 60)}:00 TIMER` : 'NO TIMER'} • {availableCountries.length} TARGET COUNTRIES • INSTANT SPATIAL FEEDBACK
                </p>
              </div>
            </div>

            {/* ---------------- 100% WALL-TO-WALL FULL-WIDTH FOOTER ---------------- */}
            <footer className="w-full mt-10 pt-4 relative select-none overflow-hidden">
              {/* Meta Row: Edge-to-edge padded */}
              <div className="w-full px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#628c7d] mb-4">
                <div className="flex items-center gap-4 text-[#628c7d]">
                  <span className="font-mono text-[11px] tracking-wider uppercase text-[#f5f5f1]/70">
                    Earthle • Spatial Geography
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#628c7d]">
                  <MapPin className="w-3.5 h-3.5 text-[#628c7d]" />
                  <span>Interactive 3D Cartography Platform</span>
                </div>
              </div>

              {/* Crisp Full-Width Divider Line (Touches screen edges 100vw) */}
              <div className="w-full h-px bg-[#275f4b]/60 mb-4" />

              {/* Second Meta Row: Copyright & Mission */}
              <div className="w-full px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#628c7d] font-normal">
                <p>© 2026 Earthle Corporation. All rights reserved.</p>
                <p className="italic font-serif text-sm text-[#f5f5f1]/80">Geography. Made Instinctive.</p>
              </div>

              {/* Monumental Solid EARTHLE Heading: 100% Unconstrained Width */}
              <div className="relative w-full overflow-hidden mt-2 pt-0 flex justify-center items-end select-none">
                <h2 className="font-serif uppercase font-semibold text-[22.5vw] leading-[0.76] tracking-tighter text-[#275f4b] translate-y-[15%] md:translate-y-[18%] select-none pointer-events-none text-center w-full block">
                  EARTHLE
                </h2>

                {/* Grounded Floating Action Button (Matches Rainmaker's Newsletter Pill) */}
                <div className="absolute right-6 md:right-12 bottom-4 md:bottom-8 z-20 pointer-events-auto">
                  <button
                    onClick={() => startGame()}
                    className="px-5 py-3 rounded-xl bg-[#13201b]/95 border border-[#275f4b] hover:border-[#e5ff42] text-[11px] md:text-xs font-bold uppercase tracking-wider text-[#f5f5f1] hover:text-[#e5ff42] transition-all backdrop-blur-md shadow-2xl flex items-center gap-2 group"
                  >
                    <span>Play Expedition</span>
                    <Play className="w-3 h-3 fill-current text-[#e5ff42] group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
