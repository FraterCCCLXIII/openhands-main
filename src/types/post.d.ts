interface Post {
  content: string;
  data: {
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
