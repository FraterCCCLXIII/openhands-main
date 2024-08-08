import * as blog1 from "./blog-1/bundled";
import * as blog2 from "./blog-2/bundled";

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

export const ALL_BLOGS = [
  blog1,
  blog2,
  blog1,
  blog2,
] as BlogData[];
