export type ChannelId = 'little_olympus' | 'iron_legends' | 'empire_decoded';

export interface ChannelInfo {
  id: ChannelId;
  name: string;
  emoji: string;
  niche: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentHex: string;
}

export const CHANNELS: Record<ChannelId, ChannelInfo> = {
  little_olympus: {
    id: 'little_olympus',
    name: 'Little Olympus',
    emoji: '🏛️',
    niche: 'Kids Mythology & Legends',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    accentHex: '#f59e0b',
  },
  iron_legends: {
    id: 'iron_legends',
    name: 'Iron Legends',
    emoji: '🤖',
    niche: 'Nostalgia Robots & Mecha Lore',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/30',
    accentHex: '#06b6d4',
  },
  empire_decoded: {
    id: 'empire_decoded',
    name: 'Empire Decoded',
    emoji: '📜',
    niche: 'History Documentaries & Tactics',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    accentHex: '#10b981',
  },
};

export type StageId = 'ideas' | 'script' | 'thumbnail' | 'render' | 'publish' | 'live';

export interface StageInfo {
  id: StageId;
  title: string;
  index: number;
  requiresGate: boolean;
  gateName?: string;
  description: string;
}

export const STAGES: StageInfo[] = [
  {
    id: 'ideas',
    title: 'Ideas',
    index: 0,
    requiresGate: false,
    description: 'Initial hooks, topics & trend pitches',
  },
  {
    id: 'script',
    title: 'Script',
    index: 1,
    requiresGate: true,
    gateName: 'Script Gate',
    description: 'Story arc, narration pacing & source check',
  },
  {
    id: 'thumbnail',
    title: 'Thumbnail',
    index: 2,
    requiresGate: true,
    gateName: 'Visual Gate',
    description: 'A/B/C composition, contrast & text hook',
  },
  {
    id: 'render',
    title: 'Render',
    index: 3,
    requiresGate: true,
    gateName: 'QC & Export Gate',
    description: '4K timeline, sound mix & color grading',
  },
  {
    id: 'publish',
    title: 'Publish',
    index: 4,
    requiresGate: true,
    gateName: 'Distribution Gate',
    description: 'Multi-platform packaging & social queue',
  },
  {
    id: 'live',
    title: 'Live',
    index: 5,
    requiresGate: false,
    description: 'Published publicly & gathering analytics',
  },
];

export interface StageGate {
  isApproved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
}

export interface ThumbnailVariant {
  id: string;
  label: string;
  concept: string;
  contrastScore: string;
  predictedCtr: string;
  isSelected: boolean;
  colorGradient: string;
  clickAppealScore?: number; // 1-10 from Gemini
  clickAppealCritique?: string;
  selectedAt?: string;
}

export interface PublishChecklist {
  youtube: boolean;
  instagram: boolean;
  facebook: boolean;
  x: boolean;
  linkedin: boolean;
  timestamps?: {
    youtube?: string;
    instagram?: string;
    facebook?: string;
    x?: string;
    linkedin?: string;
  };
}

export interface ScriptSection {
  heading: string;
  content: string;
}

export interface FullScript {
  title?: string;
  hook: string;
  sections: ScriptSection[];
  cta: string;
  summary?: string;
  retentionBeats?: string[];
  estimatedPacing?: string;
  lastDraftedAt?: string;
}

export interface Episode {
  id: string;
  channelId: ChannelId;
  title: string;
  stage: StageId;
  gates: Record<StageId, StageGate>;
  fullScript?: FullScript;
  scriptStatus: {
    wordCount: number;
    durationMinutes: number;
    hookSummary: string;
    outline: string;
    scriptReviewState: 'Drafting' | 'Review Requested' | 'Approved' | 'Needs Revisions';
    fullScript?: FullScript;
  };
  thumbnailVariants: ThumbnailVariant[];
  renderStatus: {
    progress: number;
    resolution: string;
    framerate: string;
    codec: string;
    status: 'Idle' | 'Queued' | 'Rendering' | 'Completed';
    renderTimeEst?: string;
  };
  publishChecklist: PublishChecklist;
  publishChecklistTimestamps?: Record<string, string | undefined>;
  liveAt?: string; // ISO date timestamp when reached Live
  createdAt: string;
  updatedAt: string;
  sourceIntelTitle?: string;
  sourceIntelName?: string;
}

export interface IntelItem {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  channelTarget: ChannelId;
  synopsis: string;
  viralScore: number; // e.g. 94%
  tags: string[];
  isUsed?: boolean;
}

export interface YouTubeChannelStats {
  channelId: ChannelId;
  title: string;
  channelYoutubeId: string;
  subscribers: number;
  totalViews: number;
  last28DaysViews?: number;
  videoCount: number;
  customUrl?: string;
  thumbnailUrl?: string;
  lastFetchedAt?: string;
}

export interface MonthlyRevenueChannel {
  channelId: ChannelId;
  name: string;
  monthlyTarget: number; // Little Olympus: 50k, Iron Legends: 35k, Empire Decoded: 80k
  currentRevenue: number;
  lastUpdated?: string;
}

export interface RevenueLogEntry {
  id: string;
  channelId: ChannelId;
  amount: number;
  source: string;
  date: string;
  notes?: string;
}

export interface ApexScannerRawItem {
  id?: string;
  title: string;
  source: string;
  timestamp?: string;
  channel: string;
  synopsis?: string;
  viralScore?: number;
  tags?: string[];
}
