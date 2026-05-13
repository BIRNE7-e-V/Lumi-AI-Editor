import { memo } from 'react';
import { KEYBINDS } from '@components/keybinds/use-keybinds';
import { Modal } from '@components/modal';

export const KeybindsModal = memo(function KeybindsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title="Tastenkürzel"
      description="Schnellzugriffe für Navigation und die wichtigsten Editor-Aktionen."
      size="md"
      onClose={onClose}
    >
      <div className="space-y-3 text-sm">
        {KEYBINDS.map(({ label, key: shortcut }) => (
          <div
            key={shortcut}
            className="rounded-box bg-base-200 flex items-center justify-between px-4 py-3"
          >
            <span>{label}</span>
            <kbd className="kbd kbd-sm">{shortcut}</kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
});
