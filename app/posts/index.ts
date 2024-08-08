import { bundleMDX } from "mdx-bundler";

import fs from "fs";
import path from "path";

interface BlogData {
  code: string;
  frontmatter: {
    title: string;
    excerpt: string;
    coverImage: string | undefined;
    date: string; // ISO string
    author: {
      name: string;
      picture: string;
    };
    ogImage: {
      url: string;
    };
  };
}

const bundleMDXFromName = async (name: string) => bundleMDX({
  cwd: process.cwd(),
  file: `./app/posts/${name}`,
});

const getFilesInCurrentDirectory = async () => {
  const directoryPath = path.join(process.cwd(), "app/posts");
  return fs.readdirSync(directoryPath);
}

const retrieveBlogData = async (): Promise<BlogData[]> => {
  const allFileNames = await getFilesInCurrentDirectory();
  const mdFileNames = allFileNames.filter((fileName) => fileName.endsWith(".md"));
  const PROMISES = mdFileNames.map(async (fileName) => bundleMDXFromName(fileName)) as unknown as Promise<BlogData>[];
  return Promise.all(PROMISES);
}

class BlogAPI {
  private posts: BlogData[] = [];

  constructor() { }

  public async init() {
    this.posts = await retrieveBlogData();
  }

  public async getAllBlogs(): Promise<BlogData[]> {
    return this.posts;
  }

  public async getBlogByIndex(index: number): Promise<BlogData> {
    return this.posts[index];
  }
}

const blogAPI = new BlogAPI();
blogAPI.init();

export { blogAPI };
