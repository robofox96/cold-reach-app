import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Checkbox, FormControlLabel } from '@mui/material';

export default function EditLeadDialog({
  open,
  lead,
  onClose,
}) {
  const [editValues, setEditValues] = useState({
    email: '',
    phone: '',
    mobile: '', // <-- Add mobile to state
    contact_person: '',
    area: '',
    isSurveyLead: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lead) {
      setEditValues({
        email: lead.email || '',
        phone: lead.phone || '',
        mobile: lead.mobile || '', // <-- Initialize mobile
        contact_person: lead.contact_person || '',
        area: lead.area || '',
        isSurveyLead: !!lead.isSurveyLead,
      });
    }
  }, [lead]);

  const handleChange = (field) => (e) => {
    if (field === 'isSurveyLead') {
      setEditValues({ ...editValues, isSurveyLead: e.target.checked });
    } else {
      setEditValues({ ...editValues, [field]: e.target.value });
    }
  };

  const handleSave = async () => {
    if (!lead) return;
    setLoading(true);
    const updatedLead = {
      ...lead,
      email: editValues.email,
      phone: editValues.phone,
      mobile: editValues.mobile, // <-- Save mobile
      contact_person: editValues.contact_person,
      area: editValues.area,
      isSurveyLead: editValues.isSurveyLead,
    };
    const result = await window.electronAPI.addLead(updatedLead); // upsert logic
    setLoading(false);
    if (result.success) {
      onClose(true);
    } else {
      // Optionally show error
      onClose(false);
    }
  };

  const handleCancel = () => {
    onClose(false);
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Lead</DialogTitle>
      <DialogContent>
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={editValues.email}
          onChange={handleChange('email')}
        />
        <TextField
          label="Phone"
          fullWidth
          margin="normal"
          value={editValues.phone}
          onChange={handleChange('phone')}
        />
        <TextField
          label="Mobile"
          fullWidth
          margin="normal"
          value={editValues.mobile}
          onChange={handleChange('mobile')}
        />
        <TextField
          label="Contact Person"
          fullWidth
          margin="normal"
          value={editValues.contact_person}
          onChange={handleChange('contact_person')}
        />
        <TextField
          label="Area"
          fullWidth
          margin="normal"
          value={editValues.area}
          onChange={handleChange('area')}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={!!editValues.isSurveyLead}
              onChange={handleChange('isSurveyLead')}
            />
          }
          label="Is Survey Lead"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={loading}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary" disabled={loading}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}