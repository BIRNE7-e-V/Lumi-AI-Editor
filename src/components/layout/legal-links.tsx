import { Link } from '@tanstack/react-router';

export function LegalLinks() {
  return (
    <div className="text-base-content/70 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs sm:text-sm">
      <Link className="link link-hover" to="/impressum">
        Impressum
      </Link>
      <span className="text-base-content/30 hidden sm:inline" aria-hidden="true">
        |
      </span>
      <Link className="link link-hover" to="/datenschutz">
        Datenschutz
      </Link>
    </div>
  );
}
