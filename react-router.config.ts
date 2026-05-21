import type { Config } from '@react-router/dev/config';
import { vercelPreset } from '@vercel/react-router/vite';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

const stringToSlug = (str: string) => str
  .toLowerCase()
  .replace(/ /g, "-")
  .replace(/[^a-z0-9-]/g, "");

const getPostSlug = (data: { title: string; slug?: string }) =>
  data.slug ?? stringToSlug(data.title);

export default {
  ssr: true,
  routeDiscovery: { mode: "initial" },
  appDirectory: 'src',
  presets: [vercelPreset()],
  async prerender() {
    const postsDir = path.join(process.cwd(), 'src/posts');
    const postFiles = fs.readdirSync(postsDir).filter((file) => file.endsWith('.md'));

    const blogSlugs = postFiles.flatMap((file) => {
      const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
      const { data } = matter(content) as unknown as {
        data: { title: string; published?: boolean; slug?: string };
      };

      if (data.published === false) {
        return [];
      }

      return [`/blog/${getPostSlug(data)}`];
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
