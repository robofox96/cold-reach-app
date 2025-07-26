import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, TextField, MenuItem, Checkbox, List, ListItem, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const CAMPAIGN_TYPES = ['EMAIL', 'SMS', 'WHATSAPP'];
const CAMPAIGN_STATUSES = ['DRAFT', 'ACTIVE', 'COMPLETED', 'STOPPED'];

export default function AddCampaignPage() {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [type, setType] = useState('EMAIL');
  const [area, setArea] = useState('');
  const [areas, setAreas] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalLeads, setTotalLeads] = useState(0);
  const [leads, setLeads] = useState([]);
  const navigate = useNavigate();

  // Fetch areas on mount
  useEffect(() => {
    async function fetchAreas() {
      const result = await window.electronAPI.getAllAreas();
      if (result.success) {
        setAreas(result.areas);
      }
    }
    fetchAreas();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [type, area, page, pageSize]);

  async function fetchLeads() {
    const mobileNotNull = type !== 'EMAIL';
    const emailNotNull = type === 'EMAIL';
    const result = await window.electronAPI.getAllLeads({
      area: area || undefined,
      emailNotNull,
      mobileNotNull,
      page,
      pageSize
    });
    if (result.success) {
      setLeads(result.leads);
      setTotalLeads(result.total);
    }
  }

  const handleAdd = async () => {
    if (!name) return alert('Campaign name required');
    const campaign = { name, start_date: startDate, end_date: endDate, status, type };
    // Use the current filter for leads selection
    const filter = {
      area: area || undefined,
      emailNotNull: type === 'EMAIL',
      mobileNotNull: type !== 'EMAIL'
    };
    const result = await window.electronAPI.addCampaign(campaign, filter);
    if (result.success) {
      navigate('/campaigns');
    } else {
      alert('Failed to add campaign: ' + result.error);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4, p: 3, background: '#fff', borderRadius: 2, boxShadow: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button onClick={() => navigate('/campaigns')} sx={{ mr: 2 }} variant="outlined">
          Back
        </Button>
        <Typography variant="h4" gutterBottom>
          Add New Campaign
        </Typography>
      </Box>
      <TextField
        label="Campaign Name"
        value={name}
        onChange={e => setName(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          select
          label="Campaign Type"
          value={type}
          onChange={e => setType(e.target.value)}
          fullWidth
        >
          {CAMPAIGN_TYPES.map(option => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Campaign Status"
          value={status}
          onChange={e => setStatus(e.target.value)}
          fullWidth
          disabled
        >
          {CAMPAIGN_STATUSES.map(option => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>
      </Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Select Leads (filtered):</Typography>
      <TextField
        select
        label="Filter by Area"
        value={area}
        onChange={e => {
          setArea(e.target.value);
          setPage(1);
        }}
        fullWidth
        sx={{ mb: 1 }}
      >
        <MenuItem value="">All Areas</MenuItem>
        {areas.map(a => (
          <MenuItem key={a} value={a}>{a}</MenuItem>
        ))}
      </TextField>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Matching Leads:</Typography>
      <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
        <List dense>
          {leads.map(lead => (
            <ListItem key={lead.id}>
              <ListItemText primary={lead.name} secondary={lead.email} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 2 }}>
        <Button
          variant="outlined"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <Typography variant="body2">Page {page} of {Math.ceil(totalLeads / pageSize) || 1}</Typography>
        <Button
          variant="outlined"
          disabled={page * pageSize >= totalLeads}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={() => navigate('/campaigns')}>Cancel</Button>
        <Button onClick={handleAdd} variant="contained">Add Campaign</Button>
      </Box>
    </Box>
  );
}