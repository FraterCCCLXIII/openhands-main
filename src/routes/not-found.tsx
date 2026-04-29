import { data, Link, type MetaFunction } from 'react-router';

export const loader = () => data(null, { status: 404 });

export const meta: MetaFunction = () => [
  { title: 'Not Found' },
  {
    name: 'description',
    content: 'The requested OpenHands page could not be found.',
  },
];

export default function NotFoundRoute() {
  return (
    <main className='px-6 py-16 lg:px-10 lg:py-24'>
      <section className='mx-auto flex max-w-3xl flex-col items-center rounded-[28px] border border-brand-fg/10 bg-white/50 px-8 py-14 text-center'>
        <p className='text-sm uppercase tracking-[0.14em] text-brand-muted'>404</p>
        <h1 className='mt-4 text-[32px] font-medium leading-[1.1] tracking-[-0.03em] text-brand-fg lg:text-[44px]'>
          Page Not Found
        </h1>
        <p className='mt-4 max-w-2xl text-[18px] leading-[1.6] text-brand-muted'>
          The page you are looking for doesn't exist or has been moved
        </p>
        <Link to='/' className='btn btn-primary mt-8 rounded-none'>
          Go home
        </Link>
      </section>
    </main>
  );
}
