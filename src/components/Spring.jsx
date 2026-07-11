import { useMemo } from 'react';
import * as THREE from 'three';

// A helical coil built as a tube swept along a parametric helix curve.
// Oriented along the X axis to match the pen's layout.
class HelixCurve extends THREE.Curve {
  constructor(coils, radius, length) {
    super();
    this.coils = coils;
    this.radius = radius;
    this.length = length;
  }
  getPoint(t, target = new THREE.Vector3()) {
    const angle = 2 * Math.PI * this.coils * t;
    const x = this.length * (t - 0.5);
    const y = this.radius * Math.cos(angle);
    const z = this.radius * Math.sin(angle);
    return target.set(x, y, z);
  }
}

export function useSpringGeometry({ coils, radius, length, wire }) {
  return useMemo(() => {
    const curve = new HelixCurve(coils, radius, length);
    return new THREE.TubeGeometry(curve, 220, wire, 10, false);
  }, [coils, radius, length, wire]);
}
