import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, TextField, Button, Typography, IconButton } from '@mui/material';
import AddLeadDialog from './AddLeadDialog';
import UploadLeadsDialog from './UploadLeadsDialog';
import EditIcon from '@mui/icons-material/Edit';
import EditLeadDialog from './EditLeadDialog';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [openAdd, setOpenAdd] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);

  // Edit dialog state
  const [editLead, setEditLead] = useState(null);
  const [editValues, setEditValues] = useState({ email: '', phone: '', contact_person: '' });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, [filter, page, pageSize]);

  async function fetchLeads() {
    const options = {
      search: filter,
      page,
      pageSize,
    };
    const result = await window.electronAPI.getAllLeads(options);
    if (result.success) {
      setLeads(result.leads);
      setTotal(result.total);
    }
  }

  // Filter and sort logic
  const filteredLeads = leads
    .filter(lead => lead.name.toLowerCase().includes(filter.toLowerCase()));

  // Open edit dialog for a lead
  const handleEditClick = (lead) => {
    setEditLead(lead);
    setEditValues({
      email: lead.email || '',
      phone: lead.phone || '',
      contact_person: lead.contact_person || '',
    });
  };

  // Handle edit field changes
  const handleEditChange = (field) => (e) => {
    setEditValues({ ...editValues, [field]: e.target.value });
  };

  // Save edited lead
  const handleEditSave = async () => {
    if (!editLead) return;
    setEditLoading(true);
    const updatedLead = {
      ...editLead,
      email: editValues.email,
      phone: editValues.phone,
      contact_person: editValues.contact_person,
    };
    const result = await window.electronAPI.addLead(updatedLead); // upsert logic
    setEditLoading(false);
    if (result.success) {
      setEditLead(null);
      fetchLeads();
    }
    // Optionally handle error
  };

  // Cancel edit
  const handleEditCancel = () => {
    setEditLead(null);
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
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 400, width: '100%' }}>
        <DataGrid
          rows={filteredLeads.map(lead => ({
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            contactPerson: lead.contact_person,
            area: lead.area,
            contact_person: lead.contact_person, // for edit dialog
          }))}
          columns={columns}
          pageSize={pageSize}
          rowsPerPageOptions={[5, 10, 20]}
          pagination
          paginationMode="server"
          rowCount={total}
          onPageChange={newPage => setPage(newPage)}
          onPageSizeChange={newPageSize => setPageSize(newPageSize)}
          disableSelectionOnClick
        />
      </Box>
      <AddLeadDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onLeadAdded={fetchLeads}
      />
      <UploadLeadsDialog
        open={openUpload}
        onClose={() => setOpenUpload(false)}
        onLeadsUploaded={fetchLeads}
      />

      {/* Edit Lead Dialog */}
      <EditLeadDialog
        open={!!editLead}
        editValues={editValues}
        editLoading={editLoading}
        onChange={handleEditChange}
        onCancel={handleEditCancel}
        onSave={handleEditSave}
      />
    </Box>
  );
}