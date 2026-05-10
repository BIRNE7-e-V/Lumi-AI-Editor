import { Link } from '@tanstack/react-router';

export function LegalLinks() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-base-content/70 sm:text-sm">
      <Link className="link link-hover" to="/impressum">
        Impressum
      </Link>
      <span className="hidden text-base-content/30 sm:inline" aria-hidden="true">
        |
      </span>
      <Link className="link link-hover" to="/datenschutz">
        Datenschutz
      </Link>
    </div>
  );
}
