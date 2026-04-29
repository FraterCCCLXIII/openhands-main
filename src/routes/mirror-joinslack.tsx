import { redirect } from 'react-router';

export async function loader() {
  throw redirect('https://openhands.dev/joinslack');
}

export default function MirrorJoinSlackRoute() {
  return null;
}
