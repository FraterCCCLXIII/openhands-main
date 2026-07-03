/**
 * Calculate toast duration based on message length.
 */
export const calculateToastDuration = (
  message: string | null | undefined,
  minDuration: number = 5000,
  maxDuration: number = 10000,
): number => {
  if (!message) {
    return minDuration;
  }

  const wordsPerMinute = 200;
  const charactersPerMinute = wordsPerMinute * 5;
  const charactersPerSecond = charactersPerMinute / 60;
  const readingTimeMs = (message.length / charactersPerSecond) * 1000;
  const durationWithBuffer = readingTimeMs * 1.5;

  return Math.min(Math.max(durationWithBuffer, minDuration), maxDuration);
};
