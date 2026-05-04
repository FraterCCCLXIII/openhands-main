import type { ReactNode } from 'react';

interface CompanyPageShellProps {
  children: ReactNode;
  backgroundClassName?: string;
}

export const CompanyPageShell = ({
  children,
  backgroundClassName = 'opacity-[0.12]',
}: CompanyPageShellProps) => {
  return (
    <main data-wf-el='page-main' className='relative overflow-hidden' style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        aria-hidden='true'
        data-testid='company-page-background'
        className={`pointer-events-none absolute inset-0 bg-cover bg-top bg-no-repeat ${backgroundClassName}`}
        style={{
          backgroundImage:
            "url('/assets/webflow/backgrounds/690b397ae76441160bed52b6_asci-art-hole.png')",
        }}
      />
      <div className='relative'>{children}</div>
    </main>
  );
};
