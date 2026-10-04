# DueDiligence Pro AI

**DueDiligence Pro AI** is an enterprise-grade AI-powered document analysis platform built for campus placement and full-stack AI engineering portfolios. It enables users to upload business due diligence documents (PDF and DOCX), extract and chunk document text, index semantic embeddings in ChromaDB, store relational metadata in MySQL, generate structured executive summaries using Google Gemini, and ask document-grounded questions via Retrieval-Augmented Generation (RAG).

---

## 🌟 Key Features

1. **User Authentication & Authorization**: Secure JWT-based registration and login with password hashing (`bcrypt`).
2. **Multi-User Document Isolation**: Users can only access and query their own uploaded documents.
3. **Multi-Format Document Ingestion**: Text extraction and chunking for both **PDF** (`pypdf`) and **DOCX** (`python-docx`).
4. **Local Persistent Vector Search**: Chunks and embeddings stored in local persistent ChromaDB with user-level and document-level metadata filtering.
5. **Retrieval-Augmented Generation (RAG)**: Question-answering pipeline using semantic similarity search + Google Gemini for context-restricted, hallucination-free answers.
6. **Automated Executive Summaries**: Concise summary breakdown including Overview, Key Findings, Important Risks, Financial/Business Info, and Actionable Recommendations.
7. **Relational Data Management**: Clean database structure using MySQL and SQLAlchemy ORM.
8. **Modern Interactive Dashboard**: Professional dark-themed UI built with React, TypeScript, Vite, and Ant Design.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js, TypeScript, Vite, Ant Design (`antd`) |
| **Backend** | Python 3.11+, FastAPI, Uvicorn |
| **Relational Database** | MySQL 8.0+, SQLAlchemy ORM, PyMySQL |
| **Vector Database** | ChromaDB (Local Persistent Storage) |
| **AI / LLM** | Google Gemini API (Generative AI SDK) |
| **Document Parsers** | PyPDF, python-docx |
| **Authentication** | JWT (PyJWT / python-jose), Passlib (Bcrypt) |
| **Version Control** | Git, GitHub |

---

## 📐 System Architecture

```
React.js + TypeScript Frontend (Vite + Ant Design)
                     │
                     │ REST API Requests (Bearer JWT Token)
                     ▼
             FastAPI Backend
                     │
    ┌────────────────┼────────────────┐
    │                │                │
    ▼                ▼                ▼
Authentication    RAG Engine      Document Parser
 (JWT / Passlib)   & Gemini       (PyPDF / python-docx)
                     │
            ┌────────┴────────┐
            ▼                 ▼
   ChromaDB (Vectors)    MySQL (Relational Metadata)
   - Chunk Embeddings    - Users
   - Metadata Filters    - Documents
                         - Document Analysis
                         - Chat Messages
```

---

## 📁 Project Structure

```
due-diligence-pro-ai/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py         # App configuration & env settings
│   │   │   ├── security.py       # Password hashing & JWT tokens
│   │   │   └── deps.py           # FastAPI auth dependencies
│   │   ├── db/
│   │   │   ├── database.py       # MySQL database session
│   │   │   └── models.py         # SQLAlchemy models (User, Document, etc.)
│   │   ├── schemas/
│   │   │   ├── auth.py           # Auth Pydantic models
│   │   │   ├── document.py       # Document & Summary Pydantic models
│   │   │   └── chat.py           # RAG Chat Pydantic models
│   │   ├── routers/
│   │   │   ├── auth.py           # Auth endpoints (/auth/register, /auth/login)
│   │   │   ├── documents.py      # Document endpoints (/documents/upload, /summary)
│   │   │   └── chat.py           # RAG Q&A endpoints (/documents/{id}/ask)
│   │   ├── services/
│   │   │   ├── document_service.py   # Text extraction & database orchestration
│   │   │   ├── embedding_service.py  # Gemini & ChromaDB vector embeddings
│   │   │   ├── rag_service.py        # Persistent ChromaDB vector search
│   │   │   └── gemini_service.py     # Gemini LLM Q&A & Executive Summaries
│   │   ├── utils/
│   │   │   └── document_parser.py    # PyPDF & python-docx text extractors
│   │   └── main.py              # FastAPI application entry point
│   ├── test_app.py              # Backend automated test suite
│   ├── requirements.txt         # Clean backend dependencies
│   └── .env.example             # Environment variable template
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── layouts/
│   │   │   └── DashboardLayout.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Upload.tsx
│   │   │   ├── DocumentDetails.tsx
│   │   │   ├── AIQuestionAnswer.tsx
│   │   │   └── ExecutiveSummary.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚙️ Prerequisites

- **Python**: Version 3.11 or higher
- **Node.js**: Version 18.0 or higher
- **MySQL**: Local MySQL Server 8.0+ running on port 3306

---

## 🗄️ MySQL Database Setup

1. Start your local MySQL service.
2. Log into MySQL and create the database:
   ```sql
   CREATE DATABASE due_diligence;
   ```
3. Update database credentials in your `.env` file (`MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT`).

---

## 🔐 Environment Variables

Create a `.env` file in the root directory (and in `backend/.env`):

```env
# Google Gemini API Access Key
GEMINI_API_KEY=your_google_gemini_api_key_here

# MySQL Database Settings
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=due_diligence

# Security Secret Key for JWT Signing
SECRET_KEY=super_secret_jwt_key_here
```

---

## 🚀 Running the Application

### 1. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
python app/main.py
```
The backend API will start at: `http://localhost:8000`  
Swagger API Docs available at: `http://localhost:8000/docs`

### 2. Frontend Setup (React + Vite)

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start development server
npm run dev
```
The frontend will start at: `http://localhost:5173`

---

## 🧠 How Retrieval-Augmented Generation (RAG) Works

1. **Document Upload & Text Extraction**: When a user uploads a PDF or DOCX file, `pypdf` or `python-docx` extracts raw text.
2. **Text Chunking**: The text is split into overlapping chunks (1,000 characters with 200 overlap).
3. **Vector Embeddings**: Real semantic embeddings are generated for each chunk using Google Gemini API (`models/gemini-embedding-001`).
4. **Persistent Vector Indexing**: Chunks and vectors are saved into local persistent ChromaDB with strict metadata filters (`document_id` and `user_id`).
5. **Contextual Query & LLM Synthesis**: When the user asks a question, ChromaDB retrieves top relevant text chunks. The context is passed to Google Gemini with instructions to answer based **strictly** on the document excerpts.

---

## 📡 API Endpoints Overview

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Authenticate user & return JWT token
- `GET /api/v1/auth/me` - Get current user profile

### Documents
- `POST /api/v1/documents/upload` - Upload PDF/DOCX file and index with AI
- `GET /api/v1/documents` - List user's documents
- `GET /api/v1/documents/{id}` - Get document details, summary, risk & investment reports
- `DELETE /api/v1/documents/{id}` - Delete document and ChromaDB vectors
- `POST /api/v1/documents/{id}/summary` - Fetch/regenerate executive summary
- `POST /api/v1/documents/{id}/risk-analysis` - Generate CRO Risk Analysis report
- `POST /api/v1/documents/{id}/investment-analysis` - Generate VC Investment Analysis report

### RAG Chat
- `POST /api/v1/documents/{id}/ask` - RAG semantic search & Q&A
- `GET /api/v1/documents/{id}/chat-history` - Get document Q&A history

---

## 🧪 Running Automated Tests

Run the test suite to verify MySQL connection, authentication, document parsing, vector indexing, multi-tenant security, executive summary, risk analysis, and investment analysis:

```bash
cd backend
python test_app.py
```

