import { useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Part } from './Part.jsx';
import { LabelEngine } from './Labels.jsx';

// The 3D stage: camera, lights, environment reflections, the model parts,
// and a screen-space HUD label overlay that tracks parts when exploded.
export function Scene({ object, explode, selectedId, onSelect }) {
  const meshRefs = useRef({});
  const labelLayerRef = useRef(null);

  const registerMesh = useCallback((id, mesh) => {
    meshRefs.current[id] = mesh;
  }, []);

  return (
    <div className="scene-wrap">
      <Canvas
        shadows
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 2, 9], fov: 45 }}
        onPointerMissed={() => onSelect(null)}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.75} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-6, 3, -4]} intensity={0.35} color="#ffffff" />

        <group position={[0, 0.2, 0]}>
          {object.parts.map((part) => (
            <Part
              key={part.id}
              part={part}
              explode={explode}
              selectedId={selectedId}
              onSelect={onSelect}
              registerMesh={registerMesh}
            />
          ))}
        </group>

        <LabelEngine
          parts={object.parts}
          meshRefs={meshRefs}
          container={labelLayerRef}
          selectedId={selectedId}
          show={explode > 0.5}
          onSelect={onSelect}
        />

        <ContactShadows
          position={[0, -2.2, 0]}
          opacity={0.32}
          scale={16}
          blur={2.6}
          far={5}
        />
        <Environment preset="city" />
        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={14}
          autoRotate={!selectedId}
          autoRotateSpeed={0.6}
        />
      </Canvas>
      <div ref={labelLayerRef} className="label-layer" />
    </div>
  );
}
