# DueDiligence Pro AI

> **AI-Powered Due Diligence, Risk Intelligence & Investment Analysis Platform**

DueDiligence Pro AI is a recruiter-grade, enterprise-scale SaaS application designed for venture capital, private equity, and corporate development analysts. It automates compliance auditing, legal covenant extraction, valuation reviews, and contextual Q&A for business agreements, financial prospectuses, and pitch decks.

The platform solves the common **RAG context leakage problem** (cross-document contamination) by employing a strictly segmented vector search pipeline where query scopes are isolated dynamically to the user's active document context.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client [Client Portal - React 19]
        FE[SPA Interface - Ant Design & Recharts]
    end

    subgraph Router [API Middleware - FastAPI]
        AUTH[JWT Security Gateway]
        DB_ROUTER[Relational Schema Controller]
        AI_ROUTER[Gemini & Chroma Index Controller]
    end

    subgraph Storage [Data & Model Layer]
        MYSQL[(MySQL - Users, Companies, Audit Logs)]
        CHROMA[(ChromaDB - Isolated Document Vectors)]
        GEMINI[Google Gemini 2.5 Flash API]
    end

    FE -->|Axios REST Queries| AUTH
    AUTH -->|DB Queries| DB_ROUTER
    DB_ROUTER -->|SQLAlchemy| MYSQL
    AI_ROUTER -->|Dynamic where={'document_id': id}| CHROMA
    AI_ROUTER -->|Context Prompting| GEMINI
```

---

## 🌟 Core Features

- **Document-Specific Q&A Isolation**: Vector database indexes are filtered strictly by `document_id` preventing older indexing inputs from contaminating newer analyses.
- **Cognitive Risk Assessment**: Automatically evaluates contracts across 5 risk dimensions (Financial, Operational, Market, Governance, Legal) with consultant mitigation steps.
- **PE/VC Valuation Insight**: Scores prospectuses and provides strategic Buy/Hold verdicts, analyst confidence ratings, strengths/weaknesses grids, and valuation comp analysis.
- **Multi-Tenant Company Switcher**: Supports workspace context transitions so analysts can separate audit indexes.
- **Dynamic Report Generation**: Generates production-ready PDF reports (via ReportLab) and Word document briefs (via python-docx) on-the-fly.
- **Structured JSON Engine**: Directly prompts Gemini 2.5 Flash to generate responses constrained by strict JSON Schemas.
- **Glassmorphic UI theme**: Clean dark styling with Ant Design 5 token mappings, smooth animations, and Recharts timeline visualizers.

---

## 📁 Directory Structure

```
due-diligence-pro-ai/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── api/
│       │   ├── deps.py
│       │   └── routers/
│       │       ├── auth.py
│       │       ├── companies.py
│       │       ├── dashboard.py
│       │       ├── documents.py
│       │       ├── analysis.py
│       │       ├── chat.py
│       │       └── reports.py
│       ├── core/
│       │   ├── config.py
│       │   └── security.py
│       ├── database/
│       │   ├── session.py
│       │   └── chroma.py
│       ├── models/
│       │   └── models.py
│       ├── schemas/
│       │   └── schemas.py
│       └── services/
│           ├── document_processor.py
│           ├── ai_service.py
│           └── report_generator.py
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── api/
        │   └── index.ts
        ├── layouts/
        │   └── DashboardLayout.tsx
        └── pages/
            ├── Login.tsx
            ├── Register.tsx
            ├── Dashboard.tsx
            ├── Upload.tsx
            ├── RiskAnalysis.tsx
            ├── InvestmentAnalysis.tsx
            ├── AIAssistant.tsx
            └── Reports.tsx
```

---

## ⚙️ Environment Variables

Configure these settings inside the root `.env` file prior to starting the containers:

```bash
# Google Gemini API Key (Required for AI generation, falls back to mock evaluations if blank)
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Signature Secret
SECRET_KEY=generate_a_secure_token_secret_here

# Databases (Defaults configured for Docker Compose orchestration)
DATABASE_URL=mysql+pymysql://root:password@mysql:3306/due_diligence
CHROMA_HOST=chromadb
CHROMA_PORT=8000
```

---

## 🚀 Installation & Docker Setup

Launch the entire stack (relational schema, vector db, FastAPI backend, React web portal) with one command:

```bash
# Build and run containers
docker-compose up --build
```

Access the services at:
- **Client Portal**: `http://localhost:5173`
- **FastAPI Documentation**: `http://localhost:8000/docs`
- **ChromaDB Health**: `http://localhost:8001/api/v1/heartbeat`

---

## ☁️ Railway Deployment

DueDiligence Pro AI is ready to deploy directly to Railway:
1. Link your GitHub repository to Railway.
2. Railway will automatically pick up the `docker-compose.yml` configuration.
3. Configure the environment variables (`GEMINI_API_KEY`, `SECRET_KEY`) inside Railway's Shared Variables panel.
4. Railway will spin up separate MySQL, ChromaDB, Backend, and Frontend containers automatically.

---

## 💼 Resume & Recruiter Summary

**DueDiligence Pro AI — Principal Full-Stack Engineer / AI Architect**
- Architected a multi-tenant investment analysis SaaS that processes complex PDF/DOCX documents and evaluates them with structured LLM scoring.
- Implemented a **Segmented RAG (Retrieval-Augmented Generation) Architecture** in ChromaDB to solve context leakage across documents, improving search relevancy and isolation.
- Integrated **Google Gemini 2.5 Flash** to run automated risk assessments across 5 dimensions, compiling executive buy/sell investment scores using constrained JSON schemas.
- Engineered dynamic report compilation pipelines yielding executive PDF briefs (ReportLab) and Word document formats (python-docx) for instant user downloads.
- Built a glassmorphic dashboard in React 19 featuring Ant Design, TypeScript, and Recharts, served via an optimized Nginx proxy network.
- Configured a cloud-native **Docker Compose** blueprint enabling single-command local orchestration and containerized Railway deployments.
