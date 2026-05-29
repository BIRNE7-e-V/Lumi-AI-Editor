import { Link } from '@tanstack/react-router';

export function NotFoundScreen() {
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
      <div className="card border-base-300 bg-base-100 w-full max-w-2xl border shadow-xl">
        <div className="card-body items-start gap-5">
          <div className="badge badge-outline badge-primary">404</div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-balance">Seite nicht gefunden</h1>
            <p className="text-base-content/70 leading-7">
              Die angeforderte Seite existiert nicht oder wurde verschoben.
            </p>
          </div>
          <div className="card-actions">
            <Link className="btn btn-primary btn-lg" to="/">
              Zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
