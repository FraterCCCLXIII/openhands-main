import matter from "gray-matter";
import { RAW_POSTS } from "~/posts";
import { stringToSlug } from "~/utils/string-to-slug";

class BlogAPI {
  private posts: Post[] = [];

  constructor() {
    this.posts = RAW_POSTS.map((post) => matter(post)) as unknown as Post[];
  }

  public getAllBlogs(): Post[] {
    return this.posts;
  }

  public getBlogBySlug(slug: string): Post | undefined {
    return this.posts.find((post) => stringToSlug(post.data.title) === slug);
  }
}

export const blogAPI = new BlogAPI();
