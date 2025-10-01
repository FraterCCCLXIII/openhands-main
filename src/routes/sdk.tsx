import React, { useEffect } from 'react';
import type { Route } from './+types/sdk';

export const meta: Route.MetaFunction = () => [
  { title: 'OpenHands SDK - Redirecting...' },
  {
    name: 'description',
    content: 'Redirecting to OpenHands Agent SDK on GitHub',
  },
];

export default function SDK() {
  useEffect(() => {
    // Redirect to the GitHub repository in a new window
    window.open('https://github.com/All-Hands-AI/agent-sdk', '_blank', 'noopener,noreferrer');
    // Also redirect the current window for fallback
    window.location.href = 'https://github.com/All-Hands-AI/agent-sdk';
  }, []);

  return (
    <main className="bg-[#F1EAE0] min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="heading-large mb-4">Redirecting to OpenHands SDK...</h1>
        <p className="paragraph mb-6">
          You are being redirected to the OpenHands Agent SDK repository on GitHub.
        </p>
        <p className="paragraph text-sm text-gray-600">
          If you are not redirected automatically, 
          <a 
            href="https://github.com/All-Hands-AI/agent-sdk" 
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