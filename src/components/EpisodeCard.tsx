import React from 'react';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileEdit,
  GripVertical,
  Lock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CHANNELS, Episode, StageId, STAGES } from '../types';

interface EpisodeCardProps {
  episode: Episode;
  onSelect: (episode: Episode) => void;
  onApproveGate: (episodeId: string, stage: StageId) => void;
  onRequestChanges: (episodeId: string, stage: StageId) => void;
  onMoveStage: (episodeId: string, targetStage: StageId) => void;
  onDragStart?: (e: React.DragEvent, episodeId: string) => void;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  onSelect,
  onApproveGate,
  onRequestChanges,
  onMoveStage,
  onDragStart,
}) => {
  const channel = CHANNELS[episode.channelId];
  const currentStageIndex = STAGES.findIndex((s) => s.id === episode.stage);
  const currentStageInfo = STAGES[currentStageIndex];

  const prevStage = currentStageIndex > 0 ? STAGES[currentStageIndex - 1] : null;
  const nextStage = currentStageIndex < STAGES.length - 1 ? STAGES[currentStageIndex + 1] : null;

  // Gate evaluation
  const isGatedStage = currentStageInfo?.requiresGate ?? false;
  const currentGate = episode.gates[episode.stage];
  const isGateApproved = isGatedStage ? !!currentGate?.isApproved : true;

  const handleAdvance = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nextStage) return;
    onMoveStage(episode.id, nextStage.id);
  };

  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!prevStage) return;
    onMoveStage(episode.id, prevStage.id);
  };

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onApproveGate(episode.id, episode.stage);
  };

  const handleRequestChanges = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRequestChanges(episode.id, episode.stage);
  };

  return (
    <div
      id={`episode-card-${episode.id}`}
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, episode.id)}
      onClick={() => onSelect(episode)}
      className={`group relative bg-zinc-900/95 border rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl hover:border-amber-500/40 hover:-translate-y-0.5 active:translate-y-0 ${
        isGatedStage && !isGateApproved
          ? 'border-amber-500/30 bg-gradient-to-b from-amber-950/10 to-zinc-900/95'
          : isGatedStage && isGateApproved
          ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-950/10 to-zinc-900/95'
          : 'border-zinc-800'
      }`}
    >
      {/* Top row: Channel Badge + Stage pill + Drag handle */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
              channel?.badgeBg || 'bg-zinc-800'
            } ${channel?.badgeText || 'text-zinc-300'} ${
              channel?.badgeBorder || 'border-zinc-700'
            }`}
          >
            <span>{channel?.emoji}</span>
            <span>{channel?.name}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span
            className="text-zinc-600 hover:text-zinc-400 p-1 cursor-grab active:cursor-grabbing transition-colors hidden sm:inline-flex"
            title="Drag to move stage"
          >
            <GripVertical className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Episode Title */}
      <h3 className="text-sm sm:text-base font-bold text-zinc-100 line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors mb-2">
        {episode.title}
      </h3>

      {/* Quick metadata badges */}
      <div className="flex items-center flex-wrap gap-2 text-xs text-zinc-400 mb-3">
        {episode.scriptStatus?.durationMinutes && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 font-mono text-[11px]">
            <Clock className="w-3 h-3 text-zinc-500" />
            {episode.scriptStatus.durationMinutes}m duration
          </span>
        )}

        {episode.stage === 'thumbnail' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/25 text-[11px]">
            <Sparkles className="w-3 h-3" />
            3 Variants
          </span>
        )}

        {episode.stage === 'render' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 text-[11px] font-mono">
            {episode.renderStatus.progress}% • {episode.renderStatus.resolution}
          </span>
        )}

        {episode.stage === 'live' && episode.liveAt && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            Live
          </span>
        )}
      </div>

      {/* APPROVAL GATE SECTION (For Script, Thumbnail, Render, Publish) */}
      {isGatedStage && (
        <div
          className={`mb-3 p-2.5 rounded-xl border transition-all ${
            isGateApproved
              ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {isGateApproved ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Gate Approved</span>
                {currentGate?.approvedAt && (
                  <span className="text-[11px] text-emerald-400/80 font-mono font-normal">
                    ({currentGate.approvedAt})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleRequestChanges}
                className="text-[11px] font-medium text-zinc-400 hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer px-1 py-0.5"
                title="Reopen review or request changes"
              >
                Request changes
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1 text-xs">
                <span className="font-semibold flex items-center gap-1 text-amber-400">
                  <Lock className="w-3.5 h-3.5" />
                  {currentStageInfo.gateName || 'Approval Gate'} Pending
                </span>
                <span className="text-[11px] text-amber-400/75">Gate lock active</span>
              </div>

              {currentGate?.notes && (
                <p className="text-[11px] text-zinc-300 italic line-clamp-2 bg-black/30 p-1.5 rounded border border-amber-500/20">
                  "{currentGate.notes}"
                </p>
              )}

              {/* Approve / Request Changes Buttons with big touch targets */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  id={`btn-approve-${episode.id}`}
                  onClick={handleApprove}
                  className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>

                <button
                  type="button"
                  id={`btn-changes-${episode.id}`}
                  onClick={handleRequestChanges}
                  className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Request changes
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM ROW: STAGE NAVIGATION BUTTONS (Mobile Friendly min 44px) */}
      <div
        className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/80"
        onClick={(e) => e.stopPropagation()}
      >
        {prevStage ? (
          <button
            type="button"
            id={`btn-prev-${episode.id}`}
            onClick={handleBack}
            className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-700/50 flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
            title={`Move back to ${prevStage.title}`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{prevStage.title}</span>
          </button>
        ) : (
          <span className="text-[11px] text-zinc-600 font-mono px-2">Stage 1 of 6</span>
        )}

        {nextStage ? (
          <button
            type="button"
            id={`btn-next-${episode.id}`}
            onClick={handleAdvance}
            disabled={isGatedStage && !isGateApproved}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              isGatedStage && !isGateApproved
                ? 'bg-zinc-800/60 text-zinc-500 border border-zinc-800 cursor-not-allowed opacity-75'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
            }`}
            title={
              isGatedStage && !isGateApproved
                ? `Approval Gate locked: Approve before advancing to ${nextStage.title}`
                : `Advance to ${nextStage.title}`
            }
          >
            {isGatedStage && !isGateApproved ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Locked</span>
              </>
            ) : (
              <>
                <span>Advance to {nextStage.title}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
            <Sparkles className="w-3.5 h-3.5" /> Complete
          </span>
        )}
      </div>
    </div>
  );
};
