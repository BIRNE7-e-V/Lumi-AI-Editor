import * as React from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  customPrompt: string | null;
  defaultPrompt: string;
  onClose: () => void;
  onSave: (prompt: string | null) => void;
};

export function SystemPromptDialog({ open, customPrompt, defaultPrompt, onClose, onSave }: Props) {
  const [value, setValue] = React.useState('');
  const defaultAtOpen = React.useRef('');

  React.useEffect(() => {
    if (open) {
      const initial = customPrompt ?? defaultPrompt;
      setValue(initial);
      defaultAtOpen.current = defaultPrompt;
    }
  }, [open, customPrompt, defaultPrompt]);

  const isDefault = value === defaultAtOpen.current;

  const handleReset = () => {
    setValue(defaultAtOpen.current);
  };

  const handleSave = () => {
    onSave(isDefault ? null : value);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Systemprompt bearbeiten</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Passen Sie den Systemprompt für diese Sitzung an. Wenn kein benutzerdefinierter Prompt
          gesetzt ist, wird der Standardprompt verwendet. Änderungen gelten nur bis zum Neuladen
          der Seite.
        </Typography>
        <TextField
          multiline
          fullWidth
          minRows={15}
          maxRows={25}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          slotProps={{
            input: { sx: { fontFamily: 'monospace', fontSize: '0.8rem' } },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset} disabled={isDefault} color="inherit">
          Zurücksetzen
        </Button>
        <Button onClick={onClose} color="inherit">
          Abbrechen
        </Button>
        <Button onClick={handleSave} variant="contained">
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
