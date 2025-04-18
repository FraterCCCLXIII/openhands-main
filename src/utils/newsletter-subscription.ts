import { ActionFunctionArgs, json } from "react-router-dom";

export const handleNewsletterSubscription = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");

  if (!email || typeof email !== "string") {
    return json({ result: "error", msg: "Email is required" });
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
    return json(data);
  } catch (error) {
    return json({ result: "error", msg: "Failed to subscribe. Please try again later." });
  }
};