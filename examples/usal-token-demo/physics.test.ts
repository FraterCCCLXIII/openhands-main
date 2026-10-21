// Behavioural checks for the three demo tasks. Run as:
//   node --experimental-strip-types physics.test.ts <task>
// The runner copies an arm's physics.ts next to this file before calling it.
import assert from 'node:assert/strict';
import * as physics from './physics.ts';

const body = (velocity: number, mass = 1) => ({ id: 'x', mass, position: 0, velocity });

const checks: Record<string, () => void> = {
  clamp_velocity: () => {
    const { updatePosition } = physics as any;
    assert.equal(updatePosition(body(50), 1), 10);
    assert.equal(updatePosition(body(-50), 1), -10);
    assert.equal(updatePosition(body(3), 2), 6);
    assert.equal(updatePosition(body(50), 1, 20), 20);
  },
  rename_export: () => {
    const { sumKineticEnergy } = physics as any;
    assert.equal(typeof sumKineticEnergy, 'function');
    assert.equal(sumKineticEnergy([body(3, 2)]), 9);
    assert.equal('totalEnergy' in physics, false);
  },
  add_momentum: () => {
    const { momentum } = physics as any;
    assert.equal(typeof momentum, 'function');
    assert.equal(momentum([body(3, 2), body(-1, 1)]), 5);
  },
};

const name = process.argv[2];
if (!checks[name]) {
  console.error(`unknown check ${name}`);
  process.exit(2);
}
checks[name]();
console.log(`ok ${name}`);
