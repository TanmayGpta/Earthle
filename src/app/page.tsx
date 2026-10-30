'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Country, GameSettings, AnswerRecord, ActiveTrivia } from '../types/game';
import { getCountryPool, createRng, newSeed, shuffle } from '../lib/game';
import GameHUD from '../components/GameHUD';
import BlitzHUD from '../components/BlitzHUD';
import GameOverModal from '../components/GameOverModal';
import Landing from '../components/Landing';

// Dynamic import for 3D Globe components to prevent SSR issues
const HeroGlobe = dynamic(() => import('../components/HeroGlobe'), { ssr: false });
const InteractiveGlobe = dynamic(() => import('../components/InteractiveGlobe'), { ssr: false });
const FlatMap = dynamic(() => import('../components/FlatMap'), { ssr: false });

export default function EarthleHome() {
  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isReviewingAtlas, setIsReviewingAtlas] = useState(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    mode: 'countries',
    inputType: 'type',
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
  const [showMissing, setShowMissing] = useState(false);

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
    () => getCountryPool({ mode: settings.mode, continent: settings.continent }),
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

  // Flags and Blitz use the flat map; it marks the last answered country (the target stays secret)
  const isBlitz = settings.mode === 'blitz';
  const usesMap = settings.mode === 'flags' || isBlitz;

  // Once a Blitz run ends, whatever wasn't named counts as missed (red on the map)
  const finalAnswers = useMemo(() => {
    if (!isBlitz || (!isGameOver && !isReviewingAtlas)) return answers;
    const all = { ...answers };
    for (const c of countryQueue) {
      all[c.code] ??= { countryCode: c.code, status: 'revealed', attempts: 0, timestamp: 0 };
    }
    return all;
  }, [isBlitz, isGameOver, isReviewingAtlas, answers, countryQueue]);

  const lastAnswered = useMemo(() => {
    const latest = Object.values(answers)
      .filter((a) => a.status !== 'skipped')
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    return latest ? countryQueue.find((c) => c.code === latest.countryCode) ?? null : null;
  }, [answers, countryQueue]);

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

  // Blitz hint: everything still unnamed glows for 2 seconds
  const handleShowMissing = () => {
    if (showMissing) return;
    setShowMissing(true);
    setTimeout(() => setShowMissing(false), 2000);
  };
  const glowing = useMemo(
    () => (isBlitz && showMissing && !isGameOver && !isReviewingAtlas ? countryQueue.filter((c) => !answers[c.code]) : []),
    [isBlitz, showMissing, isGameOver, isReviewingAtlas, countryQueue, answers]
  );

  // Blitz: any country, any order; naming the last one ends the run
  const handleBlitzFound = (country: Country) => {
    recordAnswer(country.code, 'correct');
    if (Object.keys(answers).length + 1 >= countryQueue.length) setIsGameOver(true);
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
          {usesMap ? (
            // Split screen: map panel right of the game panel (desktop), above it (mobile)
            <div className="absolute inset-x-0 top-0 bottom-[44%] md:bottom-0 md:left-[380px] md:border-l border-[#275f4b]/50">
              <FlatMap
                answers={finalAnswers}
                focusCountry={lastAnswered}
                onCountryHover={(country) => setHoveredCountry(country)}
                darkBorders={isBlitz}
                glowing={glowing}
              />
            </div>
          ) : (
            <InteractiveGlobe
              targetCountry={targetCountry}
              answers={answers}
              onCountryHover={(country) => setHoveredCountry(country)}
            />
          )}

          {/* In-Game HUD */}
          {isBlitz && !isGameOver && (
            <BlitzHUD
              settings={settings}
              countries={countryQueue}
              answers={finalAnswers}
              timeLeft={timeLeft}
              hoveredCountry={hoveredCountry}
              reviewing={isReviewingAtlas}
              showingMissing={showMissing}
              onShowMissing={handleShowMissing}
              onFound={handleBlitzFound}
              onFinish={() => setIsGameOver(true)}
              onExit={handleExit}
            />
          )}
          {!isBlitz && targetCountry && !isGameOver && (
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
              answers={finalAnswers}
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
        <div className="relative">
          {/* Spinning 3D Earth behind the hero */}
          <HeroGlobe scrollProgress={scrollProgress} />
          <Landing
            settings={settings}
            onSettingsChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
            availableCount={availableCountries.length}
            worldCount={getCountryPool({ mode: settings.mode, continent: 'all' }).length}
            onStart={startGame}
          />
        </div>
      )}
    </main>
  );
}
