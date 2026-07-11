import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSpringGeometry } from './Spring.jsx';

const _target = new THREE.Vector3();

// Renders one part of a model. Smoothly lerps between its assembled
// position and its exploded position based on the global `explode` amount
// (0 = together, 1 = fully apart), and reacts to hover / selection.
// Registers its mesh with the Scene so the HUD label engine can track it.
export function Part({ part, explode, selectedId, onSelect, registerMesh }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    registerMesh?.(part.id, ref.current);
    return () => registerMesh?.(part.id, null);
  }, [part.id, registerMesh]);

  const spring = useSpringGeometry(
    part.geometry.type === 'spring'
      ? part.geometry
      : { coils: 1, radius: 0.01, length: 0.01, wire: 0.01 }
  );

  const isSelected = selectedId === part.id;
  const dimmed = selectedId && !isSelected;

  useFrame(() => {
    if (!ref.current) return;
    const [bx, by, bz] = part.position;
    const [ex, ey, ez] = part.explode;
    _target.set(bx + ex * explode, by + ey * explode, bz + ez * explode);
    ref.current.position.lerp(_target, 0.15);

    const mat = ref.current.material;
    if (mat) {
      const baseGlow = part.glow ?? 0;
      const targetEmissive = isSelected ? 0.6 : hovered ? 0.35 : baseGlow;
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.2;
      const baseOpacity = part.transparent ? part.opacity ?? 0.35 : 1;
      const targetOpacity = dimmed ? baseOpacity * 0.25 : baseOpacity;
      mat.opacity += (targetOpacity - mat.opacity) * 0.2;
    }
  });

  const handleOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };
  const handleOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };
  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(part.id);
  };

  const g = part.geometry;

  return (
    <mesh
      ref={ref}
      position={part.position}
      rotation={part.rotation}
      scale={part.scale ?? 1}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
      castShadow
      receiveShadow
    >
      {g.type === 'cylinder' && (
        <cylinderGeometry args={[g.radiusTop, g.radiusBottom, g.height, 48]} />
      )}
      {g.type === 'box' && <boxGeometry args={[g.width, g.height, g.depth]} />}
      {g.type === 'cone' && <coneGeometry args={[g.radius, g.height, 48]} />}
      {g.type === 'torus' && (
        <torusGeometry
          args={[g.radius, g.tube, 24, 64, g.arc ?? Math.PI * 2]}
        />
      )}
      {g.type === 'sphere' && (
        <sphereGeometry
          args={[
            g.radius,
            g.widthSegments ?? 40,
            g.heightSegments ?? 40,
            g.phiStart ?? 0,
            g.phiLength ?? Math.PI * 2,
            g.thetaStart ?? 0,
            g.thetaLength ?? Math.PI,
          ]}
        />
      )}
      {g.type === 'spring' && <primitive object={spring} attach="geometry" />}
      <meshStandardMaterial
        color={part.color}
        metalness={part.metalness ?? 0.5}
        roughness={part.roughness ?? 0.4}
        transparent
        opacity={part.transparent ? part.opacity ?? 0.35 : 1}
        emissive={new THREE.Color(part.color)}
        emissiveIntensity={part.glow ?? 0}
        side={part.doubleSided ? THREE.DoubleSide : THREE.FrontSide}
      />
    </mesh>
  );
}
