import React, { useEffect, useState } from 'react';
import { EpisodeDetailModal } from './components/EpisodeDetailModal';
import { Header } from './components/Header';
import { IntelFeed } from './components/IntelFeed';
import { NewEpisodeModal } from './components/NewEpisodeModal';
import { PipelineBoard } from './components/PipelineBoard';
import { ToastContainer, ToastMessage } from './components/Toast';
import { WeeklyTargetTracker } from './components/WeeklyTargetTracker';
import {
  createCustomEpisode,
  createEpisodeFromIntel,
  deleteEpisode,
  fetchEpisodeById,
  fetchEpisodes,
  fetchIntelFeed,
  moveEpisodeStage,
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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

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
  const handleMoveStage = async (episodeId: string, targetStage: StageId) => {
    try {
      const result = await moveEpisodeStage(episodeId, targetStage);
      if (!result.success) {
        addToast('warning', result.error || 'Cannot move episode.');
        return;
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
    } catch (err) {
      console.error(err);
      addToast('warning', 'Failed to change stage.');
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-zinc-950">
      {/* Top sticky navigation and channel filter */}
      <Header
        selectedChannel={selectedChannel}
        onSelectChannel={setSelectedChannel}
        episodes={episodes}
        onNewEpisode={() => setIsNewModalOpen(true)}
        onResetData={handleResetData}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
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
          <>
            {/* 1. WEEKLY TARGET TRACKER */}
            <WeeklyTargetTracker
              episodes={episodes}
              onSelectEpisode={(ep) => setSelectedEpisode(ep)}
            />

            {/* 2. PRODUCTION PIPELINE KANBAN BOARD */}
            <PipelineBoard
              episodes={episodes}
              selectedChannel={selectedChannel}
              onSelectEpisode={(ep) => setSelectedEpisode(ep)}
              onApproveGate={handleApproveGate}
              onRequestChanges={handleRequestChanges}
              onMoveStage={handleMoveStage}
              onNewEpisode={() => setIsNewModalOpen(true)}
            />

            {/* 3. INTEL & RESEARCH FEED */}
            <IntelFeed
              intelItems={intelItems}
              selectedChannel={selectedChannel}
              onMakeEpisode={handleMakeEpisodeFromIntel}
              onAddCustomIntel={handleAddCustomIntel}
            />
          </>
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
          <span>Persistent Factory State</span>
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

      {/* TOAST CONTAINER */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
