// Converts exported TypeScript functions into USAL code-graph text (SPEC section 9).
//
// Usage: node ts_to_usal.mjs <file.ts>
//   stdout: graph text for each supported function, in the format usal_exec.parse_context reads
//   stderr: one line per exported function the converter cannot lower, with the reason
//
// The converter can only express what the notation can express. Its coverage is therefore
// the operation set in SPEC 9.1 (FIELD, MUL, ADD, CLAMP, REDUCE), and anything else is reported
// as unsupported rather than approximated.
import { createRequire } from 'node:module';
import fs from 'node:fs';

const TS_PATH = process.env.TYPESCRIPT_PATH
  ?? '/Users/paulbloch/Documents/github/OpenHands/OpenHands/node_modules/typescript';
const ts = createRequire(import.meta.url)(TS_PATH);

const BINARY_OPS = { '*': 'MUL', '+': 'ADD' };

class Unsupported extends Error {}

function convertFunction(fn, sf, fid) {
  const name = fn.name.text;
  const params = fn.parameters.map((p) => ({ name: p.name.getText(sf), type: p.type?.getText(sf) }));
  if (params.some((p) => !p.type)) throw new Unsupported('parameter without a type annotation');
  if (!fn.type) throw new Unsupported('return type missing');
  const paramIndex = new Map(params.map((p, i) => [p.name, i]));
  const locals = new Map();
  const nodeLines = [];
  let nextNode = 0;

  const addNode = (op, args) => {
    const k = nextNode++;
    nodeLines.push(`N${k} ${op}(${args.join(', ')})`);
    return `N${k}`;
  };

  // ctx.inline is true inside a REDUCE body, where expressions are written inline rather than as nodes.
  function lower(e, ctx) {
    switch (e.kind) {
      case ts.SyntaxKind.ParenthesizedExpression:
        return lower(e.expression, ctx);
      case ts.SyntaxKind.NumericLiteral:
        return e.text;
      case ts.SyntaxKind.PrefixUnaryExpression: {
        if (e.operator !== ts.SyntaxKind.MinusToken) break;
        const operand = lower(e.operand, ctx);
        if (!/^(P\d+|\d+(\.\d+)?)$/.test(operand)) throw new Unsupported(`negation of ${operand}`);
        return `-${operand}`;
      }
      case ts.SyntaxKind.Identifier: {
        const id = e.text;
        if (locals.has(id)) return locals.get(id);
        if (paramIndex.has(id)) return `P${paramIndex.get(id)}`;
        throw new Unsupported(`identifier ${id}`);
      }
      case ts.SyntaxKind.PropertyAccessExpression: {
        const base = e.expression;
        if (base.kind !== ts.SyntaxKind.Identifier) break;
        const field = e.name.text;
        if (ctx.lambda === base.text) return `FIELD(${base.text}.${field})`;
        if (paramIndex.has(base.text)) {
          const ref = `P${paramIndex.get(base.text)}.${field}`;
          return ctx.inline ? `FIELD(${ref})` : addNode('FIELD', [ref]);
        }
        break;
      }
      case ts.SyntaxKind.BinaryExpression: {
        const op = BINARY_OPS[e.operatorToken.getText(sf)];
        if (!op) break;
        const left = lower(e.left, ctx);
        const right = lower(e.right, ctx);
        return ctx.inline ? `${op}(${left}, ${right})` : addNode(op, [left, right]);
      }
      case ts.SyntaxKind.CallExpression: {
        const callee = e.expression;
        if (callee.kind === ts.SyntaxKind.Identifier && callee.text === 'clampToRange' && e.arguments.length === 3) {
          const args = e.arguments.map((a) => lower(a, ctx));
          return ctx.inline ? `CLAMP(${args.join(', ')})` : addNode('CLAMP', args);
        }
        if (callee.kind === ts.SyntaxKind.PropertyAccessExpression && callee.name.text === 'reduce') {
          return lowerReduce(e, ctx);
        }
        throw new Unsupported(`call ${callee.getText(sf)}`);
      }
      default:
        break;
    }
    throw new Unsupported(`${ts.SyntaxKind[e.kind]}: ${e.getText(sf)}`);
  }

  // arr.reduce((acc, x) => acc OP term, init) becomes REDUCE(P<i>, OP, init, term).
  function lowerReduce(call, ctx) {
    const source = call.expression.expression;
    if (source.kind !== ts.SyntaxKind.Identifier || !paramIndex.has(source.text)) {
      throw new Unsupported('reduce over something other than a parameter');
    }
    const [arrow, init] = call.arguments;
    if (!arrow || !ts.isArrowFunction(arrow) || arrow.parameters.length !== 2 || !init) {
      throw new Unsupported('reduce must take an arrow function with two parameters and an initial value');
    }
    const [acc, item] = arrow.parameters.map((p) => p.name.getText(sf));
    const body = arrow.body;
    if (!ts.isBinaryExpression(body) || !BINARY_OPS[body.operatorToken.getText(sf)]) {
      throw new Unsupported('reduce body must be acc * term or acc + term');
    }
    if (body.left.getText(sf) !== acc) throw new Unsupported('reduce body must start from the accumulator');
    const kind = BINARY_OPS[body.operatorToken.getText(sf)];
    const term = lower(body.right, { lambda: item, inline: true });
    const initValue = lower(init, ctx);
    const args = [`P${paramIndex.get(source.text)}`, kind, initValue, term];
    return ctx.inline ? `REDUCE(${args.join(', ')})` : addNode('REDUCE', args);
  }

  for (const statement of fn.body.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name) || !decl.initializer) throw new Unsupported('destructuring or uninitialised const');
        locals.set(decl.name.text, lower(decl.initializer, {}));
      }
    } else if (ts.isReturnStatement(statement)) {
      const ref = lower(statement.expression, {});
      if (!/^N\d+$/.test(ref)) throw new Unsupported('return of a bare parameter or literal');
      const header = `F${fid} ${name}(${params.map((p, i) => `P${i}:${p.type}`).join(', ')}) -> ${fn.type.getText(sf)}`;
      return [header, ...nodeLines, `RET ${ref}`].join('\n');
    } else {
      throw new Unsupported(`statement ${ts.SyntaxKind[statement.kind]}`);
    }
  }
  throw new Unsupported('no return statement');
}

const file = process.argv[2];
if (!file) {
  console.error('usage: node ts_to_usal.mjs <file.ts>');
  process.exit(2);
}
const text = fs.readFileSync(file, 'utf8');
const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
let fid = 1;
const converted = [];
for (const statement of sf.statements) {
  if (!ts.isFunctionDeclaration(statement)) continue;
  const exported = statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  if (!exported) continue;
  const name = statement.name.text;
  try {
    converted.push(convertFunction(statement, sf, fid));
    fid += 1;
  } catch (error) {
    if (!(error instanceof Unsupported)) throw error;
    console.error(`unsupported ${name}: ${error.message}`);
  }
}
console.log(converted.join('\n\n'));
