import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DOCS, activate, renderMarkdown } from "./extension.js";
import { PAGES, buildBlock, embed } from "./scripts/embed-docs.mjs";

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const buttonByText = (container, text) => [...container.querySelectorAll("button")].find((b) => b.textContent === text);

afterEach(() => { vi.unstubAllGlobals(); document.body.replaceChildren(); localStorage.clear(); });

function mountApp() {
  localStorage.clear();
  let mountFn;
  activate({ apiVersion: "1", registerPage: (_id, fn) => { mountFn = fn; return () => {}; } });
  const container = document.createElement("div");
  document.body.append(container);
  return { container, dispose: mountFn({ container }) };
}

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

  it("cover every Markdown file in docs/, and any imported page names its source", () => {
    const files = readdirSync(resolve("docs")).filter((f) => f.endsWith(".md")).sort();
    expect(PAGES.map((p) => p.file).sort()).toEqual(files);
    // Pages are authored here unless their id starts with "imported-"; those must carry a Source line.
    DOCS.filter((d) => d.id.startsWith("imported-")).forEach((d) => expect(d.markdown).toMatch(/^> Source: https:\/\//m));
    DOCS.filter((d) => !d.id.startsWith("imported-")).forEach((d) => expect(d.markdown).toMatch(/^> Authored for this app/m));
  });
});

describe("docs renderer safety", () => {
  it("shows HTML-looking text as text", () => {
    const node = renderMarkdown("<img src=x onerror=alert(1)> and <script>alert(2)</script>\n\n`<b>`", { httpOnly: true });
    expect(node.querySelector("img, script, b")).toBeNull();
    expect(node.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("refuses javascript: and mailto: links in docs, but chat messages keep mailto:", () => {
    const md = "[bad](javascript:alert(1)) [mail](mailto:a@b.c) [ok](https://example.com/x)";
    const docs = renderMarkdown(md, { httpOnly: true });
    const links = [...docs.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["https://example.com/x"]);
    expect(links[0].target).toBe("_blank");
    expect(links[0].rel).toBe("noopener noreferrer");
    expect(docs.textContent).toContain("bad");
    const chat = renderMarkdown(md);
    expect([...chat.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual(["mailto:a@b.c", "https://example.com/x"]);
  });
});

describe("docs reader", () => {
  it("opens from the welcome screen, switches pages and goes back", async () => {
    const { container, dispose } = mountApp();
    await tick(10);
    const open = buttonByText(container, "Learn about Holons");
    expect(open).toBeTruthy();
    expect(container.querySelector(".welcome").textContent).toContain("Demo mode");
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
    expect(container.querySelector(".team")).toBeNull();

    buttonByText(container, "Back").click();
    expect(container.querySelector(".welcome")).not.toBeNull();
    expect(container.querySelector(".docs")).toBeNull();
    expect(container.querySelector(".team")).not.toBeNull();
    expect(document.activeElement).toBe(buttonByText(container, "Learn about Holons"));
    dispose();
  });

  it("is reachable from the Docs link inside a Holon, returns to the feed, and copies the Markdown", async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    const { container, dispose } = mountApp();
    await tick(10);
    container.querySelector(".rail [data-holon='1']").click();
    await tick(10);
    expect(container.querySelector(".msg")).not.toBeNull();
    buttonByText(container, "Docs").click();
    expect(container.querySelector(".dpage")).not.toBeNull();
    expect(container.querySelector(".composer")).toBeNull();

    buttonByText(container, "Copy Markdown").click();
    await tick(5);
    expect(writeText).toHaveBeenCalledWith(DOCS[0].markdown);

    buttonByText(container, "Back").click();
    expect(container.querySelector(".docs")).toBeNull();
    expect(container.querySelector(".msg")).not.toBeNull();
    expect(container.querySelector(".composer")).not.toBeNull();
    dispose();
  });
});
