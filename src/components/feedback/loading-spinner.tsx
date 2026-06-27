type LoadingSpinnerProps = {
  label?: string;
};

export const LoadingSpinner = ({ label = "Loading..." }: LoadingSpinnerProps) => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      <p className="text-sm text-[var(--color-text-base)]">{label}</p>
    </div>
  </div>
);
