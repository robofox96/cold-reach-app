import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, FormControlLabel, Checkbox } from '@mui/material';

export default function AddLeadDialog({ open, onClose, onLeadAdded }) {
  const [newLead, setNewLead] = useState({
    name: '',
    address: '',
    phone: '',
    mobile: '',
    email: '',
    contact_person: '',
    area: 'N/A',
    isSurveyLead: false
  });

  const handleAddLead = async () => {
    const leadToAdd = { ...newLead, details: {} };
    const result = await window.electronAPI.addLead(leadToAdd);
    if (result.success) {
      onLeadAdded();
      handleClose();
    } else {
      alert('Failed to add lead: ' + result.error);
    }
  };

  const handleClose = () => {
    setNewLead({
      name: '',
      address: '',
      phone: '',
      mobile: '',
      email: '',
      area: 'N/A',
      contact_person: '',
      isSurveyLead: false
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Add New Lead</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField
          label="Company Name"
          value={newLead.name}
          onChange={e => setNewLead({ ...newLead, name: e.target.value })}
          required
        />
        <TextField
          label="Address"
          value={newLead.address}
          onChange={e => setNewLead({ ...newLead, address: e.target.value })}
        />
        <TextField
          label="Phone"
          value={newLead.phone}
          onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
        />
        <TextField
          label="Mobile"
          value={newLead.mobile}
          onChange={e => setNewLead({ ...newLead, mobile: e.target.value })}
        />
        <TextField
          label="Email"
          value={newLead.email}
          onChange={e => setNewLead({ ...newLead, email: e.target.value })}
        />
        <TextField
          label="Contact Person"
          value={newLead.contact_person}
          onChange={e => setNewLead({ ...newLead, contact_person: e.target.value })}
        />
        <TextField
          label="Area"
          value={newLead.area}
          onChange={e => setNewLead({ ...newLead, area: e.target.value })}
          placeholder='e.g. Savali'
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={newLead.isSurveyLead}
              onChange={e => setNewLead({ ...newLead, isSurveyLead: e.target.checked })}
            />
          }
          label="Is Survey Lead"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleAddLead} variant="contained">Add</Button>
      </DialogActions>
    </Dialog>
  );
}