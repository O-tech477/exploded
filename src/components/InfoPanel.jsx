import { useState, useRef, useEffect } from 'react';

// Side panel showing the selected part. Uses Gemini (via /api/explain) to
// generate a fresh "how it works" explanation and answer typed questions,
// and ElevenLabs (via /api/narrate) to read the text aloud. Both degrade
// gracefully to the hand-written text when the API keys aren't configured.
// In tour mode it auto-narrates each part and reports when the step is done.
export function InfoPanel({ object, part, onClose, touring, onTourStepEnd }) {
  const [messages, setMessages] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [question, setQuestion] = useState('');
  const [narrating, setNarrating] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const audioRef = useRef(null);
  const chatEndRef = useRef(null);

  // Tour plumbing: refs keep the latest values visible to audio callbacks.
  const touringRef = useRef(touring);
  touringRef.current = touring;
  const onStepEndRef = useRef(onTourStepEnd);
  onStepEndRef.current = onTourStepEnd;
  const stepDoneRef = useRef(false);
  const narrateRef = useRef(null);

  // Called when this part's narration finishes during a tour — advances once.
  function finishStep() {
    if (!touringRef.current || stepDoneRef.current) return;
    stepDoneRef.current = true;
    onStepEndRef.current?.();
  }

  // Hard-stop any audio: ElevenLabs playback and the browser speech fallback.
  function stopNarration() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setNarrating(false);
  }

  // Reset AI state and stop narration whenever a different part is selected.
  useEffect(() => {
    setMessages([]);
    setQuestion('');
    setAiUnavailable(false);
    stopNarration();
  }, [part?.id]);

  // Keep the newest chat message in view.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loadingAi]);

  // Tour mode: auto-narrate each part shortly after it is selected.
  useEffect(() => {
    if (!touring || !part) return;
    stepDoneRef.current = false;
    const t = setTimeout(() => narrateRef.current?.(), 700);
    return () => clearTimeout(t);
  }, [part?.id, touring]);

  // Stop narration when the panel unmounts (e.g. the user closes it).
  useEffect(() => {
    return () => stopNarration();
  }, []);

  if (!part) return null;

  // Narration reads the latest chat answer if there is one, else the
  // built-in explanation (which is also what the tour narrates).
  const lastAi = [...messages].reverse().find((m) => m.role === 'model')?.text;
  const displayText = lastAi || part.how;

  async function askAi(prompt) {
    const history = messages;
    setMessages((m) => [...m, { role: 'user', text: prompt }]);
    setQuestion('');
    setLoadingAi(true);
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          object: object.name,
          part: part.name,
          context: part.summary,
          question: prompt,
          history,
        }),
      });
      if (!res.ok) throw new Error('unavailable');
      const data = await res.json();
      const text = data.text?.trim();
      if (!text) throw new Error('empty');
      setMessages((m) => [...m, { role: 'model', text }]);
    } catch {
      setAiUnavailable(true);
    } finally {
      setLoadingAi(false);
    }
  }

  async function narrate() {
    if (narrating) {
      stopNarration();
      return;
    }
    setNarrating(true);
    try {
      const res = await fetch('/api/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: displayText }),
      });
      if (!res.ok) throw new Error('unavailable');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setNarrating(false);
        finishStep();
      };
      await audio.play();
    } catch {
      setNarrating(false);
      // Fallback: use the browser's built-in speech synthesis.
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(displayText);
        u.rate = 1;
        u.onend = () => {
          setNarrating(false);
          finishStep();
        };
        setNarrating(true);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } else {
        // No audio available at all — give tour viewers time to read.
        setTimeout(finishStep, 6000);
      }
    }
  }
  narrateRef.current = narrate;

  return (
    <aside className="info-wrap">
     <div className="info-panel">
      <button className="close-btn" onClick={onClose} aria-label="Close">×</button>

      <div className="info-eyebrow">{object.emoji} {object.name} / PART</div>
      <h2 className="info-title">{part.name}</h2>
      <p className="info-summary">{part.summary}</p>

      <div className="info-section">
        <div className="info-section-head">
          <span>How it works</span>
          <button
            className="narrate-btn"
            onClick={narrate}
            title="Read aloud (ElevenLabs)"
          >
            {narrating ? '■ Stop' : '🔊 Narrate'}
          </button>
        </div>
        <p className="info-body">{part.how}</p>
      </div>

      {/* Chat with Gemini about this part */}
      <div className="info-section-head">
        <span>Ask Gemini</span>
      </div>

      {messages.length === 0 && !loadingAi && (
        <div className="chat-chips">
          <button onClick={() => askAi("Explain this like I'm ten years old.")}>
            Explain like I'm 10
          </button>
          <button onClick={() => askAi('Why is it designed this way?')}>
            Why this design?
          </button>
          <button onClick={() => askAi('What would happen if this part failed?')}>
            What if it failed?
          </button>
        </div>
      )}

      {(messages.length > 0 || loadingAi) && (
        <div className="chat">
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role}`}>
              {m.text}
            </div>
          ))}
          {loadingAi && <div className="chat-msg model thinking">· · ·</div>}
          <div ref={chatEndRef} />
        </div>
      )}

      {aiUnavailable && (
        <p className="ai-note">
          Gemini is offline right now — the built-in explanation above still
          has you covered.
        </p>
      )}

      <form
        className="ask-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim() && !loadingAi) askAi(question.trim());
        }}
      >
        <input
          type="text"
          placeholder={`Ask about the ${part.name.toLowerCase()}…`}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" disabled={loadingAi || !question.trim()}>
          Ask
        </button>
      </form>
     </div>
    </aside>
  );
}
