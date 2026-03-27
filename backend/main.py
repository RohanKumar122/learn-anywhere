from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, docs, feed, ai, revision, search
from database import connect_db, disconnect_db

app = FastAPI(title="ConceptFlow AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins in production/dev for now to avoid CORS issues on Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(docs.router, prefix="/api/docs", tags=["Docs"])
app.include_router(feed.router, prefix="/api/feed", tags=["Feed"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(revision.router, prefix="/api/revision", tags=["Revision"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])

@app.get("/")
async def root():
    return {"message": "ConceptFlow AI API running"}
