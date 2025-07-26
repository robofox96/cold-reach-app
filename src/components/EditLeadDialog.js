import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

export default function EditLeadDialog({
  open,
  editValues,
  editLoading,
  onChange,
  onCancel,
  onSave,
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Lead</DialogTitle>
      <DialogContent>
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={editValues.email}
          onChange={onChange('email')}
        />
        <TextField
          label="Phone"
          fullWidth
          margin="normal"
          value={editValues.phone}
          onChange={onChange('phone')}
        />
        <TextField
          label="Contact Person"
          fullWidth
          margin="normal"
          value={editValues.contact_person}
          onChange={onChange('contact_person')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={editLoading}>Cancel</Button>
        <Button onClick={onSave} variant="contained" color="primary" disabled={editLoading}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}