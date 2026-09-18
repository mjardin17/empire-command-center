import React from 'react';
import { Award, Calendar, CheckCircle2, Flame, Sparkles, TrendingUp } from 'lucide-react';
import { formatWeekRange, getMondayOfCurrentWeek } from '../services/api';
import { CHANNELS, Episode } from '../types';

interface WeeklyTargetTrackerProps {
  episodes: Episode[];
  onSelectEpisode: (episode: Episode) => void;
}

export const WeeklyTargetTracker: React.FC<WeeklyTargetTrackerProps> = ({
  episodes,
  onSelectEpisode,
}) => {
  const currentMonday = getMondayOfCurrentWeek();
  const weekRangeText = formatWeekRange(currentMonday);

  // Filter episodes that reached Live this week
  const liveThisWeek = episodes.filter((ep) => {
    if (ep.stage !== 'live' || !ep.liveAt) return false;
    const liveDate = new Date(ep.liveAt);
    return liveDate >= currentMonday;
  });

  const weeklyTarget = 3;
  const currentCount = liveThisWeek.length;
  const progressPercent = Math.min(100, Math.round((currentCount / weeklyTarget) * 100));
  const isTargetAchieved = currentCount >= weeklyTarget;

  return (
    <section
      id="weekly-target-tracker"
      className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-md"
    >
      {/* Subtle gold glow accent */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Info and Target Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Flame className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
                  Weekly Output Target
                </h2>
                {isTargetAchieved ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Sparkles className="w-3 h-3" /> Target Reached!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <TrendingUp className="w-3 h-3" /> 3 Episodes / Week
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Week: <strong className="text-zinc-300">{weekRangeText}</strong></span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-500">Resets every Monday 00:00</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Score Counter */}
        <div className="flex items-baseline md:items-end gap-2 shrink-0">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono tracking-tight">
              {currentCount}
            </span>
            <span className="text-zinc-500 font-mono text-lg font-medium">/ {weeklyTarget}</span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Live Releases
          </span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="mt-4 space-y-2">
        <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isTargetAchieved
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
            }`}
            style={{ width: `${Math.max(6, progressPercent)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">
            {progressPercent}% of weekly production goal
          </span>
          <span>
            {currentCount >= weeklyTarget
              ? 'Pacing ahead of schedule'
              : `${weeklyTarget - currentCount} more needed before Sunday night`}
          </span>
        </div>
      </div>

      {/* Live Episodes chips for this week */}
      {liveThisWeek.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 shrink-0">Published this cycle:</span>
          {liveThisWeek.map((ep) => {
            const channel = CHANNELS[ep.channelId];
            return (
              <button
                key={ep.id}
                id={`weekly-live-chip-${ep.id}`}
                onClick={() => onSelectEpisode(ep)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-xs text-zinc-200 transition-colors group cursor-pointer"
                title="View episode details"
              >
                <span>{channel?.emoji}</span>
                <span className="max-w-[200px] truncate text-zinc-300 font-medium group-hover:text-amber-300">
                  {ep.title}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
