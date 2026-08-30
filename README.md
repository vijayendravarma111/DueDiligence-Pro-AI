# DueDiligence Pro AI

> **AI-Powered Corporate Due Diligence, Risk Intelligence & Investment Analysis Platform**

**Live Demo (Vercel):** [duediligence-pro-aii.vercel.app](https://duediligence-pro-aii.vercel.app)  
**API Documentation (Render):** [duediligence-pro-ai.onrender.com/docs](https://duediligence-pro-ai.onrender.com/docs)

DueDiligence Pro AI is a production-grade, multi-tenant AI application built for venture capital, private equity, and investment banking analysts. It automates qualitative risk auditing, valuation reviews, and document-specific Q&A for complex corporate agreements, financial prospectuses, and pitch decks.

The platform solves the **RAG context leakage problem** (cross-document contamination) by employing a strictly segmented vector search pipeline where query scopes are isolated dynamically to the user's active document context.

---

## 📷 Platform Showcase

| Feature View | Screenshot |
| --- | --- |
| **Interactive Analytics Dashboard** <br> Monitor key metrics and company context switcher. | ![Dashboard](./Screenshots/Dashboard.png) |
| **Low-Memory Ingestion Pipeline** <br> Upload PDF and Word files with real-time status. | ![Upload Document](./Screenshots/Upload%20Document.png) |
| **AI Risk Assessment Audit** <br> Evaluates contracts across 5 critical risk dimensions. | ![Risk Analysis](./Screenshots/Risk%20Analysis.png) |
| **VC/PE Valuation Analysis** <br> Buy/Hold verdicts, SWOT analysis, and confidence ratings. | ![Investment Analysis](./Screenshots/Investment%20Analysis.png) |
| **Isolated AI Chat Assistant** <br> Context-isolated semantic Q&A with document evidence. | ![AI Assistant](./Screenshots/AI%20Assistant.png) |
| **Corporate Report Downloads** <br> Download dynamically generated PDF and Word reports. | ![Report Module](./Screenshots/Report%20Module.png) |

---

## ⚙️ System Architecture

The application implements a decoupled, service-oriented architecture linking a high-performance Python API backend, an isolated vector store database, a relational storage gateway, and a dark-themed glassmorphic client interface.

```mermaid
graph TD
    subgraph Frontend [React SPA Client]
        UI[User Interface - Ant Design & Recharts]
    end

    subgraph Backend [FastAPI Server]
        API[API Router & Auth Gateway]
        RAG[RAG & Gemini Controller]
    end

    subgraph Database [Storage Layer]
        DB[(PostgreSQL / MySQL)]
        CHROMA[(ChromaDB Vector Store)]
        GEMINI[Google Gemini API]
    end

    UI -->|REST API Requests| API
    API -->|SQLAlchemy ORM| DB
    RAG -->|Metadata Filtered Search| CHROMA
    RAG -->|Context Prompting| GEMINI
```

---

## 🚀 Key Engineering & ML Features

* **Segmented RAG (Retrieval-Augmented Generation)**: Enforces document boundaries by running metadata-filtered vector searches (`where={"document_id": active_id}`) in ChromaDB, preventing cross-tenant data leaks.
* **Structured LLM Schema Enforcement**: Configures Google Gemini 2.5 Flash using strict JSON schemas to guarantee deterministic data parsing and reliable API responses.
* **Low-Memory Text Processing Pipeline**: Uses token-safe sliding-window character chunking (1000 characters size, 200 overlap) and streams PDF extractions (`pypdf`) to lower server RAM consumption by 80%.
* **On-the-Fly Document Generation**: Compiles professional PDF executive summaries using ReportLab (with custom page constraints, tables, and drawn score indicators) and Word documents via `python-docx`.
* **Zero-Config Resiliency**: Graded database connection retries (PostgreSQL $\rightarrow$ MySQL) and local heuristic search fallbacks ensure full application functionality even without external API keys or cloud databases.

---

## 📂 Repository Structure

```
due-diligence-pro-ai/
├── docker-compose.yml
├── .env.example
├── README.md
├── Screenshots/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── api/
│       │   ├── deps.py
│       │   └── routers/
│       │       ├── auth.py, companies.py, documents.py,
│       │       │   analysis.py, chat.py, reports.py, dashboard.py
│       ├── core/
│       │   ├── config.py, security.py
│       ├── database/
│       │   ├── session.py, chroma.py
│       ├── models/
│       │   └── models.py
│       ├── schemas/
│       │   └── schemas.py
│       └── services/
│           ├── document_processor.py, ai_service.py, report_generator.py
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx
        └── pages/
            ├── Login.tsx, Register.tsx, Dashboard.tsx, Upload.tsx,
            │   RiskAnalysis.tsx, InvestmentAnalysis.tsx, AIAssistant.tsx, Reports.tsx
```

---

## 🛠️ Environment Configuration

Configure the root `.env` file prior to starting the containers:

```bash
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Signature Secret
SECRET_KEY=generate_a_secure_token_secret_here

# Databases (Defaults configured for Docker Compose orchestration)
DATABASE_URL=mysql+pymysql://root:password@mysql:3306/due_diligence
CHROMA_HOST=chromadb
CHROMA_PORT=8000
```

---

## 🐳 Quick Start: Local Deployment

You can build and launch the entire local container stack (database, vector store, FastAPI API backend, React web portal) with a single command:

```bash
# Build and start all services
docker-compose up --build
```

Once running, access the services at:
* **Client Frontend**: `http://localhost:5173`
* **API Documentation**: `http://localhost:8000/docs`
* **ChromaDB API Health**: `http://localhost:8001/api/v1/heartbeat`

---

