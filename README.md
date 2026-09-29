# ORCA: Marine EcOsystem Reasoning with Collaborative Agents

[![Problem Statement](https://img.shields.io/badge/Problem%20Statement-SIH26176-blue.svg)](https://sih.gov.in)
[![Organisation](https://img.shields.io/badge/Organisation-ISRO%20%2F%20NRSC-orange.svg)](https://www.isro.gov.in)
[![Department](https://img.shields.io/badge/Department-Department%20of%20Space-green.svg)](https://www.dos.gov.in)
[![AI Engine](https://img.shields.io/badge/GenAI-Google%20Gemini%202.5%20Flash-purple.svg)](https://ai.google.dev)
[![Status](https://img.shields.io/badge/Backend%20Tests-6%20Passed-emerald.svg)]()

> **Core Mission**: `OBSERVE → UNDERSTAND → REASON → PREDICT → PROTECT → ACT`

**ORCA** is an operational, Agentic AI-powered conversational marine intelligence platform built for **ISRO / NRSC (National Remote Sensing Centre)**. Instead of requiring maritime operators, fisheries officers, or research scientists to manually search fragmented ocean portals, ORCA orchestrates collaborative marine agents to decompose queries, retrieve cross-domain satellite and oceanographic data, evaluate marine risk, enforce maritime boundary safety, and deliver evidence-backed advisories in Indian regional languages alongside 2D GIS and 3D Digital Ocean Twin visualizations.

---

## Architecture Workflow

```
USER QUERY (English, Tamil, Hindi, Malayalam, Telugu)
    ↓
INTENT & LANGUAGE AGENT (Gemini 2.5 Flash NLU)
    ↓
TASK PLANNER AGENT (Dynamic Task Graph Decomposition)
    ↓
PARALLEL DOMAIN AGENTS (Weather, Ocean Analytics, Tide, Satellite EO, PFZ, Geofencing)
    ↓
DATA RETRIEVAL (Unified Marine Knowledge Layer & Data Provider Adapters)
    ↓
SPATIAL & TEMPORAL REASONING (Geodesic Math, Route Engine, Trend Analysis)
    ↓
MARINE RISK AGENT (Multi-Factor Composite Risk: Waves, Winds, IMBL Buffer)
    ↓
EVIDENCE SYNTHESIS (Verifiable Observations & Source Citations)
    ↓
FINAL MARINE RESPONSE & VISUALIZATION (Conversational Copilot, 2D GIS Map, 3D Digital Ocean Twin, PDF Reports)
```

---

## 12 Collaborative Agents

| # | Agent Name | Primary Responsibility |
|---|---|---|
| 1 | **Intent & Language Agent** | Detects input language, user intent, target coordinates, and time window. |
| 2 | **Task Planner Agent** | Dynamically constructs optimal task execution graph with parallel scheduling. |
| 3 | **Satellite EO Agent** | Analyzes Oceansat-3 OCM-3 Chlorophyll and INSAT-3DR SST thermal observations. |
| 4 | **Weather Agent** | Processes IMD marine bulletins, wind speeds, sustained gusts, and cyclone alerts. |
| 5 | **Ocean Analytics Agent** | Evaluates significant wave heights, swell surge, sea state, and current vectors. |
| 6 | **Tide & Marine Conditions Agent** | Analyzes harmonic tidal gauge levels and channel draught clearance. |
| 7 | **PFZ & Fisheries Agent** | Delineates Potential Fishing Zones, target fish species, and thermal fronts. |
| 8 | **Geospatial Reasoning Agent** | Calculates geodesic distances, proximity buffers, and spatial intersections. |
| 9 | **Geofencing Agent** | Enforces IMBL border safety standoff and Marine Protected Area regulations. |
| 10 | **Marine Risk Agent** | Synthesizes environmental parameters into calibrated risk scores (LOW to CRITICAL). |
| 11 | **Hazard & Alert Agent** | Proactive warning triggers for storm surges, high swells, and restricted areas. |
| 12 | **Route Optimization Agent** | Deterministic navigational corridors avoiding hazards, reefs, and border buffers. |

---

## Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
- **2D Mapping**: SVG Vector Georeferenced Situation Map with GIS layer controls
- **3D Digital Ocean Twin**: Three.js with bathymetric shelf terrain, animated ocean surface, volumetric PFZ beacons, and temporal timeline
- **Backend API**: Python 3.11+, FastAPI, Uvicorn, Pydantic v2, SSE-Starlette
- **Agent Orchestrator**: OrcaOrchestrator dynamic multi-agent pipeline
- **AI Core**: Official Google GenAI SDK (`google-genai`), Gemini 2.5 Flash (Operational) & Gemini 2.5 Pro (Deep Reasoning)
- **Database & Spatial**: SQLAlchemy 2.0 Async, aiosqlite / asyncpg, PostGIS / Geodesic spatial engine
- **Semantic Layer**: In-memory / ChromaDB compatible vector store and Marine Knowledge Graph

---

## Repository Structure

```
ORCA/
├── backend/
│   ├── app/
│   │   ├── agents/          # 12 specialized collaborative agents & orchestrator
│   │   │   ├── orchestrator.py
│   │   │   ├── intent_agent.py
│   │   │   ├── task_planner.py
│   │   │   ├── weather_agent.py
│   │   │   ├── ocean_agent.py
│   │   │   ├── tide_agent.py
│   │   │   ├── satellite_eo_agent.py
│   │   │   ├── pfz_agent.py
│   │   │   ├── geospatial_agent.py
│   │   │   ├── geofencing_agent.py
│   │   │   ├── marine_risk_agent.py
│   │   │   ├── hazard_agent.py
│   │   │   └── route_agent.py
│   │   ├── api/             # FastAPI REST and SSE streaming endpoints
│   │   │   └── routes.py
│   │   ├── core/            # Database engine, spatial math, config
│   │   ├── data/            # Database seed scripts
│   │   ├── models/          # Pydantic schemas and SQLAlchemy models
│   │   ├── services/        # Gemini service, unified marine layer, vector store, knowledge graph
│   │   │   └── providers/   # EO, Weather, Ocean, Tide, PFZ, Boundary providers & ISRO adapter
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/               # Pytest async test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx         # Overview Dashboard
│   │   ├── copilot/         # Conversational Ocean Copilot
│   │   ├── ocean-twin/      # 3D Digital Ocean Twin
│   │   ├── fisheries/       # PFZ & Fisheries Intelligence
│   │   ├── safety/          # Marine Safety & Geofencing
│   │   ├── routes/          # Navigational Route Optimization
│   │   ├── reports/         # Marine Intelligence PDF Reports
│   │   ├── data/            # Data Sources & ISRO Ingestion
│   │   └── system/          # System Subsystem Health
│   ├── components/          # Reusable UI (Sidebar, Header, MarineMap, OceanTwin3D)
│   ├── lib/                 # API Client
│   ├── types/               # TypeScript interfaces
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quickstart Guide

### 1. Environment Setup

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `GEMINI_API_KEY` is populated:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_REASONING_MODEL=gemini-2.5-pro
DEMO_MODE=true
```

### 2. Backend Setup & Database Seeding

Activate Python virtual environment and run seed:
```bash
# In project root
.\venv\Scripts\activate

# Seed initial maritime observations and geofences
python -m backend.app.data.seed

# Run automated tests
python -m pytest backend/tests/test_backend.py -v

# Start FastAPI backend server (Port 8000)
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at: **`http://localhost:8000/docs`**

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open your browser at: **`http://localhost:3000`**

---

## Built-In SIH Demonstrations

The application features 4 dedicated one-click evaluation scenarios accessible in the top header and Copilot:

1. **Fishing Safety Demo**:
   - Query: *"Is it safe to go fishing tomorrow morning from my current location?"*
   - Execution: Intent → Weather → Ocean → Tide → Hazard → Geofence → Marine Risk → Gemini Evidence Synthesis.
2. **Find Nearest PFZ**:
   - Query: *"Where is the nearest Potential Fishing Zone today and what is the optimal route?"*
   - Execution: Satellite EO → Fisheries → Ocean Analytics → Geospatial → Route Engine.
3. **Marine Research Analysis**:
   - Query: *"Why has fish productivity declined in Palk Bay over the past two years?"*
   - Execution: Multi-year reanalysis data, SST trend (+0.42°C), chlorophyll variation (-14.2%). **Explicitly distinguishes correlation ($r = -0.68$) from causation.**
4. **Tamil Marine Safety (தமிழ் Demo)**:
   - Query: *"நாளை காலை இங்கிருந்து மீன்பிடிக்க கடலுக்கு செல்லலாமா?"*
   - Execution: Complete 12-agent pipeline with native, accurate Tamil advisory output preserving exact technical knots, wave meters, and temperatures.

---

## ISRO / NRSC Data Ingestion Interface

Live satellite Earth Observation products from **ISRO MOSDAC / Bhuvan / VEDAS** can be activated by providing agency access tokens in `backend/app/services/providers/isro_provider.py`. When operating in demo mode, simulated provider schemas adhering to official OCM-3/SSTM formats are used and clearly watermarked as:
**`SIMULATED DATA FOR DEMONSTRATION`**.

---

## License

Developed under Smart India Hackathon (SIH26176) for **ISRO / NRSC, Department of Space, Government of India**.
