import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../../api/subscribe-newsletter';

// Mock the Resend client
vi.mock('resend', () => {
  return {
    Resend: vi.fn().mockImplementation(() => {
      return {
        contacts: {
          create: vi.fn().mockImplementation(({ email }) => {
            if (email === 'error@example.com') {
              return Promise.resolve({ error: { message: 'Failed to subscribe' } });
            }
            return Promise.resolve({ id: 'contact-123', error: null });
          }),
        },
      };
    }),
  };
});

describe('subscribe-newsletter API', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      method: 'POST',
      body: {
        email: 'test@example.com',
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  it('should return 405 for non-POST requests', async () => {
    req.method = 'GET';
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('should return 400 if email is missing', async () => {
    req.body = {};
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ result: 'error', msg: 'Email is required' });
  });

  it('should return success for valid subscription', async () => {
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ 
      result: 'success', 
      msg: 'Successfully subscribed!' 
    });
  });

  it('should handle Resend API errors', async () => {
    req.body.email = 'error@example.com';
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      result: 'error', 
      msg: 'Failed to subscribe' 
    });
  });

  it('should include additional fields if provided', async () => {
    req.body = {
      email: 'test@example.com',
      first: 'John',
      last: 'Doe',
      data: {
        github_username: 'johndoe',
        company: 'Example Inc'
      }
    };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ 
      result: 'success', 
      msg: 'Successfully subscribed!' 
    });
  });
});