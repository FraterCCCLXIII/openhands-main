"""Applies a USAL-style graph patch to a TypeScript module.

The executor parses the same graph text the B arm is shown (the context), applies the
patch to it, regenerates the affected functions, and splices them into the module.

It supports only what the three demo tasks need: the node ops FIELD, MUL, ADD, CLAMP
and REDUCE, plus the patch lines PATCH, +P, +N, +RET, +F, ~N, ~F and INSERT_AFTER.
Anything else raises ExecError, which the runner counts as a failed attempt.
"""
import copy
import re


class ExecError(Exception):
    pass


BIN = {"MUL": "*", "ADD": "+"}


def split_args(text):
    """Split a comma-separated list at top-level commas only."""
    args, depth, cur = [], 0, ""
    for ch in text:
        if ch == "," and depth == 0:
            args.append(cur.strip())
            cur = ""
            continue
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        cur += ch
    if cur.strip():
        args.append(cur.strip())
    return args


def parse_op(text):
    m = re.fullmatch(r"(\w+)\((.*)\)", text.strip())
    if not m:
        raise ExecError(f"cannot parse node: {text}")
    return m.group(1), split_args(m.group(2))


class Param:
    def __init__(self, name, type_, default=None):
        self.name, self.type, self.default = name, type_, default

    def decl(self):
        base = f"{self.name}: {self.type}"
        return f"{base} = {self.default}" if self.default is not None else base


class Func:
    def __init__(self, name, params, ret_type, base_name=None):
        self.name = name
        self.params = params
        self.ret_type = ret_type
        self.base_name = base_name  # original name in the module, if this edits an existing function
        self.nodes = {}  # int -> (op, args)
        self.ret = None
        self.anchor = None  # for new functions: fid of the function to insert after

    def pname(self, index):
        if index >= len(self.params):
            raise ExecError(f"P{index} is not a parameter")
        return self.params[index].name


def parse_source_params(module, name):
    m = re.search(rf"export function {re.escape(name)}\((.*?)\)\s*:\s*([^\{{]+?)\s*\{{", module, re.S)
    if not m:
        raise ExecError(f"function {name} not found in module")
    params = []
    for part in split_args(m.group(1)):
        pname, ptype = part.split(":", 1)
        params.append(Param(pname.strip(), ptype.strip()))
    return params, m.group(2).strip()


def parse_context(context):
    """Return {fid: Func} for the functions described in the context text."""
    funcs, current = {}, None
    for line in context.splitlines():
        line = line.strip()
        m = re.match(r"F(\d+) (\w+)\(", line)
        if m:
            current = int(m.group(1))
            funcs[current] = {"name": m.group(2), "nodes": {}, "ret": None}
            continue
        if current is None:
            continue
        m = re.match(r"N(\d+) (\w+\(.*\))$", line)
        if m:
            funcs[current]["nodes"][int(m.group(1))] = parse_op(m.group(2))
            continue
        m = re.match(r"RET N(\d+)$", line)
        if m:
            funcs[current]["ret"] = int(m.group(1))
    return funcs


def block_span(module, name):
    m = re.search(rf"export function {re.escape(name)}\(.*?\n\}}\n", module, re.S)
    if not m:
        raise ExecError(f"function {name} not found in module")
    return m.start(), m.end()


def tr(arg, f, env, lines, visiting):
    arg = arg.strip()
    if re.fullmatch(r"-?\d+(\.\d+)?", arg):
        return arg
    neg = arg.startswith("-")
    core = arg[1:] if neg else arg
    if re.fullmatch(r"N\d+", core):
        out = node_var(int(core[1:]), f, env, lines, visiting)
    elif re.fullmatch(r"P\d+", core):
        out = f.pname(int(core[1:]))
    else:
        op, args = parse_op(core)
        out = op_expr(op, args, f, env, lines, visiting)
    return ("-" if neg else "") + out


def op_expr(op, args, f, env, lines, visiting):
    if op == "FIELD":
        ref = args[0]
        m = re.fullmatch(r"P(\d+)(\..*)", ref)
        if m:
            return f.pname(int(m.group(1))) + m.group(2)
        return ref
    if op in BIN:
        return f"({tr(args[0], f, env, lines, visiting)} {BIN[op]} {tr(args[1], f, env, lines, visiting)})"
    if op == "CLAMP":
        return "clampToRange(" + ", ".join(tr(a, f, env, lines, visiting) for a in args) + ")"
    if op == "REDUCE":
        source, kind, init, expr = args
        if kind not in BIN:
            raise ExecError(f"unsupported REDUCE operator {kind}")
        body = tr(expr, f, env, lines, visiting)
        return f"{tr(source, f, env, lines, visiting)}.reduce((acc, b) => acc {BIN[kind]} {body}, {init})"
    raise ExecError(f"unsupported op {op}")


def node_var(k, f, env, lines, visiting):
    if k in env:
        return env[k]
    if k in visiting:
        raise ExecError(f"cycle at N{k}")
    if k not in f.nodes:
        raise ExecError(f"N{k} is not defined")
    visiting.add(k)
    op, args = f.nodes[k]
    expr = op_expr(op, args, f, env, lines, visiting)
    visiting.discard(k)
    name = f"n{k}"
    env[k] = name
    lines.append(f"  const {name} = {expr};")
    return name


def emit(f):
    if f.ret is None:
        raise ExecError(f"{f.name} has no RET")
    env, lines = {}, []
    ret = node_var(f.ret, f, env, lines, set())
    header = f"export function {f.name}({', '.join(p.decl() for p in f.params)}): {f.ret_type} {{"
    return "\n".join([header, *lines, f"  return {ret};", "}"]) + "\n"


def apply(module, context, patch):
    base = parse_context(context)
    working = {}  # fid -> Func being edited
    new_funcs = []  # (Func, anchor fid)
    current = None

    def edit_target(fid):
        if fid not in base:
            return None
        if fid not in working:
            info = base[fid]
            params, ret_type = parse_source_params(module, info["name"])
            f = Func(info["name"], params, ret_type, base_name=info["name"])
            f.nodes = copy.deepcopy(info["nodes"])
            f.ret = info["ret"]
            working[fid] = f
        return working[fid]

    for raw in patch.splitlines():
        line = raw.strip()
        if not line or line == "COMMIT":
            continue
        if line.startswith("PATCH "):
            m = re.match(r"PATCH F(\d+)\b", line)
            if not m:
                raise ExecError(f"bad PATCH line: {line}")
            current = edit_target(int(m.group(1)))
        elif line.removeprefix("+ ").startswith("INSERT_AFTER F"):
            if current is None or current.base_name is not None:
                raise ExecError("INSERT_AFTER must follow a new function")
            current.anchor = int(re.search(r"INSERT_AFTER F(\d+)", line).group(1))
        elif m := re.match(r"\+ F(\d+) (\w+)\((.*)\) -> (.+)$", line):
            params = []
            for i, part in enumerate(split_args(m.group(3))):
                _, ptype = part.split(":", 1)
                pname = "bodies" if ptype.strip().endswith("[]") else f"arg{i}"
                params.append(Param(pname, ptype.strip()))
            current = Func(m.group(2), params, m.group(4).strip())
            new_funcs.append((current, None))
        elif m := re.match(r"\+ P(\d+) (\w+):(\S+)(?: = (.+))?$", line):
            if current is None:
                raise ExecError(f"parameter added with no function: {line}")
            if int(m.group(1)) != len(current.params):
                raise ExecError(f"parameter index must be P{len(current.params)}")
            current.params.append(Param(m.group(2), m.group(3), m.group(4)))
        elif m := re.match(r"\+ N(\d+) = (.+)$", line):
            if current is None:
                raise ExecError(f"node added with no function: {line}")
            current.nodes[int(m.group(1))] = parse_op(m.group(2))
        elif m := re.match(r"\+ RET N(\d+)$", line):
            if current is None:
                raise ExecError("RET with no function")
            current.ret = int(m.group(1))
        elif m := re.match(r"~ N(\d+)\.(left|right|arg\d+) = (.+)$", line):
            if current is None or int(m.group(1)) not in current.nodes:
                raise ExecError(f"cannot rewire: {line}")
            slot = m.group(2)
            index = {"left": 0, "right": 1}.get(slot, None)
            if index is None:
                index = int(slot[3:])
            op, args = current.nodes[int(m.group(1))]
            if index >= len(args):
                raise ExecError(f"N{m.group(1)} has no argument {slot}")
            args[index] = m.group(3).strip()
        elif m := re.match(r"~ F(\d+)\.name = (\w+)$", line):
            target = edit_target(int(m.group(1)))
            if target is None:
                raise ExecError(f"unknown function F{m.group(1)}")
            target.name = m.group(2)
        else:
            raise ExecError(f"unknown patch line: {line}")

    # Replace edited existing functions. Renames with no nodes only change the header.
    spans = []
    for f in working.values():
        start, end = block_span(module, f.base_name)
        if not f.nodes and f.ret is None:
            text = module[start:end].replace(f"function {f.base_name}(", f"function {f.name}(", 1)
        else:
            text = emit(f)
        spans.append((start, end, text))
    # Insert new functions after their anchors.
    for f, _ in new_funcs:
        if f.anchor is None:
            raise ExecError(f"new function {f.name} has no INSERT_AFTER")
        anchor = base.get(f.anchor)
        if anchor is None:
            raise ExecError(f"INSERT_AFTER F{f.anchor}: unknown anchor")
        _, end = block_span(module, anchor["name"])
        spans.append((end, end, "\n" + emit(f)))

    out = module
    for start, end, text in sorted(spans, key=lambda s: (s[0], s[1]), reverse=True):
        out = out[:start] + text + out[end:]
    return out
