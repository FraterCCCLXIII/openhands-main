export interface Body {
  id: string;
  mass: number;
  position: number;
  velocity: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export function kineticEnergy(body: Body): number {
  return 0.5 * body.mass * body.velocity * body.velocity;
}

export function updatePosition(body: Body, dt: number): number {
  return body.position + body.velocity * dt;
}

export function stepBodies(bodies: Body[], dt: number): Body[] {
  return bodies.map((b) => ({ ...b, position: updatePosition(b, dt) }));
}

export function totalEnergy(bodies: Body[]): number {
  return bodies.reduce((sum, b) => sum + kineticEnergy(b), 0);
}

export function distance(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function centroid(points: Vec2[]): Vec2 {
  const n = points.length;
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / n, y: sum.y / n };
}

export function clampToRange(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatEnergy(joules: number): string {
  return `${joules.toFixed(2)} J`;
}
