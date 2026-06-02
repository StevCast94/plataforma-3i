import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Algo salió mal',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <span className="text-5xl">⚠️</span>
      <h2 className="mt-5 text-2xl text-primary">{title}</h2>
      {message && <p className="mt-2 text-brand-gray">{message}</p>}
      {onRetry && (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
