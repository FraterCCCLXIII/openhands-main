import fs from "fs";

const GITHUB_REPO = "OpenDevin/OpenDevin";

const fetchStargazers = async () => {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`);
  const data = await response.json();

  return data.stargazers_count;
};

const fetchLatestCommit = async () => {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits/main`);
  const data = await response.json();

  return data.commit.author.date;
};

const fetchContributorsCount = async () => {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contributors?per_page=1&anon=true`);
  // see https://stackoverflow.com/a/44347632
  const linkHeader = response.headers.get("link");
  const match = linkHeader.match(/page=(\d+)>; rel="last"/);
  const lastPage = match ? parseInt(match[1], 10) : 1;

  return lastPage;
};

const fetchRepoStatistics = async () => {
  const stargazers = await fetchStargazers();
  const latestCommit = await fetchLatestCommit();
  const contributorsCount = await fetchContributorsCount();

  const data = { stargazers, latest_commit: latestCommit, contributors_count: contributorsCount };
  fs.writeFileSync("./src/data/statistics.json", JSON.stringify(data, null, 2));
}

fetchRepoStatistics()
  .then(() => console.log("Repo statistics fetched successfully"))
  .catch((error) => console.error("Error fetching repo statistics", error));
