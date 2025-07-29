import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, TextField, Button, Typography, IconButton, Tabs, Tab } from '@mui/material';
import AddLeadDialog from './AddLeadDialog';
import UploadLeadsDialog from './UploadLeadsDialog';
import EditIcon from '@mui/icons-material/Edit';
import EditLeadDialog from './EditLeadDialog';

export default function Leads() {
  const [tab, setTab] = useState(0); // 0: Survey Leads, 1: General Leads

  // State for survey leads
  const [surveyLeads, setSurveyLeads] = useState([]);
  const [surveyTotal, setSurveyTotal] = useState(0);
  const [surveyPage, setSurveyPage] = useState(1);
  const [surveyPageSize, setSurveyPageSize] = useState(20);

  // State for general leads
  const [generalLeads, setGeneralLeads] = useState([]);
  const [generalTotal, setGeneralTotal] = useState(0);
  const [generalPage, setGeneralPage] = useState(1);
  const [generalPageSize, setGeneralPageSize] = useState(20);

  // Shared state
  const [filter, setFilter] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [editLead, setEditLead] = useState(null);

  // Fetch survey leads
  useEffect(() => {
    fetchSurveyLeads();
    // eslint-disable-next-line
  }, [filter, surveyPage, surveyPageSize]);

  // Fetch general leads
  useEffect(() => {
    fetchGeneralLeads();
    // eslint-disable-next-line
  }, [filter, generalPage, generalPageSize]);

  async function fetchSurveyLeads() {
    const options = {
      search: filter,
      page: surveyPage,
      pageSize: surveyPageSize,
      isSurveyLead: true,
    };
    const result = await window.electronAPI.getAllLeads(options);
    if (result.success) {
      setSurveyLeads(result.leads);
      setSurveyTotal(result.total);
    }
  }

  async function fetchGeneralLeads() {
    const options = {
      search: filter,
      page: generalPage,
      pageSize: generalPageSize,
      isSurveyLead: false,
    };
    const result = await window.electronAPI.getAllLeads(options);
    if (result.success) {
      setGeneralLeads(result.leads);
      setGeneralTotal(result.total);
    }
  }

  // Open edit dialog for a lead
  const handleEditClick = (lead) => {
    setEditLead(lead);
  };

  // Close edit dialog and refresh leads if updated
  const handleEditClose = (updated) => {
    setEditLead(null);
    if (updated) {
      fetchSurveyLeads();
      fetchGeneralLeads();
    }
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'phone', headerName: 'Phone', flex: 1 },
    { field: 'contactPerson', headerName: 'Contact Person', flex: 1 },
    { field: 'area', headerName: 'Area', flex: 1 },
    {
      field: 'actions',
      headerName: 'Edit',
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      width: 80,
      renderCell: (params) => (
        <IconButton
          aria-label="edit"
          size="small"
          onClick={() => handleEditClick(params.row)}
        >
          <EditIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        All Leads
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        <TextField
          label="Filter by name"
          variant="outlined"
          size="small"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={() => setOpenAdd(true)}>
          Add New Lead
        </Button>
        <Button variant="contained" color="secondary" onClick={() => setOpenUpload(true)}>
          Upload Excel
        </Button>
      </Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Survey Leads" />
        <Tab label="General Leads" />
      </Tabs>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 400, width: '100%' }}>
        {tab === 0 && (
          <DataGrid
            rows={surveyLeads.map(lead => ({
              id: lead.id,
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              contactPerson: lead.contact_person,
              area: lead.area,
              contact_person: lead.contact_person,
              isSurveyLead: lead.isSurveyLead,
            }))}
            columns={columns}
            pageSize={surveyPageSize}
            rowsPerPageOptions={[5, 10, 20]}
            pagination
            paginationMode="server"
            rowCount={surveyTotal}
            page={surveyPage}
            onPageChange={newPage => setSurveyPage(newPage)}
            onPageSizeChange={newPageSize => setSurveyPageSize(newPageSize)}
            disableSelectionOnClick
          />
        )}
        {tab === 1 && (
          <DataGrid
            rows={generalLeads.map(lead => ({
              id: lead.id,
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              contactPerson: lead.contact_person,
              area: lead.area,
              contact_person: lead.contact_person,
              isSurveyLead: lead.isSurveyLead,
            }))}
            columns={columns}
            pageSize={generalPageSize}
            rowsPerPageOptions={[5, 10, 20]}
            pagination
            paginationMode="server"
            rowCount={generalTotal}
            page={generalPage}
            onPageChange={newPage => setGeneralPage(newPage)}
            onPageSizeChange={newPageSize => setGeneralPageSize(newPageSize)}
            disableSelectionOnClick
          />
        )}
      </Box>
      <AddLeadDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onLeadAdded={() => {
          fetchSurveyLeads();
          fetchGeneralLeads();
        }}
      />
      <UploadLeadsDialog
        open={openUpload}
        onClose={() => setOpenUpload(false)}
        onLeadsUploaded={() => {
          fetchSurveyLeads();
          fetchGeneralLeads();
        }}
      />
      <EditLeadDialog
        open={!!editLead}
        lead={editLead}
        onClose={handleEditClose}
      />
    </Box>
  );
}