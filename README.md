# Research Management System

A full-stack web application for managing research papers, theses, and capstone projects, built with **React.js** and **Node.js**.

## Features

1. **Research Repository** – Centralized storage for research papers, theses, and capstone projects
2. **Research Cataloging** – Each work is auto-assigned a unique code (e.g., `TH-2026-0001`, `CP-2026-0002`, `RP-2026-0003`)
3. **Search and Filtering** – Search by code, title, author, program, year, category, and keywords
4. **Research Information** – Displays title, author, adviser, program, year, research type, abstract, and keywords
5. **Digital Document Access** – Authorized users can view and download approved PDF/DOC documents
6. **Administrator Management** – Admins manage users, research records, categories, programs, submissions, and approval status

## Tech Stack

- **Frontend:** React 18, React Router, Axios (Create React App)
- **Backend:** Node.js, Express, JWT auth, Multer (file uploads)
- **Database:** JSON file storage (zero-config, portable)

## Setup & Run

### 1. Install dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Start the backend (port 5000)

```bash
cd server
npm start
```

### 3. Start the frontend (port 3000)

```bash
cd client
npm start
```

Open http://localhost:3000

## Default Admin Account

- **Username:** `admin`
- **Password:** `admin123`

Users can self-register with regular (non-admin) accounts.

## Project Structure

```
server/
  server.js          # Express app entry point
  db.js              # JSON file-based database
  routes/            # auth, research, users, programs, categories, stats
  middleware/auth.js # JWT + admin middleware
  uploads/           # uploaded documents
client/
  src/
    App.js           # Routing
    context/AuthContext.js
    components/Sidebar.js
    pages/           # Login, Register, Dashboard, ResearchList, ResearchDetail,
                     # SubmitResearch, AdminUsers, AdminResearch, AdminPrograms, AdminCategories
```

Data persists in `server/data/*.json`. Uploaded files go to `server/uploads/`.
