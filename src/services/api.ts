import { INITIAL_EPISODES, INITIAL_INTEL_ITEMS } from '../data/seedData';
import { Episode, IntelItem, StageGate, StageId, STAGES } from '../types';

const STORAGE_KEY_EPISODES = 'empire_command_episodes_v1';
const STORAGE_KEY_INTEL = 'empire_command_intel_v1';

export function getMondayOfCurrentWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  // day: 0 is Sunday, 1 is Monday ... 6 is Saturday
  // In Monday-first week: if day === 0 (Sunday), diff is -6 days. Otherwise diff is 1 - day.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString('en-US', options)} – ${sunday.toLocaleDateString('en-US', options)}`;
}

export function formatTimestamp(date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }) + ' • ' + date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function loadEpisodesFromStorage(): Episode[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EPISODES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_EPISODES, JSON.stringify(INITIAL_EPISODES));
      return INITIAL_EPISODES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load episodes from localStorage:', err);
    return INITIAL_EPISODES;
  }
}

function saveEpisodesToStorage(episodes: Episode[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EPISODES, JSON.stringify(episodes));
  } catch (err) {
    console.error('Failed to save episodes to localStorage:', err);
  }
}

function loadIntelFromStorage(): IntelItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INTEL);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_INTEL, JSON.stringify(INITIAL_INTEL_ITEMS));
      return INITIAL_INTEL_ITEMS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load intel from localStorage:', err);
    return INITIAL_INTEL_ITEMS;
  }
}

function saveIntelToStorage(intel: IntelItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_INTEL, JSON.stringify(intel));
  } catch (err) {
    console.error('Failed to save intel to localStorage:', err);
  }
}

// ==================== ASYNC API CLIENT INTERFACE ====================
// This structured API interface allows replacing the backend implementation
// with fetch('/api/episodes') without changing any UI components.

export async function fetchEpisodes(): Promise<Episode[]> {
  // Simulate standard network delay for realistic responsiveness
  await new Promise((resolve) => setTimeout(resolve, 30));
  return loadEpisodesFromStorage();
}

export async function fetchEpisodeById(id: string): Promise<Episode | null> {
  const episodes = await fetchEpisodes();
  return episodes.find((ep) => ep.id === id) || null;
}

export async function saveEpisode(episode: Episode): Promise<Episode> {
  const episodes = await fetchEpisodes();
  const index = episodes.findIndex((ep) => ep.id === episode.id);
  const now = new Date().toISOString();
  
  const updatedEpisode: Episode = {
    ...episode,
    updatedAt: now,
  };

  if (index >= 0) {
    episodes[index] = updatedEpisode;
  } else {
    episodes.unshift(updatedEpisode);
  }

  saveEpisodesToStorage(episodes);
  return updatedEpisode;
}

export async function deleteEpisode(id: string): Promise<boolean> {
  const episodes = await fetchEpisodes();
  const filtered = episodes.filter((ep) => ep.id !== id);
  saveEpisodesToStorage(filtered);
  return true;
}

export async function moveEpisodeStage(
  id: string,
  targetStage: StageId
): Promise<{ success: boolean; episode?: Episode; error?: string }> {
  const episodes = await fetchEpisodes();
  const episode = episodes.find((ep) => ep.id === id);

  if (!episode) {
    return { success: false, error: 'Episode not found' };
  }

  const currentStageInfo = STAGES.find((s) => s.id === episode.stage);
  const targetStageInfo = STAGES.find((s) => s.id === targetStage);

  if (!currentStageInfo || !targetStageInfo) {
    return { success: false, error: 'Invalid stage specified' };
  }

  // Check gate approval if moving FORWARD
  if (targetStageInfo.index > currentStageInfo.index) {
    // Check if the current stage has a required gate
    if (currentStageInfo.requiresGate) {
      const currentGate = episode.gates[episode.stage];
      if (!currentGate?.isApproved) {
        return {
          success: false,
          error: `Approval Gate locked: You must approve "${currentStageInfo.title}" before advancing to "${targetStageInfo.title}".`,
        };
      }
    }
  }

  const now = new Date().toISOString();
  const updatedGates: Record<StageId, StageGate> = { ...episode.gates };

  // If moving into Live, mark live timestamp
  let liveAt = episode.liveAt;
  if (targetStage === 'live') {
    liveAt = now;
    updatedGates.live = {
      isApproved: true,
      approvedAt: formatTimestamp(),
      approvedBy: 'Automated Release System',
    };
  } else if (episode.stage === 'live') {
    // If moving back out of live
    liveAt = undefined;
  }

  const updatedEpisode: Episode = {
    ...episode,
    stage: targetStage,
    gates: updatedGates,
    liveAt,
    updatedAt: now,
  };

  await saveEpisode(updatedEpisode);
  return { success: true, episode: updatedEpisode };
}

export async function setGateApproval(
  id: string,
  stage: StageId,
  isApproved: boolean,
  notes?: string
): Promise<Episode> {
  const episodes = await fetchEpisodes();
  const episode = episodes.find((ep) => ep.id === id);

  if (!episode) {
    throw new Error('Episode not found');
  }

  const currentGate = episode.gates[stage] || { isApproved: false };
  const updatedGates: Record<StageId, StageGate> = {
    ...episode.gates,
    [stage]: {
      ...currentGate,
      isApproved,
      approvedAt: isApproved ? formatTimestamp() : undefined,
      approvedBy: isApproved ? 'Command Director' : undefined,
      notes: notes !== undefined ? notes : currentGate.notes,
    },
  };

  const updatedEpisode: Episode = {
    ...episode,
    gates: updatedGates,
    updatedAt: new Date().toISOString(),
  };

  return saveEpisode(updatedEpisode);
}

export async function fetchIntelFeed(): Promise<IntelItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 20));
  return loadIntelFromStorage();
}

export async function createEpisodeFromIntel(
  intelId: string
): Promise<{ episode: Episode; updatedIntel: IntelItem[] }> {
  const allIntel = await fetchIntelFeed();
  const intel = allIntel.find((i) => i.id === intelId);

  if (!intel) {
    throw new Error('Intel item not found');
  }

  // Create episode in Ideas stage
  const defaultGateObj: Record<StageId, StageGate> = {
    ideas: { isApproved: true },
    script: { isApproved: false },
    thumbnail: { isApproved: false },
    render: { isApproved: false },
    publish: { isApproved: false },
    live: { isApproved: false },
  };

  const newEpisode: Episode = {
    id: `ep-${Date.now().toString().slice(-6)}`,
    channelId: intel.channelTarget,
    title: intel.title,
    stage: 'ideas',
    gates: defaultGateObj,
    scriptStatus: {
      wordCount: 0,
      durationMinutes: 12,
      hookSummary: intel.synopsis,
      outline: `1. Hook: ${intel.title}\n2. Deep Dive\n3. Climax & Synthesis\n4. Outro & Call To Action`,
      scriptReviewState: 'Drafting',
    },
    thumbnailVariants: [
      {
        id: 'var-1',
        label: 'Variant A — Cinematic Main Subject Hero Shot',
        concept: `High contrast subject with bold neon title text hook: "${intel.tags[0] || 'REVEALED'}"`,
        contrastScore: '93% High Contrast',
        predictedCtr: '8.7%',
        isSelected: true,
        colorGradient: 'from-amber-600 via-zinc-900 to-black',
      },
      {
        id: 'var-2',
        label: 'Variant B — Dramatic Tension / Shock Factor',
        concept: 'High saturation reaction or mystery artifact with yellow warning accents',
        contrastScore: '86% Bold Contrast',
        predictedCtr: '7.9%',
        isSelected: false,
        colorGradient: 'from-red-600 via-purple-950 to-black',
      },
      {
        id: 'var-3',
        label: 'Variant C — Historical / Mechanical Blueprint',
        concept: 'Detailed schematic lines overlaying high resolution rendered key art',
        contrastScore: '82% Technical Clean',
        predictedCtr: '7.2%',
        isSelected: false,
        colorGradient: 'from-cyan-600 via-slate-900 to-black',
      },
    ],
    renderStatus: {
      progress: 0,
      resolution: '4K UHD (3840x2160)',
      framerate: '60 FPS',
      codec: 'ProRes 422HQ',
      status: 'Idle',
      renderTimeEst: '30 minutes',
    },
    publishChecklist: {
      youtube: false,
      instagram: false,
      facebook: false,
      x: false,
      linkedin: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceIntelTitle: intel.title,
    sourceIntelName: intel.source,
  };

  // Mark intel as used
  const updatedIntel = allIntel.map((item) =>
    item.id === intelId ? { ...item, isUsed: true } : item
  );
  saveIntelToStorage(updatedIntel);

  const savedEpisode = await saveEpisode(newEpisode);
  return { episode: savedEpisode, updatedIntel };
}

export async function createCustomEpisode(data: Partial<Episode>): Promise<Episode> {
  const now = new Date().toISOString();
  const defaultGateObj: Record<StageId, StageGate> = {
    ideas: { isApproved: true },
    script: { isApproved: false },
    thumbnail: { isApproved: false },
    render: { isApproved: false },
    publish: { isApproved: false },
    live: { isApproved: false },
  };

  const newEpisode: Episode = {
    id: `ep-${Date.now().toString().slice(-6)}`,
    channelId: data.channelId || 'little_olympus',
    title: data.title || 'Untitled Production',
    stage: 'ideas',
    gates: defaultGateObj,
    scriptStatus: {
      wordCount: data.scriptStatus?.wordCount || 1500,
      durationMinutes: data.scriptStatus?.durationMinutes || 10,
      hookSummary: data.scriptStatus?.hookSummary || 'Episode thesis and opening hook.',
      outline: data.scriptStatus?.outline || '1. Intro\n2. Main Narrative\n3. Climax\n4. Conclusion',
      scriptReviewState: 'Drafting',
    },
    thumbnailVariants: [
      {
        id: 'var-1',
        label: 'Variant A — Primary High Contrast',
        concept: 'Hero character close-up with intense lighting and saturated background',
        contrastScore: '91%',
        predictedCtr: '8.2%',
        isSelected: true,
        colorGradient: 'from-amber-600 via-zinc-900 to-black',
      },
      {
        id: 'var-2',
        label: 'Variant B — Action Scene / Dynamic Frame',
        concept: 'High kinetic motion with glowing title hook',
        contrastScore: '85%',
        predictedCtr: '7.5%',
        isSelected: false,
        colorGradient: 'from-rose-600 via-zinc-900 to-black',
      },
    ],
    renderStatus: {
      progress: 0,
      resolution: '4K UHD (3840x2160)',
      framerate: '60 FPS',
      codec: 'ProRes 422HQ',
      status: 'Idle',
    },
    publishChecklist: {
      youtube: false,
      instagram: false,
      facebook: false,
      x: false,
      linkedin: false,
    },
    createdAt: now,
    updatedAt: now,
    ...data,
  };

  return saveEpisode(newEpisode);
}

export async function resetToDefaults(): Promise<{ episodes: Episode[]; intel: IntelItem[] }> {
  localStorage.setItem(STORAGE_KEY_EPISODES, JSON.stringify(INITIAL_EPISODES));
  localStorage.setItem(STORAGE_KEY_INTEL, JSON.stringify(INITIAL_INTEL_ITEMS));
  return { episodes: INITIAL_EPISODES, intel: INITIAL_INTEL_ITEMS };
}
