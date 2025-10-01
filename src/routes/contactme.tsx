import React, { useEffect } from 'react';
import type { Route } from './+types/contactme';

export const meta: Route.MetaFunction = () => [
  { title: 'Contact All-Hands AI - Opening Email...' },
  {
    name: 'description',
    content: 'Opening email client to contact All-Hands AI team',
  },
];

export default function ContactMe() {
  useEffect(() => {
    // Redirect to mailto link
    const mailtoLink = 'mailto:contact@all-hands.dev?cc=jamie@all-hands.dev&subject=AI%20Agents%20Hackathon';
    window.location.href = mailtoLink;
  }, []);

  return (
    <main className="bg-[#F1EAE0] min-h-screen flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4">
        <h1 className="heading-large mb-4">Opening Email Client...</h1>
        <p className="paragraph mb-6">
          Your email client should open automatically with a pre-filled message to contact the All-Hands AI team.
        </p>
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-lg mb-3">Email Details:</h2>
          <div className="text-left space-y-2">
            <p className="paragraph"><strong>To:</strong> contact@all-hands.dev</p>
            <p className="paragraph"><strong>CC:</strong> jamie@all-hands.dev</p>
            <p className="paragraph"><strong>Subject:</strong> AI Agents Hackathon</p>
          </div>
        </div>
        <p className="paragraph text-sm text-gray-600">
          If your email client doesn't open automatically, you can manually send an email to{' '}
          <a 
            href="mailto:contact@all-hands.dev?cc=jamie@all-hands.dev&subject=AI%20Agents%20Hackathon"
            className="text-[#6366F1] hover:underline"
          >
            contact@all-hands.dev
          </a>{' '}
          with the subject "AI Agents Hackathon" and CC jamie@all-hands.dev.
        </p>
      </div>
    </main>
  );
}