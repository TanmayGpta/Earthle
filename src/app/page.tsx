'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Country, GameSettings, AnswerRecord, ActiveTrivia } from '../types/game';
import { COUNTRIES } from '../data/countries';
import GameHUD from '../components/GameHUD';
import GameOverModal from '../components/GameOverModal';
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

  // Filter countries by continent
  const availableCountries = useMemo(() => {
    if (settings.continent === 'all') return COUNTRIES;
    return COUNTRIES.filter((c) => c.continent === settings.continent);
  }, [settings.continent]);

  // Start / Launch Game
  const startGame = (customSettings?: Partial<GameSettings>) => {
    const activeSettings = { ...settings, ...customSettings };
    setSettings(activeSettings);

    // Shuffle countries
    const filtered =
      activeSettings.continent === 'all'
        ? [...COUNTRIES]
        : COUNTRIES.filter((c) => c.continent === activeSettings.continent);

    const shuffled = filtered.sort(() => 0.5 - Math.random());
    setCountryQueue(shuffled);
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

  // Countdown timer
  useEffect(() => {
    if (!isPlaying || isGameOver || isReviewingAtlas) return;
    if (settings.durationSeconds <= 0) return; // Unlimited zen mode

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent((prev) => prev + 1);
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

  // Submit Answer
  const handleSubmitAnswer = (input: string) => {
    if (!targetCountry) return;

    const isCapital = settings.mode === 'capitals';
    const target = isCapital ? targetCountry.capital : targetCountry.name;
    const query = input.trim().toLowerCase();

    const isMatch = isCapital
      ? target.toLowerCase() === query
      : target.toLowerCase() === query ||
        targetCountry.aliases.some((a) => a.toLowerCase() === query);

    const newAnswers = {
      ...answers,
      [targetCountry.code]: {
        countryCode: targetCountry.code,
        status: isMatch ? ('correct' as const) : ('revealed' as const),
        attempts: 1,
        timestamp: Date.now(),
      },
    };
    setAnswers(newAnswers);

    if (isMatch) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > maxStreak) setMaxStreak(nextStreak);

      // Occasional surprise trivia (15% random chance or on milestone streak)
      if (Math.random() < 0.18 || nextStreak % 5 === 0) {
        if (targetCountry.trivia) {
          setActiveTrivia({
            country: targetCountry,
            text: targetCountry.trivia,
            id: String(Date.now()),
          });
        }
      }
    } else {
      setStreak(0);
    }

    advanceToNext();
  };

  // Skip Country (moves to back of queue)
  const handleSkip = () => {
    if (!targetCountry) return;
    setStreak(0);

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
    setAnswers((prev) => ({
      ...prev,
      [targetCountry.code]: {
        countryCode: targetCountry.code,
        status: 'revealed',
        attempts: 1,
        timestamp: Date.now(),
      },
    }));

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
            {/* Top Bar (Matches Rainmaker top header) */}
            <header className="w-full grid grid-cols-3 items-center pointer-events-auto">
              {/* Left indicator */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#e5ff42] animate-pulse" />
                <span className="hidden sm:inline text-xs uppercase font-bold tracking-widest text-[#f5f5f1]/80">
                  Precision Geography
                </span>
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
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#e5ff42] text-[#1c2c26] text-xs md:text-sm font-bold tracking-wide hover:bg-[#d4ee38] transition-all shadow-lg hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-current" />
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

              {/* Dual CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => startGame()}
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#e5ff42] text-[#1c2c26] text-sm font-extrabold tracking-wide hover:bg-[#d4ee38] shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2"
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
                  className="w-full sm:w-auto px-6 py-4 rounded-full glass-panel-interactive text-sm font-semibold text-[#f5f5f1] flex items-center justify-center gap-2"
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
              <div className="text-center mb-8">
                <span className="text-xs uppercase font-bold tracking-widest text-[#e5ff42]">
                  Custom Expedition
                </span>
                <h2 className="font-serif italic text-4xl md:text-5xl text-[#f5f5f1] mt-1">
                  Choose Your Game Style
                </h2>
              </div>

              {/* Mode Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-auto">
                {/* Card 1: Quiz Objective (Countries vs Capitals) */}
                <div className="glass-panel p-6 rounded-3xl border border-[#275f4b]/50 flex flex-col justify-between shadow-xl">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-[#628c7d]">
                      01 / Objective
                    </span>
                    <h3 className="text-xl font-bold text-[#f5f5f1] mt-1 mb-2">Quiz Target</h3>
                    <p className="text-xs text-[#f5f5f1]/70 leading-relaxed mb-4">
                      Choose whether you identify country names or their official capital cities.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#13201b]/60 p-1.5 rounded-2xl border border-[#275f4b]/40">
                    <button
                      onClick={() => setSettings((s) => ({ ...s, mode: 'countries' }))}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                        settings.mode === 'countries'
                          ? 'bg-[#e5ff42] text-[#1c2c26]'
                          : 'text-[#f5f5f1]/70 hover:text-white'
                      }`}
                    >
                      Country Names
                    </button>
                    <button
                      onClick={() => setSettings((s) => ({ ...s, mode: 'capitals' }))}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                        settings.mode === 'capitals'
                          ? 'bg-[#e5ff42] text-[#1c2c26]'
                          : 'text-[#f5f5f1]/70 hover:text-white'
                      }`}
                    >
                      Capitals
                    </button>
                  </div>
                </div>

                {/* Card 2: Input Method (Type vs MCQ) */}
                <div className="glass-panel p-6 rounded-3xl border border-[#275f4b]/50 flex flex-col justify-between shadow-xl">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-[#628c7d]">
                      02 / Input Method
                    </span>
                    <h3 className="text-xl font-bold text-[#f5f5f1] mt-1 mb-2">Input Mechanic</h3>
                    <p className="text-xs text-[#f5f5f1]/70 leading-relaxed mb-4">
                      Type-in offers pure recall with autosuggest. MCQ gives 4 high-speed cards (1-4 keys).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#13201b]/60 p-1.5 rounded-2xl border border-[#275f4b]/40">
                    <button
                      onClick={() => setSettings((s) => ({ ...s, inputType: 'mcq' }))}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                        settings.inputType === 'mcq'
                          ? 'bg-[#e5ff42] text-[#1c2c26]'
                          : 'text-[#f5f5f1]/70 hover:text-white'
                      }`}
                    >
                      Multiple Choice (4)
                    </button>
                    <button
                      onClick={() => setSettings((s) => ({ ...s, inputType: 'type' }))}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                        settings.inputType === 'type'
                          ? 'bg-[#e5ff42] text-[#1c2c26]'
                          : 'text-[#f5f5f1]/70 hover:text-white'
                      }`}
                    >
                      Type-In
                    </button>
                  </div>
                </div>

                {/* Card 3: Region Filter */}
                <div className="glass-panel p-6 rounded-3xl border border-[#275f4b]/50 flex flex-col justify-between shadow-xl">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-[#628c7d]">
                      03 / Territory
                    </span>
                    <h3 className="text-xl font-bold text-[#f5f5f1] mt-1 mb-2">Region Focus</h3>
                    <p className="text-xs text-[#f5f5f1]/70 leading-relaxed mb-4">
                      Focus on specific continents or challenge all 177 sovereign nations globally.
                    </p>
                  </div>

                  <select
                    value={settings.continent}
                    onChange={(e) => setSettings((s) => ({ ...s, continent: e.target.value }))}
                    className="w-full bg-[#13201b]/80 border border-[#275f4b]/50 rounded-2xl px-4 py-3 text-xs font-bold text-[#f5f5f1] focus:outline-none focus:border-[#e5ff42]/60"
                  >
                    <option value="all">Entire World (177 Countries)</option>
                    <option value="Europe">Europe</option>
                    <option value="Asia">Asia</option>
                    <option value="Africa">Africa</option>
                    <option value="Americas">Americas</option>
                    <option value="Oceania">Oceania</option>
                  </select>
                </div>
              </div>

              {/* Launch Expedition CTA */}
              <div className="w-full flex flex-col items-center gap-3 mt-8 mb-6">
                <button
                  onClick={() => startGame()}
                  className="w-full max-w-md py-4 rounded-full bg-[#e5ff42] text-[#1c2c26] font-extrabold text-base tracking-wide hover:bg-[#d4ee38] shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>Launch Custom Expedition</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
                <p className="text-xs text-[#628c7d]">
                  15:00 Timer • {availableCountries.length} Target Countries • Instant Spatial Feedback
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
