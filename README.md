# 🔩 Exploded — See How Things Work

> Take everyday things apart in 3D and learn how every piece fits together.

**Exploded** is an interactive 3D playground built for the curious. Select an everyday object, pull it apart with a single slider, and click any component to discover what it does. Every explanation is powered by **Google Gemini**, with optional voice narration using **ElevenLabs**.

Built from a simple idea: we use objects every day without ever seeing what's inside them. Exploded lets you explore those hidden mechanisms in an interactive, hands-on way.

---

## ✨ Features

- 🖱️ Click any part to learn its purpose
- 🤖 AI-generated explanations with Google Gemini
- 🔊 Voice narration powered by ElevenLabs
- ⚡ Fast, responsive 3D rendering

---

## 🛠️ Tech Stack

- ⚛️ React
- 🎮 Three.js
- 🧰 Drei
- 🤖 Google Gemini (`gemini-2.0-flash`)
- 🎙️ ElevenLabs (`eleven_turbo_v2_5`)

---

## 🧩 How It Works

Each object is described using simple data that defines:

- its individual parts
- assembled positions
- exploded positions

A single global **explode** value smoothly interpolates every component between assembled and exploded states, making it easy to add entirely new objects without changing the rendering logic.

---

## 🚀 Run Locally

```bash
npm install
npm run dev
```

To enable AI features locally:

```bash
npm i -g vercel
cp .env.example .env
vercel dev
```

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API Key |
| `ELEVENLABS_API_KEY` | ElevenLabs API Key |
| `ELEVENLABS_VOICE_ID` | *(Optional)* Voice ID |

Without these keys, the application still works using built-in descriptions and the browser's speech synthesis.

---

## 🏆 Built For

Made for the **DEV Weekend Challenge: Passion Edition** ❤️
