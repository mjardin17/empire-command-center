import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileCode,
  FileJson,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { importApexScannerFeed, validateAndParseApexJson } from '../services/api';

interface ApexImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

const SAMPLE_APEX_JSON = JSON.stringify(
  [
    {
      id: 'apex-901',
      title: 'The Anvil of Hephaestus: Secrets of the Underground Bronze Age Automata',
      source: 'APEX Archaeology Scanner • Hellenic Depth Index',
      timestamp: '12 mins ago',
      channel: 'little_olympus',
      synopsis:
        'New excavations in Lemnos reveal intricate copper-gear workshop believed to be the mythic inspiration for Hephaestus’s mechanical tripods. High kid fascination score.',
      viralScore: 96,
      tags: ['Hephaestus', 'Bronze Age', 'Robots in Myth'],
    },
    {
      id: 'apex-902',
      title: 'Voltron vs Golion: The Unseen Japanese Cut That Got Censored on American Television',
      source: 'APEX Anime Archive • 80s Broadcast Census',
      timestamp: '25 mins ago',
      channel: 'iron_legends',
      synopsis:
        'Archival tapes show 42 scenes cut by World Events Productions due to dark violence and mecha destruction. Nostalgia retro audience goldmine.',
      viralScore: 93,
      tags: ['Voltron', 'GoLion', 'Censorship', '80s Mecha'],
    },
    {
      id: 'apex-903',
      title: 'The Cataphract Charge: How Rome’s Heavy Cavalry Broke the Sasanian Border Forts',
      source: 'APEX Military History • Euphrates Battlefield Survey',
      timestamp: '40 mins ago',
      channel: 'empire_decoded',
      synopsis:
        '3D LiDAR mapping of Dura-Europos confirms Roman soldiers retrofitted armor to match Persian cataphracts. Stunning tactical battle breakdown potential.',
      viralScore: 91,
      tags: ['Roman Army', 'Sasanian Empire', 'Cavalry Tactics'],
    },
  ],
  null,
  2
);

export const ApexImportModal: React.FC<ApexImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validItemCount, setValidItemCount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleTextChange = (text: string) => {
    setJsonText(text);
    if (!text.trim()) {
      setValidationError(null);
      setValidItemCount(null);
      return;
    }
    const check = validateAndParseApexJson(text);
    if (check.success) {
      setValidationError(null);
      setValidItemCount(check.items.length);
    } else {
      setValidationError(check.error);
      setValidItemCount(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleTextChange(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    handleTextChange(SAMPLE_APEX_JSON);
  };

  const handleConfirmImport = async () => {
    if (!jsonText.trim()) return;
    setIsProcessing(true);
    setValidationError(null);

    try {
      const result = await importApexScannerFeed(jsonText);
      onImportSuccess(result.added.length);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to import scanner JSON');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <FileJson className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                Import from APEX Scanner
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  JSON Ingestion
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Paste scanner payload or upload file • Expects <code className="text-amber-300">[{'{id, title, source, timestamp, channel}'}]</code>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Upload file & Load sample buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <label className="min-h-[36px] px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 font-semibold cursor-pointer flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .json File</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleLoadSample}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample APEX Scanner JSON</span>
            </button>
          </div>

          {validItemCount !== null && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Valid: {validItemCount} trend dossier{validItemCount !== 1 ? 's' : ''} ready
            </span>
          )}
        </div>

        {/* JSON Editor Input */}
        <div className="flex-1 min-h-[220px] flex flex-col space-y-1.5">
          <textarea
            value={jsonText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Paste your APEX scanner JSON here... e.g.
[
  {
    &quot;title&quot;: &quot;Episode Topic Lead&quot;,
    &quot;source&quot;: &quot;APEX Crawler v4&quot;,
    &quot;channel&quot;: &quot;little_olympus&quot;
  }
]"
            className="w-full flex-1 p-3.5 rounded-2xl bg-zinc-950 font-mono text-xs text-zinc-200 border border-zinc-800 focus:outline-none focus:border-amber-400 leading-relaxed resize-none selection:bg-amber-500/30"
          />
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Invalid APEX Scanner Input:</span>
              <p className="text-rose-200/90">{validationError}</p>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <span className="text-[11px] text-zinc-500">
            Valid channels: <code className="text-zinc-400">little_olympus</code>, <code className="text-zinc-400">iron_legends</code>, <code className="text-zinc-400">empire_decoded</code>
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={!validItemCount || isProcessing}
              className={`min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                validItemCount && !isProcessing
                  ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-800 text-zinc-600 border border-zinc-800 cursor-not-allowed'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'Ingesting...'
                  : `Ingest ${validItemCount || 0} Trends to Feed`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
