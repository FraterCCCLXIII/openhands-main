interface Post {
  content: string;
  data: {
    title: string;
    slug?: string;
    aliases?: string[];
    published?: boolean;
    excerpt: string;
    coverImage: string | undefined;
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
