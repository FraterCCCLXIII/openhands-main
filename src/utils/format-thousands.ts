export const formatThousands = (stars: number) => {
  if (stars < 1000) return stars.toString();
  return `${Math.floor(stars / 1000)}k`;
}
