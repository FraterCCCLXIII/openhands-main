import { redirect } from 'react-router';
import type { Route } from './+types/joinslack';

const SLACK_REDIRECT_URL = 'https://go.openhands.dev/slack';

export const meta: Route.MetaFunction = () => [
  { title: 'Join OpenHands Slack - Redirecting...' },
  {
    name: 'description',
    content: 'Redirecting to the OpenHands Slack workspace invitation.',
  },
];

export const loader = () => redirect(SLACK_REDIRECT_URL, 301);

export default function JoinSlack() {
  return null;
}
