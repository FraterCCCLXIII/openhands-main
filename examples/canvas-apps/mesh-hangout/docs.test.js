import { readdirSync, readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DOCS, activate, renderMarkdown } from "./extension.js";
import { PAGES, buildBlock, embed } from "./scripts/embed-docs.mjs";

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (fn, ms = 1000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) { try { if (fn()) return; } catch { /* retry */ } await tick(5); }
  throw new Error("waitFor timed out");
};

beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  vi.stubGlobal("fetch", async () => { throw new Error("offline"); });
});
afterEach(() => { vi.unstubAllGlobals(); document.body.replaceChildren(); localStorage.clear(); });

function mountApp(saved = {}) {
  localStorage.clear();
  localStorage.setItem("mesh-hangout:v1", JSON.stringify(saved));
  let mountFn;
  activate({ apiVersion: "1", registerPage: (_id, fn) => { mountFn = fn; return () => {}; } });
  const container = document.createElement("div");
  document.body.append(container);
  return { container, dispose: mountFn({ container }) };
}
const buttonByText = (container, text) => [...container.querySelectorAll("button")].find((b) => b.textContent === text);

describe("embedded docs", () => {
  it("match the files in docs/ and the generated block in extension.js", () => {
    DOCS.forEach((d, i) => {
      expect(d.id).toBe(PAGES[i].id);
      expect(d.markdown).toBe(readFileSync(resolve("docs", PAGES[i].file), "utf8"));
    });
    expect(DOCS).toHaveLength(PAGES.length);
    const source = readFileSync(resolve("extension.js"), "utf8");
    expect(embed(source, buildBlock())).toBe(source);
  });

  it("cover every Markdown file in docs/, and imported pages name their source", () => {
    const files = readdirSync(resolve("docs")).filter((f) => f.endsWith(".md")).sort();
    expect(PAGES.map((p) => p.file).sort()).toEqual(files);
    DOCS.filter((d) => d.id.startsWith("protocol-")).forEach((d) => expect(d.markdown).toMatch(/^> Source: https:\/\/github\.com\/FraterCCCLXIII\/mesh-protocol\//m));
  });
});

describe("docs renderer safety", () => {
  it("shows HTML-looking text as text", () => {
    const node = renderMarkdown("<img src=x onerror=alert(1)> and <script>alert(2)</script>\n\n`<b>`", { httpOnly: true });
    expect(node.querySelector("img, script, b")).toBeNull();
    expect(node.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("refuses javascript: and mailto: links in docs, and opens http(s) links safely", () => {
    const node = renderMarkdown("[bad](javascript:alert(1)) [mail](mailto:a@b.c) [ok](https://example.com/x)", { httpOnly: true });
    const links = [...node.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["https://example.com/x"]);
    expect(links[0].target).toBe("_blank");
    expect(links[0].rel).toBe("noopener noreferrer");
    expect(node.textContent).toContain("bad");
  });

  it("renders headings, lists, code, quotes, tables and rules", () => {
    const node = renderMarkdown("## H\n\n1. one\n2. two\n\n- a\n- b\n\n> q\n\n```js\nx<1\n```\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n---\n\n**b** *i* `c`");
    ["h4", "ol li", "ul li", "blockquote", "pre code", "table th", "hr", "strong", "em", "p code"].forEach((sel) => expect(node.querySelector(sel), sel).not.toBeNull());
    expect(node.querySelector("pre code").textContent).toBe("x<1");
  });
});

describe("docs reader", () => {
  it("opens from the welcome screen, switches pages and goes back", async () => {
    const { container, dispose } = mountApp({ welcomed: false });
    await waitFor(() => container.querySelector(".welcome"));
    const open = buttonByText(container, "Learn about the MESH protocol");
    expect(open).toBeTruthy();
    open.click();

    const page = container.querySelector(".dpage");
    expect(page.querySelector("h2").textContent).toBe(DOCS[0].title);
    expect(document.activeElement).toBe(page.querySelector("h2"));
    expect(container.querySelector(".welcome")).toBeNull();
    expect(container.querySelectorAll(".dnav button")).toHaveLength(DOCS.length);

    const target = DOCS.find((d) => d.id === "how-it-works");
    buttonByText(container, target.title).click();
    expect(container.querySelector(".dpage h2").textContent).toBe(target.title);
    expect(container.querySelector('.dnav [aria-current="page"]').textContent).toBe(target.title);
    expect(container.querySelectorAll('.dnav [aria-current="page"]')).toHaveLength(1);

    buttonByText(container, "Back").click();
    expect(container.querySelector(".welcome")).not.toBeNull();
    expect(container.querySelector(".docs")).toBeNull();
    expect(document.activeElement).toBe(buttonByText(container, "Learn about the MESH protocol"));
    dispose();
  });

  it("is reachable from the Docs link once welcomed, returns to the chat, and copies the Markdown", async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    const { container, dispose } = mountApp({ welcomed: true, forceDemo: true });
    await waitFor(() => container.querySelector(".thread .msg"));
    buttonByText(container, "Docs").click();
    expect(container.querySelector(".dpage")).not.toBeNull();
    expect(container.querySelector(".composerwrap")).toBeNull();

    buttonByText(container, "Copy Markdown").click();
    await waitFor(() => writeText.mock.calls.length === 1);
    expect(writeText).toHaveBeenCalledWith(DOCS[0].markdown);

    buttonByText(container, "Back").click();
    expect(container.querySelector(".docs")).toBeNull();
    await waitFor(() => container.querySelector(".thread .msg"));
    expect(container.querySelector(".composerwrap")).not.toBeNull();
    dispose();
  });
});
