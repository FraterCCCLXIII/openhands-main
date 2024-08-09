import matter from "gray-matter";
import { RAW_POSTS } from "~/posts";

class BlogAPI {
  private posts: Post[] = [];

  constructor() { 
    this.posts = RAW_POSTS.map((post) => matter(post)) as unknown as Post[];
  }

  public getAllBlogs(): Post[] {
    return this.posts;
  }

  public getBlogByIndex(index: number): Post {
    return this.posts[index];
  }
}

export const blogAPI = new BlogAPI();
