// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  signup: (username, password) => ipcRenderer.invoke('signup', username, password),
  login: (username, password) => ipcRenderer.invoke('login', username, password),
  getAllLeads: (options) => ipcRenderer.invoke('getAllLeads', options),
  addLead: (lead) => ipcRenderer.invoke('addLead', lead),
  getAllCampaigns: (params) => ipcRenderer.invoke('getAllCampaigns', params),
  addCampaign: (campaign, filter) => ipcRenderer.invoke('addCampaign', campaign, filter),
  getLeadsForCampaign: (campaignId, options) => ipcRenderer.invoke('getLeadsForCampaign', campaignId, options),
  getCampaignById: (campaignId) => ipcRenderer.invoke('getCampaignById', campaignId),
  sendCampaignLeadEmail: (campaignLead) => ipcRenderer.invoke('sendCampaignLeadEmail', campaignLead),
  getAllAreas: () => ipcRenderer.invoke('getAllAreas'),
  updateCampaignStatus: (campaignId, status) => ipcRenderer.invoke('updateCampaignStatus', campaignId, status),
  getAllLeadsForCampaignExport: (campaignId) =>
    ipcRenderer.invoke('getAllLeadsForCampaignExport', campaignId),
  deleteLead: (leadId) => ipcRenderer.invoke('deleteLead', leadId),
  bulkUpdateCampaignLeadsFromExcel: (campaignId, leads) =>
    ipcRenderer.invoke('bulkUpdateCampaignLeadsFromExcel', campaignId, leads),
});
