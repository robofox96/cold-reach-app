import React, { useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { processLeadsExcel } from '../utils/xlsxUtils';

export default function UploadLeadsDialog({ open, onClose, onLeadsUploaded }) {
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const leads = await processLeadsExcel(file);
      for (const lead of leads) {
        await window.electronAPI.addLead(lead);
      }
      onLeadsUploaded();
      alert('Bulk leads uploaded!');
      handleClose();
    } catch (err) {
      alert('Failed to process file: ' + err.message);
    }
    setUploading(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  const handleClose = () => {
    setUploading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Upload Leads Excel</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Upload an Excel file (.xlsx or .xls) with columns: name, address, phone, mobile, email, contact_person, area, details (JSON).
        </Typography>
        <input
          type="file"
          accept=".xlsx, .xls"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <Button variant="contained" onClick={handleUploadClick} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Choose File'}
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}