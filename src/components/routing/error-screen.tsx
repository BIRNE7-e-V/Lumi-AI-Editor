import type { ErrorComponentProps } from '@tanstack/react-router';

export function RouteErrorScreen({ error, reset }: ErrorComponentProps) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const stack = error instanceof Error ? error.stack : null;

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
      <div className="card w-full max-w-3xl border border-error/20 bg-base-100 shadow-xl">
        <div className="card-body gap-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-error">
              Application error
            </p>
            <h1 className="text-3xl font-semibold text-balance">Something went wrong.</h1>
            <p className="text-sm leading-6 text-base-content/70">{errorMessage}</p>
          </div>

          {stack ? (
            <pre className="max-h-80 overflow-auto rounded-box bg-neutral p-4 text-xs leading-6 text-neutral-content">
              {stack}
            </pre>
          ) : null}

          <div className="card-actions justify-end">
            <button className="btn btn-primary" type="button" onClick={() => reset()}>
              Try again
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
