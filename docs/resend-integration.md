# Resend Integration

This document describes how to use the Resend integration for newsletter signups.

## Overview

The website uses [Resend](https://resend.com) for managing newsletter signups. The newsletter signup form is located on the blog page and uses a secure server-side API endpoint to add contacts to the Resend audience.

## Security

This implementation follows security best practices:
- The Resend API key is only used on the server side
- No sensitive credentials are exposed to the client
- All API calls to Resend are made from a secure server-side endpoint

## Configuration

The Resend integration requires the following environment variables to be set on the server:

```
RESEND_API_KEY=your_resend_api_key
```

In development, you can set this in a `.env` file in the root of the project.
In production, set this as an environment variable in your Vercel project settings.

## Audience ID

The production audience ID is hardcoded in the API endpoint:

```js
const PROD_AUDIENCE_ID = '14a0a664-dbc7-4920-8a36-f5248bdaafeb';
```

## API Endpoints

The server-side API is implemented as a Vercel API route:

- `/api/subscribe-newsletter`: Handles all subscription requests

The client-side forms submit to this endpoint, which then securely communicates with the Resend API.

## Testing

To test the integration locally:

1. Set up the environment variable:
   ```
   RESEND_API_KEY=your_resend_api_key
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. Submit the form on the blog page or join page