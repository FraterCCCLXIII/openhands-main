export const formatContributorCount = (count: number) => {
  if (count === 0) {
    return "No contributors";
  } else if (count < 50) {
    return count.toString();
  } else {
    // Round down to nearest 50 and add '+'
    const base = Math.floor(count / 50) * 50;
    return `${base}+`;
  }
}