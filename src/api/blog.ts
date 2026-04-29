import matter from "gray-matter";
import { RAW_POSTS } from "~/posts";
import { resolveBlogSlug } from "~/utils/blog-slug-aliases";
import { stringToSlug } from "~/utils/string-to-slug";

type BlogPost = Post & {
  data: Post["data"] & {
    slug?: string;
    aliases?: string[];
    published?: boolean;
    seoTitleDate?: string;
    coverRadius?: 'none';
  };
};

export const BLOG_FEATURED_SLUG = 'openhands-index';

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

class BlogAPI {
  private posts: BlogPost[] = [];
  private postsBySlug = new Map<string, BlogPost>();

  constructor() {
    this.posts = sortBlogsByDate(
      RAW_POSTS.map((post) => matter(post) as BlogPost).filter((post) => post.data.published !== false),
    );

    for (const post of this.posts) {
      this.postsBySlug.set(getBlogSlug(post), post);

      for (const alias of getBlogAliases(post)) {
        this.postsBySlug.set(alias, post);
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
    const featuredBlog = this.getFeaturedBlog();

    return this.posts.filter((post) => post !== featuredBlog);
  }

  public getArticleHighlightBlogs(limit = 3): BlogPost[] {
    return this.getBlogGridBlogs().slice(0, limit);
  }

  public getBlogBySlug(slug: string): BlogPost | undefined {
    return this.postsBySlug.get(slug) ?? this.postsBySlug.get(resolveBlogSlug(slug));
  }
}

export const blogAPI = new BlogAPI();
