import React from 'react';
import { Settings } from 'lucide-react';
import {
  HOME_VARIANT_OPTIONS,
  HOME_VARIANT_SWITCHER_LABEL,
  type HomeVariantId,
} from '~/constants/home-variants';

type HomeVariantSwitcherProps = {
  variant: HomeVariantId;
  onVariantChange: (variant: HomeVariantId) => void;
};

export function HomeVariantSwitcher({ variant, onVariantChange }: HomeVariantSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      className='fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2'
      data-testid='home-variant-switcher'
    >
      {isOpen ? (
        <div
          ref={panelRef}
          role='dialog'
          aria-label={HOME_VARIANT_SWITCHER_LABEL}
          className='w-[240px] rounded-lg border border-[rgba(34,21,13,0.12)] bg-brand-bg p-4 shadow-lg'
        >
          <p className='mb-3 text-sm font-medium text-brand-fg'>{HOME_VARIANT_SWITCHER_LABEL}</p>
          <div className='flex flex-col gap-2'>
            {HOME_VARIANT_OPTIONS.map((option) => {
              const isSelected = variant === option.id;
              return (
                <button
                  key={option.id}
                  type='button'
                  data-testid={`home-variant-option-${option.id}`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onVariantChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`rounded-md border px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'border-brand-fg bg-[rgba(34,21,13,0.06)]'
                      : 'border-[rgba(34,21,13,0.12)] hover:border-[rgba(34,21,13,0.3)]'
                  }`}
                >
                  <span className='block text-sm font-medium text-brand-fg'>{option.label}</span>
                  <span className='mt-0.5 block text-xs text-brand-muted'>{option.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        ref={triggerRef}
        type='button'
        data-testid='home-variant-switcher-trigger'
        aria-label={HOME_VARIANT_SWITCHER_LABEL}
        aria-expanded={isOpen}
        aria-haspopup='dialog'
        onClick={() => setIsOpen((open) => !open)}
        className='flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(34,21,13,0.12)] bg-brand-bg text-brand-fg shadow-md transition-colors hover:border-[rgba(34,21,13,0.3)] hover:bg-[rgba(34,21,13,0.04)]'
      >
        <Settings className='h-5 w-5' strokeWidth={1.75} aria-hidden='true' />
      </button>
    </div>
  );
}
