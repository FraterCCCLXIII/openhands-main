import type { Config } from '@react-router/dev/config';
import { vercelPreset } from '@vercel/react-router/vite';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const stringToSlug = (str: string) => str
  .toLowerCase()
  .replace(/ /g, "-")
  .replace(/[^a-z0-9-]/g, "");

export default {
  ssr: true,
  appDirectory: 'src',
  presets: [vercelPreset()],
  async prerender() {
    // Read all blog post files and extract slugs from titles
    const postsDir = path.join(process.cwd(), 'src/posts');
    const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
    
    const blogSlugs = postFiles.map(file => {
      const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
      const { data } = matter(content);
      return `/blog/${stringToSlug(data.title)}`;
    });

    return [
      '/',
      '/product',
      '/enterprise',
      '/pricing',
      '/community',
      '/manifesto',
      '/blog',
      '/about',
      '/press',
      '/contact',
      ...blogSlugs,
    ];
  },
} satisfies Config;
