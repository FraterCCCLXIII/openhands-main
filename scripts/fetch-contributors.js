import fs from "fs";

const GITHUB_REPO = "OpenDevin/OpenDevin";

const fetchContributors = async () => {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contributors`);
  const contributors = await response.json();

  fs.writeFileSync("./src/data/contributors.json", JSON.stringify(contributors, null, 2));
};

fetchContributors()
  .then(() => console.log("Contributors fetched successfully"))
  .catch((error) => console.error("Error fetching contributors", error));
