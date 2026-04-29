import matter from "gray-matter";
import { RAW_POSTS } from "~/posts";
import { resolveBlogSlug } from "~/utils/blog-slug-aliases";
import { stringToSlug } from "~/utils/string-to-slug";

type BlogPost = Post & {
  data: Post["data"] & {
    slug?: string;
    aliases?: string[];
    published?: boolean;
  };
};

export const getBlogSlug = (post: BlogPost) => post.data.slug ?? stringToSlug(post.data.title);

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
    this.posts = RAW_POSTS
      .map((post) => matter(post) as BlogPost)
      .filter((post) => post.data.published !== false);

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

  public getBlogBySlug(slug: string): BlogPost | undefined {
    return this.postsBySlug.get(slug) ?? this.postsBySlug.get(resolveBlogSlug(slug));
  }
}

export const blogAPI = new BlogAPI();
