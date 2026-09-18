import React from 'react';
import {
  Crown,
  Plus,
  RefreshCw,
  Tv,
} from 'lucide-react';
import { ChannelId, CHANNELS, Episode } from '../types';

interface HeaderProps {
  selectedChannel: ChannelId | 'all';
  onSelectChannel: (channel: ChannelId | 'all') => void;
  episodes: Episode[];
  onNewEpisode: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedChannel,
  onSelectChannel,
  episodes,
  onNewEpisode,
  onResetData,
}) => {
  const getChannelCount = (chId: ChannelId) =>
    episodes.filter((e) => e.channelId === chId).length;

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/90 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
        {/* Top bar: Brand + Actions */}
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-zinc-100 font-mono">
                  Empire Command Center
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Tv className="w-3 h-3" /> Factory OS
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden xs:block">
                YouTube Production & Gate Approval Engine
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset board to default sample episodes and intel feed?')) {
                  onResetData();
                }
              }}
              className="min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Reset sample data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Sample Data</span>
            </button>

            <button
              type="button"
              id="btn-new-episode-header"
              onClick={onNewEpisode}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Episode</span>
            </button>
          </div>
        </div>

        {/* Channel Filter Pills (Horizontal touch-friendly selector) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          <button
            type="button"
            id="filter-channel-all"
            onClick={() => onSelectChannel('all')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
              selectedChannel === 'all'
                ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-sm'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            All Channels ({episodes.length})
          </button>

          {Object.values(CHANNELS).map((channel) => {
            const count = getChannelCount(channel.id);
            const isSelected = selectedChannel === channel.id;

            return (
              <button
                key={channel.id}
                id={`filter-channel-${channel.id}`}
                onClick={() => onSelectChannel(channel.id)}
                className={`min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span>{channel.emoji}</span>
                <span>{channel.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
