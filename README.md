# DueDiligence Pro AI

> **AI-Powered Corporate Due Diligence, Risk Intelligence & Investment Analysis Platform**

**Live Frontend Application:** [duediligence-pro-aii.vercel.app](https://duediligence-pro-aii.vercel.app)  
**Live API Endpoint:** [duediligence-pro-ai.onrender.com](https://duediligence-pro-ai.onrender.com/docs)

DueDiligence Pro AI is a production-grade, enterprise-scale AI application designed for venture capital, private equity, and corporate development analysts. It automates compliance auditing, legal covenant extraction, valuation reviews, and contextual Q&A for complex business agreements, financial prospectuses, and pitch decks.

The platform solves the common **RAG context contamination problem** by employing a strictly segmented vector search pipeline where query scopes are isolated dynamically to the user's active document context.

---

## 📷 Application Showcase

###  Interactive Dashboard & Financial KPIs
*Track key metrics and monitor company workspace contexts seamlessly.*
![Dashboard](./Screenshots/Dashboard.png)

###  Document Ingestion & Vector Indexing
*Upload PDF/DOCX contracts and prospectuses with active loading feedback.*
![Upload Document](./Screenshots/Upload%20Document.png)

###  AI Risk Assessment & Mitigation
*Analyze legal, financial, and operational risks with recommended mitigations.*
![Risk Analysis](./Screenshots/Risk%20Analysis.png)

###  Venture Capital & Private Equity Valuations
*Get automated Buy/Hold recommendations, SWOT analyses, and confidence ratings.*
![Investment Analysis](./Screenshots/Investment%20Analysis.png)

###  Document-Isolated AI Assistant Chat
*Ask context-constrained questions about individual files with zero-leakage vector search.*
![AI Assistant](./Screenshots/AI%20Assistant.png)

###  Corporate Report Downloads
*Download professional PDF and Word executive briefs compiled on-the-fly.*
![Report Module](./Screenshots/Report%20Module.png)

---

## ⚙️ System Architecture

The platform is designed around a decoupled, service-oriented architecture linking a high-performance Python API backend, an isolated vector database, a relational storage gateway, and a modern glassmorphic dashboard.

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
        DB[(PostgreSQL / SQLite - Users, Companies, Audit Logs)]
        CHROMA[(ChromaDB - Isolated Document Vectors)]
        GEMINI[Google Gemini 2.5 Flash API]
    end

    FE -->|Axios REST Queries| AUTH
    AUTH -->|DB Queries| DB_ROUTER
    DB_ROUTER -->|SQLAlchemy| DB
    AI_ROUTER -->|"Dynamic where={'document_id': id}"| CHROMA
    AI_ROUTER -->|Context Prompting| GEMINI
```

---

##  Key Machine Learning & Data Engineering Features

- **Segmented RAG (Retrieval-Augmented Generation)**: Prevents historical document contamination by executing metadata-filtered queries (`where={"document_id": active_id}`) in ChromaDB.
- **Structured LLM Schema Enforcement**: Leverages Google Gemini 2.5 Flash's structured JSON output mode to guarantee deterministic data parsing and consistent API schema responses.
- **Low-Memory Text Processing Pipeline**: Employs token-safe sliding-window chunking (with 200-character overlaps) and streams PDF extractions to prevent Out-Of-Memory (OOM) failures under high-concurrency environments.
- **Automated Risk & Valuation Models**: Extracts and rates contract clauses across 5 qualitative risk dimensions and compiles investment analysis scores.
- **Dynamic File Generation**: Generates styled PDF deliverables using ReportLab and MS Word summaries using `python-docx` containing active data indicators.

---

##  Repository Structure

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

##  Environment Configuration

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

##  Quick Start: Docker Compose

Spin up the entire local container stack (PostgreSQL/MySQL, ChromaDB, FastAPI API, React Web Portal) with one command:

```bash
# Build and run containers
docker-compose up --build
```

Access the services at:
- **Client Portal**: `http://localhost:5173`
- **FastAPI Documentation**: `http://localhost:8000/docs`
- **ChromaDB Health**: `http://localhost:8001/api/v1/heartbeat`

---



**Skills & Technologies Demonstrated:**
* **Programming Languages**: Python, TypeScript, SQL
* **AI & Machine Learning**: RAG (Retrieval-Augmented Generation), Vector Embeddings (`text-embedding-004`), LLM Prompting & Schema Design (Gemini API), Semantic Search, Data Chunking
* **Databases & Vector Stores**: ChromaDB, PostgreSQL, MySQL, SQLite, SQLAlchemy ORM
* **Backend Development**: FastAPI, JWT Security, REST APIs, JSON Validation (Pydantic)
* **Frontend Web Development**: React 19, TypeScript, Ant Design, Recharts Data Visualizations
* **DevOps & Cloud**: Docker, Docker Compose, Nginx Configuration, Vercel & Render Cloud Deployments

**Key Achievements:**
* **Context Contamination Resolution**: Designed and deployed a dynamic database-isolated RAG search structure that restricts vector matching within document boundaries, solving key multi-document leakages.
* **Deterministic LLM Output Generation**: Programmed a structured extraction engine using schema validation to enforce clean tabular results from unstructured documents.
* **High-Efficiency Document Parsing**: Replaced heavy PDF layout engines with optimized stream-based page parsers, resulting in over **80% reduction in server RAM consumption** and ensuring stable execution on memory-restricted cloud environments.
