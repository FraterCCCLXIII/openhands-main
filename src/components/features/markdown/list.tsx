import React from "react";
import { ExtraProps } from "react-markdown";

// Custom component to render <ul> in markdown
export function ul({
  children,
}: React.ClassAttributes<HTMLUListElement> &
  React.HTMLAttributes<HTMLUListElement> &
  ExtraProps) {
  return (
    <ul className="my-2 list-disc ml-5 pl-2 whitespace-normal leading-6 marker:text-muted">
      {children}
    </ul>
  );
}

// Custom component to render <ol> in markdown with bubbled numbers
export function ol({
  children,
  start = 1,
}: React.ClassAttributes<HTMLOListElement> &
  React.OlHTMLAttributes<HTMLOListElement> &
  ExtraProps) {
  return (
    <ol
      className="my-2 list-none ml-1 pl-0 whitespace-normal leading-6 space-y-1"
      style={{ counterReset: `list-counter ${start - 1}` }}
    >
      {children}
    </ol>
  );
}

// Custom component to render <li> in markdown
export function li({
  children,
  className,
  ...props
}: React.ClassAttributes<HTMLLIElement> &
  React.LiHTMLAttributes<HTMLLIElement> &
  ExtraProps) {
  // Detect if parent is an ordered list by checking if className contains 'ordered'
  // or by checking context - for now we'll use a CSS approach that works for both
  return (
    <li
      className="py-0.5 flex gap-2.5 items-baseline [counter-increment:list-counter] before:content-[counter(list-counter)] before:flex before:items-center before:justify-center before:min-w-5 before:h-5 before:text-xs before:font-medium before:rounded-full before:bg-cool-grey-800 before:text-cool-grey-300 before:shrink-0 [ul_>&]:before:content-['•'] [ul_>&]:before:bg-transparent [ul_>&]:before:text-muted [ul_>&]:before:min-w-3 [ul_>&]:before:h-auto"
      {...props}
    >
      <span className="flex-1">{children}</span>
    </li>
  );
}
