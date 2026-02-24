# INC Directory Management & Sync System

A robust full-stack platform designed to synchronize, enrich, and manage the official Iglesia Ni Cristo (INC) directory. It features automated scraping, data enrichment (distance, maps, photos), and complex sub-locale (Extension/GWS) relationship management.

## 🚀 Key Features

*   **Automated Sync Engine:** 8-step core logic for high-fidelity synchronization with the official directory.
*   **Intelligent Enrichment:** Automatically fetches coordinates, street addresses, and images for every locale.
*   **Sub-Locale Management:** Specialized tracking for Extensions (Ext.) and Group Worship Services (GWS), including auto-reparenting when parent locales move districts.
*   **Dynamic Dashboard:** Real-time statistics, regional distribution charts, and synchronization history.
*   **Built-in Scheduler:** Configurable cron-based background synchronization.
*   **PWA Ready:** Manifest and Service Worker support for offline access and mobile installation.

---

## 🛠 Tech Stack

*   **Frontend:** React 18, Chakra UI, Framer Motion, Recharts, Leaflet.
*   **Backend:** Node.js, Express, Sequelize ORM.
*   **Database:** MySQL 8.0.
*   **DevOps:** Docker, Docker Compose, Nginx.

---

## 🏗 System Architecture

### 🔄 The Synchronization Workflow
The `runSync` process follows an optimized 8-step pipeline to ensure data integrity:
1.  **Status Reset:** All districts are marked inactive to provide a clean slate.
2.  **District Sync:** Fetches active districts from the official site.
3.  **Locale Fetching:** Scrapes all congregations within found districts.
4.  **Data Update:** Maps congregations to districts and refreshes `slug` data.
5.  **Enrichment:** Periodically refreshes metadata (Photos, Schedule, Contact Info).
6.  **Per-District Cleanup:** Deactivates locales no longer listed on the site.
7.  **Auto-Reparenting:** (NEW) Re-links Ext./GWS sub-locales to their parent's current district (e.g., if a district was renamed).
8.  **Global Cleanup:** (NEW) Final safety pass to deactivate any locale under a retired district.

### 🛡 Reliability & Recovery
*   **Crashed Sync Recovery:** The system automatically detects and fixes "stuck" syncs (409 errors) on server startup.
*   **Manual Reset:** Administrators can force-reset the sync status from the Settings page if a process appears permanently stalled.

---

## 📦 Deployment (Proxmox / Production)

The project is optimized for deployment in Proxmox LXC containers or standard Docker environments.

### 1. Configuration
Use the `.env.proxmox` file for production-specific variables (Database IP, HTTPS URLs, etc.).

### 2. Deployment Script
Run the automated deployment script to rebuild and restart the containers:
```bash
bash deploy_prod.sh
```

### 3. Data Alignment
After a fresh sync, if counts appear mismatched (e.g., congregations vs. extensions), run the alignment script:
```bash
node scripts/fix_data_alignment.js
```

---

## 📂 Project Structure

*   `/backend/controllers`: Core logic (`synchronizationController`, `dashboardController`, etc.)
*   `/backend/models`: Database schema (District, LocalCongregation, SyncHistory)
*   `/src/pages`: User interface (Dashboard, LocalCongregations, Settings)
*   `/scripts`: Maintenance utilities (Data fixing, Reparenting, Audits)
*   `/nginx`: Configuration for production routing and security.

---

## 📜 Development Commands

*   `npm start`: Runs both frontend (3000) and backend (3001) concurrently.
*   `npm run backend`: Runs the server only (with nodemon).
*   `npm run react`: Runs the frontend development server only.
