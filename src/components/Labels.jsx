import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const _v = new THREE.Vector3();

// Imperative HUD label engine. Lives inside the Canvas so it can run every
// frame: it projects each part's live world position into screen space and
// positions plain DOM labels in an overlay div — no per-frame React renders.
// Labels are (re)built lazily inside the frame loop so the overlay container
// is guaranteed to exist regardless of mount-order between the R3F root and
// the surrounding DOM.
export function LabelEngine({ parts, meshRefs, container, selectedId, show, onSelect }) {
  const els = useRef({});
  const builtFor = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const stateRef = useRef({ selectedId, show });
  stateRef.current = { selectedId, show };

  // Clear the overlay when the part list changes or on unmount.
  useEffect(() => {
    return () => {
      if (container.current) container.current.innerHTML = '';
      els.current = {};
      builtFor.current = null;
    };
  }, [parts, container]);

  useFrame(({ camera, gl }) => {
    const root = container.current;
    if (!root) return;

    // Build (or rebuild) the label DOM for the current part list.
    if (builtFor.current !== parts) {
      root.innerHTML = '';
      els.current = {};
      parts.forEach((p, i) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'plabel';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        el.innerHTML = `<span class="plabel-num">${String(i + 1).padStart(2, '0')}</span>${p.name}`;
        el.onclick = () => onSelectRef.current?.(p.id);
        root.appendChild(el);
        els.current[p.id] = el;
      });
      builtFor.current = parts;
    }

    const { selectedId: sel, show: visible } = stateRef.current;
    const w = gl.domElement.clientWidth;
    const h = gl.domElement.clientHeight;
    for (const p of parts) {
      const el = els.current[p.id];
      const mesh = meshRefs.current[p.id];
      if (!el || !mesh) continue;
      mesh.getWorldPosition(_v).project(camera);
      const onScreen = visible && _v.z < 1;
      el.style.opacity = onScreen ? (sel && sel !== p.id ? '0.22' : '1') : '0';
      el.style.pointerEvents = onScreen ? 'auto' : 'none';
      const x = (_v.x * 0.5 + 0.5) * w;
      const y = (-_v.y * 0.5 + 0.5) * h;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -130%)`;
      el.classList.toggle('plabel-sel', sel === p.id);
    }
  });

  return null;
}
