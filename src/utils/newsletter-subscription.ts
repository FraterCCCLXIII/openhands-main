import { ActionFunctionArgs } from 'react-router';

export const handleNewsletterSubscription = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get('email');

  if (!email || typeof email !== 'string') {
    return { result: 'error', msg: 'Email is required' };
  }

  try {
    // Call our server-side API endpoint instead of directly using Resend
    const response = await fetch('/api/subscribe-newsletter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(error);
    return {
      result: 'error',
      msg: 'Failed to subscribe. Please try again later.',
    };
  }
};
