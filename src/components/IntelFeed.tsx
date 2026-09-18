import React, { useState } from 'react';
import {
  Check,
  Compass,
  Filter,
  Flame,
  Plus,
  Radio,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { ChannelId, CHANNELS, IntelItem } from '../types';

interface IntelFeedProps {
  intelItems: IntelItem[];
  selectedChannel: ChannelId | 'all';
  onMakeEpisode: (intelId: string) => void;
  onAddCustomIntel: (item: Omit<IntelItem, 'id' | 'timestamp'>) => void;
}

export const IntelFeed: React.FC<IntelFeedProps> = ({
  intelItems,
  selectedChannel,
  onMakeEpisode,
  onAddCustomIntel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newChannel, setNewChannel] = useState<ChannelId>('little_olympus');
  const [newSynopsis, setNewSynopsis] = useState('');
  const [newTag, setNewTag] = useState('');
  const [createdIntelIds, setCreatedIntelIds] = useState<Record<string, boolean>>({});

  const filteredIntel = intelItems.filter((item) => {
    const matchesChannel =
      selectedChannel === 'all' ? true : item.channelTarget === selectedChannel;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesChannel && matchesSearch;
  });

  const handleMakeEpisodeClick = (intelId: string) => {
    setCreatedIntelIds((prev) => ({ ...prev, [intelId]: true }));
    onMakeEpisode(intelId);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSource.trim()) return;

    onAddCustomIntel({
      title: newTitle.trim(),
      source: newSource.trim(),
      channelTarget: newChannel,
      synopsis: newSynopsis.trim() || 'Researched topic lead ready for script development.',
      viralScore: Math.floor(Math.random() * 15) + 85,
      tags: newTag ? newTag.split(',').map((t) => t.trim()) : ['Research', 'Trending'],
    });

    setNewTitle('');
    setNewSource('');
    setNewSynopsis('');
    setNewTag('');
    setShowAddModal(false);
  };

  return (
    <section id="intel-feed-section" className="space-y-4">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
            <Compass className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              Intel & Research Feed
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 border border-zinc-700">
                {filteredIntel.length} trends
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Live algorithmic hooks & research dossiers ready to convert into episodes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search trends & tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Lead</span>
          </button>
        </div>
      </div>

      {/* Grid of Intel items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredIntel.map((item) => {
          const channel = CHANNELS[item.channelTarget];
          const isCreated = createdIntelIds[item.id] || item.isUsed;

          return (
            <div
              key={item.id}
              id={`intel-card-${item.id}`}
              className="bg-zinc-900/90 border border-zinc-800/90 hover:border-amber-500/30 rounded-2xl p-4 shadow-md flex flex-col justify-between gap-3 transition-all hover:shadow-xl relative overflow-hidden"
            >
              {/* Channel badge & viral score */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${
                    channel?.badgeBg || 'bg-zinc-800'
                  } ${channel?.badgeText || 'text-zinc-300'} ${
                    channel?.badgeBorder || 'border-zinc-700'
                  }`}
                >
                  <span>{channel?.emoji}</span>
                  <span>{channel?.name}</span>
                </span>

                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Flame className="w-3 h-3 text-amber-500" />
                  {item.viralScore}% score
                </span>
              </div>

              {/* Title & Synopsis */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-zinc-100 line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                  {item.synopsis}
                </p>
              </div>

              {/* Source & Timestamp */}
              <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="truncate max-w-[170px]" title={item.source}>
                    {item.source}
                  </span>
                  <span className="font-mono">{item.timestamp}</span>
                </div>

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* "Make episode" button with big touch target (44px min) */}
                <button
                  type="button"
                  id={`btn-make-episode-${item.id}`}
                  onClick={() => handleMakeEpisodeClick(item.id)}
                  disabled={isCreated}
                  className={`w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98 ${
                    isCreated
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 cursor-default'
                      : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20'
                  }`}
                >
                  {isCreated ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3] text-emerald-400" />
                      <span>Added to Ideas Stage ✓</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Make Episode</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Lead Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Add Research / Trend Intel Lead
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Target Channel
                </label>
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value as ChannelId)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {Object.values(CHANNELS).map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.emoji} {ch.name} — {ch.niche}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Trend / Story Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Secret Bronze Age Fleet of Knossos..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Source / Reference
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Archaeology Magazine & British Museum archives"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Hook / Synopsis
                </label>
                <textarea
                  rows={3}
                  placeholder="Why this will grab attention on YouTube..."
                  value={newSynopsis}
                  onChange={(e) => setNewSynopsis(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bronze Age, Navy, Tactics"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  Add to Intel Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
