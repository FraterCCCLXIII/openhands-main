import { type ActionFunctionArgs } from 'react-router';
import { Resend } from 'resend';

const resendAudienceId = import.meta.env.VITE_RESEND_AUDIENCE_ID;
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const handleNewsletterSubscription = async ({
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get('email');

  if (!email || typeof email !== 'string') {
    return { result: 'error', msg: 'Email is required' };
  }

  if (!resend) {
    console.warn('Resend API key not configured');
    return { result: 'error', msg: 'Newsletter subscription is not configured.' };
  }

  const { error, data } = await resend.contacts.create({
    email,
    audienceId: resendAudienceId,
  })

  if (error)  {
    console.warn(error);
    return { result: 'error', msg: 'Failed to subscribe. Please try again later.' };
  }

  return { result: "success", msg: 'Successfully subscribed!' };
};
