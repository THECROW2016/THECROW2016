# Hospital Management System

A comprehensive hospital queue and workflow management system built with React, TypeScript, and Express. Deployable on Railway.

## Features

- **Role-based Authentication** - Support for multiple user roles (Superadmin, Admin, Receptionist, Nurse, Doctor, Lab Tech, Pharmacist)
- **Patient Registration** - Register and manage patient records
- **Queue Management** - Real-time queue tracking across departments
- **Department Workflow** - Streamlined patient flow through Reception, Triage, Consultation, Laboratory, and Pharmacy
- **Ticket System** - Auto-generated ticket numbers for patient tracking
- **Dashboard** - Real-time statistics and overview

## Departments

1. **Reception** - Patient registration and ticket generation
2. **Triage** - Initial patient assessment and vitals
3. **Consultation** - Doctor consultations
4. **Laboratory** - Lab tests and results
5. **Pharmacy** - Medication dispensing

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Express.js, SQLite (better-sqlite3)
- **Build Tool**: Vite
- **Deployment**: Railway / Docker

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd <project-name>

# Install dependencies
npm install

# Start development server (frontend only)
npm run dev
```

### Production

```bash
# Build and start server
npm run build
npm start
```

### Demo Credentials

The system auto-logs in as admin. No credentials needed for demo.

## User Roles

| Role | Permissions |
|------|-------------|
| Superadmin | Full system access, manage all users and settings |
| Admin | Manage staff, departments, view all records |
| Receptionist | Register patients, generate tickets |
| Nurse | Triage patients, record vitals |
| Doctor | Consultations, diagnosis, prescriptions |
| Lab Tech | Process lab tests, upload results |
| Pharmacist | Dispense medications, manage inventory |

## Project Structure

```
src/
├── components/
│   ├── AdminPage.tsx       # User and department management
│   ├── ConsultationPage.tsx # Doctor consultations
│   ├── DashboardLayout.tsx  # Main layout wrapper
│   ├── DashboardPage.tsx    # Statistics dashboard
│   ├── LabPage.tsx         # Laboratory operations
│   ├── PharmacyPage.tsx    # Pharmacy operations
│   ├── QueueDisplayPage.tsx # Public queue display
│   ├── ReceptionPage.tsx   # Patient registration
│   └── TriagePage.tsx      # Triage operations
├── lib/
│   ├── api.ts             # API client
│   └── auth.tsx           # Authentication context
├── App.tsx                # Main app component
├── main.tsx               # Entry point
└── index.css             # Global styles
server.ts                   # Express server with SQLite
```

## Database Schema

- **profiles** - User profiles with role-based access
- **departments** - Hospital departments
- **patients** - Patient records
- **visits** - Patient visits/tickets
- **visit_steps** - Workflow tracking
- **queue_entries** - Active queue management

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Deployment

### Railway

1. Connect your GitHub repository to Railway
2. Railway will detect the Dockerfile automatically
3. Deploy

### Docker

```bash
docker build -t hospital-system .
docker run -p 3000:3000 hospital-system
```

## License

MIT
