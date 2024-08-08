import { bundleMDX } from "mdx-bundler";

export const { code, frontmatter } = await bundleMDX({
  cwd: process.cwd(),
  file: './app/posts/blog-1/blog-1.mdx',
});
