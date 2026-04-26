# PermitPilot

**From 14 Weeks to 14 Minutes: The AI-Powered Civic Permit Navigator for Local Businesses.**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com/apikey) API key
- (Optional) A [Supabase](https://supabase.com) project for data persistence

### Setup

1. **Clone and configure:**
```bash
git clone <your-repo-url>
cd PermitPilot
```

2. **Set your API keys:**
Edit `.env.local` in the project root:
```env
GEMINI_API_KEY=your_actual_gemini_key
SUPABASE_URL=your_supabase_url         # optional
SUPABASE_SERVICE_ROLE_KEY=your_key      # optional
```

3. **Start the backend:**
```bash
cd backend
npm install
npm run dev
```
The API gateway starts at `http://localhost:8080`.

4. **Start the frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
```
The app opens at `http://localhost:5173`.

## 🏗️ Architecture

```
User → Intake Form → POST /api/evaluate
                          ↓
                    ┌─────────────┐
                    │ Orchestrator │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           │       │       │       │       │
        Zoning  Health   Fire  Building Licensing
        Agent   Agent   Agent   Agent    Agent
           │       │       │       │       │
           └───────────────┼───────────────┘
                    ┌──────┴──────┐
                    │  Conflict   │
                    │  Detection  │
                    └──────┬──────┘
                    ┌──────┴──────┐
                    │  Checklist  │
                    │  Generator  │
                    └──────┬──────┘
                           ↓
              Unified Response → Review Page
```

## 🤖 AI Agents

| Agent | Domain | What It Checks |
|-------|--------|----------------|
| 🗺️ Zoning Authority | Land use | Districts, setbacks, proximity, hours |
| 🏥 Health Department | Food safety | Sanitation, commissary, certifications |
| 🔥 Fire Marshal | Life safety | Propane, suppression, ventilation |
| 🏗️ Building Dept | Structural | Electrical, plumbing, ADA compliance |
| 📜 Business Licensing | Legal | Licenses, insurance, tax registration |

## 🛠️ Tech Stack

- **Frontend:** Vite + React 19 + TypeScript + TanStack Router + Tailwind CSS + Framer Motion
- **Backend:** Node.js + Express
- **AI:** Google Gemini 2.0 Flash
- **Database:** Supabase (PostgreSQL)

## 📁 Project Structure

```
PermitPilot/
├── backend/
│   ├── agents/          # 5 domain agent modules
│   ├── data/            # Municipal code JSON files
│   ├── utils/           # Gemini & Supabase clients
│   └── index.js         # Express server + orchestrator
├── frontend/
│   └── src/
│       ├── routes/      # Pages (landing, intake, review)
│       ├── components/  # Shared UI components
│       └── lib/         # Types, API client
└── .env.local           # API keys (not committed)
```

## License

MIT