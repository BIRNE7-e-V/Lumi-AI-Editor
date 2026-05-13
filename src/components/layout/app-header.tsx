import { twMerge } from 'tailwind-merge';

type AppHeaderProps = {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  leadingClassName?: string;
  trailingClassName?: string;
  compact?: boolean;
  wrap?: boolean;
};

export function AppHeader({
  leading,
  trailing,
  className,
  innerClassName,
  leadingClassName,
  trailingClassName,
  compact = false,
  wrap = true,
}: AppHeaderProps) {
  return (
    <header
      className={twMerge(
        'border-base-300 bg-base-100/90 shrink-0 border-b backdrop-blur',
        compact ? 'px-3 py-2 sm:px-4 sm:py-2' : 'px-4 py-3 sm:px-6',
        className
      )}
    >
      <div
        className={twMerge(
          'flex w-full items-center justify-between gap-3',
          trailing && wrap && 'flex-wrap',
          innerClassName
        )}
      >
        <div
          className={twMerge(
            'flex min-w-0 items-center gap-2',
            wrap && 'flex-wrap',
            leadingClassName
          )}
        >
          {leading}
        </div>
        {trailing ? (
          <div
            className={twMerge(
              'flex items-center justify-end gap-2',
              wrap && 'flex-wrap',
              trailingClassName
            )}
          >
            {trailing}
          </div>
        ) : null}
      </div>
    </header>
  );
}
