import React, { useEffect } from 'react';
import type { Route } from './+types/survey';

export const meta: Route.MetaFunction = () => [
  { title: 'OpenHands Monthly Survey - Redirecting...' },
  {
    name: 'description',
    content: 'Redirecting to OpenHands monthly survey',
  },
];

export default function Survey() {
  useEffect(() => {
    // Redirect to the Google Forms survey
    const surveyUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeJWKixJAUQUxveas8HxtP25KhkAtMbz6s0ibHvduG8kuq7ew/viewform?usp=sf_link';
    window.location.href = surveyUrl;
  }, []);

  return (
    <main className="bg-[#F1EAE0] min-h-screen flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="heading-large mb-4">Taking you to our monthly survey...</h1>
        <p className="paragraph mb-6">
          You are being redirected to the OpenHands monthly survey.
        </p>
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-lg mb-3">Help us improve OpenHands:</h2>
          <ul className="text-left space-y-2 list-disc pl-6">
            <li className="paragraph">Share your feedback on OpenHands features</li>
            <li className="paragraph">Tell us about your experience using the platform</li>
            <li className="paragraph">Help shape the future of OpenHands development</li>
          </ul>
        </div>
        <p className="paragraph text-sm text-gray-600">
          If you're not redirected automatically, 
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSeJWKixJAUQUxveas8HxtP25KhkAtMbz6s0ibHvduG8kuq7ew/viewform?usp=sf_link"
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