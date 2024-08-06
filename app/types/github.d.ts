interface Branch {
  commit: {
    commit: {
      author: {
        date: string; // ISO date
      };
    };
  };
}

interface Repository {
  stargazers_count: number;
}

interface Contributor {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
}
