// Differential check: compares an exported function in two modules on random inputs.
// Usage: node diff_check.mjs <original.ts> <regenerated.ts> <function> '<json param types>'
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [orig, regen, name, typesJson] = process.argv.slice(2);
const types = JSON.parse(typesJson);
const a = await import(pathToFileURL(path.resolve(orig)).href);
const b = await import(pathToFileURL(path.resolve(regen)).href);

const randomValue = (type) => {
  if (type === 'number') return Math.random() * 200 - 100;
  if (type === 'Body') return { id: 'x', mass: Math.random() * 10, position: Math.random() * 50, velocity: Math.random() * 40 - 20 };
  throw new Error(`no generator for ${type}`);
};

for (let i = 0; i < 500; i++) {
  const args = types.map(randomValue);
  const expected = a[name](...args);
  const actual = b[name](...args);
  assert.ok(Math.abs(expected - actual) < 1e-9, `${name}(${JSON.stringify(args)}): ${expected} != ${actual}`);
}
console.log(`ok ${name}: 500 random cases agree`);
