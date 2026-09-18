import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Filter,
  Layers,
  Lock,
  Plus,
} from 'lucide-react';
import { ChannelId, CHANNELS, Episode, StageId, STAGES } from '../types';
import { EpisodeCard } from './EpisodeCard';

interface PipelineBoardProps {
  episodes: Episode[];
  selectedChannel: ChannelId | 'all';
  onSelectEpisode: (episode: Episode) => void;
  onApproveGate: (episodeId: string, stage: StageId) => void;
  onRequestChanges: (episodeId: string, stage: StageId) => void;
  onMoveStage: (episodeId: string, targetStage: StageId) => void;
  onNewEpisode: () => void;
}

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  episodes,
  selectedChannel,
  onSelectEpisode,
  onApproveGate,
  onRequestChanges,
  onMoveStage,
  onNewEpisode,
}) => {
  // Mobile active stage tab ('all' or specific stageId)
  const [activeMobileStage, setActiveMobileStage] = useState<StageId | 'all'>('all');
  const [draggedOverStage, setDraggedOverStage] = useState<StageId | null>(null);

  // Filter episodes by channel
  const filteredEpisodes = episodes.filter((ep) =>
    selectedChannel === 'all' ? true : ep.channelId === selectedChannel
  );

  const handleDragStart = (e: React.DragEvent, episodeId: string) => {
    e.dataTransfer.setData('text/plain', episodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageId: StageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedOverStage !== stageId) {
      setDraggedOverStage(stageId);
    }
  };

  const handleDragLeave = (stageId: StageId) => {
    if (draggedOverStage === stageId) {
      setDraggedOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, stageId: StageId) => {
    e.preventDefault();
    setDraggedOverStage(null);
    const episodeId = e.dataTransfer.getData('text/plain');
    if (episodeId) {
      onMoveStage(episodeId, stageId);
    }
  };

  return (
    <section id="pipeline-board-section" className="space-y-4">
      {/* Board Header / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
            <Layers className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              Production Pipeline
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                {filteredEpisodes.length} active
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Six-stage gate engine • Drag or tap arrows to advance
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          type="button"
          id="btn-add-episode-board"
          onClick={onNewEpisode}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Episode</span>
        </button>
      </div>

      {/* Mobile Stage Selector Tabs (Phone-optimized horizontal scroll) */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveMobileStage('all')}
          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 border ${
            activeMobileStage === 'all'
              ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
        >
          All Stages ({filteredEpisodes.length})
        </button>

        {STAGES.map((stage) => {
          const count = filteredEpisodes.filter((e) => e.stage === stage.id).length;
          const isActive = activeMobileStage === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveMobileStage(stage.id)}
              className={`min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 border ${
                isActive
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <span>{stage.title}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pipeline Columns Layout: Horizontal scrollable on desktop/tablets, responsive on phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
        {STAGES.map((stage, idx) => {
          const stageEpisodes = filteredEpisodes.filter((e) => e.stage === stage.id);
          const isOver = draggedOverStage === stage.id;

          // On mobile, if a specific stage tab is selected, hide the others
          if (activeMobileStage !== 'all' && activeMobileStage !== stage.id) {
            return null;
          }

          return (
            <div
              key={stage.id}
              id={`stage-column-${stage.id}`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={() => handleDragLeave(stage.id)}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`flex flex-col rounded-2xl bg-zinc-900/60 border transition-all duration-200 min-h-[360px] ${
                isOver
                  ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/40'
                  : 'border-zinc-800/80 hover:border-zinc-700/80'
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-900/90 rounded-t-2xl">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[11px] font-mono font-bold flex items-center justify-center border border-zinc-700">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                      {stage.title}
                    </h3>
                  </div>

                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-amber-400 border border-zinc-700/80">
                    {stageEpisodes.length}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="truncate">{stage.description}</span>
                </div>

                {stage.requiresGate && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Lock className="w-3 h-3" />
                    <span>Approval Gate Required</span>
                  </div>
                )}
              </div>

              {/* Cards Container */}
              <div className="p-2.5 flex-1 space-y-3 min-h-[220px]">
                {stageEpisodes.length === 0 ? (
                  <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-800/80 rounded-xl text-zinc-500">
                    <p className="text-xs">No episodes in {stage.title}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">
                      Drag cards here or advance from previous stage
                    </p>
                  </div>
                ) : (
                  stageEpisodes.map((ep) => (
                    <EpisodeCard
                      key={ep.id}
                      episode={ep}
                      onSelect={onSelectEpisode}
                      onApproveGate={onApproveGate}
                      onRequestChanges={onRequestChanges}
                      onMoveStage={onMoveStage}
                      onDragStart={handleDragStart}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
