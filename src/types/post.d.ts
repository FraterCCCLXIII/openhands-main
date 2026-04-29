interface Post {
  content: string;
  data: {
    title: string;
    slug?: string;
    aliases?: string[];
    published?: boolean;
    seoTitleDate?: string;
    excerpt: string;
    coverImage: string | undefined;
    coverRadius?: 'none';
    date: string; // ISO string
    authors: {
      name: string;
      picture?: string;
      link?: string;
    }[];
    ogImage: {
      url: string;
    };
  };
}
