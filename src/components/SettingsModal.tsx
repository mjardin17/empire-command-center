import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  Key,
  RotateCcw,
  Save,
  ShieldCheck,
  X,
  Youtube,
} from 'lucide-react';
import {
  getSavedYouTubeApiKey,
  notifyApprovalNeeded,
  requestNotificationPermission,
  resetToDefaults,
  saveYouTubeApiKey,
} from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetFactoryData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetFactoryData,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getSavedYouTubeApiKey());
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    saveYouTubeApiKey(apiKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      setNotificationPermission(res);
      if (res === 'granted') {
        notifyApprovalNeeded('Zeus vs Typhon', 'Script Approval Gate');
      }
    }
  };

  const handleTestNotification = () => {
    notifyApprovalNeeded('Go-Bots Lost Retrospective', 'Thumbnail Approval Gate');
  };

  const handleFactoryResetClick = async () => {
    if (
      window.confirm(
        'Reset Empire Command Center to factory defaults? This restores default episodes, gates, and seed intel.'
      )
    ) {
      await resetToDefaults();
      onResetFactoryData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Key className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100">
                Command Center Settings
              </h2>
              <p className="text-xs text-zinc-400">
                API integrations & approval pings configuration
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

        {/* Section 1: YouTube Data API Key */}
        <form onSubmit={handleSaveApiKey} className="space-y-3 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-400" />
              <h3 className="text-xs sm:text-sm font-bold text-zinc-100">
                YouTube Data API v3 Key
              </h3>
            </div>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Get API Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Stored locally in your browser (<code className="text-zinc-300">localStorage</code>). Used to query real-time subscriber counts and total video impressions without inventing data.
          </p>

          <div className="flex gap-2">
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Key</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Section 2: Browser Approval Notifications */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-bold text-zinc-100">
                Gate Approval Pings (Browser Notifications)
              </h3>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              Status: {notificationPermission}
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Sends an OS notification whenever an episode advances into an approval gate: <span className="text-amber-300">"Approval needed: &lt;title&gt; (&lt;stage&gt;)"</span>.
          </p>

          <div className="flex items-center gap-2 pt-1">
            {notificationPermission !== 'granted' ? (
              <button
                type="button"
                onClick={handleRequestNotification}
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Approval Notifications</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTestNotification}
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-emerald-400" />
                <span>Send Test Approval Ping</span>
              </button>
            )}
          </div>
        </div>

        {/* Section 3: Reset Data */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-zinc-200">Reset Production Factory</h4>
            <p className="text-[11px] text-zinc-500">
              Restore the initial 3 multi-channel episodes and market intel leads.
            </p>
          </div>
          <button
            type="button"
            onClick={handleFactoryResetClick}
            className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
