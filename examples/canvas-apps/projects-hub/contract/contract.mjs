// The per-repo snapshot contract (CONTRACT.md): its statuses, a validator that
// reads snapshot.schema.json itself, and the helpers adapters share.
import { readFileSync } from "node:fs";

export const SCHEMA = "pm-hub.snapshot";
export const VERSION = 1;
export const SCHEMA_JSON = JSON.parse(
  readFileSync(new URL("./snapshot.schema.json", import.meta.url), "utf8"),
);
export const STATUSES = SCHEMA_JSON.$defs.status.enum;
export const REQUIRED_COLLECTIONS =
  SCHEMA_JSON.properties.collections.required;

export const docId = (s) => String(s).replace(/[^A-Za-z0-9_.~-]/g, "_");

const typeOf = (v) =>
  v === null
    ? "null"
    : Array.isArray(v)
      ? "array"
      : Number.isInteger(v)
        ? "integer"
        : typeof v;
const isType = (v, t) =>
  t === "number" ? typeof v === "number" : typeOf(v) === t;

// The JSON Schema keywords snapshot.schema.json uses, and no others.
function check(schema, value, path, errors) {
  if (schema.$ref) {
    const name = schema.$ref.replace("#/$defs/", "");
    check(SCHEMA_JSON.$defs[name], value, path, errors);
  }
  if (schema.const !== undefined && value !== schema.const)
    errors.push(`${path}: must be ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value))
    errors.push(`${path}: ${JSON.stringify(value)} is not one of ${schema.enum.join(", ")}`);
  if (schema.type) {
    const types = [].concat(schema.type);
    if (!types.some((t) => isType(value, t))) {
      errors.push(`${path}: expected ${types.join(" or ")}`);
      return;
    }
  }
  if (typeof value === "string" && schema.pattern && !new RegExp(schema.pattern).test(value))
    errors.push(`${path}: ${JSON.stringify(value)} does not match ${schema.pattern}`);
  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum)
    errors.push(`${path}: below ${schema.minimum}`);
  if (Array.isArray(value) && schema.items)
    value.forEach((v, i) => check(schema.items, v, `${path}[${i}]`, errors));
  if (typeOf(value) === "object") {
    for (const k of schema.required ?? [])
      if (value[k] === undefined) errors.push(`${path}: missing ${k}`);
    for (const [k, v] of Object.entries(value)) {
      if (schema.propertyNames) check(schema.propertyNames, k, `${path} key ${k}`, errors);
      const sub = schema.properties?.[k] ?? schema.additionalProperties;
      if (sub && typeof sub === "object") check(sub, v, `${path}.${k}`, errors);
    }
  }
  if (schema.if) {
    const probe = [];
    check(schema.if, value, path, probe);
    if (!probe.length && schema.then) check(schema.then, value, path, errors);
  }
}

/** Returns the list of contract violations; empty means valid. */
export function validateSnapshot(snapshot) {
  const errors = [];
  check(SCHEMA_JSON, snapshot, "snapshot", errors);
  const id = snapshot?.project?.id;
  for (const [name, docs] of Object.entries(snapshot?.collections ?? {}))
    for (const [doc, data] of Object.entries(docs ?? {}))
      if (data?.project && id && data.project !== id)
        errors.push(`${name}/${doc}: project ${data.project} is not ${id}`);
  return errors;
}

/** Builds a snapshot from collections, stamping every document with the project id. */
export function makeSnapshot(project, collections, sources) {
  const out = {};
  for (const name of new Set([...REQUIRED_COLLECTIONS, ...Object.keys(collections)])) {
    out[name] = {};
    for (const [id, data] of Object.entries(collections[name] ?? {}))
      out[name][docId(id)] = { ...data, project: project.id };
  }
  // Round-trip through JSON so what is validated is exactly what is written
  // (undefined fields dropped).
  return JSON.parse(JSON.stringify({
    schema: SCHEMA,
    version: VERSION,
    project,
    generatedAt: new Date().toISOString(),
    sources,
    collections: out,
  }));
}

/** Lays a second adapter's snapshot over the first: its documents win, except
 * calendar months, whose days are summed with mergeMonth. */
export function mergeInto(base, extra, mergeMonth) {
  for (const [name, docs] of Object.entries(extra.collections)) {
    const into = (base.collections[name] ??= {});
    for (const [id, data] of Object.entries(docs))
      into[id] = name === "calendar" && into[id] ? mergeMonth([into[id], data]) : data;
  }
  base.sources = [...base.sources, ...extra.sources];
  return base;
}
