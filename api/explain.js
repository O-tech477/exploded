// Serverless endpoint: generates a "how it works" explanation with Google
// Gemini. The API key lives only in the GEMINI_API_KEY environment variable
// (set in the Vercel dashboard) and is never exposed to the browser.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const { object, part, context, question, history } = body;

  const system = `You are a friendly engineering explainer for an interactive
"exploded view" website where people take everyday objects apart to learn how
they work. The user is currently looking at one part:

Object: ${object}
Part: ${part}
What this part is: ${context}

Answer the user's questions conversationally. Be accurate and concrete, in
2-4 short, vivid sentences a curious teenager would enjoy. Do not use
markdown, headings, or bullet points — plain prose only.`;

  // Rebuild the chat so Gemini keeps context across follow-up questions.
  const contents = [];
  if (Array.isArray(history)) {
    for (const m of history.slice(-12)) {
      if (!m || typeof m.text !== 'string' || !m.text.trim()) continue;
      contents.push({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text.slice(0, 1200) }],
      });
    }
  }
  contents.push({
    role: 'user',
    parts: [
      {
        text: (
          question ||
          'Explain how this part works and how it connects to the whole object.'
        ).slice(0, 1200),
      },
    ],
  });

  const model = 'gemini-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
          // Newer flash models "think" by default, which eats the token
          // budget before any answer is produced. Turn it off for direct prose.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: 'Gemini request failed', detail });
    }

    const data = await r.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join(' ').trim() ||
      '';
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}
