import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Dialog, DialogTitle, DialogContent, IconButton, Button, Tabs, Tab } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import ReplayIcon from '@mui/icons-material/Replay';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { useParams, useNavigate } from 'react-router-dom';
import { exportLeadsToXLSX } from '../utils/xlsxUtils';
import CircularProgress from '@mui/material/CircularProgress';

export default function CampaignDetailsPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);

  // Tabs
  const [tab, setTab] = useState(0);

  // To Send
  const [leadsToSend, setLeadsToSend] = useState([]);
  const [totalLeadsToSend, setTotalLeadsToSend] = useState(0);
  const [pageToSend, setPageToSend] = useState(0);
  const [pageSizeToSend, setPageSizeToSend] = useState(10);

  // History
  const [leadsHistory, setLeadsHistory] = useState([]);
  const [totalLeadsHistory, setTotalLeadsHistory] = useState(0);
  const [pageHistory, setPageHistory] = useState(0);
  const [pageSizeHistory, setPageSizeHistory] = useState(10);

  // Dialog
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Downloading state
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  useEffect(() => {
    fetchLeadsToSend(pageToSend, pageSizeToSend);
  }, [campaignId, pageToSend, pageSizeToSend]);

  useEffect(() => {
    fetchLeadsHistory(pageHistory, pageSizeHistory);
  }, [campaignId, pageHistory, pageSizeHistory]);

  async function fetchCampaign() {
    const result = await window.electronAPI.getCampaignById(campaignId);
    if (result.success) setCampaign(result.campaign.campaign);
  }

  async function fetchLeadsToSend(pageArg = pageToSend, pageSizeArg = pageSizeToSend) {
    const result = await window.electronAPI.getLeadsForCampaign(
      campaignId,
      { statuses: ['READY'], page: pageArg + 1, pageSize: pageSizeArg }
    );
    if (result.success) {
      setLeadsToSend(result.leads);
      setTotalLeadsToSend(result.total || 0);
    }
  }

  async function fetchLeadsHistory(pageArg = pageHistory, pageSizeArg = pageSizeHistory) {
    // Fetch leads with status SENT or FAILED
    const result = await window.electronAPI.getLeadsForCampaign(
      campaignId,
      { statuses: ['SENT', 'FAILED'], page: pageArg + 1, pageSize: pageSizeArg }
    );
    console.log('Fetched leads history:', result);
    if (result.success) {
      setLeadsHistory(result.leads);
      setTotalLeadsHistory(result.total || 0);
    }
  }

  const handleShowEmail = (lead) => {
    setSelectedLead(lead);
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async (lead) => {
    const result = await window.electronAPI.sendCampaignLeadEmail(lead);
    console.log('Send email result:', result);
    if (result.success) {
      alert(`Email sent to ${lead.email}`);
      // Optionally refresh leads to reflect status change
      fetchLeadsToSend();
    } else {
      alert(`Failed to send email: ${result.error}`);
    }
    setSelectedLead(null);
  };

  // Add start/stop campaign logic
  const handleStartStopCampaign = async () => {
    if (!campaign) return;
    const newStatus = campaign.status === 'ACTIVE' ? 'STOPPED' : 'ACTIVE';
    const result = await window.electronAPI.updateCampaignStatus(campaign.id, newStatus);
    if (result && result.updated) {
      setCampaign({ ...campaign, status: newStatus });
    }
  };

  const handleDownloadLeads = async () => {
    setDownloading(true);
    try {
      const result = await window.electronAPI.getAllLeadsForCampaignExport(campaignId);
      if (result.success) {
        exportLeadsToXLSX(result.leads, `campaign_${campaignId}_leads.xlsx`);
      } else {
        alert('Failed to download leads');
      }
    } finally {
      setDownloading(false);
    }
  };

  // Update columns: remove actions, add tentative_send_date
  const columns = [
    { field: 'name', headerName: 'Lead Name', flex: 1 },
    { field: 'email', headerName: 'Lead Email', flex: 1 },
    { field: 'mobile', headerName: 'Lead Mobile', flex: 1 },
    { field: 'contact_person', headerName: 'Contact Person', flex: 1 },
    { field: 'campaign_lead_status', headerName: 'Status', flex: 1 },
    { field: 'tentative_send_date', headerName: 'Tentative Send Date', flex: 1 },
  ];

  const historyColumns = [
    { field: 'name', headerName: 'Lead Name', flex: 1 },
    { field: 'email', headerName: 'Lead Email', flex: 1 },
    { field: 'mobile', headerName: 'Lead Mobile', flex: 1 },
    { field: 'contact_person', headerName: 'Contact Person', flex: 1 },
    { field: 'campaign_lead_status', headerName: 'Status', flex: 1 },
    { field: 'send_date', headerName: 'Send Date' , flex: 1 },
    { field: 'campaign_lead_extra', headerName: 'Extra Data', flex: 1 }
  ];

  if (!campaign) {
    return <Typography>Loading campaign...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Button variant="outlined" sx={{ mb: 2 }} onClick={() => navigate('/campaigns')}>Back</Button>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {campaign?.name || 'Campaign'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography
              variant="body2"
              sx={{
                px: 2,
                py: 0.5,
                borderRadius: 2,
                bgcolor:
                  campaign?.type === 'EMAIL'
                    ? 'primary.light'
                    : campaign?.type === 'SMS'
                    ? 'success.light'
                    : campaign?.type === 'WHATSAPP'
                    ? 'info.light'
                    : 'grey.200',
                color: 'text.primary',
                fontWeight: 500,
              }}
            >
              {campaign?.type || '-'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                px: 2,
                py: 0.5,
                borderRadius: 2,
                bgcolor:
                  campaign?.status === 'ACTIVE'
                    ? 'success.light'
                    : campaign?.status === 'DRAFT'
                    ? 'warning.light'
                    : campaign?.status === 'STOPPED'
                    ? 'error.light'
                    : 'grey.200',
                color: 'text.primary',
                fontWeight: 500,
              }}
            >
              {campaign?.status || '-'}
            </Typography>
            <Button
              variant={campaign?.status === 'ACTIVE' ? 'contained' : 'outlined'}
              color={campaign?.status === 'ACTIVE' ? 'error' : 'success'}
              startIcon={campaign?.status === 'ACTIVE' ? <StopIcon /> : <PlayArrowIcon />}
              onClick={handleStartStopCampaign}
            >
              {campaign?.status === 'ACTIVE' ? 'Stop Campaign' : 'Start Campaign'}
            </Button>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            Duration:
          </Typography>
          <Typography variant="body2">
            {campaign?.start_date
              ? new Date(campaign.start_date).toLocaleDateString()
              : '-'}
            {' '}to{' '}
            {campaign?.end_date
              ? new Date(campaign.end_date).toLocaleDateString()
              : '-'}
          </Typography>
        </Box>
      </Paper>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleDownloadLeads}
          disabled={downloading}
        >
          Download Leads (XLSX)
        </Button>
        {downloading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={24} />
            <Typography variant="body2">Downloading...</Typography>
          </Box>
        )}
      </Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="To Send" />
        <Tab label="History" />
      </Tabs>
      {tab === 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>Campaign Leads To Send</Typography>
          <Box sx={{ height: 400, width: '100%', overflow: 'auto' }}>
            <DataGrid
              rows={leadsToSend.map(lead => ({
                id: lead.id,
                name: lead.name,
                email: lead.email,
                mobile: lead.mobile,
                contact_person: lead.contact_person,
                campaign_lead_status: lead.campaign_lead_status || 'Pending',
                tentative_send_date: lead.tentative_send_date ? new Date(lead.tentative_send_date.replace(' ', 'T') + 'Z').toLocaleString() || '' : '-'
              }))}
              columns={columns}
              pageSize={pageSizeToSend}
              rowsPerPageOptions={[10, 20, 50]}
              rowCount={totalLeadsToSend}
              pagination
              paginationMode="server"
              page={pageToSend}
              onPageChange={setPageToSend}
              onPageSizeChange={(newSize) => { setPageSizeToSend(newSize); setPageToSend(0); }}
              autoHeight={false}
              sx={{
                minWidth: 900,
                '& .MuiDataGrid-virtualScroller': {
                  overflowY: 'auto',
                  overflowX: 'auto',
                },
              }}
            />
          </Box>
        </>
      )}
      {tab === 1 && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>Campaign Leads History</Typography>
          <Box sx={{ height: 400, width: '100%', overflow: 'auto' }}>
            <DataGrid
              rows={leadsHistory.map(lead => ({
                id: lead.id,
                name: lead.name,
                email: lead.email,
                mobile: lead.mobile,
                contact_person: lead.contact_person,
                campaign_lead_status: lead.campaign_lead_status || '',
                send_date: new Date(lead.campaign_lead_updated_at.replace(' ', 'T') + 'Z').toLocaleString() || '',
                campaign_lead_extra: lead.campaign_lead_extra || '',
              }))}
              columns={historyColumns}
              pageSize={pageSizeHistory}
              rowsPerPageOptions={[10, 20, 50]}
              rowCount={totalLeadsHistory}
              pagination
              paginationMode="server"
              page={pageHistory}
              onPageChange={setPageHistory}
              onPageSizeChange={(newSize) => { setPageSizeHistory(newSize); setPageHistory(0); }}
              autoHeight={false}
              sx={{
                minWidth: 900,
                '& .MuiDataGrid-virtualScroller': {
                  overflowY: 'auto',
                  overflowX: 'auto',
                },
              }}
            />
          </Box>
        </>
      )}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Email Preview</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1">To: {selectedLead?.email}</Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            {/* Replace with actual email content logic */}
            {selectedLead ? `Email content for ${selectedLead.name}` : ''}
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
}