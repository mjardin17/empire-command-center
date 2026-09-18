import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Compass,
  DollarSign,
  Layers,
  Sparkles,
  TrendingUp,
  X,
  Youtube,
} from 'lucide-react';
import { ApexImportModal } from './components/ApexImportModal';
import { EpisodeDetailModal } from './components/EpisodeDetailModal';
import { Header } from './components/Header';
import { IntelFeed } from './components/IntelFeed';
import { NewEpisodeModal } from './components/NewEpisodeModal';
import { PipelineBoard } from './components/PipelineBoard';
import { RevenueSection } from './components/RevenueSection';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { WeeklyTargetTracker } from './components/WeeklyTargetTracker';
import { YouTubeAnalyticsSection } from './components/YouTubeAnalyticsSection';
import {
  createCustomEpisode,
  createEpisodeFromIntel,
  deleteEpisode,
  fetchEpisodes,
  fetchIntelFeed,
  moveEpisodeStage,
  requestNotificationPermission,
  resetToDefaults,
  saveEpisode,
  setGateApproval,
} from './services/api';
import { ChannelId, Episode, IntelItem, StageId, STAGES } from './types';

export default function App() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [intelItems, setIntelItems] = useState<IntelItem[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelId | 'all'>('all');
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isApexImportOpen, setIsApexImportOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Section view selector: 'all' | 'pipeline' | 'analytics' | 'revenue' | 'intel'
  const [activeSectionView, setActiveSectionView] = useState<
    'all' | 'pipeline' | 'analytics' | 'revenue' | 'intel'
  >('all');

  // Browser notification permission state
  const [notificationState, setNotificationState] = useState<string>('default');
  const [dismissNotificationBanner, setDismissNotificationBanner] = useState<boolean>(false);

  const addToast = (type: 'success' | 'warning' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial load
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [loadedEpisodes, loadedIntel] = await Promise.all([
          fetchEpisodes(),
          fetchIntelFeed(),
        ]);
        setEpisodes(loadedEpisodes);
        setIntelItems(loadedIntel);
      } catch (err) {
        console.error('Failed to load initial data:', err);
        addToast('warning', 'Failed to read stored episodes. Loaded defaults.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationState(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationState('granted');
      addToast('success', 'Browser notifications enabled for gate approvals!');
    } else {
      setNotificationState('denied');
      addToast('warning', 'Notification permission not granted.');
    }
  };

  // Gate Approval Handler
  const handleApproveGate = async (episodeId: string, stage: StageId) => {
    try {
      const updated = await setGateApproval(episodeId, stage, true);
      setEpisodes((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      if (selectedEpisode?.id === updated.id) {
        setSelectedEpisode(updated);
      }
      const stageName = STAGES.find((s) => s.id === stage)?.title || stage;
      addToast('success', `Gate Approved: "${updated.title.slice(0, 30)}..." cleared for ${stageName}.`);
    } catch (err) {
      console.error(err);
      addToast('warning', 'Failed to approve gate.');
    }
  };

  // Gate Request Changes Handler
  const handleRequestChanges = async (episodeId: string, stage: StageId, notes?: string) => {
    try {
      const updated = await setGateApproval(episodeId, stage, false, notes);
      setEpisodes((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      if (selectedEpisode?.id === updated.id) {
        setSelectedEpisode(updated);
      }
      const stageName = STAGES.find((s) => s.id === stage)?.title || stage;
      addToast('warning', `Changes requested for ${stageName}. Advance lock engaged.`);
    } catch (err) {
      console.error(err);
      addToast('warning', 'Failed to record change request.');
    }
  };

  // Move Episode Stage Handler with Gate Check
  const handleMoveStage = async (episodeId: string, targetStage: StageId): Promise<boolean> => {
    try {
      const result = await moveEpisodeStage(episodeId, targetStage);
      if (!result.success) {
        addToast('warning', result.error || 'Cannot move episode.');
        return false;
      }

      if (result.episode) {
        const updated = result.episode;
        setEpisodes((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        if (selectedEpisode?.id === updated.id) {
          setSelectedEpisode(updated);
        }
        const targetTitle = STAGES.find((s) => s.id === targetStage)?.title;
        addToast('success', `Moved to ${targetTitle}: "${updated.title.slice(0, 30)}..."`);
      }
      return true;
    } catch (err) {
      console.error(err);
      addToast('warning', 'Failed to change stage.');
      return false;
    }
  };

  // Save Episode updates
  const handleSaveEpisode = async (updated: Episode) => {
    try {
      const saved = await saveEpisode(updated);
      setEpisodes((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
      setSelectedEpisode(saved);
      addToast('success', 'Episode details saved.');
    } catch (err) {
      console.error(err);
      addToast('warning', 'Failed to save episode.');
    }
  };

  // Delete Episode
  const handleDeleteEpisode = async (episodeId: string) => {
    try {
      await deleteEpisode(episodeId);
      setEpisodes((prev) => prev.filter((e) => e.id !== episodeId));
      if (selectedEpisode?.id === episodeId) {
        setSelectedEpisode(null);
      }
      addToast('info', 'Episode removed from pipeline.');
    } catch (err) {
      console.error(err);
      addToast('warning', 'Failed to delete episode.');
    }
  };

  // Create Episode From Intel Feed
  const handleMakeEpisodeFromIntel = async (intelId: string) => {
    try {
      const { episode, updatedIntel } = await createEpisodeFromIntel(intelId);
      setEpisodes((prev) => [episode, ...prev]);
      setIntelItems(updatedIntel);
      addToast(
        'success',
        `New episode created in Ideas: "${episode.title.slice(0, 32)}..."`
      );
    } catch (err) {
      console.error(err);
      addToast('warning', 'Failed to convert intel into episode.');
    }
  };

  // Create Manual Episode
  const handleCreateCustom = async (data: Partial<Episode>) => {
    try {
      const created = await createCustomEpisode(data);
      setEpisodes((prev) => [created, ...prev]);
      addToast('success', `Added to Ideas: "${created.title.slice(0, 32)}..."`);
    } catch (err) {
      console.error(err);
      addToast('warning', 'Failed to create episode.');
    }
  };

  // Reset to default sample episodes
  const handleResetData = async () => {
    try {
      const { episodes: defEpisodes, intel: defIntel } = await resetToDefaults();
      setEpisodes(defEpisodes);
      setIntelItems(defIntel);
      setSelectedEpisode(null);
      addToast('info', 'Reset factory board to default sample episodes & research leads.');
    } catch (err) {
      console.error(err);
      addToast('warning', 'Failed to reset data.');
    }
  };

  // Add custom research item to intel feed
  const handleAddCustomIntel = (item: Omit<IntelItem, 'id' | 'timestamp'>) => {
    const newItem: IntelItem = {
      ...item,
      id: `intel-${Date.now()}`,
      timestamp: 'Just now',
    };
    const updated = [newItem, ...intelItems];
    setIntelItems(updated);
    try {
      localStorage.setItem('empire_command_intel_v1', JSON.stringify(updated));
    } catch (e) {}
    addToast('success', `Added "${item.title.slice(0, 30)}..." to Intel Feed.`);
  };

  // Handle APEX import success
  const handleApexImportSuccess = async (count: number) => {
    const freshIntel = await fetchIntelFeed();
    setIntelItems(freshIntel);
    addToast('success', `Successfully imported ${count} research leads from APEX Scanner!`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950">
      {/* Top sticky navigation and channel filter */}
      <Header
        selectedChannel={selectedChannel}
        onSelectChannel={setSelectedChannel}
        episodes={episodes}
        onNewEpisode={() => setIsNewModalOpen(true)}
        onResetData={handleResetData}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-7">
        {/* BROWSER NOTIFICATIONS PERMISSION BANNER */}
        {notificationState === 'default' && !dismissNotificationBanner && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-950/40 border border-amber-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start sm:items-center gap-3">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <Bell className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-zinc-100">
                  Enable Browser Push Notifications for Approval Gates
                </h4>
                <p className="text-xs text-zinc-400">
                  Receive instant alerts whenever an episode reaches Script, Thumbnail, Render, or Publish gates.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Allow Notifications</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissNotificationBanner(true)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SECTION NAVIGATION TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-800/80">
          <button
            type="button"
            onClick={() => setActiveSectionView('all')}
            className={`min-h-[44px] px-4 py-2 border-b-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
              activeSectionView === 'all'
                ? 'border-amber-400 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Full Dashboard Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSectionView('pipeline')}
            className={`min-h-[44px] px-4 py-2 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
              activeSectionView === 'pipeline'
                ? 'border-amber-400 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Pipeline Board ({episodes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSectionView('analytics')}
            className={`min-h-[44px] px-4 py-2 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
              activeSectionView === 'analytics'
                ? 'border-amber-400 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Youtube className="w-4 h-4 text-red-400" />
            <span>YouTube Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSectionView('revenue')}
            className={`min-h-[44px] px-4 py-2 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
              activeSectionView === 'revenue'
                ? 'border-amber-400 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Revenue vs Targets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSectionView('intel')}
            className={`min-h-[44px] px-4 py-2 border-b-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
              activeSectionView === 'intel'
                ? 'border-amber-400 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Intel & APEX Leads ({intelItems.length})</span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-zinc-400">
                Initializing Empire Command Center...
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* 1. WEEKLY TARGET TRACKER (always shown or on pipeline) */}
            {(activeSectionView === 'all' || activeSectionView === 'pipeline') && (
              <WeeklyTargetTracker
                episodes={episodes}
                onSelectEpisode={(ep) => setSelectedEpisode(ep)}
              />
            )}

            {/* 2. PRODUCTION PIPELINE KANBAN BOARD */}
            {(activeSectionView === 'all' || activeSectionView === 'pipeline') && (
              <PipelineBoard
                episodes={episodes}
                selectedChannel={selectedChannel}
                onSelectEpisode={(ep) => setSelectedEpisode(ep)}
                onApproveGate={handleApproveGate}
                onRequestChanges={handleRequestChanges}
                onMoveStage={handleMoveStage}
                onNewEpisode={() => setIsNewModalOpen(true)}
              />
            )}

            {/* 3. YOUTUBE ANALYTICS (PER-CHANNEL VIA YOUTUBE DATA API) */}
            {(activeSectionView === 'all' || activeSectionView === 'analytics') && (
              <YouTubeAnalyticsSection
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            )}

            {/* 4. REVENUE VS TARGETS (MONTHLY TRACKER & DAILY RUN RATE) */}
            {(activeSectionView === 'all' || activeSectionView === 'revenue') && (
              <RevenueSection />
            )}

            {/* 5. INTEL & APEX SCANNER FEED */}
            {(activeSectionView === 'all' || activeSectionView === 'intel') && (
              <IntelFeed
                intelItems={intelItems}
                selectedChannel={selectedChannel}
                onMakeEpisode={handleMakeEpisodeFromIntel}
                onAddCustomIntel={handleAddCustomIntel}
                onOpenApexImport={() => setIsApexImportOpen(true)}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-4 px-4 sm:px-8 text-center text-xs text-zinc-600">
        <p className="flex items-center justify-center gap-2 flex-wrap font-mono">
          <span>Empire Command Center</span>
          <span>•</span>
          <span>Little Olympus 🏛️</span>
          <span>•</span>
          <span>Iron Legends 🤖</span>
          <span>•</span>
          <span>Empire Decoded 📜</span>
          <span>•</span>
          <span>Gemini & YouTube Data API Integrated</span>
        </p>
      </footer>

      {/* MODALS */}
      {selectedEpisode && (
        <EpisodeDetailModal
          episode={selectedEpisode}
          onClose={() => setSelectedEpisode(null)}
          onSave={handleSaveEpisode}
          onApproveGate={handleApproveGate}
          onRequestChanges={handleRequestChanges}
          onMoveStage={handleMoveStage}
          onDelete={handleDeleteEpisode}
        />
      )}

      <NewEpisodeModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateCustom}
        defaultChannel={selectedChannel !== 'all' ? selectedChannel : 'little_olympus'}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onResetFactoryData={handleResetData}
      />

      <ApexImportModal
        isOpen={isApexImportOpen}
        onClose={() => setIsApexImportOpen(false)}
        onImportSuccess={handleApexImportSuccess}
      />

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
