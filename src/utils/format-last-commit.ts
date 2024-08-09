export const formatLastCommit = (date: string) => {
  const lastCommitDate = new Date(date);
  const currentDate = new Date();
  const timeDifference = currentDate.getTime() - lastCommitDate.getTime();

  const seconds = timeDifference / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const weeks = days / 7;

  if (weeks >= 1) return `${Math.floor(weeks)} weeks ago`;
  if (days >= 1) return `${Math.floor(days)} days ago`;
  if (hours >= 1) return `${Math.floor(hours)} hours ago`;
  if (minutes >= 1) return `${Math.floor(minutes)} minutes ago`;

  return 'Just now';
}
