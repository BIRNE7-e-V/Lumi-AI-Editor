import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  size?: 'md' | 'lg';
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ open, title, description, size = 'lg', onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="bg-base-content/25 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`rounded-box border-base-300 bg-base-100 w-full border shadow-2xl ${size === 'md' ? 'max-w-2xl' : 'max-w-3xl'}`}
      >
        <div className="border-base-300 flex items-start justify-between gap-4 border-b px-6 py-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="text-base-content/65 text-sm">{description}</p>}
          </div>
          <button
            aria-label="Schließen"
            className="btn btn-circle btn-ghost btn-sm"
            type="button"
            onClick={onClose}
          >
            <XMarkIcon className="size-5" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
