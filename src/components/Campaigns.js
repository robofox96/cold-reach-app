import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton, MenuItem, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Link, useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'STOPPED', label: 'Stopped' },
  { value: 'FINISHED', label: 'Finished' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
];

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10 });
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line
  }, [pagination.page, pagination.pageSize, statusFilter, typeFilter]);

  async function fetchCampaigns() {
    const result = await window.electronAPI.getAllCampaigns({
      page: pagination.page + 1, // DataGrid is 0-based, backend expects 1-based
      pageSize: pagination.pageSize,
      status: statusFilter,
      type: typeFilter,
    });
    if (result.success) {
      setCampaigns(Array.isArray(result.campaigns) ? result.campaigns : []);
      setTotalCampaigns(result.total || 0);
    } else {
      setCampaigns([]);
      setTotalCampaigns(0);
      console.error('Failed to fetch campaigns:', result.error);
    }
  }

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'start_date', headerName: 'Start Date', flex: 1 },
    { field: 'end_date', headerName: 'End Date', flex: 1 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params) => {
        let color = '';
        switch (params.value) {
          case 'ACTIVE':
            color = '#388e3c'; // green
            break;
          case 'DRAFT':
            color = '#f57c00'; // orange
            break;
          case 'STOPPED':
            color = '#d32f2f'; // red
            break;
          case 'FINISHED':
            color = '#9e9e9e'; // grey
            break;
          default:
            color = '#757575'; // grey
        }
        return (
          <span style={{
            color: color,
            fontWeight: 600,
            fontSize: '0.95em',
            display: 'inline-block',
            minWidth: 70,
            textAlign: 'center'
          }}>
            {params.value}
          </span>
        );
      }
    },
    { field: 'type', headerName: 'Type', flex: 1 },
    {
      field: 'actions',
      headerName: 'Details',
      flex: 0.5,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          color="primary"
          onClick={() => navigate(`/campaigns/${params.row.id}`)}
          aria-label="View Campaign"
        >
          <VisibilityIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Campaigns
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={e => {
            setPagination({ ...pagination, page: 0 }); // Reset to first page on filter change
            setStatusFilter(e.target.value);
          }}
          size="small"
          sx={{ minWidth: 140 }}
        >
          {STATUS_OPTIONS.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Type"
          value={typeFilter}
          onChange={e => {
            setPagination({ ...pagination, page: 0 }); // Reset to first page on filter change
            setTypeFilter(e.target.value);
          }}
          size="small"
          sx={{ minWidth: 140 }}
        >
          {TYPE_OPTIONS.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
        <Button
          component={Link}
          to="/campaigns/new"
          variant="contained"
          color="primary"
          sx={{ ml: 'auto' }}
        >
          Add New Campaign
        </Button>
      </Box>
      <Box sx={{ width: '100%', flex: 1, minHeight: 0 }}>
        <DataGrid
          rows={campaigns.map(c => ({ ...c, id: c.id }))}
          columns={columns}
          pagination
          paginationMode="server"
          rowCount={totalCampaigns}
          pageSize={pagination.pageSize}
          page={pagination.page}
          onPaginationModelChange={({ page, pageSize }) =>
            setPagination({ page, pageSize })
          }
          rowsPerPageOptions={[10, 20, 50]}
          disableSelectionOnClick
          autoHeight
        />
      </Box>
    </Box>
  );
}