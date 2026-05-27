#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API = 'https://api.notion.com/v1';
const NOTION_VERSION = process.env.NOTION_VERSION ?? '2022-06-28';
const POSTS_DIR = process.env.BLOG_POSTS_DIR ?? 'src/posts';
const PUBLIC_DIR = process.env.PUBLIC_DIR ?? 'public';
const BLOG_API_FILE = process.env.BLOG_API_FILE ?? 'src/api/blog.ts';
const NOTICE = 'This Notion page was created by an AI agent (OpenHands) on behalf of the user during the GitHub-to-Notion blog migration.';
const rawArgs = process.argv.slice(2);
const argv = new Set(rawArgs);
const seedMode = argv.has('--seed');
const auditMode = argv.has('--audit');
const refreshRichTextMode = argv.has('--refresh-rich-text');
const rebuildBlocksMode = argv.has('--rebuild-blocks');
const checkOnly = argv.has('--check') || argv.has('--dry-run');
const keepMissing = argv.has('--keep-missing');
const verbose = argv.has('--verbose');
const seedOnlySlug = rawArgs.find((arg) => arg.startsWith('--only='))?.slice('--only='.length) ?? process.env.NOTION_SEED_ONLY_SLUG;
const fromIndex = Number(rawArgs.find((arg) => arg.startsWith('--from-index='))?.slice('--from-index='.length) ?? process.env.NOTION_REBUILD_FROM_INDEX ?? 1);
const repoRoot = process.cwd();
const postsDir = path.resolve(repoRoot, POSTS_DIR);
const publicDir = path.resolve(repoRoot, PUBLIC_DIR);

class UserError extends Error {}
const token = () => process.env.NOTION_API_KEY || process.env.NOTION_INTEGRATION_KEY;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const normalizeId = (id) => id?.replaceAll('-', '');
const assertValue = (name, value) => { if (!value) throw new UserError(`${name} is required.`); return value; };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const comparableMarkdownHash = (value) => sha256(String(value).split('\n').filter((line) => line.trim() !== '').join('\n'));
const stringToSlug = (value) => String(value ?? '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
const mimeTypes = new Map([['.avif', 'image/avif'], ['.gif', 'image/gif'], ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'], ['.png', 'image/png'], ['.svg', 'image/svg+xml'], ['.webp', 'image/webp']]);

const notion = async (endpoint, options = {}) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let response;
    try {
      response = await fetch(`${API}${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${assertValue('NOTION_API_KEY or NOTION_INTEGRATION_KEY', token())}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
        },
      });
    } catch (error) {
      if (attempt < 4) {
        await sleep((attempt + 1) * 2000);
        continue;
      }
      throw error;
    }
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch {}
    if (response.ok) return body;
    if (response.status === 429 || response.status >= 500) {
      await sleep((Number(response.headers.get('retry-after')) || attempt + 1) * 2000);
      continue;
    }
    throw new Error(`Notion API ${options.method ?? 'GET'} ${endpoint} failed (${response.status}): ${text}`);
  }
  throw new Error(`Notion API ${options.method ?? 'GET'} ${endpoint} failed after retries.`);
};

const uploadFileToNotion = async (filePath, filename = path.basename(filePath)) => {
  const bytes = await readFile(filePath);
  const contentType = mimeTypes.get(path.extname(filename).toLowerCase()) ?? 'application/octet-stream';
  const upload = await notion('/file_uploads', { method: 'POST', body: JSON.stringify({ mode: 'single_part', filename, content_type: contentType }) });
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: contentType }), filename);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let response;
    try {
      response = await fetch(`${API}/file_uploads/${upload.id}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${assertValue('NOTION_API_KEY or NOTION_INTEGRATION_KEY', token())}`, 'Notion-Version': NOTION_VERSION },
        body: form,
      });
    } catch (error) {
      if (attempt < 4) {
        await sleep((attempt + 1) * 2000);
        continue;
      }
      throw error;
    }
    const text = await response.text();
    if (response.ok) return upload.id;
    if (response.status === 429 || response.status >= 500) {
      await sleep((Number(response.headers.get('retry-after')) || attempt + 1) * 2000);
      continue;
    }
    throw new Error(`Notion file upload failed (${response.status}): ${text}`);
  }
  throw new Error('Notion file upload failed after retries.');
};

const defaultAnnotations = { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' };
const mergeAnnotations = (base = {}, extra = {}) => ({ ...defaultAnnotations, ...base, ...extra });
const isNativeNotionUrl = (url) => /^(https?:|mailto:|tel:|ftp:)/i.test(url);
const normalizeMarkdownLinkUrl = (url) => {
  if (isNativeNotionUrl(url)) return url;
  if (url === '#') return 'https://openhands.dev';
  if (url.startsWith('#')) return `https://openhands.dev/${url}`;
  if (url.startsWith('/')) return `https://openhands.dev${url}`;
  if (url.startsWith('../')) return `https://openhands.dev/blog/${url.replace(/^\.\.\//, '')}`;
  if (/^[a-z0-9][a-z0-9-]*$/i.test(url)) return `https://openhands.dev/blog/${url}`;
  return '';
};
const textChunks = (value, annotations = {}, linkUrl = null) => {
  const text = String(value ?? '');
  const parts = [];
  for (let i = 0; i < text.length; i += 1900) {
    const content = text.slice(i, i + 1900);
    if (!content) continue;
    parts.push({
      type: 'text',
      text: { content, ...(linkUrl ? { link: { url: linkUrl } } : {}) },
      annotations: mergeAnnotations(annotations),
    });
  }
  return parts;
};
const findTokenEnd = (text, marker, start) => {
  let index = start;
  while (index < text.length) {
    const found = text.indexOf(marker, index);
    if (found === -1) return -1;
    if (found === 0 || text[found - 1] !== '\\') return found;
    index = found + marker.length;
  }
  return -1;
};
const findLinkClose = (text, start) => {
  let bracketDepth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === '\\') { index += 1; continue; }
    if (text[index] === '[') bracketDepth += 1;
    if (text[index] === ']') {
      if (bracketDepth === 0) return index;
      bracketDepth -= 1;
    }
  }
  return -1;
};
const parseInlineMarkdown = (value, annotations = {}, linkUrl = null) => {
  const text = String(value ?? '');
  const parts = [];
  let buffer = '';
  const flush = () => {
    if (!buffer) return;
    parts.push(...textChunks(buffer, annotations, linkUrl));
    buffer = '';
  };
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\\' && index + 1 < text.length) {
      buffer += text[index + 1];
      index += 1;
      continue;
    }
    if (text[index] === '`') {
      const end = findTokenEnd(text, '`', index + 1);
      if (end !== -1) {
        flush();
        parts.push(...textChunks(text.slice(index + 1, end), mergeAnnotations(annotations, { code: true }), linkUrl));
        index = end;
        continue;
      }
    }
    if (text.startsWith('~~', index)) {
      const end = findTokenEnd(text, '~~', index + 2);
      if (end !== -1) {
        flush();
        parts.push(...parseInlineMarkdown(text.slice(index + 2, end), mergeAnnotations(annotations, { strikethrough: true }), linkUrl));
        index = end + 1;
        continue;
      }
    }
    const strongMarker = text.startsWith('**', index) ? '**' : text.startsWith('__', index) ? '__' : '';
    if (strongMarker) {
      const end = findTokenEnd(text, strongMarker, index + 2);
      if (end !== -1) {
        flush();
        parts.push(...parseInlineMarkdown(text.slice(index + 2, end), mergeAnnotations(annotations, { bold: true }), linkUrl));
        index = end + 1;
        continue;
      }
    }
    if ((text[index] === '*' || text[index] === '_') && !text.startsWith('**', index) && !text.startsWith('__', index)) {
      const marker = text[index];
      const end = findTokenEnd(text, marker, index + 1);
      if (end !== -1 && end > index + 1 && !/\s/.test(text[index + 1]) && !/\s/.test(text[end - 1])) {
        flush();
        parts.push(...parseInlineMarkdown(text.slice(index + 1, end), mergeAnnotations(annotations, { italic: true }), linkUrl));
        index = end;
        continue;
      }
    }
    if (text[index] === '[') {
      const closeBracket = findLinkClose(text, index + 1);
      if (closeBracket !== -1 && text[closeBracket + 1] === '(') {
        const closeParen = findTokenEnd(text, ')', closeBracket + 2);
        const rawUrl = closeParen === -1 ? '' : text.slice(closeBracket + 2, closeParen).trim().replace(/\s+"[^"]*"$/, '');
        const notionUrl = normalizeMarkdownLinkUrl(rawUrl);
        if (notionUrl) {
          flush();
          parts.push(...parseInlineMarkdown(text.slice(index + 1, closeBracket), annotations, notionUrl));
          index = closeParen;
          continue;
        }
      }
    }
    buffer += text[index];
  }
  flush();
  return parts;
};
const richText = (value) => parseInlineMarkdown(value);
const richTextProp = (value) => ({ rich_text: richText(value) });
const titleProp = (value) => ({ title: [{ type: 'text', text: { content: String(value ?? '') } }] });
const plain = (parts = []) => parts.map((part) => part.plain_text ?? part.text?.content ?? '').join('');
const escapeMarkdownText = (value) => String(value ?? '').replace(/([\\`*_{}\[\]()#+.!~-])/g, '\\$1');
const richTextToMarkdown = (parts = []) => parts.map((part) => {
  let content = part.plain_text ?? part.text?.content ?? '';
  const annotations = part.annotations ?? defaultAnnotations;
  if (!content) return '';
  if (annotations.code) content = `\`${content.replace(/`/g, '\\`')}\``;
  else {
    if (annotations.bold) content = `**${content}**`;
    if (annotations.italic) content = `*${content}*`;
    if (annotations.strikethrough) content = `~~${content}~~`;
  }
  const href = part.href ?? part.text?.link?.url;
  return href ? `[${content}](${href})` : content;
}).join('');
const pageProp = (page, names) => {
  for (const name of names) {
    const prop = page.properties?.[name];
    if (!prop) continue;
    if (prop.type === 'title') return plain(prop.title);
    if (prop.type === 'rich_text') return plain(prop.rich_text);
    if (prop.type === 'url') return prop.url ?? '';
    if (prop.type === 'date') return prop.date?.start ?? '';
    if (prop.type === 'checkbox') return prop.checkbox;
    if (prop.type === 'select') return prop.select?.name ?? '';
    if (prop.type === 'files') return prop.files ?? [];
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
const normalizeAssetPath = (assetPath) => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(assetPath)) throw new Error(`Expected repository-local asset path, got URL: ${assetPath}`);
  const normalized = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  if (!normalized.startsWith('/assets/')) throw new Error(`Only /assets/ paths are supported for blog assets: ${assetPath}`);
  return normalized;
};
const assetFile = (assetPath) => path.resolve(publicDir, normalizeAssetPath(assetPath).slice(1));
const repoPath = (relativePath) => path.resolve(repoRoot, relativePath);
const fileNameFromUrl = (url) => decodeURIComponent(path.basename(new URL(url).pathname));
const imageUrl = (imageOrFile) => {
  if (!imageOrFile) return '';
  if (imageOrFile.type === 'external') throw new Error('External Notion image links are not allowed; upload the image into Notion instead.');
  if (imageOrFile.type === 'file') return imageOrFile.file.url;
  return imageOrFile.url ?? '';
};

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

const splitMarkdown = (raw) => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  return match ? { frontmatter: match[1], body: raw.slice(match[0].length) } : { frontmatter: '', body: raw };
};
const markdownImage = (line) => line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/);
const notionCodeLanguage = (language) => {
  const normalized = language.trim().toLowerCase();
  if (!normalized || normalized === 'plaintext' || normalized === 'plain') return 'plain text';
  if (normalized === 'md') return 'markdown';
  if (normalized === 'js') return 'javascript';
  if (normalized === 'ts') return 'typescript';
  return normalized;
};
const paragraphBlock = (text) => ({ object: 'block', type: 'paragraph', paragraph: { rich_text: richText(text) } });
const imageBlockFromMarkdown = async (alt, assetPath) => {
  const normalized = normalizeAssetPath(assetPath);
  const uploadId = await uploadFileToNotion(assetFile(normalized), path.basename(normalized));
  return { object: 'block', type: 'image', image: { type: 'file_upload', file_upload: { id: uploadId }, caption: alt ? richText(alt) : [] } };
};
const parseTableCells = (line) => {
  const trimmed = line.trim();
  const body = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const withoutTrailing = body.endsWith('|') ? body.slice(0, -1) : body;
  return withoutTrailing.split('|').map((cell) => cell.trim());
};
const isTableDelimiter = (cells) => cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
const iframeSrc = (line) => line.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/iframe>/i)?.[1];
const markdownBodyToBlocks = async (body, options = {}) => {
  const lines = body.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
  const blocks = [];
  let i = 0;
  const pushParagraph = async (paragraphLines) => {
    const text = paragraphLines.join('\n');
    if (!text) return;
    const image = markdownImage(text.trim());
    if (image && options.placeholderImages) blocks.push({ type: 'image_placeholder', alt: image[1], assetPath: image[2] });
    else if (image) blocks.push(await imageBlockFromMarkdown(image[1], image[2]));
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
      blocks.push({ object: 'block', type: 'code', code: { language: notionCodeLanguage(originalLanguage), rich_text: textChunks(code.join('\n')), caption: originalLanguage ? textChunks(originalLanguage) : [] } });
      continue;
    }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(lines[i])) {
      blocks.push({ object: 'block', type: 'divider', divider: {} });
      i += 1;
      continue;
    }
    const embedUrl = iframeSrc(lines[i]);
    if (embedUrl) {
      blocks.push({ object: 'block', type: 'embed', embed: { url: embedUrl, caption: textChunks(lines[i].trim()) } });
      i += 1;
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(lines[i])) {
      const tableLines = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) tableLines.push(lines[i++]);
      const parsedRows = tableLines.map(parseTableCells);
      const hasColumnHeader = parsedRows.length > 1 && isTableDelimiter(parsedRows[1]);
      const dataRows = hasColumnHeader ? [parsedRows[0], ...parsedRows.slice(2)] : parsedRows;
      const tableWidth = Math.max(...dataRows.map((row) => row.length));
      blocks.push({
        object: 'block',
        type: 'table',
        table: {
          table_width: tableWidth,
          has_column_header: hasColumnHeader,
          has_row_header: false,
          children: dataRows.map((row) => ({
            object: 'block',
            type: 'table_row',
            table_row: { cells: Array.from({ length: tableWidth }, (_, index) => richText(row[index] ?? '')) },
          })),
        },
      });
      continue;
    }
    const listItem = (line) => line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
    const listItemIndent = (match) => match[1].replace(/\t/g, '  ').length;
    const isOrderedListItem = (match) => /\d+\./.test(match[2]);
    const list = listItem(lines[i]);
    if (list) {
      const parseList = (indent, ordered) => {
        const items = [];
        while (i < lines.length) {
          const item = listItem(lines[i]);
          if (!item) break;
          const itemIndent = listItemIndent(item);
          const itemOrdered = isOrderedListItem(item);
          if (itemIndent < indent) break;
          if (itemIndent > indent) {
            if (!items.length) break;
            const parent = items[items.length - 1];
            const parentData = parent[parent.type];
            parentData.children = [...(parentData.children ?? []), ...parseList(itemIndent, itemOrdered)];
            continue;
          }
          if (itemOrdered !== ordered) break;
          const type = ordered ? 'numbered_list_item' : 'bulleted_list_item';
          items.push({ object: 'block', type, [type]: { rich_text: richText(item[3]) } });
          i += 1;
        }
        return items;
      };
      blocks.push(...parseList(listItemIndent(list), isOrderedListItem(list)));
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
    while (i < lines.length && lines[i] !== '' && !/^```/.test(lines[i]) && !/^(#{1,3})\s+/.test(lines[i]) && !/^>\s?/.test(lines[i]) && !/^\s*(---|\*\*\*|___)\s*$/.test(lines[i]) && !/^\s*\|.*\|\s*$/.test(lines[i]) && !/^\s*(?:[-*+]\s+|\d+\.\s+)/.test(lines[i]) && !iframeSrc(lines[i])) paragraphLines.push(lines[i++]);
    await pushParagraph(paragraphLines);
  }
  return blocks;
};

const extractFrontmatterValue = (frontmatter, field) => frontmatter.match(new RegExp(`^${field}:\\s*([^\\n]*)`, 'm'))?.[1]?.trim() ?? '';
const parseFrontmatterValue = (value) => {
  const trimmed = String(value ?? '').trim();
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) return trimmed.slice(1, -1).replace(/''/g, "'");
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  return trimmed;
};
const parseAuthors = (frontmatter) => {
  const authors = [];
  const lines = frontmatter.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^authors:\s*$/.test(lines[index])) continue;
    while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
      index += 1;
      const name = lines[index].match(/^\s*-\s+name:\s*(.*)$/)?.[1];
      if (name) authors.push(parseFrontmatterValue(name));
    }
  }
  return authors;
};
const parseRedirectFrom = (frontmatter) => {
  const items = [];
  const lines = frontmatter.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^redirectFrom:\s*$/.test(lines[index])) continue;
    while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
      index += 1;
      const slug = lines[index].match(/^\s*-\s+(.*)$/)?.[1];
      if (slug) items.push(parseFrontmatterValue(slug));
    }
  }
  return items;
};
const parseOgImage = (frontmatter) => frontmatter.match(/^ogImage:\s*\n\s+url:\s*(.*)$/m)?.[1];
const parsePostMeta = (file, raw) => {
  const { frontmatter, body } = splitMarkdown(raw);
  const data = {
    title: parseFrontmatterValue(extractFrontmatterValue(frontmatter, 'title')) || file.replace(/\.md$/, ''),
    published: parseFrontmatterValue(extractFrontmatterValue(frontmatter, 'published')),
    slug: parseFrontmatterValue(extractFrontmatterValue(frontmatter, 'slug')),
    redirectFrom: parseRedirectFrom(frontmatter),
    excerpt: parseFrontmatterValue(extractFrontmatterValue(frontmatter, 'excerpt')),
    coverImage: parseFrontmatterValue(extractFrontmatterValue(frontmatter, 'coverImage')),
    coverAlt: parseFrontmatterValue(extractFrontmatterValue(frontmatter, 'coverAlt')),
    date: parseFrontmatterValue(extractFrontmatterValue(frontmatter, 'date')),
    authors: parseAuthors(frontmatter),
    ogImage: parseFrontmatterValue(parseOgImage(frontmatter)),
    importance: parseFrontmatterValue(extractFrontmatterValue(frontmatter, 'importance')),
  };
  if (!data.importance) delete data.importance;
  if (data.published !== false) delete data.published;
  return { frontmatter, body, data, slug: data.slug || stringToSlug(data.title) };
};

const localBlogIndex = async () => {
  const bySlug = new Map();
  const imagePathBySlugAndName = new Map();
  const files = (await readdir(postsDir)).filter((file) => file.endsWith('.md')).sort();
  for (const file of files) {
    const raw = await readFile(path.join(postsDir, file), 'utf8');
    const post = parsePostMeta(file, raw);
    bySlug.set(post.slug, { file: `${POSTS_DIR}/${file}`, ...post });
    const images = [post.data.coverImage, post.data.ogImage];
    for (const match of post.body.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) images.push(match[1]);
    const pathByName = imagePathBySlugAndName.get(post.slug) ?? new Map();
    for (const imagePath of images) if (typeof imagePath === 'string' && imagePath.startsWith('/assets/')) pathByName.set(path.basename(imagePath), normalizeAssetPath(imagePath));
    imagePathBySlugAndName.set(post.slug, pathByName);
  }
  return { bySlug, imagePathBySlugAndName };
};
const derivedAssetPath = (slug, filename) => `/assets/notion-blog/${slug}/${filename}`;
const resolveAssetPath = (context, filename) => context.imagePathByName.get(filename) ?? derivedAssetPath(context.slug, filename);
const downloadNotionFile = async (url, assetPath, report) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download Notion-hosted image ${url} (${response.status}).`);
  const remote = Buffer.from(await response.arrayBuffer());
  const file = assetFile(assetPath);
  const local = await readIfExists(file);
  if (local && sha256(local) === sha256(remote)) { report.assetsUnchanged += 1; return; }
  report.assetUpdates += 1;
  await writeIfChanged(file, remote, report, assetPath);
};
const filePropertyAssetPath = async (files, context, report) => {
  const first = files?.[0];
  if (!first) return '';
  const url = imageUrl(first);
  if (!url) return '';
  const filename = first.name || fileNameFromUrl(url);
  const assetPath = resolveAssetPath(context, filename);
  await downloadNotionFile(url, assetPath, report);
  return assetPath;
};
const indentMarkdown = (markdown, depth) => {
  if (!depth || !markdown) return markdown;
  const indent = '  '.repeat(depth);
  return markdown.split('\n').map((line) => line ? `${indent}${line}` : line).join('\n');
};
const childBlocksToMarkdown = async (block, context, report, depth) => {
  if (!block.has_children) return '';
  return blocksToMarkdown(await listBlocks(block.id), context, report, depth);
};
const blockToMarkdown = async (block, context, report, depth = 0) => {
  const withChildren = async (markdown) => {
    const childMarkdown = await childBlocksToMarkdown(block, context, report, depth + 1);
    return childMarkdown ? `${markdown}\n${childMarkdown}` : markdown;
  };
  if (block.type === 'paragraph') return withChildren(indentMarkdown(richTextToMarkdown(block.paragraph.rich_text), depth));
  if (block.type === 'heading_1') return indentMarkdown(`# ${richTextToMarkdown(block.heading_1.rich_text)}`, depth);
  if (block.type === 'heading_2') return indentMarkdown(`## ${richTextToMarkdown(block.heading_2.rich_text)}`, depth);
  if (block.type === 'heading_3') return indentMarkdown(`### ${richTextToMarkdown(block.heading_3.rich_text)}`, depth);
  if (block.type === 'bulleted_list_item') return withChildren(`${'  '.repeat(depth)}- ${richTextToMarkdown(block.bulleted_list_item.rich_text)}`);
  if (block.type === 'numbered_list_item') return withChildren(`${'  '.repeat(depth)}1. ${richTextToMarkdown(block.numbered_list_item.rich_text)}`);
  if (block.type === 'quote') return indentMarkdown(richTextToMarkdown(block.quote.rich_text).split('\n').map((line) => `> ${line}`).join('\n'), depth);
  if (block.type === 'embed') {
    const caption = plain(block.embed.caption);
    return indentMarkdown(caption || `<iframe src="${block.embed.url}" allowfullscreen=""></iframe>`, depth);
  }
  if (block.type === 'table') {
    const rows = await listBlocks(block.id);
    const markdownRows = rows
      .filter((row) => row.type === 'table_row')
      .map((row) => `| ${row.table_row.cells.map((cell) => richTextToMarkdown(cell)).join(' | ')} |`);
    if (block.table.has_column_header && markdownRows.length) {
      const width = rows.find((row) => row.type === 'table_row')?.table_row.cells.length ?? 1;
      markdownRows.splice(1, 0, `| ${Array.from({ length: width }, () => '---').join(' | ')} |`);
    }
    return indentMarkdown(markdownRows.join('\n'), depth);
  }
  if (block.type === 'code') {
    const originalLanguage = plain(block.code.caption);
    const language = originalLanguage || (block.code.language && block.code.language !== 'plain text' ? block.code.language : '');
    return indentMarkdown(`\`\`\`${language}\n${plain(block.code.rich_text)}\n\`\`\``, depth);
  }
  if (block.type === 'image') {
    const url = imageUrl(block.image);
    if (!url) return '';
    const filename = fileNameFromUrl(url);
    const assetPath = resolveAssetPath(context, filename);
    await downloadNotionFile(url, assetPath, report);
    return indentMarkdown(`![${plain(block.image.caption)}](${assetPath})`, depth);
  }
  if (block.type === 'divider') return indentMarkdown('---', depth);
  return '';
};
const blocksToMarkdown = async (blocks, context, report, depth = 0) => {
  const parts = [];
  for (const block of blocks) {
    const markdown = await blockToMarkdown(block, context, report, depth);
    if (markdown && markdown !== NOTICE) parts.push(markdown);
  }
  return parts.join(depth ? '\n' : '\n\n');
};
const pageBodyMarkdown = async (pageId, context, report) => {
  const body = await blocksToMarkdown(await listBlocks(pageId), context, report);
  return body ? `${body}\n` : '';
};
const yamlString = (value) => `'${String(value ?? '').replaceAll("'", "''")}'`;
const buildFrontmatter = ({ title, slug, redirectFrom, excerpt, coverImage, coverAlt, date, authors, ogImage, published, importance }) => {
  const lines = [`title: ${yamlString(title)}`];
  if (published === false) lines.push('published: false');
  if (importance && importance !== 'Standard') lines.push(`importance: ${importance}`);
  if (slug) lines.push(`slug: ${slug}`);
  if (redirectFrom?.length) { lines.push('redirectFrom:'); for (const from of redirectFrom) lines.push(`  - ${from}`); }
  if (excerpt) lines.push(`excerpt: ${yamlString(excerpt)}`);
  if (coverImage) lines.push(`coverImage: ${coverImage}`);
  if (coverAlt !== undefined && coverAlt !== '') lines.push(`coverAlt: ${yamlString(coverAlt)}`);
  if (date) lines.push(`date: ${yamlString(date)}`);
  if (authors?.length) { lines.push('authors:'); for (const author of authors) lines.push(`  - name: ${author}`); }
  if (ogImage) lines.push('ogImage:', `  url: ${ogImage}`);
  return lines.join('\n');
};
const pageMetadata = async (page, context, report) => {
  const title = pageProp(page, ['Name', 'Title']);
  const slug = pageProp(page, ['Slug']) || stringToSlug(title);
  const authors = String(pageProp(page, ['Authors']) || '').split(',').map((author) => author.trim()).filter(Boolean);
  const redirectFrom = String(pageProp(page, ['Redirect From']) || '').split(',').map((s) => s.trim()).filter(Boolean);
  return {
    title,
    slug,
    redirectFrom,
    excerpt: pageProp(page, ['Excerpt']) || '',
    coverImage: await filePropertyAssetPath(pageProp(page, ['Cover image']), context, report),
    coverAlt: pageProp(page, ['Cover alt']) || '',
    date: pageProp(page, ['Publication date']) || '',
    authors,
    ogImage: await filePropertyAssetPath(pageProp(page, ['OG image']), context, report),
    published: undefined,
    importance: pageProp(page, ['Importance']) || 'Standard',
  };
};

const updateFeaturedSlug = async (slug, report) => {
  if (!slug) return;
  const file = repoPath(BLOG_API_FILE);
  const current = await readIfExists(file);
  if (!current) throw new Error(`Cannot update featured blog slug; file not found: ${BLOG_API_FILE}`);
  const source = current.toString('utf8');
  const pattern = /export const BLOG_FEATURED_SLUG = '[^']*';/;
  if (!pattern.test(source)) throw new Error(`Cannot find BLOG_FEATURED_SLUG in ${BLOG_API_FILE}`);
  const next = source.replace(pattern, `export const BLOG_FEATURED_SLUG = '${slug}';`);
  if (next === source) return;
  report.featuredSlugUpdates += 1;
  await writeIfChanged(file, next, report, BLOG_API_FILE);
};


const syncFromNotion = async () => {
  const databaseId = normalizeId(assertValue('NOTION_BLOG_DATABASE_ID', process.env.NOTION_BLOG_DATABASE_ID));
  await ensureDatabaseProperties(databaseId);
  const pages = await queryDatabase(databaseId);
  const index = await localBlogIndex();
  const expected = new Set();
  const featuredCandidates = [];
  const report = { pages: pages.length, markdownUpdates: 0, assetUpdates: 0, assetsUnchanged: 0, deletedPosts: 0, featuredSlugUpdates: 0, changed: [] };
  for (const page of pages) {
    const title = pageProp(page, ['Name', 'Title']);
    const status = pageProp(page, ['Status']) || (page.properties?.Published?.checkbox === false ? 'Draft' : 'Published');
    const slug = pageProp(page, ['Slug']) || stringToSlug(title);
    const existing = index.bySlug.get(slug);
    if (status === 'Draft') {
      if (existing?.file) expected.add(existing.file);
      if (verbose) console.log(`Skipping draft Notion blog page: ${slug || page.id}`);
      continue;
    }
    if (!slug) { if (verbose) console.warn(`Skipping Notion page without slug/title: ${page.id}`); continue; }
    const relative = existing?.file ?? `${POSTS_DIR}/${slug}.md`;
    const context = { slug, imagePathByName: index.imagePathBySlugAndName.get(slug) ?? new Map() };
    expected.add(relative);
    const metadata = await pageMetadata(page, context, report);
    if (metadata.importance === 'Featured') featuredCandidates.push({ slug, date: metadata.date });
    const body = await pageBodyMarkdown(page.id, context, report);
    const markdown = `---\n${buildFrontmatter(metadata)}\n---\n${body}`;
    const current = await readIfExists(repoPath(relative));
    const currentMarkdown = current?.toString('utf8');
    const markdownMatches = currentMarkdown && (sha256(currentMarkdown) === sha256(markdown) || comparableMarkdownHash(currentMarkdown) === comparableMarkdownHash(markdown));
    if (!markdownMatches) { report.markdownUpdates += 1; await writeIfChanged(repoPath(relative), markdown, report, relative); }
  }
  const latestFeatured = featuredCandidates
    .sort((left, right) => new Date(right.date || 0).getTime() - new Date(left.date || 0).getTime())[0];
  await updateFeaturedSlug(latestFeatured?.slug, report);

  if (!keepMissing) {
    for (const file of await readdir(postsDir)) {
      if (!file.endsWith('.md')) continue;
      const relative = `${POSTS_DIR}/${file}`;
      if (expected.has(relative)) continue;
      report.deletedPosts += 1;
      report.changed.push(relative);
      if (!checkOnly) await unlink(repoPath(relative));
    }
  }
  console.log(`Notion blog sync checked ${report.pages} Notion pages.`);
  console.log(`Markdown updates: ${report.markdownUpdates}; asset updates: ${report.assetUpdates}; deleted posts: ${report.deletedPosts}; featured slug updates: ${report.featuredSlugUpdates}.`);
  if (!report.changed.length) return console.log('No differences found between Notion and the repository.');
  console.log('Changed paths:');
  for (const changed of report.changed) console.log(`- ${changed}`);
  if (checkOnly) { console.error('Differences found while running in --check/--dry-run mode.'); process.exitCode = 1; }
};

const desiredDatabaseProperties = () => ({
  Name: { title: {} },
  Status: {
    select: {
      options: [
        { name: 'Draft', color: 'gray' },
        { name: 'Ready', color: 'yellow' },
        { name: 'Published', color: 'green' },
      ],
    },
  },
  Importance: {
    select: {
      options: [
        { name: 'Featured', color: 'red' },
        { name: 'Standard', color: 'gray' },
        { name: 'SEO', color: 'blue' },
      ],
    },
  },
  Slug: { rich_text: {} }, 'Redirect From': { rich_text: {} }, 'Publication date': { date: {} }, Authors: { rich_text: {} }, Excerpt: { rich_text: {} },
  'Cover image': { files: {} }, 'Cover alt': { rich_text: {} }, 'OG image': { files: {} },
});
const createDatabase = (parentPageId) => notion('/databases', { method: 'POST', body: JSON.stringify({ parent: { type: 'page_id', page_id: parentPageId }, icon: { type: 'emoji', emoji: '✍️' }, title: [{ type: 'text', text: { content: 'OpenHands Blog Source' } }], description: [{ type: 'text', text: { content: NOTICE } }], properties: desiredDatabaseProperties() }) });
const ensureDatabaseProperties = async (databaseId) => {
  const database = await notion(`/databases/${databaseId}`);
  const remove = {};
  for (const propertyName of ['File', 'Markdown SHA256', 'Assets SHA256', 'Frontmatter', 'OG image URL', 'Published', 'Cover radius', 'SEO title date']) if (database.properties[propertyName]) remove[propertyName] = null;
  if (database.properties['Cover image'] && database.properties['Cover image'].type !== 'files') remove['Cover image'] = null;
  if (Object.keys(remove).length) await notion(`/databases/${databaseId}`, { method: 'PATCH', body: JSON.stringify({ properties: remove }) });
  await notion(`/databases/${databaseId}`, { method: 'PATCH', body: JSON.stringify({ properties: desiredDatabaseProperties() }) });
};
const filePropertyFromAsset = async (assetPath) => {
  if (!assetPath || !String(assetPath).startsWith('/assets/')) return [];
  const normalized = normalizeAssetPath(assetPath);
  const filename = path.basename(normalized);
  const uploadId = await uploadFileToNotion(assetFile(normalized), filename);
  return [{ name: filename, type: 'file_upload', file_upload: { id: uploadId } }];
};
const postProperties = async (file, post) => ({
  Name: titleProp(post.data.title ?? file),
  Status: { select: { name: post.data.published === false ? 'Draft' : 'Published' } },
  Importance: { select: { name: post.data.importance || 'Standard' } },
  Slug: richTextProp(post.slug),
  'Redirect From': richTextProp((post.data.redirectFrom ?? []).join(', ')),
  'Publication date': post.data.date ? { date: { start: post.data.date } } : { date: null },
  Authors: richTextProp(post.data.authors.join(', ')),
  Excerpt: richTextProp(post.data.excerpt ?? ''),
  'Cover image': { files: await filePropertyFromAsset(post.data.coverImage) },
  'Cover alt': richTextProp(post.data.coverAlt ?? ''),
  'OG image': { files: await filePropertyFromAsset(post.data.ogImage) },
});
const appendBlocks = async (pageId, blocks) => { for (let i = 0; i < blocks.length; i += 100) await notion(`/blocks/${pageId}/children`, { method: 'PATCH', body: JSON.stringify({ children: blocks.slice(i, i + 100) }) }); };
const archiveChildren = async (pageId) => { for (const block of await listBlocks(pageId)) await notion(`/blocks/${block.id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) }); };
const createOrUpdatePostPage = async (databaseId, existingPage, file, raw) => {
  const post = parsePostMeta(file, raw);
  const properties = await postProperties(file, post);
  const blocks = [paragraphBlock(NOTICE), ...(await markdownBodyToBlocks(post.body))];
  if (existingPage) { await notion(`/pages/${existingPage.id}`, { method: 'PATCH', body: JSON.stringify({ properties }) }); await archiveChildren(existingPage.id); await appendBlocks(existingPage.id, blocks); return; }
  const page = await notion('/pages', { method: 'POST', body: JSON.stringify({ parent: { database_id: databaseId }, properties, children: blocks.slice(0, 100) }) });
  await appendBlocks(page.id, blocks.slice(100));
};
const seedNotion = async () => {
  const database = process.env.NOTION_BLOG_DATABASE_ID ? { id: normalizeId(process.env.NOTION_BLOG_DATABASE_ID) } : await createDatabase(assertValue('NOTION_PARENT_PAGE_ID', process.env.NOTION_PARENT_PAGE_ID));
  const existingPages = await queryDatabase(database.id);
  await ensureDatabaseProperties(database.id);
  const pagesBySlug = new Map();
  const pagesByFile = new Map();
  for (const page of existingPages) {
    const slug = pageProp(page, ['Slug']);
    const file = pageProp(page, ['File', 'Repository path', 'Path']);
    if (slug) pagesBySlug.set(slug, page);
    if (file) pagesByFile.set(file, page);
  }
  const allFiles = (await readdir(postsDir)).filter((file) => file.endsWith('.md')).sort();
  const resolvedFiles = [];
  for (const file of allFiles) {
    if (!seedOnlySlug) {
      resolvedFiles.push(file);
      continue;
    }
    const raw = await readFile(path.join(postsDir, file), 'utf8');
    if (parsePostMeta(file, raw).slug === seedOnlySlug || file.replace(/\.md$/, '') === seedOnlySlug) resolvedFiles.push(file);
  }
  if (seedOnlySlug && resolvedFiles.length === 0) throw new UserError(`No local blog post found for --only=${seedOnlySlug}`);
  for (const [index, file] of resolvedFiles.entries()) {
    const raw = await readFile(path.join(postsDir, file), 'utf8');
    const post = parsePostMeta(file, raw);
    const existingPage = pagesBySlug.get(post.slug) ?? pagesByFile.get(`${POSTS_DIR}/${file}`);
    console.log(`${existingPage ? 'Updating' : 'Creating'} Notion blog page ${index + 1}/${resolvedFiles.length}: ${file}`);
    await createOrUpdatePostPage(database.id, existingPage, file, raw);
  }
  console.log(`Updated Notion blog database: ${database.id}`);
  console.log(`Set NOTION_BLOG_DATABASE_ID=${database.id} in GitHub Actions to sync from this database.`);
};




const appendBlocksAfter = async (pageId, blocks, afterId) => {
  let lastId = afterId;
  for (let i = 0; i < blocks.length; i += 100) {
    const body = { children: blocks.slice(i, i + 100) };
    if (lastId) body.after = lastId;
    const result = await notion(`/blocks/${pageId}/children`, { method: 'PATCH', body: JSON.stringify(body) });
    const inserted = result.results ?? [];
    if (inserted.length) lastId = inserted[inserted.length - 1].id;
  }
  return lastId;
};
const rebuildPageBlocksPreservingImages = async (pageId, body) => {
  const existing = await listBlocks(pageId);
  const notice = existing.find((block) => block.type === 'paragraph' && plain(block.paragraph.rich_text) === NOTICE);
  const existingImages = existing.filter((block) => block.type === 'image');
  const desired = await markdownBodyToBlocks(body, { placeholderImages: true });
  let imageIndex = 0;
  let anchorId = notice?.id ?? existing[0]?.id;
  let pending = [];
  let insertedTextBlocks = 0;
  const flush = async () => {
    if (!pending.length) return;
    anchorId = await appendBlocksAfter(pageId, pending, anchorId);
    insertedTextBlocks += pending.length;
    pending = [];
  };
  for (const block of desired) {
    if (block.type === 'image_placeholder') {
      await flush();
      const existingImage = existingImages[imageIndex];
      if (existingImage) {
        anchorId = existingImage.id;
        imageIndex += 1;
      } else {
        const uploaded = await imageBlockFromMarkdown(block.alt, block.assetPath);
        anchorId = await appendBlocksAfter(pageId, [uploaded], anchorId);
        imageIndex += 1;
      }
      continue;
    }
    pending.push(block);
  }
  await flush();
  let archived = 0;
  for (const block of existing) {
    if (block.id === notice?.id) continue;
    if (block.type === 'image' && existingImages.indexOf(block) < imageIndex) continue;
    try {
      await notion(`/blocks/${block.id}`, { method: 'PATCH', body: JSON.stringify({ archived: true }) });
      archived += 1;
    } catch (error) {
      if (!String(error.message ?? error).includes("Can't edit block that is archived")) throw error;
    }
  }
  return { insertedTextBlocks, keptImages: Math.min(imageIndex, existingImages.length), archived };
};
const rebuildNotionBlocks = async () => {
  const databaseId = normalizeId(assertValue('NOTION_BLOG_DATABASE_ID', process.env.NOTION_BLOG_DATABASE_ID));
  await ensureDatabaseProperties(databaseId);
  const local = await localBlogIndex();
  const pages = await queryDatabase(databaseId);
  let totalInserted = 0;
  let totalKeptImages = 0;
  let totalArchived = 0;
  for (const [index, page] of pages.entries()) {
    if (index + 1 < fromIndex) continue;
    const title = pageProp(page, ['Name', 'Title']) || page.id;
    const slug = pageProp(page, ['Slug']) || stringToSlug(title);
    if (seedOnlySlug && slug !== seedOnlySlug) continue;
    const localPost = local.bySlug.get(slug);
    if (!pageProp(page, ['Status'])) await notion(`/pages/${page.id}`, { method: 'PATCH', body: JSON.stringify({ properties: { Status: { select: { name: 'Published' } } } }) });
    if (!localPost) {
      if (verbose) console.warn(`Skipping block rebuild for Notion page without local post: ${slug || page.id}`);
      continue;
    }
    const result = await rebuildPageBlocksPreservingImages(page.id, localPost.body);
    totalInserted += result.insertedTextBlocks;
    totalKeptImages += result.keptImages;
    totalArchived += result.archived;
    console.log(`Rebuilt Notion blocks ${index + 1}/${pages.length}: ${title} (${result.insertedTextBlocks} text blocks, ${result.keptImages} images kept, ${result.archived} old blocks archived)`);
  }
  console.log(`Rebuilt Notion pages with ${totalInserted} text blocks, preserved ${totalKeptImages} image blocks, archived ${totalArchived} old blocks.`);
};

const literalInlineMarkdownPattern = /(?<!!)\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`/;
const hasLiteralInlineMarkdown = (parts = []) => parts.some((part) => literalInlineMarkdownPattern.test(part.plain_text ?? part.text?.content ?? ''));
const refreshRichTextArray = (parts = []) => richText(plain(parts));
const refreshBlockRichText = async (block) => {
  const update = async (payload) => notion(`/blocks/${block.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  if (block.type === 'paragraph' && hasLiteralInlineMarkdown(block.paragraph.rich_text)) return update({ paragraph: { rich_text: refreshRichTextArray(block.paragraph.rich_text) } });
  if (block.type?.startsWith('heading_') && hasLiteralInlineMarkdown(block[block.type].rich_text)) return update({ [block.type]: { rich_text: refreshRichTextArray(block[block.type].rich_text) } });
  if (block.type === 'quote' && hasLiteralInlineMarkdown(block.quote.rich_text)) return update({ quote: { rich_text: refreshRichTextArray(block.quote.rich_text) } });
  if (block.type === 'bulleted_list_item' && hasLiteralInlineMarkdown(block.bulleted_list_item.rich_text)) return update({ bulleted_list_item: { rich_text: refreshRichTextArray(block.bulleted_list_item.rich_text) } });
  if (block.type === 'numbered_list_item' && hasLiteralInlineMarkdown(block.numbered_list_item.rich_text)) return update({ numbered_list_item: { rich_text: refreshRichTextArray(block.numbered_list_item.rich_text) } });
  if (block.type === 'table_row' && block.table_row.cells.some(hasLiteralInlineMarkdown)) return update({ table_row: { cells: block.table_row.cells.map(refreshRichTextArray) } });
  return null;
};
const refreshPageRichText = async (pageId) => {
  let updates = 0;
  for (const block of await listBlocks(pageId)) {
    if (await refreshBlockRichText(block)) updates += 1;
    if (block.type === 'table') {
      for (const row of await listBlocks(block.id)) if (await refreshBlockRichText(row)) updates += 1;
    }
  }
  return updates;
};
const refreshNotionRichText = async () => {
  const databaseId = normalizeId(assertValue('NOTION_BLOG_DATABASE_ID', process.env.NOTION_BLOG_DATABASE_ID));
  await ensureDatabaseProperties(databaseId);
  const pages = await queryDatabase(databaseId);
  let totalUpdates = 0;
  for (const [index, page] of pages.entries()) {
    const title = pageProp(page, ['Name', 'Title']) || page.id;
    if (!pageProp(page, ['Status'])) await notion(`/pages/${page.id}`, { method: 'PATCH', body: JSON.stringify({ properties: { Status: { select: { name: 'Published' } } } }) });
    const updates = await refreshPageRichText(page.id);
    totalUpdates += updates;
    console.log(`Refreshed native rich text ${index + 1}/${pages.length}: ${title} (${updates} block update${updates === 1 ? '' : 's'})`);
  }
  console.log(`Refreshed ${totalUpdates} Notion block(s) with native rich-text annotations.`);
};

const emptyCounts = () => ({ links: 0, bold: 0, italic: 0, strikethrough: 0, inlineCode: 0, headings: 0, bulleted: 0, numbered: 0, quotes: 0, tables: 0, embeds: 0, dividers: 0, images: 0, externalImages: 0, literalMarkdown: 0 });
const addInlinePartCounts = (parts, counts) => {
  for (const part of parts ?? []) {
    if (part.href ?? part.text?.link?.url) counts.links += 1;
    if (part.annotations?.bold) counts.bold += 1;
    if (part.annotations?.italic) counts.italic += 1;
    if (part.annotations?.strikethrough) counts.strikethrough += 1;
    if (part.annotations?.code) counts.inlineCode += 1;
    const text = part.plain_text ?? part.text?.content ?? '';
    if (/(?<!!)\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`/.test(text)) counts.literalMarkdown += 1;
  }
};
const addExpectedInlineCounts = (text, counts) => addInlinePartCounts(parseInlineMarkdown(text), counts);
const countMarkdownBody = (body) => {
  const counts = emptyCounts();
  const lines = body.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
  let i = 0;
  const countParagraph = (paragraphLines) => {
    const text = paragraphLines.join('\n');
    if (!text) return;
    if (markdownImage(text.trim())) counts.images += 1;
    else addExpectedInlineCounts(text, counts);
  };
  while (i < lines.length) {
    if (!lines[i]) { i += 1; continue; }
    if (/^```/.test(lines[i])) {
      for (i += 1; i < lines.length && lines[i] !== '```'; i += 1) {}
      if (i < lines.length) i += 1;
      continue;
    }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(lines[i])) { counts.dividers += 1; i += 1; continue; }
    if (iframeSrc(lines[i])) { counts.embeds += 1; i += 1; continue; }
    if (/^\s*\|.*\|\s*$/.test(lines[i])) {
      counts.tables += 1;
      const tableLines = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) tableLines.push(lines[i++]);
      const parsedRows = tableLines.map(parseTableCells);
      const dataRows = parsedRows.length > 1 && isTableDelimiter(parsedRows[1]) ? [parsedRows[0], ...parsedRows.slice(2)] : parsedRows;
      for (const row of dataRows) for (const cell of row) addExpectedInlineCounts(cell, counts);
      continue;
    }
    const list = lines[i].match(/^\s*(?:[-*+]\s+|(\d+)\.\s+)(.*)$/);
    if (list) {
      const ordered = Boolean(list[1]);
      while (i < lines.length) {
        const item = lines[i].match(/^\s*(?:[-*+]\s+|(\d+)\.\s+)(.*)$/);
        if (!item || Boolean(item[1]) !== ordered) break;
        if (ordered) counts.numbered += 1;
        else counts.bulleted += 1;
        addExpectedInlineCounts(item[2], counts);
        i += 1;
      }
      continue;
    }
    const heading = lines[i].match(/^(#{1,3})\s+(.*)$/);
    if (heading) { counts.headings += 1; addExpectedInlineCounts(heading[2], counts); i += 1; continue; }
    const quote = lines[i].match(/^>\s?(.*)$/);
    if (quote) {
      counts.quotes += 1;
      const quoteLines = [];
      while (i < lines.length) {
        const match = lines[i].match(/^>\s?(.*)$/);
        if (!match) break;
        quoteLines.push(match[1]);
        i += 1;
      }
      addExpectedInlineCounts(quoteLines.join('\n'), counts);
      continue;
    }
    const paragraphLines = [];
    while (i < lines.length && lines[i] !== '' && !/^```/.test(lines[i]) && !/^(#{1,3})\s+/.test(lines[i]) && !/^>\s?/.test(lines[i]) && !/^\s*(---|\*\*\*|___)\s*$/.test(lines[i]) && !/^\s*\|.*\|\s*$/.test(lines[i]) && !/^\s*(?:[-*+]\s+|\d+\.\s+)/.test(lines[i]) && !iframeSrc(lines[i])) paragraphLines.push(lines[i++]);
    countParagraph(paragraphLines);
  }
  return counts;
};
const addNotionBlockCounts = async (block, counts) => {
  if (block.type === 'paragraph') addInlinePartCounts(block.paragraph.rich_text, counts);
  else if (block.type.startsWith('heading_')) { counts.headings += 1; addInlinePartCounts(block[block.type].rich_text, counts); }
  else if (block.type === 'bulleted_list_item') { counts.bulleted += 1; addInlinePartCounts(block.bulleted_list_item.rich_text, counts); }
  else if (block.type === 'numbered_list_item') { counts.numbered += 1; addInlinePartCounts(block.numbered_list_item.rich_text, counts); }
  else if (block.type === 'quote') { counts.quotes += 1; addInlinePartCounts(block.quote.rich_text, counts); }
  else if (block.type === 'image') { counts.images += 1; if (block.image.type === 'external') counts.externalImages += 1; }
  else if (block.type === 'embed') counts.embeds += 1;
  else if (block.type === 'divider') counts.dividers += 1;
  else if (block.type === 'table') {
    counts.tables += 1;
    for (const row of await listBlocks(block.id)) if (row.type === 'table_row') for (const cell of row.table_row.cells) addInlinePartCounts(cell, counts);
    return;
  }
  if (block.has_children) for (const child of await listBlocks(block.id)) await addNotionBlockCounts(child, counts);
};
const countNotionBlocks = async (pageId) => {
  const counts = emptyCounts();
  for (const block of await listBlocks(pageId)) await addNotionBlockCounts(block, counts);
  return counts;
};
const auditNotion = async () => {
  const databaseId = normalizeId(assertValue('NOTION_BLOG_DATABASE_ID', process.env.NOTION_BLOG_DATABASE_ID));
  const database = await notion(`/databases/${databaseId}`);
  const forbidden = ['File', 'Markdown SHA256', 'Assets SHA256', 'Frontmatter', 'OG image URL', 'Published', 'Cover radius', 'SEO title date'].filter((name) => database.properties[name]);
  const statusOptions = new Set(database.properties.Status?.select?.options?.map((option) => option.name) ?? []);
  const importanceOptions = new Set(database.properties.Importance?.select?.options?.map((option) => option.name) ?? []);
  const failures = [];
  if (forbidden.length) failures.push(`Forbidden derived/redundant properties still exist: ${forbidden.join(', ')}`);
  for (const status of ['Draft', 'Ready', 'Published']) if (!statusOptions.has(status)) failures.push(`Missing Status option: ${status}`);
  for (const importance of ['Featured', 'Standard', 'SEO']) if (!importanceOptions.has(importance)) failures.push(`Missing Importance option: ${importance}`);
  const local = await localBlogIndex();
  const pages = await queryDatabase(databaseId);
  let audited = 0;
  for (const page of pages) {
    const title = pageProp(page, ['Name', 'Title']);
    const status = pageProp(page, ['Status']) || (page.properties?.Published?.checkbox === false ? 'Draft' : 'Published');
    if (status === 'Draft') continue;
    const slug = pageProp(page, ['Slug']) || stringToSlug(title);
    if (!slug) { if (verbose) console.warn(`Skipping Notion page without slug/title during audit: ${page.id}`); continue; }
    for (const propName of ['Cover image', 'OG image']) for (const file of pageProp(page, [propName]) || []) if (file.type === 'external') failures.push(`${slug}: ${propName} uses an external file link`);
    const localPost = local.bySlug.get(slug);
    if (!localPost) { failures.push(`${slug}: no matching local post for audit`); continue; }
    audited += 1;
    const expected = countMarkdownBody(localPost.body);
    const actual = await countNotionBlocks(page.id);
    for (const key of ['links', 'bold', 'italic', 'strikethrough', 'inlineCode', 'headings', 'bulleted', 'numbered', 'quotes', 'tables', 'embeds', 'dividers', 'images']) {
      if (actual[key] < expected[key]) failures.push(`${slug}: ${key} incomplete expected_at_least=${expected[key]} actual=${actual[key]}`);
    }
    if (actual.externalImages) failures.push(`${slug}: ${actual.externalImages} body image(s) use external links`);
    if (actual.literalMarkdown) failures.push(`${slug}: ${actual.literalMarkdown} rich-text segment(s) still contain literal Markdown syntax`);
  }
  if (failures.length) {
    console.error(`Notion blog audit failed for ${audited} non-draft page(s):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Notion blog audit passed for ${audited} non-draft page(s).`);
};

try {
  if (!(await stat(postsDir)).isDirectory()) throw new UserError(`Blog posts directory does not exist: ${postsDir}`);
  if (auditMode) await auditNotion();
  else if (rebuildBlocksMode) await rebuildNotionBlocks();
  else if (refreshRichTextMode) await refreshNotionRichText();
  else if (seedMode) await seedNotion();
  else await syncFromNotion();
} catch (error) {
  console.error(error instanceof UserError ? error.message : error);
  process.exitCode = 1;
}
