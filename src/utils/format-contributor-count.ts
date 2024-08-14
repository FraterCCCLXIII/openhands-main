export const formatContributorCount = (count: number) => {
  if (count === 0) {
    return "No contributors";
  } else if (count < 50) {
    return count.toString();
  } else if (count < 100) {
    return "50+";
  } else if (count < 150) {
    return "100+";
  } else if (count < 200) {
    return "150+";
  } else if (count < 1000) {
    return "200+";
  } else {
    return "1000+";
  }
}