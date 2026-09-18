import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Eye,
  Key,
  PlaySquare,
  RefreshCw,
  TrendingUp,
  Users,
  Video,
  Youtube,
} from 'lucide-react';
import {
  fetchLiveYouTubeStats,
  getSavedYouTubeApiKey,
} from '../services/api';
import { ChannelId, CHANNELS, YouTubeChannelStats } from '../types';

interface YouTubeAnalyticsSectionProps {
  onOpenSettings: () => void;
}

// Default YouTube channel IDs for the 3 production channels
const DEFAULT_CHANNEL_CONFIGS: { channelId: ChannelId; youtubeId: string; title: string; defaultHandle: string }[] = [
  {
    channelId: 'little_olympus',
    youtubeId: 'UCbCmjCuTUZos636dAqPEVEg', // YouTube Kids / educational reference or custom channel ID
    title: 'Little Olympus',
    defaultHandle: '@LittleOlympusMyth',
  },
  {
    channelId: 'iron_legends',
    youtubeId: 'UCsTcErHg8oDvUnTzoqsYeNw', // Nostalgia / mecha reference channel
    title: 'Iron Legends',
    defaultHandle: '@IronLegendsMecha',
  },
  {
    channelId: 'empire_decoded',
    youtubeId: 'UCCODtTqc5456BlKE2009Edg', // History / documentary reference channel
    title: 'Empire Decoded',
    defaultHandle: '@EmpireDecodedDoc',
  },
];

export const YouTubeAnalyticsSection: React.FC<YouTubeAnalyticsSectionProps> = ({
  onOpenSettings,
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [stats, setStats] = useState<YouTubeChannelStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  useEffect(() => {
    const key = getSavedYouTubeApiKey();
    setApiKey(key);
    if (key) {
      loadStats(key);
    }
  }, []);

  const loadStats = async (keyToUse: string) => {
    if (!keyToUse) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLiveYouTubeStats(keyToUse, DEFAULT_CHANNEL_CONFIGS);
      setStats(data);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch YouTube analytics from Google API');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    const key = getSavedYouTubeApiKey();
    setApiKey(key);
    if (key) {
      loadStats(key);
    }
  };

  // If no API key configured: show clean compliant empty state
  if (!apiKey) {
    return (
      <section id="youtube-analytics-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/25">
              <Youtube className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                YouTube Channel Analytics
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Data API v3
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Live subscriber metrics, total impressions, and views per channel
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
            <Key className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-zinc-100">
              YouTube Data API Key Not Configured
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              Empire Command Center never invents or fakes analytics numbers. To fetch real-time
              subscribers, total views, and video counts directly from YouTube's API, add your API key.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              id="btn-goto-settings-analytics"
              onClick={onOpenSettings}
              className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>Add API Key in Settings</span>
            </button>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-zinc-800 flex items-center gap-1.5 transition-colors"
            >
              <span>Get Free Google Key</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="youtube-analytics-section" className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/25">
            <Youtube className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-100">Live YouTube Analytics</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live API Active
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Direct telemetry from YouTube Data API v3 • {lastRefreshed ? `Updated at ${lastRefreshed}` : 'Synced'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{loading ? 'Fetching...' : 'Refresh Live Stats'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="min-h-[40px] px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-zinc-800 transition-colors"
            title="Edit API Key"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Error Banner if API Call Fails */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">YouTube Data API Error</span>
            <p className="text-rose-300/90">{error}</p>
            <p className="text-[11px] text-rose-400/80">
              Verify that your API key is enabled for "YouTube Data API v3" in Google Cloud Console.
            </p>
          </div>
        </div>
      )}

      {/* 3 Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DEFAULT_CHANNEL_CONFIGS.map((cfg) => {
          const channelMeta = CHANNELS[cfg.channelId];
          const channelStat = stats.find((s) => s.channelId === cfg.channelId);

          return (
            <div
              key={cfg.channelId}
              id={`analytics-card-${cfg.channelId}`}
              className="bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-4 transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{channelMeta.emoji}</span>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">{channelMeta.name}</h3>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {cfg.defaultHandle}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${channelMeta.badgeBg} ${channelMeta.badgeText} ${channelMeta.badgeBorder}`}
                >
                  Active
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 py-2 border-y border-zinc-800/80">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-zinc-400" /> Subscribers
                  </span>
                  <span className="text-lg font-black text-zinc-100 font-mono block">
                    {loading ? (
                      <span className="inline-block w-16 h-5 bg-zinc-800 animate-pulse rounded" />
                    ) : channelStat ? (
                      channelStat.subscribers.toLocaleString()
                    ) : (
                      '—'
                    )}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-zinc-400" /> Total Views
                  </span>
                  <span className="text-lg font-black text-amber-400 font-mono block">
                    {loading ? (
                      <span className="inline-block w-20 h-5 bg-zinc-800 animate-pulse rounded" />
                    ) : channelStat ? (
                      channelStat.totalViews.toLocaleString()
                    ) : (
                      '—'
                    )}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-zinc-400" /> Public Videos
                  </span>
                  <span className="text-sm font-bold text-zinc-200 font-mono block">
                    {loading ? (
                      <span className="inline-block w-10 h-4 bg-zinc-800 animate-pulse rounded" />
                    ) : channelStat ? (
                      channelStat.videoCount.toLocaleString()
                    ) : (
                      '—'
                    )}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] text-zinc-500 font-medium flex items-center gap-1" title="YouTube Data API v3 provides public totals; rolling 28-day watch metrics require private YouTube Studio Analytics OAuth">
                    <TrendingUp className="w-3.5 h-3.5 text-zinc-400" /> 28-Day Window
                  </span>
                  <span className="text-xs font-semibold text-zinc-400 font-mono block">
                    {loading ? (
                      <span className="inline-block w-14 h-4 bg-zinc-800 animate-pulse rounded" />
                    ) : channelStat?.last28DaysViews !== undefined ? (
                      `${channelStat.last28DaysViews.toLocaleString()} views`
                    ) : (
                      <span className="text-zinc-500 text-[11px]" title="Private 28-day analytics requires authenticated Studio OAuth tokens">
                        Studio OAuth Req.
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span className="font-mono">ID: {cfg.youtubeId.slice(0, 12)}...</span>
                <a
                  href={`https://youtube.com/channel/${cfg.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
                >
                  <span>Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
