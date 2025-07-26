# Cold Emailer Electron App

## Overview

Cold Emailer is a desktop application built with Electron, React, Material UI, and SQLite. It helps you manage leads and campaigns for cold emailing, SMS, or WhatsApp outreach. The app features a modern UI, persistent local storage, and easy import/export of leads.

---

## Features

- **User Authentication:** Signup and login with secure password hashing.
- **Lead Management:** Add, edit, filter, and import leads from Excel.
- **Campaigns:** Create campaigns, select leads, schedule and track outreach.
- **Campaign-Leads:** Many-to-many relationship between campaigns and leads.
- **Status Tracking:** Campaign and lead statuses (DRAFT, ACTIVE, STOPPED, FINISHED).
- **Export:** Download campaign leads as Excel files for further processing.
- **Automated Cron:** Background service to send emails/SMS/WhatsApp as per schedule.
- **Material UI:** Responsive, modern interface with DataGrid and dialogs.
- **SQLite Storage:** All data is stored locally in `users.db` for privacy and persistence.

---

## Architecture

- **Frontend:**  
  - React with React Router (`src/app.js`, `src/renderer.js`)
  - Material UI components (`@mui/material`, `@mui/x-data-grid`)
  - Pages: Login/Signup, All Leads, Campaigns, Add Campaign
  - Data fetched via `window.electronAPI` (IPC bridge)

- **Backend:**  
  - Node.js modules in `src/backend/` (auth.js, leads.js, campaigns.js)
  - SQLite database (`users.db`)
  - IPC handlers registered in `src/main.js`
  - Secure bridge via `src/preload.js`

- **Data Models:**  
  - **Lead:** id, name, address, phone, mobile, email, contact_person, details (JSON)
  - **Campaign:** id, name, start_date, end_date, status, type (EMAIL/SMS/WHATSAPP)
  - **Campaign-Leads:** campaign_id, lead_id, status, tentative_send_date, follow_up_call_date, remarks

---

## Developer Workflow

### Run Locally

```sh
npm install
npm start
```

### Build for Distribution

```sh
npm run make
```
- Distributable installers will be in `out/make/`.

### Seed Sample Data

```sh
node src/utils/seed.js
```

### Inspect Database

```sh
sqlite3 users.db
```

---

## Project Structure

```
src/
  backend/         # Node.js backend modules (auth.js, leads.js, campaigns.js, ...)
  components/      # React UI components
  utils/           # Utility modules (xlsxUtils.js, seed.js, ...)
  renderer.js      # React entry point
  app.js           # Main React App component
  main.js          # Electron main process, IPC handlers
  preload.js       # Secure IPC bridge
users.db           # SQLite database file
```

---

## IPC Usage Example

```js
// In renderer
const result = await window.electronAPI.getAllLeads({ search: 'Acme', page: 1, pageSize: 10 });
```

---

## Conventions

- **Do not use `require('electron')` in renderer code.**  
  Use `window.electronAPI` for all backend communication.
- **Database migrations:**  
  Schema changes require migration scripts. Updating `CREATE TABLE` in code does not alter existing tables.
- **Component modularity:**  
  Dialogs and utility logic are separated into their own files.

---

## External Dependencies

- [Material UI](https://mui.com/) (`@mui/material`, `@mui/x-data-grid`)
- [SQLite](https://www.sqlite.org/index.html) (`sqlite3`)
- [xlsx](https://github.com/SheetJS/sheetjs) (Excel parsing)

---

## License

MIT

---

## Maintainers

- [Your Name](a19101996@gmail.com)

---

## Questions?

If any conventions or workflows are unclear, please check `.github/copilot-instructions.md` or open an issue.