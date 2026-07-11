# 🔩 Exploded — See How Things Work

> Take everyday things apart in 3D and learn how every piece fits together.

**Exploded** is an interactive 3D playground built for the curious. Pick an
everyday object, drag it apart into its individual components with a single
slider, and click any part to learn what it does — with explanations written
by **Google Gemini** and read aloud by **ElevenLabs**.

Born from a simple passion: the itch to know *how the things around us actually
work*. We use pens, mice, and batteries every day and almost never see inside
them. Exploded opens them up.

## ✨ Features

- **Real-time exploded views** — a physically laid-out 3D model that smoothly
  bursts apart and reassembles as you drag the slider.
- **Click-to-learn** — select any part to highlight it, dim the rest, and read
  how it works and how it connects to the whole.
- **AI explanations (Google Gemini)** — regenerate fresh, engaging descriptions
  and ask your own follow-up questions about any part.
- **Voice narration (ElevenLabs)** — click "Narrate" to hear a part explained
  aloud, with a browser speech-synthesis fallback.
- **Orbit, zoom, explore** — full 3D camera controls; auto-rotates when idle.

## 🛠️ Built With

- [React](https://react.dev/) + [Vite](https://vite.dev/)
- [Three.js](https://threejs.org/) via
  [React Three Fiber](https://r3f.docs.pmnd.rs/) and
  [drei](https://github.com/pmndrs/drei)
- **Google Gemini** (`gemini-2.0-flash`) for explanations
- **ElevenLabs** (`eleven_turbo_v2_5`) for text-to-speech
- Serverless functions on [Vercel](https://vercel.com/) to keep API keys secret

## 🧩 How the model works

Each object is described as plain data (`src/data/pen.js`): every part has a
geometry, an assembled position, and an `explode` offset vector. The
`<Part>` component lerps each mesh between its assembled and exploded position
based on a single global `explode` value (0 → 1), so the whole animation is
driven by one slider. Adding a new object is just adding a new data entry.

## 🚀 Run locally

```bash
npm install
npm run dev          # 3D app at http://localhost:5173 (AI features need keys)
```

To run the AI features locally, install the Vercel CLI and provide keys:

```bash
npm i -g vercel
cp .env.example .env # then fill in your keys
vercel dev           # serves the app AND the /api functions
```

## 🔑 Environment variables

| Variable              | Where to get it                              |
| --------------------- | -------------------------------------------- |
| `GEMINI_API_KEY`      | https://aistudio.google.com/apikey (free)    |
| `ELEVENLABS_API_KEY`  | https://elevenlabs.io → Profile → API Keys   |
| `ELEVENLABS_VOICE_ID` | *(optional)* an ElevenLabs voice id          |

The app works fully without keys — it falls back to the hand-written
descriptions and the browser's built-in speech synthesis.

## ☁️ Deploy

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) (framework preset:
   **Vite**; the `/api` folder is auto-detected as serverless functions).
3. Add the environment variables above in **Settings → Environment Variables**.
4. Deploy. Done.

---

Made for the **DEV Weekend Challenge: Passion Edition**.
