import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, test } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = process.cwd();

const notionRichText = (content: string) => [
  { type: "text", plain_text: content, text: { content } },
];

const notionPage = ({
  id,
  title = "",
  slug = "",
  status = "Published",
}: {
  id: string;
  title?: string;
  slug?: string;
  status?: string;
}) => ({
  object: "page",
  id,
  archived: false,
  in_trash: false,
  properties: {
    Name: { type: "title", title: title ? notionRichText(title) : [] },
    Status: { type: "select", select: { name: status } },
    Slug: { type: "rich_text", rich_text: slug ? notionRichText(slug) : [] },
    "Cover image": { type: "files", files: [] },
    "OG image": { type: "files", files: [] },
  },
});

describe("sync-notion-blog audit", () => {
  test("ignores untitled placeholder Notion rows that sync also skips", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "notion-blog-audit-"));
    const postsDir = path.join(tempRoot, "src", "posts");
    await mkdir(postsDir, { recursive: true });
    await writeFile(
      path.join(postsDir, "example-post.md"),
      [
        "---",
        "title: 'Example post'",
        "slug: example-post",
        "date: '2026-05-26T00:00:00.000Z'",
        "---",
        "",
      ].join("\n"),
    );

    const mockFetch = path.join(tempRoot, "mock-notion-fetch.mjs");
    await writeFile(
      mockFetch,
      `const json = (body) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
const pages = [
  ${JSON.stringify(notionPage({ id: "page-with-local-post", title: "Example post", slug: "example-post" }))},
  ${JSON.stringify(notionPage({ id: "blank-placeholder-row" }))},
];
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(String(input));
  if (url.pathname === '/v1/databases/db123') {
    return json({
      properties: {
        Status: { select: { options: [{ name: 'Draft' }, { name: 'Ready' }, { name: 'Published' }] } },
        Importance: { select: { options: [{ name: 'Featured' }, { name: 'Standard' }, { name: 'SEO' }] } },
      },
    });
  }
  if (url.pathname === '/v1/databases/db123/query' && options.method === 'POST') {
    return json({ results: pages, has_more: false, next_cursor: null });
  }
  if (url.pathname === '/v1/blocks/page-with-local-post/children') {
    return json({ results: [], has_more: false, next_cursor: null });
  }
  if (url.pathname === '/v1/blocks/blank-placeholder-row/children') {
    throw new Error('audit should skip blank placeholder rows before reading blocks');
  }
  throw new Error(\`Unexpected Notion request: \${options.method ?? 'GET'} \${url.pathname}\`);
};
`,
    );

    const { stdout } = await execFileAsync(
      process.execPath,
      ["--import", mockFetch, path.join(repoRoot, "scripts", "sync-notion-blog.mjs"), "--audit"],
      {
        cwd: tempRoot,
        env: {
          ...process.env,
          NOTION_API_KEY: "test-notion-key",
          NOTION_BLOG_DATABASE_ID: "db123",
        },
      },
    );

    expect(stdout).toContain("Notion blog audit passed for 1 non-draft page(s).");
  });

  test("warns without failing when Notion rich text is missing an inline annotation", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "notion-blog-audit-"));
    const postsDir = path.join(tempRoot, "src", "posts");
    await mkdir(postsDir, { recursive: true });
    await writeFile(
      path.join(postsDir, "example-post.md"),
      [
        "---",
        "title: 'Example post'",
        "slug: example-post",
        "date: '2026-05-26T00:00:00.000Z'",
        "---",
        "",
        "This paragraph has **bold** text.",
      ].join("\n"),
    );

    const mockFetch = path.join(tempRoot, "mock-notion-fetch.mjs");
    await writeFile(
      mockFetch,
      `const json = (body) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
const page = ${JSON.stringify(notionPage({ id: "page-with-local-post", title: "Example post", slug: "example-post" }))};
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(String(input));
  if (url.pathname === '/v1/databases/db123') {
    return json({
      properties: {
        Status: { select: { options: [{ name: 'Draft' }, { name: 'Ready' }, { name: 'Published' }] } },
        Importance: { select: { options: [{ name: 'Featured' }, { name: 'Standard' }, { name: 'SEO' }] } },
      },
    });
  }
  if (url.pathname === '/v1/databases/db123/query' && options.method === 'POST') {
    return json({ results: [page], has_more: false, next_cursor: null });
  }
  if (url.pathname === '/v1/blocks/page-with-local-post/children') {
    return json({
      results: [{
        type: 'paragraph',
        has_children: false,
        paragraph: {
          rich_text: [{ type: 'text', plain_text: 'This paragraph has bold text.', text: { content: 'This paragraph has bold text.' }, annotations: { bold: false } }],
        },
      }],
      has_more: false,
      next_cursor: null,
    });
  }
  throw new Error(\`Unexpected Notion request: \${options.method ?? 'GET'} \${url.pathname}\`);
};
`,
    );

    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      ["--import", mockFetch, path.join(repoRoot, "scripts", "sync-notion-blog.mjs"), "--audit"],
      {
        cwd: tempRoot,
        env: {
          ...process.env,
          NOTION_API_KEY: "test-notion-key",
          NOTION_BLOG_DATABASE_ID: "db123",
        },
      },
    );

    expect(stderr).toContain("example-post: bold incomplete expected_at_least=1 actual=0");
    expect(stdout).toContain("Notion blog audit passed for 1 non-draft page(s).");
  });

  test("sync writes valid GFM table delimiters for Notion tables without column-header metadata", async () => {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "notion-blog-sync-"));
    const postsDir = path.join(tempRoot, "src", "posts");
    const apiDir = path.join(tempRoot, "src", "api");
    await mkdir(postsDir, { recursive: true });
    await mkdir(apiDir, { recursive: true });
    await writeFile(
      path.join(apiDir, "blog.ts"),
      "export const BLOG_FEATURED_SLUG = 'old-featured';\n",
    );

    const mockFetch = path.join(tempRoot, "mock-notion-fetch.mjs");
    await writeFile(
      mockFetch,
      `const json = (body) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
const page = ${JSON.stringify(notionPage({ id: "page-with-table", title: "Table post", slug: "table-post" }))};
Object.assign(page.properties, {
  Excerpt: { type: 'rich_text', rich_text: [] },
  Authors: { type: 'rich_text', rich_text: [] },
  Importance: { type: 'select', select: { name: 'Standard' } },
  'Publication date': { type: 'date', date: null },
  'Cover alt': { type: 'rich_text', rich_text: [] },
});
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(String(input));
  if (url.pathname === '/v1/databases/db123') {
    return json({
      properties: {
        Status: { select: { options: [{ name: 'Draft' }, { name: 'Ready' }, { name: 'Published' }] } },
        Importance: { select: { options: [{ name: 'Featured' }, { name: 'Standard' }, { name: 'SEO' }] } },
      },
    });
  }
  if (url.pathname === '/v1/databases/db123' && options.method === 'PATCH') {
    return json({ id: 'db123' });
  }
  if (url.pathname === '/v1/databases/db123/query' && options.method === 'POST') {
    return json({ results: [page], has_more: false, next_cursor: null });
  }
  if (url.pathname === '/v1/blocks/page-with-table/children') {
    return json({
      results: [{
        id: 'table-block',
        type: 'table',
        archived: false,
        in_trash: false,
        has_children: true,
        table: { table_width: 2, has_column_header: false, has_row_header: false },
      }],
      has_more: false,
      next_cursor: null,
    });
  }
  if (url.pathname === '/v1/blocks/table-block/children') {
    return json({
      results: [
        { type: 'table_row', archived: false, in_trash: false, table_row: { cells: [[{ type: 'text', plain_text: 'Tool', text: { content: 'Tool' } }], [{ type: 'text', plain_text: 'Best For', text: { content: 'Best For' } }]] } },
        { type: 'table_row', archived: false, in_trash: false, table_row: { cells: [[{ type: 'text', plain_text: 'OpenHands', text: { content: 'OpenHands' } }], [{ type: 'text', plain_text: 'Autonomous work', text: { content: 'Autonomous work' } }]] } },
      ],
      has_more: false,
      next_cursor: null,
    });
  }
  throw new Error(\`Unexpected Notion request: \${options.method ?? 'GET'} \${url.pathname}\`);
};
`,
    );

    await execFileAsync(
      process.execPath,
      ["--import", mockFetch, path.join(repoRoot, "scripts", "sync-notion-blog.mjs")],
      {
        cwd: tempRoot,
        env: {
          ...process.env,
          NOTION_API_KEY: "test-notion-key",
          NOTION_BLOG_DATABASE_ID: "db123",
        },
      },
    );

    const markdown = await readFile(path.join(postsDir, "table-post.md"), "utf8");

    expect(markdown).toContain("| Tool | Best For |");
    expect(markdown).toContain("| --- | --- |");
    expect(markdown).toContain("| OpenHands | Autonomous work |");
  });
});
