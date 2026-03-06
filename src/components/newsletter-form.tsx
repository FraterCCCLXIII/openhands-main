import React from 'react';
import { RegularButton } from './regular-button';
import { Form } from 'react-router';

interface NewsletterFormProps {
  error?: string;
  success?: string;
  disabled?: boolean;
}

export const NewsletterForm: React.FC<NewsletterFormProps> = ({
  error,
  success,
  disabled,
}) => {
  return (
    <div>
      <Form
        data-testid='newsletter-form'
        className='flex gap-4 md:gap-2 w-full flex-col md:flex-row items-center'
        method='post'
      >
        <input
          type='email'
          name='email'
          placeholder='Email'
          required
          pattern='[^@]+@[^.]+\..+'
          className='bg-white text-black py-2 px-4 rounded-lg w-full lg:w-[300px]'
        />
        <RegularButton type='submit' disabled={disabled}>
          Subscribe
        </RegularButton>
      </Form>
      {error && <p className='description mb-4 text-red-600'>{error}</p>}
      {success && (
        <div className='mt-4'>
          <h3 className='text-lg font-semibold text-green-600'>Thank you for your submission!</h3>
          <p className='description text-green-600'>{success}</p>
        </div>
      )}
    </div>
  );
};
