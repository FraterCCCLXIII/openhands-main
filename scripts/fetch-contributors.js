import fs from "fs";

const GITHUB_REPO = "OpenDevin/OpenDevin";

const DEPENDABOT_ID = 49699333;
const EXCLUDED_CONTRIBUTORS_ID = [DEPENDABOT_ID];

const fetchContributors = async () => {
  const response = await fetch(`https://github.com/${GITHUB_REPO}/graphs/contributors-data`, {
    headers: {
      accept: "application/json",
    },
  });
  const contributors = await response.json();

  const parsed = contributors
    .reverse()
    .slice(0, 60)
    .filter((contributor) => !EXCLUDED_CONTRIBUTORS_ID.includes(contributor.author.id))
    .map((contributor) => ({
      id: contributor.author.id,
      login: contributor.author.login,
      // commits: contributor.total, // Data is alread returned in the order of commits
    }));

  fs.writeFileSync("./src/data/contributors.json", JSON.stringify(parsed, null, 2));
};

fetchContributors()
  .then(() => console.log("Contributors fetched successfully"))
  .catch((error) => console.error("Error fetching contributors", error));
