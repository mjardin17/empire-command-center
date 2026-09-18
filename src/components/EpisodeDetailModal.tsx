import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Film,
  Flame,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  Play,
  RotateCcw,
  Save,
  Share2,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { ChannelId, CHANNELS, Episode, PublishChecklist, StageId, STAGES } from '../types';

interface EpisodeDetailModalProps {
  episode: Episode;
  onClose: () => void;
  onSave: (updated: Episode) => void;
  onApproveGate: (episodeId: string, stage: StageId) => void;
  onRequestChanges: (episodeId: string, stage: StageId, notes?: string) => void;
  onMoveStage: (episodeId: string, targetStage: StageId) => void;
  onDelete: (episodeId: string) => void;
}

export const EpisodeDetailModal: React.FC<EpisodeDetailModalProps> = ({
  episode,
  onClose,
  onSave,
  onApproveGate,
  onRequestChanges,
  onMoveStage,
  onDelete,
}) => {
  const [formData, setFormData] = useState<Episode>({ ...episode });
  const [activeTab, setActiveTab] = useState<'overview' | 'script' | 'thumbnail' | 'render' | 'publish'>('overview');
  const [revisionNoteInput, setRevisionNoteInput] = useState(
    episode.gates[episode.stage]?.notes || ''
  );
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const currentStageInfo = STAGES.find((s) => s.id === formData.stage);
  const currentGate = formData.gates[formData.stage];
  const isGated = currentStageInfo?.requiresGate ?? false;
  const isGateApproved = isGated ? !!currentGate?.isApproved : true;

  const currentStageIndex = STAGES.findIndex((s) => s.id === formData.stage);
  const nextStage = currentStageIndex < STAGES.length - 1 ? STAGES[currentStageIndex + 1] : null;

  // Publish checklist count
  const checklistKeys: (keyof PublishChecklist)[] = ['youtube', 'instagram', 'facebook', 'x', 'linkedin'];
  const completedChecklistCount = checklistKeys.filter((k) => formData.publishChecklist[k]).length;

  const handleTextChange = (field: keyof Episode, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleScriptChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      scriptStatus: {
        ...prev.scriptStatus,
        [field]: value,
      },
    }));
  };

  const handleToggleChecklist = (platform: keyof PublishChecklist) => {
    const updatedChecklist = {
      ...formData.publishChecklist,
      [platform]: !formData.publishChecklist[platform],
    };
    const updated = {
      ...formData,
      publishChecklist: updatedChecklist,
    };
    setFormData(updated);
    onSave(updated);
  };

  const handleSelectThumbnailVariant = (variantId: string) => {
    const updatedVariants = formData.thumbnailVariants.map((v) => ({
      ...v,
      isSelected: v.id === variantId,
    }));
    const updated = {
      ...formData,
      thumbnailVariants: updatedVariants,
    };
    setFormData(updated);
    onSave(updated);
  };

  const handleSetRenderProgress = (progress: number) => {
    const updatedRender = {
      ...formData.renderStatus,
      progress,
      status: progress >= 100 ? ('Completed' as const) : progress > 0 ? ('Rendering' as const) : ('Idle' as const),
    };
    const updated = {
      ...formData,
      renderStatus: updatedRender,
    };
    setFormData(updated);
    onSave(updated);
  };

  const handleSaveChanges = () => {
    onSave(formData);
    onClose();
  };

  const handleDirectApprove = () => {
    onApproveGate(formData.id, formData.stage);
    const updatedGates = {
      ...formData.gates,
      [formData.stage]: {
        ...formData.gates[formData.stage],
        isApproved: true,
        approvedAt: 'Just now',
        approvedBy: 'Command Lead',
      },
    };
    setFormData((prev) => ({ ...prev, gates: updatedGates }));
  };

  const handleSubmitRevisions = () => {
    onRequestChanges(formData.id, formData.stage, revisionNoteInput);
    const updatedGates = {
      ...formData.gates,
      [formData.stage]: {
        ...formData.gates[formData.stage],
        isApproved: false,
        notes: revisionNoteInput,
      },
    };
    setFormData((prev) => ({ ...prev, gates: updatedGates }));
    setShowRevisionForm(false);
  };

  return (
    <div
      id="episode-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER */}
        <div className="p-4 sm:p-5 bg-zinc-950/80 border-b border-zinc-800 flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Channel Selector */}
              <select
                value={formData.channelId}
                onChange={(e) => handleTextChange('channelId', e.target.value as ChannelId)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {Object.values(CHANNELS).map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.emoji} {ch.name}
                  </option>
                ))}
              </select>

              {/* Stage Pill */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Stage: {currentStageInfo?.title} ({currentStageIndex + 1}/6)
              </span>

              {isGated && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    isGateApproved
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isGateApproved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approved
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      Approval Required
                    </>
                  )}
                </span>
              )}
            </div>

            {/* Title Input */}
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTextChange('title', e.target.value)}
              className="w-full text-base sm:text-xl font-extrabold text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-amber-400 focus:outline-none transition-colors py-1"
              placeholder="Episode title..."
            />
          </div>

          {/* Close button with min 44px touch area */}
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer shrink-0"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STAGE STEPPER PIPELINE BAR */}
        <div className="bg-zinc-950/40 border-b border-zinc-800 px-4 py-2.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-2 min-w-[620px]">
            {STAGES.map((s, idx) => {
              const isCurrent = s.id === formData.stage;
              const isPast = idx < currentStageIndex;
              const isApprovedPast = formData.gates[s.id]?.isApproved;

              return (
                <React.Fragment key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (s.id !== formData.stage) {
                        onMoveStage(formData.id, s.id);
                        setFormData((prev) => ({ ...prev, stage: s.id }));
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                        : isPast
                        ? 'bg-zinc-800/80 text-emerald-400 hover:bg-zinc-800'
                        : 'bg-zinc-900/60 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {isPast || isApprovedPast ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-mono flex items-center justify-center">
                        {idx + 1}
                      </span>
                    )}
                    <span>{s.title}</span>
                  </button>
                  {idx < STAGES.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* APPROVAL GATE BANNER (IF CURRENT STAGE REQUIRES GATE) */}
        {isGated && (
          <div
            className={`px-4 sm:px-6 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isGateApproved
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {isGateApproved ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <span className="font-bold text-sm">
                  {isGateApproved
                    ? `${currentStageInfo?.title || 'Stage'} Gate Approved`
                    : `${currentStageInfo?.title || 'Stage'} Approval Gate Required`}
                </span>
                {currentGate?.approvedAt && (
                  <span className="text-xs text-emerald-400/80 font-mono">
                    ({currentGate.approvedAt})
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300">
                {isGateApproved
                  ? 'Criteria validated. This episode is authorized to advance.'
                  : 'Quality checkpoint: approve criteria or request specific changes before advancing.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isGateApproved ? (
                <>
                  <button
                    type="button"
                    onClick={handleDirectApprove}
                    className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Approve Gate
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRevisionForm(!showRevisionForm)}
                    className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 active:scale-95 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Request Changes
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowRevisionForm(true)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-amber-300 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 transition-colors cursor-pointer"
                >
                  Reopen Gate / Revisions
                </button>
              )}
            </div>
          </div>
        )}

        {/* Revision form dropdown if toggled */}
        {showRevisionForm && (
          <div className="p-4 bg-zinc-950 border-b border-zinc-800 space-y-2">
            <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              Specify Revision Feedback / Gate Notes:
            </label>
            <textarea
              rows={2}
              value={revisionNoteInput}
              onChange={(e) => setRevisionNoteInput(e.target.value)}
              placeholder="e.g. Needs faster pacing in opening hook, or contrast boost on thumbnail variant B..."
              className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRevisionForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitRevisions}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 cursor-pointer"
              >
                Submit Change Request
              </button>
            </div>
          </div>
        )}

        {/* NAVIGATION TABS (Overview, Script, Thumbnail, Render, Publish) */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-zinc-800 bg-zinc-900/50 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`min-h-[44px] px-4 py-2 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('script')}
            className={`min-h-[44px] px-4 py-2 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'script'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Script Status
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('thumbnail')}
            className={`min-h-[44px] px-4 py-2 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'thumbnail'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Thumbnails ({formData.thumbnailVariants.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('render')}
            className={`min-h-[44px] px-4 py-2 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'render'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Render ({formData.renderStatus.progress}%)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('publish')}
            className={`min-h-[44px] px-4 py-2 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'publish'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Publish Checklist ({completedChecklistCount}/5)
          </button>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-medium block">Word Count</span>
                  <span className="text-xl font-bold font-mono text-zinc-100">
                    {formData.scriptStatus.wordCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
                    ~{formData.scriptStatus.durationMinutes} min video
                  </span>
                </div>

                <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-medium block">Active Thumbnail</span>
                  <span className="text-sm font-bold text-amber-400 truncate block mt-1">
                    {formData.thumbnailVariants.find((v) => v.isSelected)?.label.slice(0, 18) ||
                      'None'}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    CTR: {formData.thumbnailVariants.find((v) => v.isSelected)?.predictedCtr || 'N/A'}
                  </span>
                </div>

                <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-medium block">Render Status</span>
                  <span className="text-xl font-bold font-mono text-cyan-400">
                    {formData.renderStatus.progress}%
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
                    {formData.renderStatus.resolution}
                  </span>
                </div>

                <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-medium block">Multi-Platform</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {completedChecklistCount} / 5
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">Channels ready</span>
                </div>
              </div>

              {/* Hook & Synopsis */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Opening Hook / Synopsis
                </label>
                <textarea
                  rows={3}
                  value={formData.scriptStatus.hookSummary}
                  onChange={(e) => handleScriptChange('hookSummary', e.target.value)}
                  className="w-full p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-zinc-200 text-sm focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              {/* Research Intel Attribution if present */}
              {formData.sourceIntelTitle && (
                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <span className="font-semibold text-zinc-300">Generated from Research Intel:</span>
                    <p className="text-zinc-400">{formData.sourceIntelTitle}</p>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      Source: {formData.sourceIntelName}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SCRIPT STATUS */}
          {activeTab === 'script' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <div>
                  <span className="text-xs text-zinc-400 font-medium">Review Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {formData.scriptStatus.scriptReviewState}
                    </span>
                    <span className="text-xs text-zinc-400">
                      Target length: ~{formData.scriptStatus.durationMinutes} mins
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-xs text-zinc-400 block">Word Count</label>
                    <input
                      type="number"
                      value={formData.scriptStatus.wordCount}
                      onChange={(e) => handleScriptChange('wordCount', parseInt(e.target.value) || 0)}
                      className="w-28 p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block">Target Minutes</label>
                    <input
                      type="number"
                      value={formData.scriptStatus.durationMinutes}
                      onChange={(e) => handleScriptChange('durationMinutes', parseInt(e.target.value) || 0)}
                      className="w-24 p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Story Arc Outline */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Story Arc / Production Script Outline
                </label>
                <textarea
                  rows={8}
                  value={formData.scriptStatus.outline}
                  onChange={(e) => handleScriptChange('outline', e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 3: THUMBNAIL VARIANT PLACEHOLDERS */}
          {activeTab === 'thumbnail' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">A/B/C Thumbnail Variants</h3>
                  <p className="text-xs text-zinc-400">
                    Compare contrast, click-through predictions and set active hero
                  </p>
                </div>
                <span className="text-xs text-amber-400 font-mono font-semibold">
                  3 Variants Ready
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {formData.thumbnailVariants.map((variant) => (
                  <div
                    key={variant.id}
                    onClick={() => handleSelectThumbnailVariant(variant.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      variant.isSelected
                        ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/30 shadow-xl'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Visual Placeholder Box with dynamic gradient */}
                      <div
                        className={`w-full h-32 rounded-xl bg-gradient-to-br ${variant.colorGradient} p-3 flex flex-col justify-between relative border border-white/10 overflow-hidden shadow-inner`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30">
                            CTR: {variant.predictedCtr}
                          </span>
                          {variant.isSelected && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-black uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/10">
                          <p className="text-[11px] font-extrabold text-white leading-tight line-clamp-2">
                            {variant.label}
                          </p>
                        </div>
                      </div>

                      {/* Concept notes */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-zinc-300 block">
                          Visual Composition:
                        </span>
                        <p className="text-xs text-zinc-400 line-clamp-3 leading-snug">
                          {variant.concept}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {variant.contrastScore}
                      </span>
                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          variant.isSelected
                            ? 'bg-amber-400 text-zinc-950 font-bold'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {variant.isSelected ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: RENDER PROGRESS */}
          {activeTab === 'render' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                      <Film className="w-5 h-5 text-cyan-400" />
                      4K Render & QC Pipeline
                    </h3>
                    <p className="text-xs text-zinc-400">
                      High-fidelity render queue and technical validation
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold ${
                      formData.renderStatus.progress === 100
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : formData.renderStatus.progress > 0
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {formData.renderStatus.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-300 font-mono">
                    <span>Export Progress</span>
                    <span className="text-cyan-400 font-bold">{formData.renderStatus.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
                      style={{ width: `${formData.renderStatus.progress}%` }}
                    />
                  </div>
                </div>

                {/* Interactive quick controls */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSetRenderProgress(0)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                  >
                    Reset (0%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetRenderProgress(50)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-cyan-300 cursor-pointer"
                  >
                    Simulate 50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetRenderProgress(100)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
                  >
                    Mark 100% Complete
                  </button>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Resolution</span>
                  <span className="text-xs font-bold text-zinc-200">{formData.renderStatus.resolution}</span>
                </div>
                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Frame Rate</span>
                  <span className="text-xs font-bold text-zinc-200">{formData.renderStatus.framerate}</span>
                </div>
                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Master Codec</span>
                  <span className="text-xs font-bold text-zinc-200">{formData.renderStatus.codec}</span>
                </div>
                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block">Est. Time</span>
                  <span className="text-xs font-bold text-zinc-200">
                    {formData.renderStatus.renderTimeEst || '~30 mins'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PUBLISH CHECKLIST */}
          {activeTab === 'publish' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    Multi-Platform Syndication Checklist
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Verify each distribution target before switching status to Live
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/25">
                  {completedChecklistCount} / 5 Ready
                </span>
              </div>

              {/* Checklist items with large 44px+ touch targets */}
              <div className="space-y-2.5">
                {[
                  {
                    key: 'youtube' as const,
                    name: 'YouTube Primary Release',
                    desc: '4K video file, chapter timestamps, tags, custom thumbnail, pinned discussion comment.',
                    icon: '▶️',
                  },
                  {
                    key: 'instagram' as const,
                    name: 'Instagram Reel & Carousel',
                    desc: '9:16 vertical hook teaser, 6-slide story carousel, Link in Bio updated.',
                    icon: '📸',
                  },
                  {
                    key: 'facebook' as const,
                    name: 'Facebook Watch & Group Post',
                    desc: 'Longform video upload to channel page with interactive poll for viewers.',
                    icon: '👥',
                  },
                  {
                    key: 'x' as const,
                    name: 'X (Twitter) Video Thread',
                    desc: '60-second highlight clip with 4-tweet historical/technical breakdown thread.',
                    icon: '✖️',
                  },
                  {
                    key: 'linkedin' as const,
                    name: 'LinkedIn Behind-the-Scenes',
                    desc: 'Documentary production case study / storytelling craft article.',
                    icon: '💼',
                  },
                ].map((item) => {
                  const isChecked = formData.publishChecklist[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleToggleChecklist(item.key)}
                      className={`w-full min-h-[56px] p-4 rounded-xl border flex items-center justify-between gap-4 text-left transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-zinc-100'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl shrink-0">{item.icon}</span>
                        <div>
                          <span
                            className={`text-sm font-bold block ${
                              isChecked ? 'text-emerald-300' : 'text-zinc-200'
                            }`}
                          >
                            {item.name}
                          </span>
                          <span className="text-xs text-zinc-400 line-clamp-1">{item.desc}</span>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-400 text-zinc-950'
                            : 'border-zinc-700 bg-zinc-900'
                        }`}
                      >
                        {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-4 bg-zinc-950/90 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this episode from the production factory?')) {
                onDelete(formData.id);
                onClose();
              }
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Episode</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveChanges}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Details</span>
            </button>

            {nextStage && (
              <button
                type="button"
                onClick={() => {
                  onMoveStage(formData.id, nextStage.id);
                  onClose();
                }}
                disabled={isGated && !isGateApproved}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isGated && !isGateApproved
                    ? 'bg-zinc-800/80 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
                }`}
              >
                <span>Advance to {nextStage.title}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
