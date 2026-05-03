import clsx from 'clsx';
import React from 'react';
import { Form } from 'react-router';

interface NewsletterFormProps {
  error?: string;
  success?: string;
  disabled?: boolean;
  centered?: boolean;
  className?: string;
}

export const NewsletterForm: React.FC<NewsletterFormProps> = ({
  error,
  success,
  disabled,
  centered = false,
  className,
}) => {
  return (
    <div className={clsx('w-full', centered && 'flex flex-col items-center', className)}>
      <Form
        data-testid='newsletter-form'
        className={clsx(
          'flex w-full flex-col items-center gap-4',
          centered && 'text-center'
        )}
        method='post'
      >
        <div className='flex w-full max-w-[400px] flex-col gap-4 md:flex-row md:items-center md:gap-5'>
          <input
            type='email'
            name='email'
            placeholder='Share your email'
            required
            pattern='[^@]+@[^.]+\..+'
            className='min-h-[52px] w-full rounded-[8px] border border-black/5 bg-white px-6 text-[16px] leading-[1.5] text-[#5f5f5f] outline-none transition-colors placeholder:text-[#b3a88c] focus:border-brand-accent'
          />
          <input
            type='submit'
            value='Subscribe'
            disabled={disabled}
            className='btn btn-primary m-0 min-h-[52px] rounded-[8px] disabled:cursor-not-allowed disabled:opacity-50'
          />
        </div>

        <p className='m-0 max-w-[400px] text-left text-[12px] leading-[1.4] text-[#5f5f5f]'>
          By submitting your email you agree to our{' '}
          <a
            href='/privacy'
            target='_blank'
            rel='noreferrer'
            className='font-medium text-[#5f5f5f] underline decoration-[1px] underline-offset-[0.18em] transition-colors hover:text-brand-fg'
          >
            Privacy Policy
          </a>
        </p>
      </Form>

      {error && (
        <p className='mt-4 border-t border-[#e31700] pt-2 text-[14px] leading-[1.5] text-[#e31700]'>
          {error}
        </p>
      )}

      <div className={clsx('mt-4 text-center text-[#22150d]', !success && 'hidden')}>
        <h3 className='text-[18px] font-medium leading-[1.2]'>Thank you for your submission!</h3>
        {success && <p className='mt-1 text-[14px] leading-[1.5] text-[#5f5f5f]'>{success}</p>}
      </div>
    </div>
  );
};
