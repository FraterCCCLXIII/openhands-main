import React, { useEffect } from 'react';
import type { Route } from './+types/github';

export const meta: Route.MetaFunction = () => [
  { title: 'OpenHands GitHub - Redirecting...' },
  {
    name: 'description',
    content: 'Redirecting to OpenHands repository on GitHub',
  },
];

export default function GitHub() {
  useEffect(() => {
    // Redirect to the GitHub repository
    window.location.href = 'https://github.com/All-Hands-AI/OpenHands';
  }, []);

  return (
    <main className="bg-[#F1EAE0] min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="heading-large mb-4">Redirecting to OpenHands GitHub...</h1>
        <p className="paragraph mb-6">
          You are being redirected to the OpenHands repository on GitHub.
        </p>
        <p className="paragraph text-sm text-gray-600">
          If you are not redirected automatically, 
          <a 
            href="https://github.com/All-Hands-AI/OpenHands" 
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