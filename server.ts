import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Generate Draft Script
app.post('/api/gemini/generate-script', async (req, res) => {
  try {
    const { title, channelId, hookSummary, outline, sourceIntelTitle, sourceIntelName, tags } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // High-craft fallback script if API key is not configured
      const hook = hookSummary || `Did you know the untold story behind "${title}" changed everything we thought we knew? Let's decode the secret history.`;
      const sections = [
        {
          heading: 'Act I: The Forgotten Origins & The Spark',
          content: `[Visual: Archival schematics and dramatic atmospheric lighting]\nIn the heart of the archives lies the genesis of ${title}. Long before it became legendary, the earliest records were surrounded by intense rivalries and high-stakes gambles. ${sourceIntelTitle ? `As documented in ${sourceIntelName || 'research files'}: "${sourceIntelTitle}".` : ''}`,
        },
        {
          heading: 'Act II: The Conflict & The Tactical Turning Point',
          content: `[Visual: Kinetic split-screen comparison and tactical diagram]\nWhen pressure reached the breaking point, a single audacious move altered the course of history. Primary witnesses documented the shocking confrontation that caught everyone off guard.`,
        },
        {
          heading: 'Act III: The Climax & Modern Repercussions',
          content: `[Visual: 4K macro focus and cinematic legacy summary]\nThe reverberations echo to this day. What seemed like a localized struggle fundamentally redefined the rules of the entire field. Modern experts still consider this a turning point.`,
        },
      ];
      const cta = `Which revelation in ${title} surprised you most? Drop your theory in the comments below, subscribe to the channel, and tap the bell so you never miss an episode breakdown!`;
      return res.json({
        hook,
        sections,
        cta,
        wordCount: 1850,
        durationMinutes: 12,
        isSimulated: true,
      });
    }

    const channelProfile =
      channelId === 'little_olympus'
        ? 'Little Olympus 🏛️ (Target: Kids ages 8-12 fascinated by Greek mythology). Tone: High-energy, wondrous, witty god banter, vivid analogies, kid-safe humor, exciting mythological showdowns.'
        : channelId === 'iron_legends'
        ? 'Iron Legends 🤖 (Target: Nostalgia retro mecha & 80s/90s robot anime/toy collectors). Tone: Analytical, reverent, sharp engineering breakdown, industrial manufacturing rivalries, heroic mechanical drama.'
        : 'Empire Decoded 📜 (Target: History documentary buffs, military tactics & archaeology enthusiasts). Tone: Cinematic, authoritative, serious, rigorous, primary source citations, gripping tactical suspense.';

    const intelContext = sourceIntelTitle
      ? `\nIntel Dossier Lead: "${sourceIntelTitle}" (Source: ${sourceIntelName || 'Field Scanner'})\nRelevant Themes/Tags: ${(tags || []).join(', ')}`
      : '';

    const prompt = `You are the lead showrunner and YouTube video retention architect for a high-performing digital studio.
Channel Profile: ${channelProfile}${intelContext}
Episode Title: "${title}"
${hookSummary ? `Existing Hook/Concept: ${hookSummary}` : ''}
${outline ? `Episode Outline: ${outline}` : ''}

Generate a complete, production-ready, high-retention video draft script:
1. "hook": 0:00-0:45 scrolling-stopping opening hook. Must begin with an auditory/visual pattern interrupt [SFX / Visual cue], pose an irresistible curiosity gap, raise the emotional stakes, and tease the climax without spoiling the resolution.
2. "sections": Exactly 3 narrative acts:
   - Act I (Origins, Context, and the Catalyst)
   - Act II (Escalation, Conflict, and the Decisive Turning Point)
   - Act III (Climax, Resolution, and Enduring Legacy)
   Each section MUST have a punchy, evocative "heading" and 2-3 engaging narration paragraphs with embedded [Visual cue: ...] and [SFX: ...] directives for the editor.
3. "cta": High-conversion outro with a community-debating question and subscribe prompt tailored specifically to this topic.

Respond strictly in valid JSON format:
{
  "hook": "string",
  "sections": [
    { "heading": "string", "content": "string" },
    { "heading": "string", "content": "string" },
    { "heading": "string", "content": "string" }
  ],
  "cta": "string"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const totalWords =
      (parsed.hook?.split(/\s+/).length || 0) +
      (parsed.sections?.reduce(
        (acc: number, s: any) => acc + (s.content?.split(/\s+/).length || 0),
        0
      ) || 0) +
      (parsed.cta?.split(/\s+/).length || 0);

    const durationMinutes = Math.max(8, Math.round(totalWords / 150));

    res.json({
      hook: parsed.hook || hookSummary || 'Welcome back to the command center.',
      sections: parsed.sections || [],
      cta: parsed.cta || 'Subscribe for more.',
      wordCount: totalWords,
      durationMinutes,
    });
  } catch (err: any) {
    console.error('Error generating script:', err);
    res.status(500).json({ error: err.message || 'Failed to generate script' });
  }
});

// 2. Summarize Long Script
app.post('/api/gemini/summarize-script', async (req, res) => {
  try {
    const { scriptText, title, channelId } = req.body;
    if (!scriptText) {
      return res.status(400).json({ error: 'Script text is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        summary: `Executive summary for "${title || 'Episode'}": High-impact 3-act narrative with strong curiosity-driven retention hook, tight mid-video conflict escalation, and actionable viewer retention outro.`,
        retentionBeats: [
          'Minute 0:30 hook cliffhanger before title card',
          'Minute 4:15 tactical pivot and rare archival evidence reveal',
          'Minute 9:00 climax resolution and philosophical legacy summary',
        ],
        estimatedPacing: 'Target tempo: 150-165 WPM with dynamic visual cut every 3.5-5.0 seconds.',
        isSimulated: true,
      });
    }

    const prompt = `You are a YouTube Executive Producer and retention consultant.
Channel Context: ${channelId || 'Documentary Studio'}
Episode Title: "${title || 'Episode'}"
Full Script Content:
"""
${scriptText}
"""

Provide a sharp, executive-level script critique and retention breakdown:
1. "summary": A 2-3 sentence executive pitch summarizing the emotional story arc and core revelation.
2. "retentionBeats": Exactly 3 timestamped retention peaks/cliffhangers (e.g., at 0:30, 4:00, and 8:30) engineered to prevent viewer drop-off.
3. "estimatedPacing": Recommendation for narrator pace (WPM), voice tone, and visual edit cut frequency.

Respond strictly in valid JSON format:
{
  "summary": "string",
  "retentionBeats": ["string", "string", "string"],
  "estimatedPacing": "string"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error summarizing script:', err);
    res.status(500).json({ error: err.message || 'Failed to summarize script' });
  }
});

// 3. Score Thumbnail Variants (1-10 on Click Appeal)
app.post('/api/gemini/score-thumbnails', async (req, res) => {
  try {
    const { title, channelId, variants } = req.body;
    if (!variants || !Array.isArray(variants)) {
      return res.status(400).json({ error: 'Variants array required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Deterministic realistic scores if API key is not yet set
      const defaultScores = variants.map((v: any, index: number) => ({
        id: v.id,
        score: index === 0 ? 9.2 : index === 1 ? 7.6 : 8.4,
        critique:
          index === 0
            ? 'Exceptional curiosity gap and high mobile contrast. Focal point draws the eye immediately at 200px browse scale.'
            : index === 1
            ? 'Atmospheric color palette, but background details risk turning muddy at mobile browse sizes.'
            : 'Strong graphic clash that drives click intent; bold text hook balances the visual weight cleanly.',
      }));
      return res.json({ scores: defaultScores, isSimulated: true });
    }

    const prompt = `You are a YouTube packaging and thumbnail CTR specialist.
Channel Niche: ${channelId}
Episode Title: "${title}"
Thumbnail Variants:
${variants
  .map(
    (v: any, i: number) =>
      `Variant ${i + 1} (id: ${v.id}, label: "${v.label}"): Concept: "${v.concept}", Contrast Score: "${v.contrastScore}"`
  )
  .join('\n')}

Evaluate each variant on YouTube mobile click-appeal on a scale of 1.0 to 10.0 (where 10.0 is an elite top-1% viral thumbnail).
Evaluate for:
1. 250px mobile screen readability (clarity of focal subject against background)
2. Curiosity gap (visual story without giving away the answer)
3. Title complementarity (does the thumbnail hook avoid repeating the title words?)

Respond strictly in valid JSON format:
{
  "scores": [
    {
      "id": "string",
      "score": number,
      "critique": "string"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error scoring thumbnails:', err);
    res.status(500).json({ error: err.message || 'Failed to score thumbnails' });
  }
});

// 4. YouTube Data API Stats Proxy (Safe, handles CORS & clear error propagation)
app.post('/api/youtube/stats', async (req, res) => {
  try {
    const { apiKey, channelIds } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'YouTube API key is required' });
    }
    if (!channelIds || !channelIds.length) {
      return res.status(400).json({ error: 'At least one channel ID is required' });
    }

    const idsParam = channelIds.join(',');
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${encodeURIComponent(
      idsParam
    )}&key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      const errMsg =
        data.error?.message ||
        data.error?.errors?.[0]?.message ||
        `YouTube API returned error status ${response.status}`;
      return res.status(response.status).json({ error: errMsg });
    }

    res.json(data);
  } catch (err: any) {
    console.error('YouTube API fetch error:', err);
    res.status(500).json({ error: err.message || 'Failed to connect to YouTube Data API' });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Empire Command Center running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
