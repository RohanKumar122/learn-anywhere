from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from database import get_db
from auth_utils import get_current_user

router = APIRouter()

def serialize_doc(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

class DocCreate(BaseModel):
    title: str
    content: str
    summary: Optional[str] = ""
    category: str = "DSA"  # DSA, System Design, OS, DBMS, CN, Other
    tags: List[str] = []
    difficulty: str = "Medium"  # Easy, Medium, Hard
    is_ai_generated: bool = False
    is_public: bool = False

class DocUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[List[str]] = None
    difficulty: Optional[str] = None
    is_public: Optional[bool] = None

class NoteAdd(BaseModel):
    note: str
    highlight: Optional[str] = None

@router.post("/")
async def create_doc(data: DocCreate, current_user=Depends(get_current_user)):
    db = get_db()
    # Estimate read time (~200 words/min)
    word_count = len(data.content.split())
    read_time = max(1, word_count // 200)
    
    doc = {
        **data.dict(),
        "owner_id": current_user["id"],
        "owner_name": current_user["name"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "read_time_minutes": read_time,
        "view_count": 0,
        "personal_notes": [],
        "is_published": True,
    }
    result = await db.docs.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return doc

@router.get("/")
async def list_docs(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    tag: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user=Depends(get_current_user)
):
    db = get_db()
    query = {
        "$or": [
            {"owner_id": current_user["id"]},
            {"is_public": True}
        ]
    }
    if category:
        query["category"] = category
    if difficulty:
        query["difficulty"] = difficulty
    if tag:
        query["tags"] = {"$in": [tag]}
    
    skip = (page - 1) * limit
    cursor = db.docs.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    total = await db.docs.count_documents(query)
    
    return {
        "docs": [serialize_doc(d) for d in docs],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@router.get("/{id}")
async def get_doc(id: str, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db.docs.find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Doc not found")
    if doc["owner_id"] != current_user["id"] and not doc.get("is_public"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Track reading history
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$addToSet": {"reading_history": id},
         "$set": {f"last_read.{id}": datetime.utcnow()}}
    )
    await db.docs.update_one({"_id": ObjectId(id)}, {"$inc": {"view_count": 1}})
    
    return serialize_doc(doc)

@router.put("/{id}")
async def update_doc(id: str, data: DocUpdate, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db.docs.find_one({"_id": ObjectId(id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    if doc["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your doc")
    
    updates = {k: v for k, v in data.dict().items() if v is not None}
    updates["updated_at"] = datetime.utcnow()
    await db.docs.update_one({"_id": ObjectId(id)}, {"$set": updates})
    updated = await db.docs.find_one({"_id": ObjectId(id)})
    return serialize_doc(updated)

@router.delete("/{id}")
async def delete_doc(id: str, current_user=Depends(get_current_user)):
    db = get_db()
    doc = await db.docs.find_one({"_id": ObjectId(id)})
    if not doc or doc["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.docs.delete_one({"_id": ObjectId(id)})
    return {"message": "Deleted"}

@router.post("/{id}/bookmark")
async def toggle_bookmark(id: str, current_user=Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    bookmarks = user.get("bookmarks", [])
    
    if id in bookmarks:
        await db.users.update_one({"_id": ObjectId(current_user["id"])}, {"$pull": {"bookmarks": id}})
        return {"bookmarked": False}
    else:
        await db.users.update_one({"_id": ObjectId(current_user["id"])}, {"$addToSet": {"bookmarks": id}})
        return {"bookmarked": True}

@router.post("/{id}/note")
async def add_personal_note(id: str, data: NoteAdd, current_user=Depends(get_current_user)):
    db = get_db()
    note = {
        "user_id": current_user["id"],
        "note": data.note,
        "highlight": data.highlight,
        "created_at": datetime.utcnow().isoformat()
    }
    await db.docs.update_one(
        {"_id": ObjectId(id)},
        {"$push": {"personal_notes": note}}
    )
    return {"message": "Note added", "note": note}

@router.get("/bookmarks/list")
async def get_bookmarks(current_user=Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    bookmark_ids = user.get("bookmarks", [])
    if not bookmark_ids:
        return {"docs": []}
    
    object_ids = [ObjectId(bid) for bid in bookmark_ids]
    cursor = db.docs.find({"_id": {"$in": object_ids}})
    docs = await cursor.to_list(length=100)
    return {"docs": [serialize_doc(d) for d in docs]}
