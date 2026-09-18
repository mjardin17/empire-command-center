import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  Film,
  Flame,
  Image as ImageIcon,
  Key,
  Layers,
  Lock,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Share2,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react';
import {
  formatTimestamp,
  generateDraftScript,
  scoreThumbnailVariants,
  summarizeScript,
} from '../services/api';
import {
  ChannelId,
  CHANNELS,
  Episode,
  FullScript,
  PublishChecklist,
  StageId,
  STAGES,
  ThumbnailVariant,
} from '../types';

interface EpisodeDetailModalProps {
  episode: Episode;
  onClose: () => void;
  onSave: (updated: Episode) => void;
  onApproveGate: (episodeId: string, stage: StageId) => void;
  onRequestChanges: (episodeId: string, stage: StageId, notes?: string) => void;
  onMoveStage: (episodeId: string, targetStage: StageId) => Promise<boolean> | boolean;
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
  // Determine initial active tab based on stage context
  const getInitialTab = (): 'overview' | 'script' | 'thumbnail' | 'render' | 'publish' => {
    if (episode.stage === 'script') return 'script';
    if (episode.stage === 'thumbnail') return 'thumbnail';
    if (episode.stage === 'publish') return 'publish';
    if (episode.stage === 'render') return 'render';
    return 'overview';
  };

  const [formData, setFormData] = useState<Episode>(() => ({
    ...episode,
    fullScript: episode.fullScript || {
      hook:
        episode.scriptStatus?.hookSummary ||
        'In the golden age of ancient myth and machines, one discovery changed everything.',
      sections: [
        {
          heading: 'Act 1: The Inciting Catalyst',
          content:
            '[Visual cue: Rapid dynamic montage with sound design]\nDeep in the forgotten archives, ancient engineering scrolls revealed blueprints for mechanical titans.',
        },
        {
          heading: 'Act 2: The Tactical Showdown',
          content:
            '[Visual cue: 3D schematic breakdown with kinetic typography]\nWhen the opposing legions met at the riverbed, the sheer scale of the defense wall stunned the commanders.',
        },
        {
          heading: 'Act 3: The Aftermath & Paradigm Shift',
          content:
            '[Visual cue: Cinematic drone sweep across the battlefield ruins]\nModern archaeologists are only now beginning to grasp the astronomical precision embedded in these ancient ruins.',
        },
      ],
      cta: 'Subscribe to Empire Decoded for weekly deep-dives into ancient tactical engineering.',
      lastDraftedAt: formatTimestamp(),
    },
  }));

  const [activeTab, setActiveTab] = useState<'overview' | 'script' | 'thumbnail' | 'render' | 'publish'>(
    getInitialTab
  );

  const [revisionNoteInput, setRevisionNoteInput] = useState(
    episode.gates[episode.stage]?.notes || ''
  );
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  // Gemini loading & state
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isSummarizingScript, setIsSummarizingScript] = useState(false);
  const [isScoringThumbnails, setIsScoringThumbnails] = useState(false);
  const [isRenderingSimulation, setIsRenderingSimulation] = useState(false);
  const [hasCopiedScript, setHasCopiedScript] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [scriptSummaryResult, setScriptSummaryResult] = useState<{
    summary: string;
    retentionBeats: string[];
    estimatedPacing: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const currentStageInfo = STAGES.find((s) => s.id === formData.stage);
  const currentGate = formData.gates[formData.stage];
  const isGated = currentStageInfo?.requiresGate ?? false;
  const isGateApproved = isGated ? !!currentGate?.isApproved : true;

  const currentStageIndex = STAGES.findIndex((s) => s.id === formData.stage);
  const nextStage = currentStageIndex < STAGES.length - 1 ? STAGES[currentStageIndex + 1] : null;

  // Publish checklist count
  const checklistKeys: (keyof PublishChecklist)[] = ['youtube', 'instagram', 'facebook', 'x', 'linkedin'];
  const completedChecklistCount = checklistKeys.filter((k) => formData.publishChecklist?.[k]).length;

  const handleTextChange = (field: keyof Episode, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Full Script handlers
  const handleHookChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      fullScript: {
        ...(prev.fullScript || { sections: [], cta: '' }),
        hook: val,
      },
    }));
  };

  const handleCtaChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      fullScript: {
        ...(prev.fullScript || { hook: '', sections: [] }),
        cta: val,
      },
    }));
  };

  const handleSectionHeadingChange = (index: number, heading: string) => {
    setFormData((prev) => {
      const currentSections = [...(prev.fullScript?.sections || [])];
      if (currentSections[index]) {
        currentSections[index] = { ...currentSections[index], heading };
      }
      return {
        ...prev,
        fullScript: {
          ...(prev.fullScript || { hook: '', cta: '' }),
          sections: currentSections,
        },
      };
    });
  };

  const handleSectionContentChange = (index: number, content: string) => {
    setFormData((prev) => {
      const currentSections = [...(prev.fullScript?.sections || [])];
      if (currentSections[index]) {
        currentSections[index] = { ...currentSections[index], content };
      }
      return {
        ...prev,
        fullScript: {
          ...(prev.fullScript || { hook: '', cta: '' }),
          sections: currentSections,
        },
      };
    });
  };

  const handleAddSection = () => {
    setFormData((prev) => {
      const currentSections = [...(prev.fullScript?.sections || [])];
      currentSections.push({
        heading: `Act ${currentSections.length + 1}: Key Narrative Beat`,
        content: '[Visual cue: Narrative cut with archival B-Roll]\nEnter narrative script text here...',
      });
      return {
        ...prev,
        fullScript: {
          ...(prev.fullScript || { hook: '', cta: '' }),
          sections: currentSections,
        },
      };
    });
  };

  const handleRemoveSection = (idx: number) => {
    setFormData((prev) => {
      const currentSections = [...(prev.fullScript?.sections || [])].filter((_, i) => i !== idx);
      return {
        ...prev,
        fullScript: {
          ...(prev.fullScript || { hook: '', cta: '' }),
          sections: currentSections,
        },
      };
    });
  };

  // Gemini: Generate Draft Script
  const handleGenerateDraftScript = async () => {
    setIsGeneratingScript(true);
    setModalError(null);
    try {
      const result = await generateDraftScript(
        formData.title,
        formData.channelId,
        formData.fullScript?.hook || formData.scriptStatus?.hookSummary,
        formData.scriptStatus?.outline,
        formData.sourceIntelTitle,
        formData.sourceIntelName,
        (formData as any).tags
      );

      const updatedScript: FullScript = {
        hook: result.hook,
        sections: result.sections,
        cta: result.cta,
        lastDraftedAt: formatTimestamp(),
      };

      const updated = {
        ...formData,
        fullScript: updatedScript,
        scriptStatus: {
          ...formData.scriptStatus,
          wordCount: result.wordCount,
          durationMinutes: result.durationMinutes,
          hookSummary: result.hook.slice(0, 140) + '...',
          scriptReviewState: 'Drafting' as const,
        },
      };

      setFormData(updated);
      onSave(updated);
      showToast('Draft script generated successfully with Gemini!');
    } catch (err: any) {
      setModalError(`Script Generation Failed: ${err.message || 'Gemini service unreachable'}`);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Gemini: Summarize Script
  const handleSummarizeScript = async () => {
    setIsSummarizingScript(true);
    setModalError(null);
    try {
      const scriptParts = [
        `HOOK: ${formData.fullScript?.hook || ''}`,
        ...(formData.fullScript?.sections || []).map(
          (s) => `[${s.heading}]\n${s.content}`
        ),
        `CTA: ${formData.fullScript?.cta || ''}`,
      ].join('\n\n');

      const result = await summarizeScript(scriptParts, formData.title, formData.channelId);
      setScriptSummaryResult(result);
      showToast('Executive script summary ready!');
    } catch (err: any) {
      setModalError(`Script Summarization Failed: ${err.message || 'Gemini service unreachable'}`);
    } finally {
      setIsSummarizingScript(false);
    }
  };

  // Copy Full Script to Clipboard
  const handleCopyScript = async () => {
    const fullText = [
      `TITLE: ${formData.title}`,
      `CHANNEL: ${CHANNELS[formData.channelId]?.name || formData.channelId}`,
      `DATE: ${formData.fullScript?.lastDraftedAt || formatTimestamp()}`,
      '',
      '=== HOOK ===',
      formData.fullScript?.hook || '',
      '',
      '=== MAIN CONTENT ===',
      ...(formData.fullScript?.sections || []).map(
        (s) => `\n## ${s.heading}\n${s.content}`
      ),
      '',
      '=== CALL TO ACTION ===',
      formData.fullScript?.cta || '',
    ].join('\n');

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullText);
      }
      setHasCopiedScript(true);
      showToast('Full script copied to clipboard!');
      setTimeout(() => setHasCopiedScript(false), 2500);
    } catch (err) {
      showToast('Script ready (clipboard permission blocked)');
    }
  };

  // Thumbnail: Score Variants with Gemini (1-10)
  const handleScoreThumbnailVariants = async () => {
    setIsScoringThumbnails(true);
    setModalError(null);
    try {
      const result = await scoreThumbnailVariants(
        formData.title,
        formData.channelId,
        formData.thumbnailVariants
      );

      const updatedVariants = formData.thumbnailVariants.map((v) => {
        const found = result.scores.find((s) => s.id === v.id);
        if (found) {
          return {
            ...v,
            clickAppealScore: found.score,
            clickAppealCritique: found.critique,
          };
        }
        return v;
      });

      const updated = {
        ...formData,
        thumbnailVariants: updatedVariants,
      };

      setFormData(updated);
      onSave(updated);
      showToast('Thumbnail variants scored 1–10 with Gemini!');
    } catch (err: any) {
      setModalError(`Thumbnail Scoring Failed: ${err.message || 'Gemini service unreachable'}`);
    } finally {
      setIsScoringThumbnails(false);
    }
  };

  // Thumbnail: Pick Winner
  const handlePickWinner = (variantId: string) => {
    const timestamp = formatTimestamp();
    const updatedVariants = formData.thumbnailVariants.map((v) => ({
      ...v,
      isSelected: v.id === variantId,
      selectedAt: v.id === variantId ? timestamp : undefined,
    }));

    const updated = {
      ...formData,
      thumbnailVariants: updatedVariants,
    };

    setFormData(updated);
    onSave(updated);
    showToast(`Winner selected (${timestamp})!`);
  };

  // Publish Checklist toggle
  const handleToggleChecklist = (platform: keyof PublishChecklist) => {
    const isNowChecked = !formData.publishChecklist?.[platform];
    const timestamp = isNowChecked ? formatTimestamp() : undefined;

    const updatedChecklist = {
      ...(formData.publishChecklist || {
        youtube: false,
        instagram: false,
        facebook: false,
        x: false,
        linkedin: false,
      }),
      [platform]: isNowChecked,
    };

    const updatedTimestamps = {
      ...(formData.publishChecklistTimestamps || {}),
      [platform]: timestamp,
    };

    const updated = {
      ...formData,
      publishChecklist: updatedChecklist,
      publishChecklistTimestamps: updatedTimestamps,
    };

    setFormData(updated);
    onSave(updated);
  };

  // Check or uncheck all syndication targets
  const handleToggleAllPublish = (checkAll: boolean) => {
    const timestamp = checkAll ? formatTimestamp() : undefined;
    const updatedChecklist: PublishChecklist = {
      youtube: checkAll,
      instagram: checkAll,
      facebook: checkAll,
      x: checkAll,
      linkedin: checkAll,
    };
    const updatedTimestamps: Record<string, string | undefined> = {
      youtube: timestamp,
      instagram: timestamp,
      facebook: timestamp,
      x: timestamp,
      linkedin: timestamp,
    };

    const updated = {
      ...formData,
      publishChecklist: updatedChecklist,
      publishChecklistTimestamps: updatedTimestamps as any,
    };
    setFormData(updated);
    onSave(updated);
    showToast(checkAll ? 'All distribution channels checked ready!' : 'All checklists cleared.');
  };

  // Simulate automated 4K rendering queue
  const handleStartRenderQueue = () => {
    if (isRenderingSimulation) return;
    setIsRenderingSimulation(true);

    let progress = Math.max(10, formData.renderStatus.progress);
    handleSetRenderProgress(progress);

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsRenderingSimulation(false);
        handleSetRenderProgress(100);
        showToast('4K Render export complete and color graded!');
      } else {
        handleSetRenderProgress(progress);
      }
    }, 450);
  };

  const handleSetRenderProgress = (progress: number) => {
    const updatedRender = {
      ...formData.renderStatus,
      progress,
      status:
        progress >= 100
          ? ('Completed' as const)
          : progress > 0
          ? ('Rendering' as const)
          : ('Idle' as const),
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
        approvedAt: formatTimestamp(),
        approvedBy: 'Command Lead',
      },
    };

    let updatedScriptStatus = formData.scriptStatus;
    if (formData.stage === 'script') {
      updatedScriptStatus = {
        ...formData.scriptStatus,
        scriptReviewState: 'Approved',
      };
    }

    const updated: Episode = {
      ...formData,
      gates: updatedGates,
      scriptStatus: updatedScriptStatus,
    };

    setFormData(updated);
    onSave(updated);
    showToast(`${currentStageInfo?.title || 'Stage'} gate approved!`);
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

    let updatedScriptStatus = formData.scriptStatus;
    if (formData.stage === 'script') {
      updatedScriptStatus = {
        ...formData.scriptStatus,
        scriptReviewState: 'Needs Revisions',
      };
    }

    const updated: Episode = {
      ...formData,
      gates: updatedGates,
      scriptStatus: updatedScriptStatus,
    };

    setFormData(updated);
    onSave(updated);
    setShowRevisionForm(false);
    showToast('Change request recorded with revision notes.');
  };

  return (
    <div
      id="episode-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOAST FEEDBACK NOTIFICATION */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs shadow-xl flex items-center gap-2 border border-amber-400 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* MODAL ERROR BANNER */}
        {modalError && (
          <div className="mx-4 mt-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-between gap-3 text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{modalError}</span>
            </div>
            <button
              type="button"
              onClick={() => setModalError(null)}
              className="text-rose-400 hover:text-rose-200 text-xs font-semibold px-2 py-1 rounded bg-rose-900/50 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TOP HEADER */}
        <div className="p-4 sm:p-5 bg-zinc-950/90 border-b border-zinc-800 flex items-start justify-between gap-4">
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
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                    isGateApproved
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isGateApproved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approved {currentGate?.approvedAt && `(${currentGate.approvedAt})`}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Approval Gate Locked</span>
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

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer shrink-0"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STAGE STEPPER BAR */}
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
                    onClick={async () => {
                      if (s.id !== formData.stage) {
                        const success = await onMoveStage(formData.id, s.id);
                        if (success) {
                          setFormData((prev) => ({ ...prev, stage: s.id }));
                        }
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

        {/* APPROVAL GATE BANNER */}
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
                    : `${currentStageInfo?.title || 'Stage'} Gate: Approval Required`}
                </span>
                {currentGate?.approvedAt && (
                  <span className="text-xs text-emerald-400/80 font-mono">
                    ({currentGate.approvedAt})
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300">
                {isGateApproved
                  ? 'Criteria validated. This episode is authorized to advance to subsequent stages.'
                  : 'Quality checkpoint: review and approve content or request specific revisions.'}
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
                    className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 active:scale-95 transition-all cursor-pointer"
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

        {/* Revision form dropdown */}
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

        {/* NAVIGATION TABS */}
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
            className={`min-h-[44px] px-4 py-2 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'script'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Full Script Viewer</span>
            {formData.stage === 'script' && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('thumbnail')}
            className={`min-h-[44px] px-4 py-2 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'thumbnail'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Thumbnails ({formData.thumbnailVariants.length})</span>
            {formData.stage === 'thumbnail' && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
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
            className={`min-h-[44px] px-4 py-2 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'publish'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Publish Checklist ({completedChecklistCount}/5)</span>
            {formData.stage === 'publish' && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
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
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
                    CTR: {formData.thumbnailVariants.find((v) => v.isSelected)?.predictedCtr}
                  </span>
                </div>

                <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-medium block">Render Progress</span>
                  <span className="text-xl font-bold font-mono text-cyan-400">
                    {formData.renderStatus.progress}%
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
                    {formData.renderStatus.status}
                  </span>
                </div>

                <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 font-medium block">Release Ready</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {completedChecklistCount}/5
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
                    {formData.publishChecklist?.youtube ? 'YouTube Checked' : 'YouTube Pending'}
                  </span>
                </div>
              </div>

              {/* Source Dossier Information */}
              {formData.sourceIntelTitle && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-400">
                    Sourced From Intel Feed
                  </span>
                  <h4 className="text-sm font-bold text-zinc-200">{formData.sourceIntelTitle}</h4>
                  <p className="text-xs text-zinc-400">Source: {formData.sourceIntelName}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FULL SCRIPT VIEWER IN THE GATE */}
          {activeTab === 'script' && (
            <div className="space-y-6">
              {/* Script Header Toolbar: Gemini Actions + Metrics */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-100">Full Production Script</h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {formData.scriptStatus.scriptReviewState}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    ~{formData.scriptStatus.wordCount} words • ~{formData.scriptStatus.durationMinutes} mins target runtime
                  </p>
                </div>

                {/* Gemini AI Action Buttons & Copy */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copy full script hook, acts, and CTA to clipboard"
                  >
                    {hasCopiedScript ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                    <span>{hasCopiedScript ? 'Copied!' : 'Copy Script'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateDraftScript}
                    disabled={isGeneratingScript}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingScript ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingScript ? 'Generating Draft...' : 'Generate Draft Script (Gemini)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSummarizeScript}
                    disabled={isSummarizingScript}
                    className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isSummarizingScript ? 'Summarizing...' : 'Summarize with Gemini'}</span>
                  </button>
                </div>
              </div>

              {/* Summary Card if generated */}
              {scriptSummaryResult && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Gemini Executive Script Synthesis
                    </span>
                    <button
                      type="button"
                      onClick={() => setScriptSummaryResult(null)}
                      className="text-zinc-400 hover:text-zinc-200 text-xs"
                    >
                      Dismiss
                    </button>
                  </div>

                  <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                    {scriptSummaryResult.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-amber-500/20">
                    <div>
                      <span className="text-[11px] font-bold text-amber-400 block mb-1">
                        High-Retention Beats:
                      </span>
                      <ul className="list-disc pl-4 space-y-0.5 text-zinc-300 text-[11px]">
                        {scriptSummaryResult.retentionBeats.map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-amber-400 block mb-1">
                        Pacing Analysis:
                      </span>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">
                        {scriptSummaryResult.estimatedPacing}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Script Section: Hook */}
              <div className="space-y-2 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Opening Hook (0:00 – 0:45)
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">Crucial for 30s Retention</span>
                </div>
                <textarea
                  rows={3}
                  value={formData.fullScript?.hook || ''}
                  onChange={(e) => handleHookChange(e.target.value)}
                  placeholder="Opening hook lines with auditory cue and narrative anchor..."
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs font-mono focus:outline-none focus:border-amber-400 leading-relaxed resize-y"
                />
              </div>

              {/* Script Sections: Acts / Scenes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Script Narrative Sections & Cues
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Scene Beat</span>
                  </button>
                </div>

                {(formData.fullScript?.sections || []).map((sec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={sec.heading}
                        onChange={(e) => handleSectionHeadingChange(idx, e.target.value)}
                        className="flex-1 font-bold text-xs text-amber-300 bg-transparent border-b border-zinc-700 focus:border-amber-400 focus:outline-none py-1"
                      />
                      {(formData.fullScript?.sections?.length || 0) > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(idx)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                          title="Remove section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={4}
                      value={sec.content}
                      onChange={(e) => handleSectionContentChange(idx, e.target.value)}
                      placeholder="Script dialogue, narration, and [visual cues]..."
                      className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 text-xs font-mono focus:outline-none focus:border-amber-400 leading-relaxed resize-y"
                    />
                  </div>
                ))}
              </div>

              {/* Script Section: Call To Action (CTA) */}
              <div className="space-y-2 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" />
                  Outro & Call to Action (CTA)
                </label>
                <textarea
                  rows={2}
                  value={formData.fullScript?.cta || ''}
                  onChange={(e) => handleCtaChange(e.target.value)}
                  placeholder="Closing sign-off, comment question, and next episode card..."
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs font-mono focus:outline-none focus:border-amber-400 leading-relaxed resize-y"
                />
              </div>

              {/* Script Gate Action Bar */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">
                    Script Gate Verification
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Approve full script text or request revisions before storyboard/thumbnail handoff
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRevisionForm(true)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 transition-colors cursor-pointer"
                  >
                    Request Script Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleDirectApprove}
                    className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Script Gate</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THUMBNAIL APPROVAL (SIDE-BY-SIDE + GEMINI SCORING + WINNER) */}
          {activeTab === 'thumbnail' && (
            <div className="space-y-6">
              {/* Header with Gemini Score action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    A/B/C Thumbnail Variants Comparison
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Pick a winner, evaluate AI click-appeal scores (1–10), or request new variants
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleScoreThumbnailVariants}
                    disabled={isScoringThumbnails}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isScoringThumbnails ? 'animate-spin' : ''}`} />
                    <span>
                      {isScoringThumbnails ? 'Scoring Variants...' : 'Score Variants 1–10 (Gemini)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Side-by-Side Variants Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {formData.thumbnailVariants.map((variant) => (
                  <div
                    key={variant.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                      variant.isSelected
                        ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/40 shadow-xl'
                        : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Thumbnail Preview Banner */}
                      <div
                        className={`w-full h-36 rounded-xl bg-gradient-to-br ${variant.colorGradient} p-3 flex flex-col justify-between relative border border-white/10 overflow-hidden shadow-inner`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30">
                            CTR: {variant.predictedCtr}
                          </span>
                          {variant.isSelected && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                              <Award className="w-3 h-3" />
                              Winner
                            </span>
                          )}
                        </div>

                        <div className="bg-black/70 backdrop-blur-md p-2 rounded-lg border border-white/15">
                          <p className="text-xs font-black text-white leading-tight line-clamp-2">
                            {variant.label}
                          </p>
                        </div>
                      </div>

                      {/* Click Appeal Score (Gemini 1-10) */}
                      <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Click Appeal
                          </span>
                          <span className="font-mono font-black text-amber-400 text-sm">
                            {variant.clickAppealScore !== undefined
                              ? `${variant.clickAppealScore} / 10`
                              : 'Not scored yet'}
                          </span>
                        </div>
                        {variant.clickAppealCritique && (
                          <p className="text-[11px] text-zinc-400 leading-tight">
                            {variant.clickAppealCritique}
                          </p>
                        )}
                      </div>

                      {/* Concept summary */}
                      <div className="space-y-1 text-xs">
                        <span className="text-[11px] font-bold text-zinc-300 block">
                          Visual Hook Concept:
                        </span>
                        <p className="text-zinc-400 line-clamp-3 leading-snug">
                          {variant.concept}
                        </p>
                      </div>

                      {/* Winner Timestamp if picked */}
                      {variant.selectedAt && (
                        <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Winner picked: {variant.selectedAt}</span>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        Contrast: {variant.contrastScore}
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePickWinner(variant.id)}
                        className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          variant.isSelected
                            ? 'bg-amber-400 text-zinc-950 shadow-md'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                        }`}
                      >
                        {variant.isSelected ? 'Winner Selected' : 'Pick as Winner'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Thumbnail Gate Action Bar */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">
                    Thumbnail Gate Verification
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Validate that high-CTR winner is picked before moving to 4K render
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRevisionForm(true)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 transition-colors cursor-pointer"
                  >
                    Request New Variants
                  </button>
                  <button
                    type="button"
                    onClick={handleDirectApprove}
                    className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Thumbnail Gate</span>
                  </button>
                </div>
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

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleStartRenderQueue}
                    disabled={isRenderingSimulation || formData.renderStatus.progress === 100}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 ${isRenderingSimulation ? 'animate-spin' : ''}`} />
                    <span>{isRenderingSimulation ? 'Rendering 4K Queue...' : 'Run 4K Export Pipeline'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetRenderProgress(100)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-zinc-700 cursor-pointer"
                  >
                    Instant 100%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetRenderProgress(0)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-400 cursor-pointer"
                  >
                    Reset (0%)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PUBLISH CHECKLIST */}
          {activeTab === 'publish' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    Multi-Platform Syndication Checklist
                  </h3>
                  <p className="text-xs text-zinc-400">
                    YouTube check is mandatory before this episode can move to Live
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleAllPublish(true)}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                  >
                    Check All Done
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllPublish(false)}
                    className="min-h-[36px] px-2 py-1 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                  >
                    Clear
                  </button>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/25">
                    {completedChecklistCount} / 5 Ready
                  </span>
                </div>
              </div>

              {/* YouTube Mandatory Warning if unchecked */}
              {!formData.publishChecklist?.youtube && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-3 text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Mandatory Gate:</strong> YouTube primary release must be checked off with timestamps before advancing to Live.
                  </span>
                </div>
              )}

              {/* Checklist items */}
              <div className="space-y-2.5">
                {[
                  {
                    key: 'youtube' as const,
                    name: 'YouTube Primary Release',
                    desc: '4K video file, chapter timestamps, tags, custom thumbnail, pinned discussion comment.',
                    icon: '▶️',
                    isMandatory: true,
                  },
                  {
                    key: 'instagram' as const,
                    name: 'Instagram Reel & Carousel',
                    desc: '9:16 vertical hook teaser, 6-slide story carousel, Link in Bio updated.',
                    icon: '📸',
                    isMandatory: false,
                  },
                  {
                    key: 'facebook' as const,
                    name: 'Facebook Watch & Group Post',
                    desc: 'Longform video upload to channel page with interactive poll for viewers.',
                    icon: '👥',
                    isMandatory: false,
                  },
                  {
                    key: 'x' as const,
                    name: 'X (Twitter) Video Thread',
                    desc: '60-second highlight clip with 4-tweet historical/technical breakdown thread.',
                    icon: '✖️',
                    isMandatory: false,
                  },
                  {
                    key: 'linkedin' as const,
                    name: 'LinkedIn Behind-the-Scenes',
                    desc: 'Documentary production case study / storytelling craft article.',
                    icon: '💼',
                    isMandatory: false,
                  },
                ].map((item) => {
                  const isChecked = !!formData.publishChecklist?.[item.key];
                  const timestamp = formData.publishChecklistTimestamps?.[item.key];

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
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-bold block ${
                                isChecked ? 'text-emerald-300' : 'text-zinc-200'
                              }`}
                            >
                              {item.name}
                            </span>
                            {item.isMandatory && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                                Required for Live
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-zinc-400 line-clamp-1">{item.desc}</span>
                          {timestamp && (
                            <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">
                              ✓ Checked: {timestamp}
                            </span>
                          )}
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
          <div className="flex items-center gap-2">
            {confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  return;
                }
                onDelete(formData.id);
                onClose();
              }}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                confirmDelete
                  ? 'bg-rose-600 hover:bg-rose-500 text-white font-bold animate-pulse'
                  : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>{confirmDelete ? 'Click to Confirm Delete' : 'Delete Episode'}</span>
            </button>
          </div>

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
                onClick={async () => {
                  const success = await onMoveStage(formData.id, nextStage.id);
                  if (success) {
                    onClose();
                  }
                }}
                disabled={
                  (isGated && !isGateApproved) ||
                  (nextStage.id === 'live' && !formData.publishChecklist?.youtube)
                }
                title={
                  isGated && !isGateApproved
                    ? `${currentStageInfo?.title || 'Stage'} gate must be approved before advancing`
                    : nextStage.id === 'live' && !formData.publishChecklist?.youtube
                    ? 'YouTube Primary Release must be checked in the Publish checklist before going Live'
                    : `Advance to ${nextStage.title}`
                }
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  (isGated && !isGateApproved) ||
                  (nextStage.id === 'live' && !formData.publishChecklist?.youtube)
                    ? 'bg-zinc-800/80 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20 active:scale-95'
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
