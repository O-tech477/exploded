import { useState, useEffect, useRef } from 'react';

// Top-right object selector. A single chip that drops open into a
// spec-sheet style list — same mono / cut-corner / cyan language as the
// rest of the HUD, so it reads as one instrument rather than a button row.
export function ModelMenu({ objects, activeId, onSelect }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const active = objects.find((o) => o.id === activeId) || objects[0];
  const activeIndex = objects.findIndex((o) => o.id === active.id);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (id) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <div className={`modelmenu ${open ? 'open' : ''}`} ref={rootRef}>
      <button
        className="mm-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="mm-emoji">{active.emoji}</span>
        <span className="mm-trigger-text">
          <span className="mm-eyebrow">SPECIMEN</span>
          <span className="mm-name">{active.name}</span>
        </span>
        <span className="mm-index">
          {String(activeIndex + 1).padStart(2, '0')}/{String(objects.length).padStart(2, '0')}
        </span>
        <span className="mm-caret" aria-hidden>▾</span>
      </button>

      <div className="mm-panel" role="listbox">
        <div className="mm-panel-head">// SELECT SPECIMEN</div>
        {objects.map((o, i) => (
          <button
            key={o.id}
            className={`mm-option ${o.id === active.id ? 'sel' : ''}`}
            role="option"
            aria-selected={o.id === active.id}
            onClick={() => pick(o.id)}
          >
            <span className="mm-opt-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="mm-opt-emoji">{o.emoji}</span>
            <span className="mm-opt-name">{o.name}</span>
            {o.id === active.id && <span className="mm-opt-dot" />}
          </button>
        ))}
      </div>
    </div>
  );
}
