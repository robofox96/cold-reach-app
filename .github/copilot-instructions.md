# Copilot Instructions for Cold Emailer Electron App

## Project Overview
- This is an Electron desktop app using React (with React Router and Material UI) for the frontend and SQLite for persistent storage.
- The backend logic (auth, leads, campaigns) is implemented in Node.js modules under `src/backend/` and exposed to the renderer via Electron IPC and a secure `preload.js` bridge.

## Architecture & Data Flow
- **Frontend:**
  - Main React entry: `src/renderer.js` and `src/app.js`.
  - Routing is handled via React Router. Pages include Login/Signup, All Leads, Campaigns, and Add Campaign.
  - UI components use Material UI (`@mui/material`, `@mui/x-data-grid`).
  - Data is fetched via `window.electronAPI` (exposed in `preload.js`) using IPC calls to backend.
- **Backend:**
  - Auth, leads, and campaigns logic in `src/backend/`.
  - SQLite DB file: `users.db`.
  - IPC handlers are registered in `src/main.js`.
  - Data models:
    - **Lead:** id, name (unique), address, phone, mobile, email, contact_person, details (JSON)
    - **Campaign:** id, name, start_date, end_date, status, type (EMAIL/SMS/WHATSAPP)
    - **Campaign-Leads:** many-to-many via `campaign_leads` table

## Developer Workflows
- **Build & Run:**
  - Use Electron Forge with Webpack. Start with `npm start`.
  - Renderer scripts are injected by Webpack; do not manually add `<script src="renderer.js">` in HTML.
- **Database:**
  - To manually inspect or migrate the SQLite DB, use `sqlite3 users.db` in terminal.
  - Schema changes require migration scripts; updating `CREATE TABLE` in code does not alter existing tables.
- **Seeding Data:**
  - Use `src/utils/seed.js` to seed sample leads. Run with `node src/utils/seed.js`.
- **IPC & Preload:**
  - All backend functions exposed to frontend must be registered in `main.js` and exposed via `preload.js` using `contextBridge`.
  - Never use `require('electron')` in renderer code; always use `window.electronAPI`.

## Project-Specific Patterns
- **Upsert for Leads:**
  - `addLead` checks for existing lead by name and updates if found, else inserts new.
- **Filtering & Pagination:**
  - `getAllLeads` supports filtering by phone, email, mobile not null, fuzzy search (name/email/contact_person), and pagination.
- **Campaign Creation:**
  - Add Campaign is a full page (`/campaigns/new`), not a dialog. Allows selecting multiple leads with filters.
- **Component Modularity:**
  - Dialogs and utility logic (e.g., Excel parsing) are separated into their own files under `src/components/` and `src/utils/`.

## External Dependencies
- Material UI (`@mui/material`, `@mui/x-data-grid`)
- SQLite (`sqlite3`)
- Excel parsing (`xlsx`)

## Example IPC Usage
```js
// In renderer
const result = await window.electronAPI.getAllLeads({ search: 'Acme', page: 1, pageSize: 10 });
```

## Key Files & Directories
- `src/backend/` — Node.js backend modules (auth.js, leads.js, campaigns.js)
- `src/components/` — React UI components
- `src/utils/` — Utility modules (e.g., xlsxUtils.js, seed.js)
- `src/main.js` — Electron main process, IPC handlers
- `src/preload.js` — Secure bridge for IPC
- `users.db` — SQLite database

---

If any conventions or workflows are unclear, please specify which section needs more detail or examples.
