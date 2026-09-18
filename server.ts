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
    const { title, channelId, hookSummary, outline } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Realistic fallback script if API key is not configured in local environment
      const hook = hookSummary || `Did you know the untold story behind "${title}" changed everything we thought we knew? Let's decode the secret history.`;
      const sections = [
        {
          heading: 'Act I: The Forgotten Origins',
          content: `In the heart of the archives lies the genesis of ${title}. Long before it became legend, the early blueprints faced immense opposition. Primary sources indicate that what seemed like an overnight sensation was actually the result of intense rivalry and clandestine operations.`,
        },
        {
          heading: 'Act II: The Climax and the Turning Point',
          content: `When the pressure mounted, key decisions turned the tide. Strategic moves deployed on the ground defied conventional wisdom. Eye-witness accounts describe the moment the balance shifted irrevocably.`,
        },
        {
          heading: 'Act III: The Aftermath and Legacy',
          content: `The ramifications continue to echo today. Modern experts still study these decisive moments as masterclasses in strategy and resilience. What was forged in the fire established the empire we study today.`,
        },
      ];
      const cta = `Which detail of ${title} surprised you most? Drop your theory in the comments below, hit subscribe for our next documentary, and ring the bell so you never miss an episode.`;
      return res.json({
        hook,
        sections,
        cta,
        wordCount: 1850,
        durationMinutes: 12,
        isSimulated: true,
      });
    }

    const channelStyle =
      channelId === 'little_olympus'
        ? 'Target audience is kids (ages 8-12) passionate about Greek mythology and legends. Tone is enthusiastic, high-energy, wondrous, fast-paced, and educational.'
        : channelId === 'iron_legends'
        ? 'Target audience is nostalgic retro mecha and 80s anime/toy lore fans. Tone is analytical, nostalgic, reverent, sharp, and focused on behind-the-scenes industrial rivalries.'
        : 'Target audience is history documentary buffs and military tactics enthusiasts. Tone is cinematic, serious, authoritative, gripping, and deeply grounded in primary historical sources.';

    const prompt = `You are the lead showrunner and scriptwriter for YouTube channel.
Channel style: ${channelStyle}
Episode Title: "${title}"
${hookSummary ? `Existing Hook Idea: ${hookSummary}` : ''}
${outline ? `Existing Outline: ${outline}` : ''}

Write a complete, structured YouTube video draft script with:
1. Hook (0:00 - 0:45 gripping opening retention hook that stops scrolling)
2. 3 detailed narrative sections (Act I, Act II, Act III), each with a punchy heading and 2-3 engaging narration paragraphs with b-roll/visual cue notes in [brackets].
3. CTA (Call to action outro with question prompt and subscribe tease)

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
    const { scriptText, title } = req.body;
    if (!scriptText) {
      return res.status(400).json({ error: 'Script text is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        summary: `Executive summary for "${title || 'Episode'}": High-impact 3-act narrative with strong curiosity-driven retention hook, tight mid-video conflict escalation, and actionable viewer retention outro.`,
        retentionBeats: [
          'Minute 0:30 hook cliffhanger before intro title card',
          'Minute 4:15 tactical pivot and rare archival evidence reveal',
          'Minute 9:00 climax resolution and philosophical legacy summary',
        ],
        estimatedPacing: 'Target tempo: 145-160 WPM with dynamic visual b-roll every 4-6 seconds.',
        isSimulated: true,
      });
    }

    const prompt = `Analyze this YouTube production script for "${title || 'Episode'}":
"""
${scriptText}
"""

Provide an executive director summary including:
1. "summary": A 2-3 sentence executive pitch of the episode's story arc.
2. "retentionBeats": An array of 3 key retention cliffhangers/moments designed to keep audience watch time high.
3. "estimatedPacing": A recommendation on voiceover pacing (WPM) and visual pacing.

Respond in JSON format:
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
            ? 'Exceptional curiosity gap and high mobile contrast. Focal point draws the eye immediately.'
            : index === 1
            ? 'Atmospheric color palette, but background details may blur at 200px mobile browse size.'
            : 'Strong graphic clash that drives click intent; text hook balances the visual weight nicely.',
      }));
      return res.json({ scores: defaultScores, isSimulated: true });
    }

    const prompt = `You are a world-class YouTube CTR and thumbnail packaging specialist.
Channel Niche: ${channelId}
Episode Title: "${title}"
Thumbnail Variants:
${variants
  .map(
    (v: any, i: number) =>
      `Variant ${i + 1} (id: ${v.id}, label: "${v.label}"): Concept: "${v.concept}", Contrast Score: "${v.contrastScore}"`
  )
  .join('\n')}

Evaluate each variant on YouTube mobile click-appeal on a scale of 1.0 to 10.0 (where 10.0 is an elite MrBeast/Vox level click magnet).
Consider:
- Immediate readability at 250px mobile width
- Visual tension / curiosity gap
- Brand relevance for ${channelId}

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
