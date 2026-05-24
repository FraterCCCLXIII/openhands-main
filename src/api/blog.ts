import { RAW_POSTS } from "~/posts";
import { resolveBlogSlug } from "~/utils/blog-slug-aliases";
import { stringToSlug } from "~/utils/string-to-slug";

type BlogPost = Post & {
  data: Post["data"] & {
    slug?: string;
    aliases?: string[];
    redirectFrom?: string[];
    published?: boolean;
    importance?: 'Featured' | 'Standard' | 'SEO';
    coverAlt?: string;
    featuredImage?: string;
  };
};

export const BLOG_FEATURED_SLUG = 'openhands-enterprise-agent-control-plane';

export const getBlogSlug = (post: BlogPost) => post.data.slug ?? stringToSlug(post.data.title);

const sortBlogsByDate = (blogs: BlogPost[]) =>
  [...blogs].sort((left, right) => new Date(right.data.date).getTime() - new Date(left.data.date).getTime());

const getBlogAliases = (post: BlogPost) => {
  const canonicalSlug = getBlogSlug(post);
  const titleSlug = stringToSlug(post.data.title);
  const configuredAliases = post.data.aliases ?? [];

  return Array.from(
    new Set([
      ...configuredAliases,
      ...(titleSlug !== canonicalSlug ? [titleSlug] : []),
    ]),
  );
};

const parseFrontmatterValue = (value: string) => {
  const trimmed = value.trim();

  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }

  return trimmed;
};

const normalizeDateValue = (value: unknown) => {
  if (typeof value !== 'string' || !value) return value;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? value : new Date(timestamp).toISOString();
};

const parseIndentedFrontmatterBlock = (lines: string[]) => {
  if (lines.some((line) => line.trimStart().startsWith('- '))) {
    const items: unknown[] = [];
    let currentItem: Record<string, unknown> | null = null;

    for (const line of lines) {
      const listObjectMatch = line.match(/^\s*-\s+([A-Za-z][\w-]*):\s*(.*)$/);
      if (listObjectMatch) {
        currentItem = { [listObjectMatch[1]]: parseFrontmatterValue(listObjectMatch[2]) };
        items.push(currentItem);
        continue;
      }

      const listScalarMatch = line.match(/^\s*-\s*(.*)$/);
      if (listScalarMatch) {
        currentItem = null;
        items.push(parseFrontmatterValue(listScalarMatch[1]));
        continue;
      }

      const nestedObjectMatch = line.match(/^\s+([A-Za-z][\w-]*):\s*(.*)$/);
      if (nestedObjectMatch && currentItem) {
        currentItem[nestedObjectMatch[1]] = parseFrontmatterValue(nestedObjectMatch[2]);
      }
    }

    return items;
  }

  return Object.fromEntries(
    lines
      .map((line) => line.match(/^\s+([A-Za-z][\w-]*):\s*(.*)$/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => [match[1], parseFrontmatterValue(match[2])]),
  );
};

const parsePost = (rawPost: string): BlogPost => {
  const frontmatterMatch = rawPost.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!frontmatterMatch) {
    return { content: rawPost, data: {} as BlogPost['data'] };
  }

  const data: Record<string, unknown> = {};
  const lines = frontmatterMatch[1].split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const topLevelMatch = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!topLevelMatch) continue;

    const [, key, value] = topLevelMatch;
    if (value) {
      data[key] = parseFrontmatterValue(value);
      continue;
    }

    const blockLines: string[] = [];
    while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
      index += 1;
      blockLines.push(lines[index]);
    }
    data[key] = parseIndentedFrontmatterBlock(blockLines);
  }

  data.date = normalizeDateValue(data.date);

  return {
    content: rawPost.slice(frontmatterMatch[0].length),
    data: data as BlogPost['data'],
  };
};

class BlogAPI {
  private posts: BlogPost[] = [];
  private postsBySlug = new Map<string, BlogPost>();
  private redirectFromMap = new Map<string, string>();

  constructor() {
    this.posts = sortBlogsByDate(
      RAW_POSTS.map(parsePost).filter(
        (post) => post.data.published !== false,
      ),
    );

    for (const post of this.posts) {
      const canonicalSlug = getBlogSlug(post);
      this.postsBySlug.set(canonicalSlug, post);

      for (const alias of getBlogAliases(post)) {
        this.postsBySlug.set(alias, post);
      }

      for (const from of (post.data.redirectFrom ?? [])) {
        this.redirectFromMap.set(from, canonicalSlug);
      }
    }
  }

  public getAllBlogs(): BlogPost[] {
    return [...this.posts];
  }

  public getFeaturedBlog(): BlogPost | undefined {
    return this.postsBySlug.get(BLOG_FEATURED_SLUG) ?? this.posts[0];
  }

  public getBlogGridBlogs(): BlogPost[] {
    return this.posts;
  }

  public getArticleHighlightBlogs(limit = 3): BlogPost[] {
    return this.getBlogGridBlogs().slice(0, limit);
  }

  public getBlogBySlug(slug: string): BlogPost | undefined {
    return this.postsBySlug.get(slug) ?? this.postsBySlug.get(resolveBlogSlug(slug));
  }

  public getRedirectTarget(slug: string): string | undefined {
    return this.redirectFromMap.get(slug);
  }
}

export const blogAPI = new BlogAPI();
