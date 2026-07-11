// Serverless endpoint: converts text to speech with ElevenLabs and streams
// back MP3 audio. The API key lives only in ELEVENLABS_API_KEY (set in the
// Vercel dashboard) and never reaches the browser.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'ELEVENLABS_API_KEY not configured' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const text = (body.text || '').slice(0, 800); // keep clips short + cheap
  if (!text) return res.status(400).json({ error: 'No text provided' });

  // "Adam" — a premade voice usable on the free API tier (the old "Rachel"
  // default is now a library voice that free plans can't use). Override with
  // ELEVENLABS_VOICE_ID.
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: 'ElevenLabs request failed', detail });
    }

    const arrayBuffer = await r.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}
