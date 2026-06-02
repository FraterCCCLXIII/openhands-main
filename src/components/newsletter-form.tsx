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
        data-wf-el='is-blog'
        className={clsx(
          'relative flex w-full flex-col items-center justify-center gap-4 text-[#5f5f5f]',
          centered && 'text-center'
        )}
        method='post'
      >
        <div data-wf-el='input-group' className='relative flex w-full max-w-[400px] flex-col gap-4 text-left text-[#5f5f5f] md:flex-row md:gap-5'>
          <input
            type='email'
            name='email'
            placeholder='Share your email'
            required
            pattern='[^@]+@[^.]+\..+'
            className='min-h-[52px] w-full rounded-[8px] border-none bg-white text-[16px] leading-[1.5] text-[#5f5f5f] outline-none transition-colors placeholder:text-[#b3a88c] focus:ring-1 focus:ring-brand-accent'
            style={{ verticalAlign: 'middle', marginBottom: '10px', padding: '25.6px 12px', height: '51px', minHeight: '0px', boxSizing: 'border-box' }}
          />
          <input
            data-wf-el='button'
            type='submit'
            value='Subscribe'
            disabled={disabled}
            className='btn-primary inline-flex min-h-[52px] cursor-pointer items-center justify-center rounded-[8px] px-[30.4px] py-[12px] text-[16px] font-medium leading-[1.3] disabled:cursor-not-allowed disabled:opacity-50'
            style={{ marginTop: '0px', marginBottom: '10px', position: 'relative', minHeight: 'auto', minWidth: 'auto', gap: '6.4px', paddingTop: '14.4px', paddingBottom: '14.4px' }}
          />
        </div>

        <p data-wf-el='eyebrow' className='m-0 max-w-[480px] text-center font-mono text-[12px] leading-[14.4px] text-[#5f5f5f]' style={{ textWrap: 'pretty' }}>
          {'By submitting your email you agree to our '}
          <a
            href='/privacy'
            target='_blank'
            rel='noreferrer'
            className='font-mono font-normal leading-[14.4px] text-[#5f5f5f] underline decoration-[1.2px] underline-offset-[0.18em] transition-colors hover:text-brand-fg'
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

      <div className={clsx('mt-4 text-center text-[#181818]', !success && 'hidden')}>
        <h3 className='text-[18px] font-medium leading-[1.2]'>Thank you for your submission!</h3>
        {success && <p className='mt-1 text-[14px] leading-[1.5] text-[#5f5f5f]'>{success}</p>}
      </div>
    </div>
  );
};
