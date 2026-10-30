'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameSettings, AnswerRecord } from '../types/game';
import ArtDecoFrame from './ArtDecoFrame';
import { formatSeed } from '../lib/game';
import { Trophy, RotateCcw, Share2, Eye, CheckCircle2, Flame, Award, Globe } from 'lucide-react';

interface GameOverModalProps {
  settings: GameSettings;
  answers: Record<string, AnswerRecord>;
  totalCountries: number;
  runSeed: number;
  maxStreak: number;
  timeSpentSeconds: number;
  onPlayAgain: () => void;
  onReviewAtlas: () => void;
}

export default function GameOverModal({
  settings,
  answers,
  totalCountries,
  runSeed,
  maxStreak,
  timeSpentSeconds,
  onPlayAgain,
  onReviewAtlas,
}: GameOverModalProps) {
  const [copied, setCopied] = useState(false);

  const answerList = Object.values(answers);
  const correctCount = answerList.filter((a) => a.status === 'correct').length;
  const revealedCount = answerList.filter((a) => a.status === 'revealed').length;
  const skippedCount = answerList.filter((a) => a.status === 'skipped').length;
  // Skipped countries were never actually answered
  const totalAttempted = correctCount + revealedCount;

  const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;
  // Rank on share of the whole pool mastered, so quitting early can't earn a top title
  const coverage = totalCountries > 0 ? correctCount / totalCountries : 0;

  // Rank title
  let rank = 'Cartographer Apprentice';
  if (coverage >= 0.85) rank = 'Supreme Global Cartographer';
  else if (coverage >= 0.6) rank = 'Master Navigator';
  else if (coverage >= 0.3) rank = 'World Explorer';

  // Confetti trigger on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e5ff42', '#10b981', '#f5f5f1', '#628c7d'],
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  // Blitz has no wrong answers or streaks: it reports pace and what was missed
  const isBlitz = settings.mode === 'blitz';
  const usesMap = isBlitz || settings.mode === 'flags';
  const perMinute = timeSpentSeconds > 0 ? Math.round((correctCount / timeSpentSeconds) * 60) : 0;

  const handleShare = () => {
    const text = isBlitz
      ? `🌍 Earthle Blitz!\nFound: ${correctCount}/${totalCountries} in ${formatTime(timeSpentSeconds)}\nPace: ⚡ ${perMinute} per minute\nRun: #${formatSeed(runSeed)}\nRank: ${rank}\nPlay at earthle.vercel.app`
      : `🌍 Earthle Run Finished!\nMode: ${settings.mode.toUpperCase()} (${settings.inputType.toUpperCase()})\nScore: ${correctCount}/${totalCountries} (${accuracy}% accuracy)
Run: #${formatSeed(runSeed)}\nBest Streak: 🔥 ${maxStreak}\nRank: ${rank}\nPlay at earthle.vercel.app`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg">
        <ArtDecoFrame
          badge="DEBRIEF // EXPEDITION COMPLETE"
          cornerSize={48}
          cornerColor="text-[#e5ff42]"
          className="p-6 md:p-8 text-center shadow-2xl relative"
        >
          {/* Trophy & Classification */}
          <div className="w-14 h-14 mx-auto mb-3 bg-[#0e1814] border border-[#275f4b]/80 flex items-center justify-center text-[#e5ff42]">
            <Trophy className="w-7 h-7" />
          </div>

          <p className="text-xs font-mono uppercase tracking-[0.25em] text-[#e5ff42] font-semibold mb-1">
            {rank}
          </p>
          <h2 className="text-2xl md:text-3xl font-serif italic text-[#f5f5f1]">
            Expedition Complete
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#628c7d] mt-1">
            Run #{formatSeed(runSeed)}
          </p>

          {/* Big Score Display */}
          <div className="my-6 p-4 bg-[#0e1814]/90 border border-[#275f4b]/60 flex items-center justify-around font-mono">
            <div>
              <p className="text-3xl font-bold text-[#e5ff42]">{correctCount}</p>
              <p className="text-[10px] text-[#628c7d] uppercase tracking-wider mt-0.5">Mastered</p>
            </div>
            <div className="w-px h-8 bg-[#275f4b]/60" />
            <div>
              <p className="text-3xl font-bold text-[#f5f5f1]">{accuracy}%</p>
              <p className="text-[10px] text-[#628c7d] uppercase tracking-wider mt-0.5">Accuracy</p>
            </div>
            <div className="w-px h-8 bg-[#275f4b]/60" />
            <div>
              <p className="text-3xl font-bold text-[#e5ff42] flex items-center justify-center gap-1">
                {!isBlitz && <Flame className="w-5 h-5 fill-[#e5ff42]/30" />}
                {isBlitz ? perMinute : maxStreak}
              </p>
              <p className="text-[10px] text-[#628c7d] uppercase tracking-wider mt-0.5">{isBlitz ? 'Per min' : 'Streak'}</p>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-3 gap-2 text-xs font-mono text-[#f5f5f1]/70 mb-6">
            <div className="p-2.5 bg-[#0e1814]/80 border border-[#275f4b]/40">
              <span className="text-[#10b981] font-bold block text-sm">{correctCount}</span>
              <span className="text-[10px] text-[#628c7d]">CORRECT</span>
            </div>
            <div className="p-2.5 bg-[#0e1814]/80 border border-[#275f4b]/40">
              <span className="text-[#f87171] font-bold block text-sm">{revealedCount}</span>
              <span className="text-[10px] text-[#628c7d]">{isBlitz ? 'MISSED' : 'REVEALED'}</span>
            </div>
            <div className="p-2.5 bg-[#0e1814]/80 border border-[#275f4b]/40">
              <span className="text-[#628c7d] font-bold block text-sm">{formatTime(timeSpentSeconds)}</span>
              <span className="text-[10px] text-[#628c7d]">TIME ELAPSED</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={onPlayAgain}
              className="w-full py-3.5 bg-[#e5ff42] text-[#1c2c26] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#d4ee38] flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Launch New Run</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={onReviewAtlas}
                className="py-3 bg-[#0e1814]/90 border border-[#275f4b]/80 hover:border-[#628c7d] text-xs font-mono uppercase tracking-wider font-semibold text-[#f5f5f1] flex items-center justify-center gap-2 transition-all"
              >
                <Globe className="w-4 h-4 text-[#628c7d]" />
                <span>{usesMap ? 'Review Map' : 'Review 3D Globe'}</span>
              </button>

              <button
                onClick={handleShare}
                className="py-3 bg-[#0e1814]/90 border border-[#275f4b]/80 hover:border-[#e5ff42] text-xs font-mono uppercase tracking-wider font-semibold text-[#f5f5f1] hover:text-[#e5ff42] flex items-center justify-center gap-2 transition-all"
              >
                <Share2 className="w-4 h-4 text-[#e5ff42]" />
                <span>{copied ? 'Score Copied!' : 'Share Score'}</span>
              </button>
            </div>
          </div>
        </ArtDecoFrame>
      </div>
    </div>
  );
}
