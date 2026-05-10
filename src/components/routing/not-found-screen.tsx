import { Link } from '@tanstack/react-router';

export function NotFoundScreen() {
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
      <div className="card w-full max-w-2xl border border-base-300 bg-base-100 shadow-xl">
        <div className="card-body items-start gap-5">
          <div className="badge badge-outline badge-primary">404</div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-balance">Seite nicht gefunden</h1>
            <p className="leading-7 text-base-content/70">
              Die angeforderte Seite existiert nicht oder wurde verschoben.
            </p>
          </div>
          <div className="card-actions">
            <Link className="btn btn-primary" to="/">
              Zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
