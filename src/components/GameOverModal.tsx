'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameSettings, AnswerRecord } from '../types/game';
import { Trophy, RotateCcw, Share2, Eye, CheckCircle2, Flame, Award, Globe } from 'lucide-react';

interface GameOverModalProps {
  settings: GameSettings;
  answers: Record<string, AnswerRecord>;
  maxStreak: number;
  timeSpentSeconds: number;
  onPlayAgain: () => void;
  onReviewAtlas: () => void;
}

export default function GameOverModal({
  settings,
  answers,
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
  const totalAttempted = answerList.length;

  const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;

  // Rank title
  let rank = 'Cartographer Apprentice';
  if (accuracy >= 90) rank = 'Supreme Global Cartographer';
  else if (accuracy >= 75) rank = 'Master Navigator';
  else if (accuracy >= 50) rank = 'World Explorer';

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

  const handleShare = () => {
    const text = `🌍 Earthle Run Finished!\nMode: ${settings.mode.toUpperCase()} (${settings.inputType.toUpperCase()})\nScore: ${correctCount}/${totalAttempted} (${accuracy}%)\nBest Streak: 🔥 ${maxStreak}\nRank: ${rank}\nPlay at earthle.vercel.app`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel p-6 md:p-8 rounded-3xl shadow-2xl border border-white/10 text-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#e5ff42]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Title */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#e5ff42]/10 border border-[#e5ff42]/30 flex items-center justify-center text-[#e5ff42]">
          <Trophy className="w-8 h-8" />
        </div>

        <p className="text-xs uppercase font-bold tracking-widest text-[#e5ff42] mb-1">
          {rank}
        </p>
        <h2 className="text-2xl md:text-3xl font-serif italic text-[#f5f5f1]">
          Expedition Complete
        </h2>

        {/* Big Score Display */}
        <div className="my-6 p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-around">
          <div>
            <p className="text-3xl font-extrabold text-[#e5ff42]">{correctCount}</p>
            <p className="text-xs text-[#f5f5f1]/50 uppercase tracking-wider mt-0.5">Mastered</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <p className="text-3xl font-extrabold text-[#f5f5f1]">{accuracy}%</p>
            <p className="text-xs text-[#f5f5f1]/50 uppercase tracking-wider mt-0.5">Accuracy</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <p className="text-3xl font-extrabold text-[#e5ff42] flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 fill-[#e5ff42]/30" />
              {maxStreak}
            </p>
            <p className="text-xs text-[#f5f5f1]/50 uppercase tracking-wider mt-0.5">Best Streak</p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-xs text-[#f5f5f1]/70 mb-6">
          <div className="p-2.5 rounded-xl bg-white/5">
            <span className="text-[#10b981] font-bold block text-sm">{correctCount}</span>
            <span>Correct</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5">
            <span className="text-[#f87171] font-bold block text-sm">{revealedCount}</span>
            <span>Revealed</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5">
            <span className="text-[#628c7d] font-bold block text-sm">{formatTime(timeSpentSeconds)}</span>
            <span>Time Taken</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onPlayAgain}
            className="w-full py-3.5 rounded-xl bg-[#e5ff42] text-[#103d1d] font-bold text-sm tracking-wide hover:bg-[#d4ee38] flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onReviewAtlas}
              className="py-3 rounded-xl glass-panel-interactive text-sm font-semibold text-[#f5f5f1] flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4 text-[#628c7d]" />
              <span>Review 3D Globe</span>
            </button>

            <button
              onClick={handleShare}
              className="py-3 rounded-xl glass-panel-interactive text-sm font-semibold text-[#f5f5f1] flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4 text-[#e5ff42]" />
              <span>{copied ? 'Copied!' : 'Share Score'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
