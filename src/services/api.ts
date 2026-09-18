import { INITIAL_EPISODES, INITIAL_INTEL_ITEMS } from '../data/seedData';
import {
  ApexScannerRawItem,
  ChannelId,
  CHANNELS,
  Episode,
  FullScript,
  IntelItem,
  MonthlyRevenueChannel,
  RevenueLogEntry,
  StageGate,
  StageId,
  STAGES,
  ThumbnailVariant,
  YouTubeChannelStats,
} from '../types';

const STORAGE_KEY_EPISODES = 'empire_command_episodes_v1';
const STORAGE_KEY_INTEL = 'empire_command_intel_v1';
const STORAGE_KEY_REVENUE = 'empire_command_revenue_v1';
const STORAGE_KEY_REVENUE_LOGS = 'empire_command_revenue_logs_v1';
const STORAGE_KEY_YT_KEY = 'empire_youtube_api_key';

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
    // Check if target is live: YouTube check is strictly mandatory!
    if (targetStage === 'live' && !episode.publishChecklist?.youtube) {
      return {
        success: false,
        error: 'Syndication Gate locked: YouTube primary release checklist item must be verified and checked off before moving episode to Live.',
      };
    }

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

  // If entering a gated stage, ping notification
  if (targetStageInfo.requiresGate && !updatedGates[targetStage]?.isApproved) {
    notifyApprovalNeeded(updatedEpisode.title, targetStageInfo.title);
  }

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

// ---------------------------------------------------------------------------
// BROWSER NOTIFICATIONS
// ---------------------------------------------------------------------------
export function notifyApprovalNeeded(episodeTitle: string, stageTitle: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(`Approval needed: ${episodeTitle} (${stageTitle})`, {
        body: `Action required at the ${stageTitle} gate. Open Empire Command Center to review.`,
        icon: '/favicon.ico',
      });
    } catch (e) {
      console.warn('Could not dispatch browser notification', e);
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// SERVER-SIDE GEMINI API CLIENT CALLS
// ---------------------------------------------------------------------------
export async function generateDraftScript(
  title: string,
  channelId: string,
  hookSummary?: string,
  outline?: string
): Promise<{
  hook: string;
  sections: { heading: string; content: string }[];
  cta: string;
  wordCount: number;
  durationMinutes: number;
  isSimulated?: boolean;
}> {
  const response = await fetch('/api/gemini/generate-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, channelId, hookSummary, outline }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to generate script (status ${response.status})`);
  }

  return response.json();
}

export async function summarizeScript(
  scriptText: string,
  title?: string
): Promise<{
  summary: string;
  retentionBeats: string[];
  estimatedPacing: string;
  isSimulated?: boolean;
}> {
  const response = await fetch('/api/gemini/summarize-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scriptText, title }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to summarize script (status ${response.status})`);
  }

  return response.json();
}

export async function scoreThumbnailVariants(
  title: string,
  channelId: string,
  variants: ThumbnailVariant[]
): Promise<{ scores: { id: string; score: number; critique: string }[]; isSimulated?: boolean }> {
  const response = await fetch('/api/gemini/score-thumbnails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, channelId, variants }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to score thumbnails (status ${response.status})`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// YOUTUBE DATA API (LIVE)
// ---------------------------------------------------------------------------
export function getSavedYouTubeApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY_YT_KEY) || '';
}

export function saveYouTubeApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_YT_KEY, key.trim());
}

export async function fetchLiveYouTubeStats(
  apiKey: string,
  channelConfigs: { channelId: ChannelId; youtubeId: string; title: string }[]
): Promise<YouTubeChannelStats[]> {
  if (!apiKey) {
    throw new Error('API key is missing');
  }

  const ids = channelConfigs.map((c) => c.youtubeId);
  const response = await fetch('/api/youtube/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, channelIds: ids }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `YouTube API error (${response.status})`);
  }

  const data = await response.json();
  const items = data.items || [];

  return channelConfigs.map((config) => {
    const item = items.find((it: any) => it.id === config.youtubeId);
    if (!item) {
      return {
        channelId: config.channelId,
        title: config.title,
        channelYoutubeId: config.youtubeId,
        subscribers: 0,
        totalViews: 0,
        videoCount: 0,
        lastFetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    const stats = item.statistics || {};
    const snippet = item.snippet || {};

    return {
      channelId: config.channelId,
      title: snippet.title || config.title,
      channelYoutubeId: config.youtubeId,
      subscribers: parseInt(stats.subscriberCount) || 0,
      totalViews: parseInt(stats.viewCount) || 0,
      videoCount: parseInt(stats.videoCount) || 0,
      customUrl: snippet.customUrl,
      thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
      lastFetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  });
}

// ---------------------------------------------------------------------------
// REVENUE VS MONTHLY TARGETS (MANUAL ENTRY & PROJECTIONS)
// Targets: Little Olympus $50K, Iron Legends $35K, Empire Decoded $80K
// ---------------------------------------------------------------------------
export const DEFAULT_REVENUE_CHANNELS: MonthlyRevenueChannel[] = [
  {
    channelId: 'little_olympus',
    name: 'Little Olympus',
    monthlyTarget: 50000,
    currentRevenue: 34200,
    lastUpdated: new Date().toISOString(),
  },
  {
    channelId: 'iron_legends',
    name: 'Iron Legends',
    monthlyTarget: 35000,
    currentRevenue: 21850,
    lastUpdated: new Date().toISOString(),
  },
  {
    channelId: 'empire_decoded',
    name: 'Empire Decoded',
    monthlyTarget: 80000,
    currentRevenue: 58600,
    lastUpdated: new Date().toISOString(),
  },
];

export function getRevenueChannels(): MonthlyRevenueChannel[] {
  if (typeof window === 'undefined') return DEFAULT_REVENUE_CHANNELS;
  const raw = localStorage.getItem(STORAGE_KEY_REVENUE);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_REVENUE, JSON.stringify(DEFAULT_REVENUE_CHANNELS));
    return DEFAULT_REVENUE_CHANNELS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_REVENUE_CHANNELS;
  }
}

export function saveRevenueChannels(channels: MonthlyRevenueChannel[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_REVENUE, JSON.stringify(channels));
}

export function updateChannelRevenue(
  channelId: ChannelId,
  currentRevenue: number
): MonthlyRevenueChannel[] {
  const current = getRevenueChannels();
  const updated = current.map((c) =>
    c.channelId === channelId
      ? { ...c, currentRevenue: Math.max(0, currentRevenue), lastUpdated: new Date().toISOString() }
      : c
  );
  saveRevenueChannels(updated);
  return updated;
}

export function getRevenueLogs(): RevenueLogEntry[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY_REVENUE_LOGS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addRevenueLog(
  entry: Omit<RevenueLogEntry, 'id'>
): { logs: RevenueLogEntry[]; channels: MonthlyRevenueChannel[] } {
  const logs = getRevenueLogs();
  const newEntry: RevenueLogEntry = {
    ...entry,
    id: `rev-${Date.now()}`,
  };
  const updatedLogs = [newEntry, ...logs];
  localStorage.setItem(STORAGE_KEY_REVENUE_LOGS, JSON.stringify(updatedLogs));

  // Also auto-add to channel current revenue
  const currentChannels = getRevenueChannels();
  const updatedChannels = currentChannels.map((c) =>
    c.channelId === entry.channelId
      ? { ...c, currentRevenue: c.currentRevenue + entry.amount, lastUpdated: new Date().toISOString() }
      : c
  );
  saveRevenueChannels(updatedChannels);

  return { logs: updatedLogs, channels: updatedChannels };
}

// ---------------------------------------------------------------------------
// APEX SCANNER JSON IMPORT
// Expected shape: [{ id?, title, source, timestamp?, channel, synopsis?, viralScore?, tags? }]
// ---------------------------------------------------------------------------
export function validateAndParseApexJson(
  rawInput: string | any[]
): { success: true; items: ApexScannerRawItem[] } | { success: false; error: string } {
  let parsed: any;
  if (typeof rawInput === 'string') {
    try {
      parsed = JSON.parse(rawInput.trim());
    } catch (e: any) {
      return { success: false, error: `Invalid JSON syntax: ${e.message}` };
    }
  } else {
    parsed = rawInput;
  }

  if (!Array.isArray(parsed)) {
    return {
      success: false,
      error: 'Root JSON must be an array of scanner objects (e.g. `[{ "title": "...", "source": "...", "channel": "..." }]`).',
    };
  }

  if (parsed.length === 0) {
    return { success: false, error: 'JSON array is empty. Please provide at least 1 scanner item.' };
  }

  const validChannels: Record<string, ChannelId> = {
    little_olympus: 'little_olympus',
    'little olympus': 'little_olympus',
    iron_legends: 'iron_legends',
    'iron legends': 'iron_legends',
    empire_decoded: 'empire_decoded',
    'empire decoded': 'empire_decoded',
  };

  const validated: ApexScannerRawItem[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    const itemNumber = i + 1;

    if (!item || typeof item !== 'object') {
      return { success: false, error: `Item #${itemNumber} is not a valid object.` };
    }

    if (!item.title || typeof item.title !== 'string' || !item.title.trim()) {
      return {
        success: false,
        error: `Item #${itemNumber} is missing required field: "title" (string).`,
      };
    }

    if (!item.source || typeof item.source !== 'string' || !item.source.trim()) {
      return {
        success: false,
        error: `Item #${itemNumber} ("${item.title.slice(0, 30)}...") is missing required field: "source" (string).`,
      };
    }

    if (!item.channel || typeof item.channel !== 'string') {
      return {
        success: false,
        error: `Item #${itemNumber} ("${item.title.slice(0, 30)}...") is missing required field: "channel" ("little_olympus", "iron_legends", or "empire_decoded").`,
      };
    }

    const normalizedChannel = validChannels[item.channel.toLowerCase().trim()];
    if (!normalizedChannel) {
      return {
        success: false,
        error: `Item #${itemNumber}: channel "${item.channel}" is not recognized. Must be "little_olympus", "iron_legends", or "empire_decoded".`,
      };
    }

    validated.push({
      id: item.id ? String(item.id) : undefined,
      title: item.title.trim(),
      source: item.source.trim(),
      timestamp: item.timestamp || 'Just now (APEX import)',
      channel: normalizedChannel,
      synopsis: item.synopsis || 'Dossier imported from APEX automated market trend scanner.',
      viralScore:
        typeof item.viralScore === 'number'
          ? Math.min(100, Math.max(50, Math.round(item.viralScore)))
          : Math.floor(Math.random() * 12) + 88,
      tags: Array.isArray(item.tags)
        ? item.tags.map((t: any) => String(t).trim())
        : ['APEX', 'Market Trend'],
    });
  }

  return { success: true, items: validated };
}

export async function importApexScannerFeed(
  rawInput: string | any[]
): Promise<{ added: IntelItem[]; totalCount: number }> {
  const result = validateAndParseApexJson(rawInput);
  if (!result.success) {
    throw new Error(result.error);
  }

  const existingIntel = await fetchIntelFeed();
  const newIntelItems: IntelItem[] = result.items.map((raw, idx) => ({
    id: raw.id || `apex-${Date.now()}-${idx}`,
    title: raw.title,
    source: raw.source,
    timestamp: raw.timestamp || 'Just now',
    channelTarget: raw.channel as ChannelId,
    synopsis: raw.synopsis || 'Dossier imported from APEX automated market trend scanner.',
    viralScore: raw.viralScore || 90,
    tags: raw.tags || ['APEX', 'Algorithm'],
    isUsed: false,
  }));

  const merged = [...newIntelItems, ...existingIntel];
  saveIntelToStorage(merged);

  return { added: newIntelItems, totalCount: merged.length };
}
