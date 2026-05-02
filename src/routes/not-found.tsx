import { data, type MetaFunction } from 'react-router';
import { OverlayLinkButton } from '~/components/overlay-link-button';

export const loader = () => data(null, { status: 404 });

export const handle = { hideGlobalFooter: true };

export const meta: MetaFunction = () => [
  { title: 'Not Found' },
  {
    name: 'description',
    content: 'The requested OpenHands page could not be found.',
  },
];

export default function NotFoundRoute() {
  return (
    <main className='px-6 pt-[20.2vh] lg:px-10'>
      <section className='mx-auto flex max-w-[600px] flex-col items-center text-center'>
        <div className='text-[16px] leading-[22.4px] text-brand-fg'>404</div>
        <h1 className='mt-[22px] w-full text-[32px] font-medium leading-[1.1] tracking-[-0.03em] text-brand-fg lg:text-[44px] lg:leading-[48.4px]'>
          Page Not Found
        </h1>
        <div className='mt-1 text-[18px] font-semibold leading-[25.2px] text-brand-fg lg:text-[20px] lg:leading-[28px]'>
          The page you are looking for doesn't exist or has been moved
        </div>
        <OverlayLinkButton href='/' label='Go home' className='mt-[9px]' />
      </section>
    </main>
  );
}
