import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Link, useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    const result = await window.electronAPI.getAllCampaigns({
      page: 0,
      pageSize: 100
    });
    if (result.success) {
      setCampaigns(Array.isArray(result.campaigns) ? result.campaigns : []);
    } else {
      setCampaigns([]);
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
      <Button
        component={Link}
        to="/campaigns/new"
        variant="contained"
        color="primary"
        sx={{ mb: 2 }}
      >
        Add New Campaign
      </Button>
      <Box sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={campaigns.map(c => ({ ...c, id: c.id }))}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 20, 50]}
          disableSelectionOnClick
          autoHeight
        />
      </Box>
    </Box>
  );
}