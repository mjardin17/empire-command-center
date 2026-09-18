import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { ChannelId, CHANNELS, Episode } from '../types';

interface NewEpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Partial<Episode>) => void;
  defaultChannel?: ChannelId;
}

export const NewEpisodeModal: React.FC<NewEpisodeModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  defaultChannel = 'little_olympus',
}) => {
  const [channelId, setChannelId] = useState<ChannelId>(defaultChannel);
  const [title, setTitle] = useState('');
  const [hookSummary, setHookSummary] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(12);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      channelId,
      title: title.trim(),
      scriptStatus: {
        wordCount: 0,
        durationMinutes,
        hookSummary: hookSummary.trim() || 'Opening hook and narrative thesis.',
        outline: '1. Hook / Teaser\n2. Context & Background\n3. Main Climax / Core Argument\n4. Takeaways & Outro',
        scriptReviewState: 'Drafting',
      },
    });

    setTitle('');
    setHookSummary('');
    onClose();
  };

  return (
    <div
      id="new-episode-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-700/90 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Draft New Episode</h3>
              <p className="text-xs text-zinc-400">Enters pipeline at stage 1: Ideas</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Channel Choice */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">
              Production Channel
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.values(CHANNELS).map((ch) => {
                const isSelected = ch.id === channelId;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setChannelId(ch.id)}
                    className={`min-h-[48px] p-2.5 rounded-xl border text-left flex flex-col justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-sm">{ch.emoji}</span>
                    <span className="text-xs font-bold truncate mt-0.5">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">
              Episode Working Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Why Hephaestus Forged the Armor of Achilles..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Hook / Synopsis */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">
              Opening Hook / Premise
            </label>
            <textarea
              rows={3}
              placeholder="The 15-second opening hook that will stop viewers from scrolling..."
              value={hookSummary}
              onChange={(e) => setHookSummary(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-400 leading-relaxed"
            />
          </div>

          {/* Target Duration */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">
              Target Runtime (Minutes)
            </label>
            <div className="flex items-center gap-3">
              {[8, 12, 16, 24].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold border cursor-pointer ${
                    durationMinutes === mins
                      ? 'bg-amber-400 text-zinc-950 border-amber-400 font-bold'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Create Idea Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
