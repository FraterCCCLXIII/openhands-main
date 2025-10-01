import React, { useEffect } from 'react';
import type { Route } from './+types/joinslack';

export const meta: Route.MetaFunction = () => [
  { title: 'Join OpenHands Slack - Redirecting...' },
  {
    name: 'description',
    content: 'Redirecting to OpenHands Slack workspace invitation',
  },
];

export default function JoinSlack() {
  useEffect(() => {
    // Redirect to the Slack workspace invitation link
    const slackInviteUrl = 'https://join.slack.com/t/openhands-ai/shared_invite/zt-3dz15yufa-fjhM~pgiTGhVKapZghT3YA';
    window.location.href = slackInviteUrl;
  }, []);

  return (
    <main className="bg-[#F1EAE0] min-h-screen flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="heading-large mb-4">Joining OpenHands Slack...</h1>
        <p className="paragraph mb-6">
          You are being redirected to join the OpenHands Slack workspace.
        </p>
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-lg mb-3">What happens next:</h2>
          <ol className="text-left space-y-2 list-decimal pl-6">
            <li className="paragraph">You'll be taken to Slack's invitation page</li>
            <li className="paragraph">Click "Join Workspace" to join the OpenHands community</li>
            <li className="paragraph">Start participating in discussions and get help from the community</li>
          </ol>
        </div>
        <p className="paragraph text-sm text-gray-600">
          If you're not redirected automatically, 
          <a 
            href="https://join.slack.com/t/openhands-ai/shared_invite/zt-3dz15yufa-fjhM~pgiTGhVKapZghT3YA"
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#6366F1] hover:underline ml-1"
          >
            click here
          </a>.
        </p>
      </div>
    </main>
  );
}