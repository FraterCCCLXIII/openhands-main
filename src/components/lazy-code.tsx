import React from 'react';
import type { ExtraProps } from 'react-markdown';
import { FallbackCode } from './fallback-code';

const LazyCodeModule = React.lazy(async () => {
  const module = await import('~/components/code');
  return { default: module.code };
});

type CodePropsType = React.ClassAttributes<HTMLElement> &
  React.HTMLAttributes<HTMLElement> &
  ExtraProps;

interface CodeProps extends CodePropsType {
  customStyle?: React.CSSProperties;
}

export const LazyCode: React.FC<React.PropsWithChildren<CodeProps>> = ({
  children,
  className,
  customStyle,
}) => {
  return (
    <React.Suspense
      fallback={
        <FallbackCode className={className} customStyle={customStyle}>
          {children}
        </FallbackCode>
      }
    >
      <LazyCodeModule className={className} customStyle={customStyle}>
        {children}
      </LazyCodeModule>
    </React.Suspense>
  );
};
