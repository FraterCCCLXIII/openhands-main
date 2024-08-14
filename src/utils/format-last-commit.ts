export const formatLastCommit = (date: string) => {
  const lastCommitDate = new Date(date);
  const currentDate = new Date();
  const timeDifference = currentDate.getTime() - lastCommitDate.getTime();

  const seconds = timeDifference / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const weeks = days / 7;

  console.log(hours)

  if (weeks >= 1) return `${Math.floor(weeks)} week${Math.floor(weeks) > 1 ? 's' : ''} ago`;
  if (days >= 1) return `${Math.floor(days)} day${Math.floor(days) > 1 ? 's' : ''} ago`;
  if (hours >= 1) return `${Math.floor(hours)} hour${Math.floor(hours) > 1 ? 's' : ''} ago`;
  if (minutes >= 1) return `${Math.floor(minutes)} minute${Math.floor(minutes) > 1 ? 's' : ''} ago`;

  return 'Just now';
}
