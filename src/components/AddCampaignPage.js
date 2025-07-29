import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, TextField, MenuItem, List, ListItem, ListItemText, Checkbox, FormControlLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const CAMPAIGN_TYPES = ['EMAIL', 'SMS', 'WHATSAPP'];

export default function AddCampaignPage() {
  const [name, setName] = useState('');
  const [type, setType] = useState('EMAIL');
  const [area, setArea] = useState('');
  const [areas, setAreas] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalLeads, setTotalLeads] = useState(0);
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [isSurveyLead, setIsSurveyLead] = useState('');
  const [manualSelect, setManualSelect] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
  const navigate = useNavigate();

  // Fetch areas on mount
  useEffect(() => {
    async function fetchAreas() {
      const result = await window.electronAPI.getAllAreas();
      if (result.success) setAreas(result.areas);
    }
    fetchAreas();
  }, []);

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line
  }, [type, area, page, pageSize, search, isSurveyLead]);

  async function fetchLeads() {
    const mobileNotNull = type !== 'EMAIL';
    const emailNotNull = type === 'EMAIL';
    const options = {
      area: area || undefined,
      emailNotNull,
      mobileNotNull,
      page,
      pageSize,
      search: search || undefined,
    };
    if (isSurveyLead !== '') options.isSurveyLead = isSurveyLead === 'true';
    const result = await window.electronAPI.getAllLeads(options);
    if (result.success) setLeads(result.leads), setTotalLeads(result.total);
  }

  // Handle manual selection toggle
  const handleManualSelectToggle = (e) => {
    setManualSelect(e.target.checked);
    if (!e.target.checked) setSelectedLeadIds(new Set());
  };

  // Handle checkbox for a single lead
  const handleLeadCheckbox = (leadId) => (e) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (e.target.checked) next.add(leadId);
      else next.delete(leadId);
      return next;
    });
  };

  // Handle "Select All on Page" (optional)
  const handleSelectAllPage = (e) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      leads.forEach(lead => {
        if (e.target.checked) next.add(lead.id);
        else next.delete(lead.id);
      });
      return next;
    });
  };

  const allPageSelected = leads.length > 0 && leads.every(lead => selectedLeadIds.has(lead.id));

  const handleAdd = async () => {
    if (!name) return alert('Campaign name required');
    const now = new Date();
    const start_date = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const campaign = { name, start_date, end_date: null, status: 'DRAFT', type };

    // If manual selection and at least one lead is selected, use selectedLeadIds
    if (manualSelect && selectedLeadIds.size > 0) {
      const result = await window.electronAPI.addCampaign(campaign, { selectedLeadIds: Array.from(selectedLeadIds) });
      if (result.success) navigate('/campaigns');
      else alert('Failed to add campaign: ' + result.error);
      return;
    }

    // Otherwise, use filter as before
    const filter = {
      area: area || undefined,
      emailNotNull: type === 'EMAIL',
      mobileNotNull: type !== 'EMAIL',
      search: search || undefined,
    };
    if (isSurveyLead !== '') filter.isSurveyLead = isSurveyLead === 'true';
    const result = await window.electronAPI.addCampaign(campaign, filter);
    if (result.success) navigate('/campaigns');
    else alert('Failed to add campaign: ' + result.error);
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4, p: 3, background: '#fff', borderRadius: 2, boxShadow: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button onClick={() => navigate('/campaigns')} sx={{ mr: 2 }} variant="outlined">Back</Button>
        <Typography variant="h4" gutterBottom>Add New Campaign</Typography>
      </Box>
      <TextField
        label="Campaign Name"
        value={name}
        onChange={e => setName(e.target.value)}
        fullWidth sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          select label="Campaign Type"
          value={type}
          onChange={e => setType(e.target.value)}
          fullWidth
        >
          {CAMPAIGN_TYPES.map(option => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>
      </Box>
      <FormControlLabel
        control={<Checkbox checked={manualSelect} onChange={handleManualSelectToggle} />}
        label="Manually select leads"
        sx={{ mb: 1 }}
      />
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Select Leads (filtered):</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
        <TextField
          select label="Filter by Area"
          value={area}
          onChange={e => { setArea(e.target.value); setPage(1); }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All Areas</MenuItem>
          {areas.map(a => (
            <MenuItem key={a} value={a}>{a}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Search Name or Email"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          sx={{ minWidth: 200 }}
        />
        <TextField
          select label="Survey Lead"
          value={isSurveyLead}
          onChange={e => { setIsSurveyLead(e.target.value); setPage(1); }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="true">Survey Leads</MenuItem>
          <MenuItem value="false">General Leads</MenuItem>
        </TextField>
      </Box>
      {manualSelect && (
        <FormControlLabel
          control={
            <Checkbox
              checked={allPageSelected}
              indeterminate={leads.some(lead => selectedLeadIds.has(lead.id)) && !allPageSelected}
              onChange={handleSelectAllPage}
            />
          }
          label="Select all on this page"
          sx={{ mb: 1 }}
        />
      )}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Matching Leads:</Typography>
      <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
        <List dense>
          {leads.map(lead => (
            <ListItem key={lead.id} secondaryAction={
              manualSelect && (
                <Checkbox
                  edge="end"
                  checked={selectedLeadIds.has(lead.id)}
                  onChange={handleLeadCheckbox(lead.id)}
                />
              )
            }>
              <ListItemText primary={lead.name} secondary={lead.email} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 2 }}>
        <Button variant="outlined" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
        <Typography variant="body2">Page {page} of {Math.ceil(totalLeads / pageSize) || 1}</Typography>
        <Button variant="outlined" disabled={page * pageSize >= totalLeads} onClick={() => setPage(page + 1)}>Next</Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={() => navigate('/campaigns')}>Cancel</Button>
        <Button onClick={handleAdd} variant="contained">Add Campaign</Button>
      </Box>
    </Box>
  );
}