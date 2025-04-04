// API route for newsletter subscriptions
import { Resend } from 'resend';

// Initialize Resend client with API key from environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

// Production audience ID
const PROD_AUDIENCE_ID = '14a0a664-dbc7-4920-8a36-f5248bdaafeb';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        result: 'error', 
        msg: 'Email is required' 
      });
    }

    // Prepare contact data
    const contactData = {
      email,
      audienceId: PROD_AUDIENCE_ID,
      unsubscribed: false
    };

    // Subscribe to the newsletter using Resend API
    const data = await resend.contacts.create(contactData);

    if (data.error) {
      return res.status(400).json({ 
        result: 'error', 
        msg: data.error.message || 'Failed to subscribe' 
      });
    }

    return res.status(200).json({ 
      result: 'success', 
      msg: 'Successfully subscribed!' 
    });
  } catch (error) {
    console.error('Error subscribing:', error);
    return res.status(500).json({ 
      result: 'error', 
      msg: 'Failed to subscribe. Please try again later.' 
    });
  }
}