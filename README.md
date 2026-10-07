# Unfazed — SaaS Platform for Private-Practice Therapists in India

**Unfazed** is an end-to-end practice management SaaS purpose-built for independent clinical psychologists, psychotherapists, and mental health counselors across India.

---

## 🌟 Key Features

1. **Branded Public Booking Portal (`/:slug`)**
   - Instant provider discovery with qualifications, RCI credentials, specializations, and languages.
   - Timezone-aware slot generation (India Standard Time by default) with custom buffers and durations (30/45/50/60 min).
   - **No Payment Gating**: Instant appointment confirmation and secure room link generation without checkout friction.

2. **Client CRM & Digital Consent Record**
   - Structured intake assessment capturing demographics, emergency contacts, medical histories, and presenting concerns.
   - Auditable digital informed consent with UTC timestamps and client IP logging.
   - Client roster with tag search and status management (`active`, `inactive`, `archived`).

3. **Clinical Documentation & Privacy Isolation**
   - Standardized **SOAP** (Subjective, Objective, Assessment, Plan) & **DAP** (Data, Assessment, Plan) templates alongside rich Freeform notes.
   - **Role-Restricted Zero-Leak Isolation**: Private clinician notes remain quarantined; only explicitly designated `shared` care summaries reach the Client Portal.

4. **Real-Time Telehealth Chat**
   - Socket.io room-based encrypted consultation chat between therapist and client.

5. **Centralized Entitlement Service**
   - Decoupled single-source-of-truth service (`entitlementService.canAccess`) managing feature gates (Active Client Caps, SOAP/DAP templates, Practice Analytics).
   - Interactive client-side upgrade prompts.

6. **Practice Analytics Hub**
   - Pure MongoDB Aggregation Pipelines calculating monthly session trajectories, client retention cohorts (repeat return rate), and attendance reliability (no-show & cancellation rates).

---

## 🏗️ Architecture & Project Structure

```
unfazed/
├── unfazed-backend/          # Node.js, Express, MongoDB/Mongoose, Socket.io
│   ├── src/
│   │   ├── config/           # Database connection & auto-seeder
│   │   ├── controllers/      # Auth, Scheduling, Notes, CRM, Analytics
│   │   ├── middleware/       # JWT Auth & Centralized Entitlement Gates
│   │   ├── models/           # Therapist, Client, Session, SessionNote, Availability, TierConfig
│   │   ├── routes/           # RESTful API routing
│   │   ├── services/         # EntitlementService & Decoupled NotificationService
│   │   ├── sockets/          # Socket.io real-time chat handler
│   │   └── utils/            # Slug generation & helpers
│   ├── package.json
│   └── .env.example
│
└── unfazed-frontend/         # Vite, React 18, Tailwind CSS, Recharts, Socket.io-client
    ├── src/
    │   ├── api/              # Axios instance with JWT interceptors
    │   ├── components/       # SlotPicker, SoapDapForm, IntakeForm, ChatWindow, Charts, UpgradePrompt
    │   ├── context/          # AuthContext
    │   ├── hooks/            # useEntitlement
    │   └── pages/            # Dashboard, CRM, Clinical Notes, Analytics, BookingPage, Portal
    ├── package.json
    └── tailwind.config.js
```

---

## 🚀 Quick-Start Guide

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Backend Setup
```bash
cd unfazed-backend
npm install
npm run dev
```
*Note: If local MongoDB is not running on port 27017, the backend automatically engages an embedded in-memory MongoDB instance with pre-seeded demo provider and client data.*

### 3. Frontend Setup
```bash
cd unfazed-frontend
npm install
npm run dev
```

### 4. Default Demo Credentials
- **Therapist Portal**: `http://localhost:5173/login`
  - **Email**: `dr.sharma@unfazed.in`
  - **Password**: `password123`
- **Public Booking Link**: `http://localhost:5173/dr-anjali-sharma`

---

## 🔒 Security & Privacy
- Passwords hashed using `bcryptjs` with 12 salt rounds.
- Stateless authentication using JSON Web Tokens (JWT) with role separation (`therapist` vs `client`).
- Strict backend API serialization preventing exposure of private clinician notes to client endpoints.
