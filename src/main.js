const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const auth = require('./backend/auth');
const leads = require('./backend/leads');
const campaigns = require('./backend/campaigns');
const emaiService = require('./backend/emailService');
const { startCampaignCron } = require('./backend/cronService');

let cronStarted = false;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: true, // Allow window resizing
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('signup', async (event, username, password) => {
  return new Promise((resolve) => {
    auth.signup(username, password, (err, userId) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, userId });
    });
  });
});

ipcMain.handle('login', async (event, username, password) => {
  return new Promise((resolve) => {
    auth.login(username, password, (err, user) => {
      if (err) resolve({ success: false, error: err.message });
      else if (!user) resolve({ success: false, error: 'Invalid credentials' });
      else {
        // Start the cron only once after first successful login
        if (!cronStarted) {
          startCampaignCron();
          cronStarted = true;
        }
        resolve({ success: true, user });
      }
    });
  });
});

ipcMain.handle('getAllLeads', async (event, options = {}) => {
  return new Promise((resolve) => {
    leads.getAllLeads(options, (err, result) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, ...result });
    });
  });
});

ipcMain.handle('addLead', async (event, lead) => {
  return new Promise((resolve) => {
    leads.addLead(lead, (err, id) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, id });
    });
  });
});

ipcMain.handle('getAllCampaigns', async (event, params = {}) => {
  return new Promise((resolve) => {
    campaigns.getAllCampaigns(params, (err, rows) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, ...rows });
    });
  });
});

ipcMain.handle('addCampaign', async (event, campaign, filter) => {
  return new Promise((resolve) => {
    campaigns.addCampaign(campaign, filter, (err, id) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, id });
    });
  });
});

ipcMain.handle('getLeadsForCampaign', async (event, campaignId, options = {}) => {
  return new Promise((resolve) => {
    campaigns.getLeadsForCampaign(campaignId, options, (err, result) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, ...result });
    });
  });
});

ipcMain.handle('getCampaignById', async (event, campaignId) => {
  return new Promise((resolve) => {
    campaigns.getCampaignById(campaignId, (err, campaign) => {
      if (err) resolve({ success: false, error: err.message });
      else if (!campaign) resolve({ success: false, error: 'Campaign not found' });
      else resolve({ success: true, campaign });
    });
  });
});

ipcMain.handle('sendCampaignLeadEmail', async (event, campaignLead) => {
  return new Promise((resolve) => {
    emaiService.sendCampaignLeadEmail(campaignLead, (err, result) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, ...result });
    });
  });
});

// Add this IPC handler for getAllAreas
ipcMain.handle('getAllAreas', async (event) => {
  return new Promise((resolve) => {
    leads.getAllAreas((err, areas) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, areas });
    });
  });
});

ipcMain.handle('updateCampaignStatus', async (event, campaignId, status) => {
  return new Promise((resolve) => {
    campaigns.updateCampaignStatus(campaignId, status, (err, result) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, ...result });
    });
  });
});

ipcMain.handle('getAllLeadsForCampaignExport', async (event, campaignId) => {
  return new Promise((resolve) => {
    campaigns.getAllLeadsForCampaignExport(campaignId, (err, rows) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, leads: rows });
    });
  });
});

ipcMain.handle('deleteLead', async (event, leadId) => {
  return new Promise((resolve) => {
    leads.deleteLead(leadId, (err, result) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, ...result });
    });
  });
});

ipcMain.handle('bulkUpdateCampaignLeadsFromExcel', async (event, campaignId, leads) => {
  return new Promise((resolve) => {
    campaigns.bulkUpdateCampaignLeadsFromExcel(campaignId, leads, (err, result) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, ...result });
    });
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
