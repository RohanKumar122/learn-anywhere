from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime
from database import get_db
from auth_utils import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
async def register(data: RegisterRequest):
    db = get_db()
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "created_at": datetime.utcnow(),
        "bookmarks": [],
        "reading_history": [],
        "revision_queue": [],
        "preferences": {"topics": [], "difficulty": "all"},
    }
    result = await db.users.insert_one(user)
    token = create_access_token({"sub": str(result.inserted_id)})
    return {
        "token": token,
        "user": {"id": str(result.inserted_id), "name": data.name, "email": data.email}
    }

@router.post("/login")
async def login(data: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": str(user["_id"])})
    return {
        "token": token,
        "user": {"id": str(user["_id"]), "name": user["name"], "email": user["email"]}
    }

@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "created_at": current_user.get("created_at"),
        "preferences": current_user.get("preferences", {}),
    }
