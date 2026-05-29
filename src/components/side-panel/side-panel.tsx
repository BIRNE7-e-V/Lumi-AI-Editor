import { type ComponentType, type ReactNode, type SVGProps, useCallback, useState } from 'react';

import { twMerge } from 'tailwind-merge';

export const SIDE_PANEL_TOGGLE_WIDTH = 40;
const SIDE_PANEL_MIN_WIDTH = 200;
const SIDE_PANEL_MAX_WIDTH = 700;

type SidePanelProps = {
  side: 'left' | 'right';
  open: boolean;
  defaultWidth: number;
  storageKey: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  onToggle: () => void;
  children: ReactNode;
};

export function SidePanel({
  side,
  open,
  defaultWidth,
  storageKey,
  icon: Icon,
  label,
  onToggle,
  children,
}: SidePanelProps) {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = Number(saved);
      if (parsed >= SIDE_PANEL_MIN_WIDTH && parsed <= SIDE_PANEL_MAX_WIDTH) return parsed;
    }
    return defaultWidth;
  });

  const [isResizing, setIsResizing] = useState(false);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!open) return;
      e.preventDefault();

      const startX = e.clientX;
      const startWidth = width;
      setIsResizing(true);

      const onMouseMove = (ev: MouseEvent) => {
        const delta = side === 'left' ? ev.clientX - startX : startX - ev.clientX;
        const newWidth = Math.max(
          SIDE_PANEL_MIN_WIDTH,
          Math.min(SIDE_PANEL_MAX_WIDTH, startWidth + delta)
        );
        setWidth(newWidth);
        localStorage.setItem(storageKey, String(newWidth));
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [open, side, storageKey, width]
  );

  return (
    <div
      className="relative hidden h-full min-h-0 shrink-0 overflow-visible lg:block"
      style={{
        width: open ? width : SIDE_PANEL_TOGGLE_WIDTH / 2,
        transition: isResizing ? 'none' : 'width 300ms ease-out',
      }}
    >
      {/* Outlined button — behind the sliding panel, tracks the outer wrapper edge */}
      <button
        aria-label={`${label} ${open ? 'schließen' : 'öffnen'}`}
        className={twMerge(
          'btn btn-lg rounded-box border-base-300 bg-base-100 absolute top-3 z-10 h-auto min-h-0 w-10 flex-col gap-2 border px-2 py-4 shadow-sm',
          side === 'left' ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'
        )}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <Icon className="size-4" />
        <span className="rotate-180 text-xs font-medium tracking-[0.2em] [writing-mode:vertical-rl]">
          {label}
        </span>
      </button>

      {/* Sliding panel — above the outlined button */}
      <div
        className="absolute inset-y-0 h-full min-h-0 overflow-visible bg-transparent"
        style={{
          width,
          [side === 'left' ? 'left' : 'right']: 0,
          transform: open
            ? 'translateX(0)'
            : side === 'left'
              ? `translateX(calc(-100% + ${SIDE_PANEL_TOGGLE_WIDTH / 2}px))`
              : `translateX(calc(100% - ${SIDE_PANEL_TOGGLE_WIDTH / 2}px))`,
          transition: isResizing ? 'none' : 'transform 300ms ease-out',
          cursor: !open ? 'pointer' : undefined,
        }}
        onClick={!open ? onToggle : undefined}
      >
        {/* Content */}
        <div className="bg-base-100 absolute inset-0 overflow-hidden shadow-sm">
          <div className={twMerge('h-full min-h-0', !open && 'pointer-events-none')}>
            {children}
          </div>

          {/* Resize handle */}
          {open ? (
            <div
              aria-hidden="true"
              className={twMerge(
                'group absolute inset-y-0 z-10 w-4 cursor-col-resize',
                side === 'left' ? '-right-1.5' : '-left-1.5'
              )}
              onMouseDown={handleResizeMouseDown}
            >
              <div
                className={twMerge(
                  'bg-primary/0 group-hover:bg-primary/25 absolute inset-y-0 w-1.5 rounded-full transition-colors duration-150',
                  side === 'left' ? 'right-1.5' : 'left-1.5'
                )}
              />
            </div>
          ) : null}
        </div>

        {/* Borderless cap button — same position as outlined button, covers it seamlessly */}
        <button
          aria-label={`${label} ${open ? 'schließen' : 'öffnen'}`}
          className={twMerge(
            'btn btn-lg rounded-box bg-base-100 absolute top-3 h-auto min-h-0 w-10 flex-col gap-2 border-transparent px-2 py-4 shadow-none',
            side === 'left' ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'
          )}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <Icon className="size-4" />
          <span className="rotate-180 text-xs font-medium tracking-[0.2em] [writing-mode:vertical-rl]">
            {label}
          </span>
        </button>
      </div>
    </div>
  );
}
