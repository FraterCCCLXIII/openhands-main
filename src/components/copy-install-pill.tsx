import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

type CopyInstallPillProps = {
  command: string;
};

export function CopyInstallPill({ command }: CopyInstallPillProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can fail in unsupported contexts; leave the pill unchanged.
    }
  };

  return (
    <button
      type='button'
      onClick={handleCopy}
      className='group flex max-w-full items-center gap-2 rounded-full border border-[rgba(24,24,24,0.2)] bg-[#f7f3ee] px-3 py-1.5 text-brand-fg transition-colors hover:border-[rgba(24,24,24,0.35)] hover:bg-[#f3ede4]'
      aria-label={copied ? 'Copied install command' : 'Copy install command'}
      title={copied ? 'Copied!' : 'Click to copy'}
    >
      <code className='truncate font-mono text-sm font-normal leading-[19.6px]'>{command}</code>
      {copied ? (
        <Check className='h-3.5 w-3.5 flex-shrink-0 text-brand-fg/70' strokeWidth={2} aria-hidden='true' />
      ) : (
        <Copy className='h-3.5 w-3.5 flex-shrink-0 text-brand-fg/50 transition-colors group-hover:text-brand-fg/70' strokeWidth={2} aria-hidden='true' />
      )}
    </button>
  );
}
