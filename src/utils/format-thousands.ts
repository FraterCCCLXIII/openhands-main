export const formatThousands = (num: number) => {
  // Match openhands.dev format using Intl.NumberFormat compact notation
  // This produces "68.7K" format (one decimal, uppercase K)
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(num);
}
