import { useState, useEffect, useRef, useCallback } from 'react';
import { Scene } from './components/Scene.jsx';
import { InfoPanel } from './components/InfoPanel.jsx';
import { ModelMenu } from './components/ModelMenu.jsx';
import { OBJECTS } from './data/objects.js';
import './App.css';

export default function App() {
  const [objectId, setObjectId] = useState(OBJECTS[0].id);
  const [exploded, setExploded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [touring, setTouring] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('exploded-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    localStorage.setItem('exploded-theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Intro: on first load the model gently drifts apart and settles back —
  // a quiet hint that things here come apart. Kept below 0.5 so no HUD
  // labels flash, and skipped for reduced-motion users.
  const [intro, setIntro] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t1 = setTimeout(() => setIntro(0.35), 900);
    const t2 = setTimeout(() => setIntro(0), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const object = OBJECTS.find((o) => o.id === objectId);
  const selectedPart = object.parts.find((p) => p.id === selectedId) || null;

  // Keep the latest selection readable from stable callbacks.
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const switchObject = (id) => {
    setObjectId(id);
    setSelectedId(null);
    setExploded(false);
    setTouring(false);
  };

  const closePanel = () => {
    setSelectedId(null);
    setTouring(false);
  };

  // --- Guided tour: explode, then walk part-by-part with narration. ---
  const startTour = () => {
    setExploded(true);
    setSelectedId(object.parts[0].id);
    setTouring(true);
  };
  const stopTour = () => setTouring(false);

  const handleTourStepEnd = useCallback(() => {
    const idx = object.parts.findIndex((p) => p.id === selectedIdRef.current);
    const next = idx + 1;
    if (next >= object.parts.length) {
      setTouring(false);
      setSelectedId(null);
      return;
    }
    setSelectedId(object.parts[next].id);
  }, [object]);

  // --- Keyboard shortcuts: E explode, arrows cycle parts, Esc close. ---
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'e' || e.key === 'E') setExploded((v) => !v);
      if (e.key === 'Escape') {
        setSelectedId(null);
        setTouring(false);
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const n = object.parts.length;
        const idx = object.parts.findIndex((p) => p.id === selectedIdRef.current);
        const next = idx === -1 ? (dir === 1 ? 0 : n - 1) : (idx + dir + n) % n;
        setSelectedId(object.parts[next].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [object]);

  return (
    <div className={`app ${dark ? 'dark' : ''}`}>
      <Scene
        object={object}
        explode={exploded ? 1 : intro}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">◱</span>
          <span className="brand-name">Exploded</span>
        </div>
        <p className="brand-sub">Take everyday things apart. See how they work.</p>
      </header>

      {/* Object selector — top-right drop menu */}
      <ModelMenu objects={OBJECTS} activeId={objectId} onSelect={switchObject} />

      {/* Parts index (bill of materials) */}
      <div className="bom">
        <div className="bom-head">
          // {object.name} — {object.parts.length} PARTS
        </div>
        {object.parts.map((p, i) => (
          <button
            key={p.id}
            className={`bom-item ${selectedId === p.id ? 'sel' : ''}`}
            onClick={() => setSelectedId(p.id)}
          >
            <span className="bom-num">{String(i + 1).padStart(2, '0')}</span>
            {p.name}
          </button>
        ))}
      </div>

      {/* Explode + tour controls */}
      <div className="controls">
        <div className="controls-row">
          <button
            className={`explode-toggle ${exploded ? 'on' : ''}`}
            onClick={() => setExploded((v) => !v)}
          >
            <span className="toggle-dot" />
            {exploded ? 'ASSEMBLE' : 'EXPLODE'}
          </button>
          <button
            className={`tour-btn ${touring ? 'on' : ''}`}
            onClick={touring ? stopTour : startTour}
          >
            {touring ? '■ STOP TOUR' : '▶ TOUR'}
          </button>
        </div>
        <div className="controls-hint">
          [E] explode · [←/→] cycle parts · [ESC] close · drag to orbit
        </div>
      </div>

      {/* Theme toggle */}
      <button
        className="theme-btn"
        onClick={() => setDark((v) => !v)}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? '☀' : '☾'}
      </button>

      {selectedPart && (
        <InfoPanel
          object={object}
          part={selectedPart}
          onClose={closePanel}
          touring={touring}
          onTourStepEnd={handleTourStepEnd}
        />
      )}
    </div>
  );
}
