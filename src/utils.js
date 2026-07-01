export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function lerpAngle(a, b, t) {
  let diff = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return a + diff * t;
}

export function pointInRectXZ(px, pz, rect) {
  return (
    px >= rect.x - rect.w / 2 &&
    px <= rect.x + rect.w / 2 &&
    pz >= rect.z - rect.d / 2 &&
    pz <= rect.z + rect.d / 2
  );
}

export function circleRectOverlapXZ(cx, cz, cr, rect) {
  const hx = rect.w / 2;
  const hz = rect.d / 2;
  const nx = clamp(cx, rect.x - hx, rect.x + hx);
  const nz = clamp(cz, rect.z - hz, rect.z + hz);
  return Math.hypot(cx - nx, cz - nz) < cr;
}

export function resolveCircleRectXZ(cx, cz, cr, rect) {
  const hx = rect.w / 2;
  const hz = rect.d / 2;
  const nx = clamp(cx, rect.x - hx, rect.x + hx);
  const nz = clamp(cz, rect.z - hz, rect.z + hz);
  const dx = cx - nx;
  const dz = cz - nz;
  const dist = Math.hypot(dx, dz);
  if (dist === 0 || dist >= cr) return { x: cx, z: cz };
  const push = cr - dist;
  const ux = dx / (dist || 1);
  const uz = dz / (dist || 1);
  return { x: cx + ux * push, z: cz + uz * push };
}
