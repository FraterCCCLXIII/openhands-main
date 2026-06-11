function stripMarkdownToPlainText(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/[*_~>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getBlogPreviewText(post: Pick<Post, 'content' | 'data'>): string {
  const excerpt = post.data.excerpt?.trim();
  if (excerpt) return excerpt;

  return stripMarkdownToPlainText(post.content);
}
