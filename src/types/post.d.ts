interface Post {
  content: string;
  data: {
    title: string;
    slug?: string;
    aliases?: string[];
    published?: boolean;
    importance?: 'Featured' | 'Standard' | 'SEO';
    seoTitleDate?: string;
    excerpt: string;
    coverImage: string | undefined;
    featuredImage?: string;
    coverAlt?: string;
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
