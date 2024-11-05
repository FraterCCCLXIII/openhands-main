export const formatContributorCount = (count: number) => {
  if (count === 0) {
    return "No contributors";
  } else if (count < 10) {
    return count.toString();
  } else {
    // Round down to nearest 10 and add '+'
    const base = Math.floor(count / 10) * 10;
    return `${base}+`;
  }
}