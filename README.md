# ConceptFlow AI 🧠

> AI-powered DSA & System Design learning — optimized for 2–10 minute sessions.
> Think: Medium + Notion + LeetCode Notes + ChatGPT, but for metro commutes.

---

## Features

- **Smart Learning Feed** — infinite scroll feed of DSA/System Design cards
- **Rich Doc Reader** — markdown with code highlighting, progress bar, read time
- **AI Assistant** — ask anything, get structured answers with code examples
- **Save AI as Doc** — one click to convert any AI answer into a reusable doc
- **Revision System** — spaced repetition (SM-2 algorithm) so you actually retain concepts
- **Quiz + Flashcards** — AI-generated per doc
- **Search** — full text + tag + difficulty + category filters
- **Bookmarks** — save docs for offline/metro reading
- **PWA** — installable, offline-ready via service worker + IndexedDB

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind CSS |
| State | Zustand |
| Backend | FastAPI + Motor (async MongoDB) |
| Auth | JWT (python-jose + passlib) |
| AI | Gemini 1.5 Flash / OpenAI GPT-3.5 |
| DB | MongoDB |
| PWA | vite-plugin-pwa + Workbox |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB running locally (`mongod`)

---

### 1. Clone & setup

```bash
git clone <your-repo>
cd conceptflow
```

### 2. Backend setup

```bash
cd backend

# Install deps
pip install -r requirements.txt

# Configure environment
cp .env .env.local
# Edit .env and add your API keys:
# GEMINI_API_KEY=your_key_here  ← Get free at https://makersuite.google.com/
# OPENAI_API_KEY=your_key_here  ← Optional fallback

# Seed sample content (DSA + System Design docs)
python seed.py

# Start server
uvicorn main:app --reload --port 8000
```

Backend runs at: http://localhost:8000  
API docs at: http://localhost:8000/docs

### 3. Frontend setup

```bash
cd frontend

# Install deps
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Getting AI API Keys

### Gemini (Recommended — Free)
1. Go to https://makersuite.google.com/
2. Click "Get API Key"
3. Add to `backend/.env`: `GEMINI_API_KEY=your_key`

### OpenAI (Optional fallback)
1. Go to https://platform.openai.com/api-keys
2. Add to `backend/.env`: `OPENAI_API_KEY=your_key`

The app works without API keys — AI features will show a config message instead.

---

## Project Structure

```
conceptflow/
├── backend/
│   ├── main.py              # FastAPI app entry
│   ├── database.py          # MongoDB connection
│   ├── config.py            # Settings from .env
│   ├── auth_utils.py        # JWT + password utils
│   ├── seed.py              # Sample content seeder
│   ├── requirements.txt
│   ├── .env                 # ← Add your keys here
│   └── routers/
│       ├── auth.py          # Register, login, /me
│       ├── docs.py          # CRUD, bookmark, notes
│       ├── feed.py          # Smart feed, filters
│       ├── ai.py            # Gemini/OpenAI, save-as-doc, quiz
│       ├── revision.py      # Spaced repetition (SM-2)
│       └── search.py        # Full text + filter search
│
└── frontend/
    ├── src/
    │   ├── App.jsx           # Router setup
    │   ├── main.jsx
    │   ├── index.css         # Design system + prose styles
    │   ├── api/
    │   │   ├── client.js     # Axios + auth interceptors
    │   │   └── index.js      # All API methods
    │   ├── store/
    │   │   └── index.js      # Zustand global state
    │   ├── components/
    │   │   └── Layout.jsx    # Sidebar + mobile nav
    │   └── pages/
    │       ├── LoginPage.jsx
    │       ├── RegisterPage.jsx
    │       ├── FeedPage.jsx       # Infinite scroll feed
    │       ├── DocPage.jsx        # Reader + quiz + flashcards
    │       ├── AIPage.jsx         # Chat + save-as-doc
    │       ├── RevisionPage.jsx   # Spaced repetition UI
    │       ├── SearchPage.jsx     # Search + filters
    │       ├── BookmarksPage.jsx
    │       ├── CreateDocPage.jsx  # Markdown editor
    │       └── ProfilePage.jsx
    ├── index.html
    ├── vite.config.js        # PWA config
    ├── tailwind.config.js
    └── package.json
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login → JWT |
| GET | /api/auth/me | Current user |

### Docs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/docs/ | List docs (paginated) |
| POST | /api/docs/ | Create doc |
| GET | /api/docs/{id} | Get doc (tracks read) |
| PUT | /api/docs/{id} | Update doc |
| DELETE | /api/docs/{id} | Delete doc |
| POST | /api/docs/{id}/bookmark | Toggle bookmark |
| POST | /api/docs/{id}/note | Add personal note |
| GET | /api/docs/bookmarks/list | Get bookmarked docs |

### Feed
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/feed/ | Smart feed (unread first) |
| POST | /api/feed/{id}/mark-read | Mark as read |
| POST | /api/feed/{id}/add-to-revision | Add to revision queue |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ai/ask | Ask AI (with history) |
| POST | /api/ai/save-as-doc | Save AI answer as doc |
| GET | /api/ai/chats | Chat history |
| POST | /api/ai/generate-quiz/{id} | AI quiz from doc |
| POST | /api/ai/generate-flashcards/{id} | AI flashcards from doc |

### Revision
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/revision/due | Docs due for revision |
| POST | /api/revision/{id}/complete | Record review (quality 0-5) |
| DELETE | /api/revision/{id} | Remove from queue |
| GET | /api/revision/stats | User stats |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/search/?q=... | Full text search + filters |

---

## Roadmap (Next Steps)

- [ ] Google OAuth login
- [ ] Mermaid diagram support in docs
- [ ] IndexedDB offline doc caching
- [ ] RAG over your saved docs (Gemini embeddings)
- [ ] Semantic search
- [ ] Import from markdown file
- [ ] Streak tracking
- [ ] Dark/light theme toggle
- [ ] Share public doc links
- [ ] Admin dashboard

---

## License
MIT
# learn-anywhere
