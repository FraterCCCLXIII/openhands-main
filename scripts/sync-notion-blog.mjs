#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://api.notion.com/v1';
const NOTION_VERSION = process.env.NOTION_VERSION ?? '2022-06-28';
const POSTS_DIR = process.env.BLOG_POSTS_DIR ?? 'src/posts';
const PUBLIC_DIR = process.env.PUBLIC_DIR ?? 'public';
const ASSET_BASE_URL = process.env.NOTION_BLOG_ASSET_BASE_URL ?? 'https://openhands.dev';
const NOTICE = 'This Notion page was created by an AI agent (OpenHands) on behalf of the user during the GitHub-to-Notion blog migration.';
const argv = new Set(process.argv.slice(2));
const seedMode = argv.has('--seed');
const checkOnly = argv.has('--check') || argv.has('--dry-run');
const keepMissing = argv.has('--keep-missing');
const verbose = argv.has('--verbose');
const repoRoot = process.cwd();
const postsDir = path.resolve(repoRoot, POSTS_DIR);
const publicDir = path.resolve(repoRoot, PUBLIC_DIR);

class UserError extends Error {}
const token = () => process.env.NOTION_API_KEY || process.env.NOTION_INTEGRATION_KEY;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const normalizeId = (id) => id?.replaceAll('-', '');
const assertValue = (name, value) => { if (!value) throw new UserError(`${name} is required.`); return value; };
const comparableMarkdownHash = (value) => sha256(String(value).split('\n').filter((line) => line.trim() !== '').join('\n'));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const notion = async (endpoint, options = {}) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(`${API}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${assertValue('NOTION_API_KEY or NOTION_INTEGRATION_KEY', token())}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (response.ok) return body;
    if (response.status === 429 || response.status >= 500) {
      await sleep((Number(response.headers.get('retry-after')) || attempt + 1) * 2000);
      continue;
    }
    throw new Error(`Notion API ${options.method ?? 'GET'} ${endpoint} failed (${response.status}): ${text}`);
  }
  throw new Error(`Notion API ${options.method ?? 'GET'} ${endpoint} failed after retries.`);
};

const textChunks = (value) => {
  const text = String(value ?? '');
  if (!text) return [{ type: 'text', text: { content: '' } }];
  const parts = [];
  for (let i = 0; i < text.length; i += 1900) parts.push({ type: 'text', text: { content: text.slice(i, i + 1900) } });
  return parts;
};
const richText = (value) => textChunks(value);
const richTextProp = (value) => ({ rich_text: richText(value) });
const titleProp = (value) => ({ title: [{ type: 'text', text: { content: String(value ?? '') } }] });
const plain = (parts = []) => parts.map((part) => part.plain_text ?? part.text?.content ?? '').join('');
const pageProp = (page, names) => {
  for (const name of names) {
    const prop = page.properties?.[name];
    if (!prop) continue;
    if (prop.type === 'title') return plain(prop.title);
    if (prop.type === 'rich_text') return plain(prop.rich_text);
    if (prop.type === 'url') return prop.url ?? '';
    if (prop.type === 'date') return prop.date?.start ?? '';
  }
  return '';
};
const readIfExists = async (file) => { try { return await readFile(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
const writeIfChanged = async (file, content, report, label) => {
  const next = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
  const current = await readIfExists(file);
  if (current && sha256(current) === sha256(next)) return false;
  report.changed.push(label);
  if (!checkOnly) { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, next); }
  return true;
};

const normalizePostPath = (fileName) => {
  const normalized = fileName.replaceAll('\\', '/').replace(/^\/+/, '');
  if (!normalized.endsWith('.md') || normalized.includes('..') || path.isAbsolute(normalized)) throw new Error(`Unsafe blog post path: ${fileName}`);
  return normalized.includes('/') ? normalized : `${POSTS_DIR}/${normalized}`;
};
const normalizeAssetPath = (assetPath) => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(assetPath)) throw new Error(`Expected repository-local asset path, got URL: ${assetPath}`);
  const normalized = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  if (!normalized.startsWith('/assets/')) throw new Error(`Only /assets/ paths are supported for blog assets: ${assetPath}`);
  return normalized;
};
const absoluteAssetUrl = (assetPath) => `${ASSET_BASE_URL}${normalizeAssetPath(assetPath)}`;
const notionImageUrl = (src) => src.startsWith('/assets/') ? absoluteAssetUrl(src) : src;
const localAssetPathFromUrl = (url) => {
  try {
    const parsed = new URL(url);
    const base = new URL(ASSET_BASE_URL);
    if (parsed.origin === base.origin && parsed.pathname.startsWith('/assets/')) return decodeURI(parsed.pathname);
  } catch {}
  return url;
};
const assetFile = (assetPath) => path.resolve(publicDir, normalizeAssetPath(assetPath).slice(1));
const repoPath = (relativePath) => path.resolve(repoRoot, relativePath);

const queryDatabase = async (databaseId) => {
  const pages = [];
  let cursor;
  do {
    const body = await notion(`/databases/${databaseId}/query`, { method: 'POST', body: JSON.stringify({ page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) }) });
    pages.push(...body.results.filter((item) => item.object === 'page' && !item.archived && !item.in_trash));
    cursor = body.has_more ? body.next_cursor : undefined;
  } while (cursor);
  return pages;
};
const listBlocks = async (blockId) => {
  const blocks = [];
  let cursor;
  do {
    const params = new URLSearchParams({ page_size: '100' });
    if (cursor) params.set('start_cursor', cursor);
    const body = await notion(`/blocks/${blockId}/children?${params}`);
    blocks.push(...body.results.filter((block) => !block.archived && !block.in_trash));
    cursor = body.has_more ? body.next_cursor : undefined;
  } while (cursor);
  return blocks;
};
const notionCodeLanguage = (language) => {
  const normalized = language.trim().toLowerCase();
  if (!normalized || normalized === 'plaintext' || normalized === 'plain') return 'plain text';
  if (normalized === 'md') return 'markdown';
  if (normalized === 'js') return 'javascript';
  if (normalized === 'ts') return 'typescript';
  return normalized;
};


const splitMarkdown = (raw) => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  return match ? { frontmatter: match[1], body: raw.slice(match[0].length) } : { frontmatter: '', body: raw };
};
const markdownImage = (line) => line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
const paragraphBlock = (text) => ({ object: 'block', type: 'paragraph', paragraph: { rich_text: richText(text) } });
const markdownBodyToBlocks = (body) => {
  const lines = body.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
  const blocks = [];
  let i = 0;
  const pushParagraph = (paragraphLines) => {
    const text = paragraphLines.join('\n');
    if (!text) return;
    const image = markdownImage(text.trim());
    if (image) blocks.push({ object: 'block', type: 'image', image: { type: 'external', external: { url: notionImageUrl(image[2]) }, caption: image[1] ? richText(image[1]) : [] } });
    else blocks.push(paragraphBlock(text));
  };
  while (i < lines.length) {
    if (lines[i] === '') { i += 1; continue; }
    const fence = lines[i].match(/^```([^`]*)$/);
    if (fence) {
      const originalLanguage = fence[1].trim();
      const code = [];
      for (i += 1; i < lines.length && lines[i] !== '```'; i += 1) code.push(lines[i]);
      if (i < lines.length) i += 1;
      blocks.push({
        object: 'block',
        type: 'code',
        code: {
          language: notionCodeLanguage(originalLanguage),
          rich_text: richText(code.join('\n')),
          caption: originalLanguage ? richText(originalLanguage) : [],
        },
      });
      continue;
    }
    const heading = lines[i].match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const type = `heading_${heading[1].length}`;
      blocks.push({ object: 'block', type, [type]: { rich_text: richText(heading[2]) } });
      i += 1;
      continue;
    }
    const quote = lines[i].match(/^>\s?(.*)$/);
    if (quote) {
      const quoteLines = [];
      while (i < lines.length) {
        const match = lines[i].match(/^>\s?(.*)$/);
        if (!match) break;
        quoteLines.push(match[1]);
        i += 1;
      }
      blocks.push({ object: 'block', type: 'quote', quote: { rich_text: richText(quoteLines.join('\n')) } });
      continue;
    }
    const paragraphLines = [];
    while (i < lines.length && lines[i] !== '' && !/^```/.test(lines[i]) && !/^(#{1,3})\s+/.test(lines[i]) && !/^>\s?/.test(lines[i])) paragraphLines.push(lines[i++]);
    pushParagraph(paragraphLines);
  }
  return blocks;
};

const blockToMarkdown = (block) => {
  if (block.type === 'paragraph') return plain(block.paragraph.rich_text);
  if (block.type === 'heading_1') return `# ${plain(block.heading_1.rich_text)}`;
  if (block.type === 'heading_2') return `## ${plain(block.heading_2.rich_text)}`;
  if (block.type === 'heading_3') return `### ${plain(block.heading_3.rich_text)}`;
  if (block.type === 'quote') return plain(block.quote.rich_text).split('\n').map((line) => `> ${line}`).join('\n');
  if (block.type === 'code') {
    const originalLanguage = plain(block.code.caption);
    const language = originalLanguage || (block.code.language && block.code.language !== 'plain text' ? block.code.language : '');
    return `\`\`\`${language}\n${plain(block.code.rich_text)}\n\`\`\``;
  }
  if (block.type === 'image') {
    const src = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
    return `![${plain(block.image.caption)}](${localAssetPathFromUrl(src)})`;
  }
  if (block.type === 'divider') return '---';
  return '';
};
const pageBodyMarkdown = async (pageId) => {
  const blocks = (await listBlocks(pageId)).filter((block) => blockToMarkdown(block) !== NOTICE);
  const body = blocks.map(blockToMarkdown).filter(Boolean).join('\n\n');
  return body ? `${body}\n` : '';
};
const collectMarkdownAssetPaths = (markdown) => [...markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)]
  .map((match) => localAssetPathFromUrl(match[1])).filter((src) => src.startsWith('/assets/')).sort();
const syncAsset = async (assetPath, report) => {
  const localPath = normalizeAssetPath(assetPath);
  const local = await readIfExists(assetFile(localPath));
  const response = await fetch(absoluteAssetUrl(localPath));
  if (!response.ok) {
    if (local) {
      report.assetsUnchanged += 1;
      return;
    }
    throw new Error(`Failed to download ${absoluteAssetUrl(localPath)} (${response.status}) for ${localPath}.`);
  }
  const remote = Buffer.from(await response.arrayBuffer());
  if (local && sha256(local) === sha256(remote)) { report.assetsUnchanged += 1; return; }
  report.assetUpdates += 1;
  await writeIfChanged(assetFile(localPath), remote, report, localPath);
};

const fallbackFrontmatter = (page) => {
  const title = pageProp(page, ['Name', 'Title']);
  const slug = pageProp(page, ['Slug']);
  const date = pageProp(page, ['Publication date']);
  const authors = pageProp(page, ['Authors']);
  return [`title: ${JSON.stringify(title)}`, slug && `slug: ${slug}`, date && `date: '${date}'`, authors && `authors:\n${authors.split(',').map((author) => `  - name: ${author.trim()}`).join('\n')}`].filter(Boolean).join('\n');
};
const syncFromNotion = async () => {
  const databaseId = normalizeId(assertValue('NOTION_BLOG_DATABASE_ID', process.env.NOTION_BLOG_DATABASE_ID));
  const pages = await queryDatabase(databaseId);
  const expected = new Set();
  const report = { pages: pages.length, markdownUpdates: 0, assetUpdates: 0, assetsUnchanged: 0, deletedPosts: 0, changed: [] };
  for (const page of pages) {
    const fileProp = pageProp(page, ['File', 'Repository path', 'Path']);
    const title = pageProp(page, ['Name', 'Title']);
    if (!fileProp && !title.endsWith('.md')) { if (verbose) console.warn(`Skipping Notion page without File property: ${page.id}`); continue; }
    const relative = normalizePostPath(fileProp || title);
    expected.add(relative);
    const frontmatter = pageProp(page, ['Frontmatter']) || fallbackFrontmatter(page);
    const body = await pageBodyMarkdown(page.id);
    const markdown = `---\n${frontmatter}\n---\n${body}`;
    const current = await readIfExists(repoPath(relative));
    const currentMarkdown = current?.toString('utf8');
    const markdownMatches = currentMarkdown && (sha256(currentMarkdown) === sha256(markdown) || comparableMarkdownHash(currentMarkdown) === comparableMarkdownHash(markdown));
    if (!markdownMatches) { report.markdownUpdates += 1; await writeIfChanged(repoPath(relative), markdown, report, relative); }
    for (const assetPath of collectMarkdownAssetPaths(body)) await syncAsset(assetPath, report);
  }
  if (!keepMissing) {
    for (const file of await readdir(postsDir)) {
      if (!file.endsWith('.md')) continue;
      const relative = `${POSTS_DIR}/${file}`;
      if (expected.has(relative)) continue;
      report.deletedPosts += 1; report.changed.push(relative);
      if (!checkOnly) await unlink(repoPath(relative));
    }
  }
  console.log(`Notion blog sync checked ${report.pages} Notion pages.`);
  console.log(`Markdown updates: ${report.markdownUpdates}; asset updates: ${report.assetUpdates}; deleted posts: ${report.deletedPosts}.`);
  if (!report.changed.length) return console.log('No differences found between Notion and the repository.');
  console.log('Changed paths:');
  for (const changed of report.changed) console.log(`- ${changed}`);
  if (checkOnly) { console.error('Differences found while running in --check/--dry-run mode.'); process.exitCode = 1; }
};

const databaseProperties = () => ({
  Name: { title: {} }, File: { rich_text: {} }, Slug: { rich_text: {} }, 'Publication date': { date: {} }, Authors: { rich_text: {} }, Published: { checkbox: {} },
  Excerpt: { rich_text: {} }, 'Cover image': { url: {} }, 'Cover alt': { rich_text: {} }, 'Cover radius': { rich_text: {} }, 'OG image URL': { url: {} }, 'SEO title date': { rich_text: {} },
  Frontmatter: { rich_text: {} }, 'Markdown SHA256': { rich_text: {} }, 'Assets SHA256': { rich_text: {} },
});
const createDatabase = (parentPageId) => notion('/databases', { method: 'POST', body: JSON.stringify({ parent: { type: 'page_id', page_id: parentPageId }, icon: { type: 'emoji', emoji: '✍️' }, title: [{ type: 'text', text: { content: 'OpenHands Blog Source' } }], description: [{ type: 'text', text: { content: NOTICE } }], properties: databaseProperties() }) });
const ensureDatabaseProperties = (databaseId) => notion(`/databases/${databaseId}`, { method: 'PATCH', body: JSON.stringify({ properties: databaseProperties() }) });
const markdownAssetManifest = async (body, data) => {
  const paths = new Set(collectMarkdownAssetPaths(body));
  for (const value of [data.coverImage, data.featuredImage, data.ogImage?.url]) if (typeof value === 'string' && value.startsWith('/assets/')) paths.add(value);
  const manifest = [];
  for (const assetPath of [...paths].sort()) {
    const bytes = await readIfExists(assetFile(assetPath));
    if (bytes) manifest.push({ path: normalizeAssetPath(assetPath), sha256: sha256(bytes), sourceUrl: absoluteAssetUrl(assetPath) });
  }
  return JSON.stringify(manifest, null, 2);
};
const postProperties = async (file, raw, data, frontmatter, body) => {
  const authors = Array.isArray(data.authors) ? data.authors.map((author) => author?.name).filter(Boolean).join(', ') : '';
  const assetManifest = await markdownAssetManifest(body, data);
  return {
    Name: titleProp(data.title ?? file), File: richTextProp(`${POSTS_DIR}/${file}`), Slug: richTextProp(data.slug ?? ''), 'Publication date': data.date ? { date: { start: data.date } } : { date: null },
    Authors: richTextProp(authors), Published: { checkbox: data.published !== false }, Excerpt: richTextProp(data.excerpt ?? ''), 'Cover image': { url: typeof data.coverImage === 'string' ? notionImageUrl(data.coverImage) : null },
    'Cover alt': richTextProp(data.coverAlt ?? ''), 'Cover radius': richTextProp(data.coverRadius ?? ''), 'OG image URL': { url: typeof data.ogImage?.url === 'string' ? notionImageUrl(data.ogImage.url) : null },
    'SEO title date': richTextProp(data.seoTitleDate ?? ''), Frontmatter: richTextProp(frontmatter), 'Markdown SHA256': richTextProp(sha256(raw)), 'Assets SHA256': richTextProp(sha256(assetManifest)),
  };
};
const appendBlocks = async (pageId, blocks) => { for (let i = 0; i < blocks.length; i += 100) await notion(`/blocks/${pageId}/children`, { method: 'PATCH', body: JSON.stringify({ children: blocks.slice(i, i + 100) }) }); };
const archiveChildren = async (pageId) => { for (const block of await listBlocks(pageId)) await notion(`/blocks/${block.id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) }); };
const createOrUpdatePostPage = async (databaseId, existingPage, file, raw, data) => {
  const { frontmatter, body } = splitMarkdown(raw);
  const properties = await postProperties(file, raw, data, frontmatter, body);
  const blocks = [paragraphBlock(NOTICE), ...markdownBodyToBlocks(body)];
  if (existingPage) { await notion(`/pages/${existingPage.id}`, { method: 'PATCH', body: JSON.stringify({ properties }) }); await archiveChildren(existingPage.id); await appendBlocks(existingPage.id, blocks); return; }
  const page = await notion('/pages', { method: 'POST', body: JSON.stringify({ parent: { database_id: databaseId }, properties, children: blocks.slice(0, 100) }) });
  await appendBlocks(page.id, blocks.slice(100));
};
const seedNotion = async () => {
  const database = process.env.NOTION_BLOG_DATABASE_ID ? { id: normalizeId(process.env.NOTION_BLOG_DATABASE_ID) } : await createDatabase(assertValue('NOTION_PARENT_PAGE_ID', process.env.NOTION_PARENT_PAGE_ID));
  const matter = (await import('gray-matter')).default;
  await ensureDatabaseProperties(database.id);
  const existingPages = await queryDatabase(database.id);
  const pagesByFile = new Map(existingPages.map((page) => [pageProp(page, ['File', 'Repository path', 'Path']), page]).filter(([file]) => Boolean(file)));
  const files = (await readdir(postsDir)).filter((file) => file.endsWith('.md')).sort();
  for (const [index, file] of files.entries()) {
    const raw = await readFile(path.join(postsDir, file), 'utf8');
    const existingPage = pagesByFile.get(`${POSTS_DIR}/${file}`);
    console.log(`${existingPage ? 'Updating' : 'Creating'} Notion blog page ${index + 1}/${files.length}: ${file}`);
    await createOrUpdatePostPage(database.id, existingPage, file, raw, matter(raw).data);
  }
  console.log(`Updated Notion blog database: ${database.id}`);
  console.log(`Set NOTION_BLOG_DATABASE_ID=${database.id} in GitHub Actions to sync from this database.`);
};

try {
  if (!(await stat(postsDir)).isDirectory()) throw new UserError(`Blog posts directory does not exist: ${postsDir}`);
  if (seedMode) await seedNotion(); else await syncFromNotion();
} catch (error) {
  console.error(error instanceof UserError ? error.message : error);
  process.exitCode = 1;
}
