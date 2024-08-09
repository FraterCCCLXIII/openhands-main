import matter from "gray-matter";
import { RAW_POSTS } from "~/posts";

class BlogAPI {
  private posts: Post[] = [];

  constructor() { 
    this.posts = RAW_POSTS.map((post) => matter(post)) as unknown as Post[];
  }

  public async getAllBlogs(): Promise<Post[]> {
    return this.posts;
  }

  public async getBlogByIndex(index: number): Promise<Post> {
    return this.posts[index];
  }
}

export const blogAPI = new BlogAPI();
