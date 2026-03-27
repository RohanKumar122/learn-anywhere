from fastapi import APIRouter, Depends, Query
from typing import Optional
from database import get_db
from auth_utils import get_current_user
from bson import ObjectId

router = APIRouter()

def serialize_doc(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@router.get("/")
async def search(
    q: str = Query(..., min_length=1),
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    tag: Optional[str] = None,
    is_ai_generated: Optional[bool] = None,
    bookmarked_only: bool = False,
    unread_only: bool = False,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    current_user=Depends(get_current_user)
):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    
    # Text search query
    query = {
        "$or": [
            {"owner_id": current_user["id"]},
            {"is_public": True}
        ],
        "$and": [
            {
                "$or": [
                    {"title": {"$regex": q, "$options": "i"}},
                    {"content": {"$regex": q, "$options": "i"}},
                    {"tags": {"$in": [q.lower()]}},
                    {"summary": {"$regex": q, "$options": "i"}},
                ]
            }
        ]
    }
    
    if category:
        query["category"] = category
    if difficulty:
        query["difficulty"] = difficulty
    if tag:
        query["tags"] = {"$in": [tag]}
    if is_ai_generated is not None:
        query["is_ai_generated"] = is_ai_generated
    
    if bookmarked_only:
        bookmark_ids = user.get("bookmarks", [])
        if bookmark_ids:
            query["_id"] = {"$in": [ObjectId(bid) for bid in bookmark_ids]}
    
    if unread_only:
        read_ids = user.get("reading_history", [])
        if read_ids:
            query["_id"] = {"$nin": [ObjectId(rid) for rid in read_ids]}
    
    skip = (page - 1) * limit
    cursor = db.docs.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    total = await db.docs.count_documents(query)
    
    return {
        "results": [serialize_doc(d) for d in docs],
        "total": total,
        "query": q,
        "page": page,
    }
