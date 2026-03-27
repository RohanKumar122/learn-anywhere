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
async def get_feed(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=30),
    current_user=Depends(get_current_user)
):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    read_ids = user.get("reading_history", [])
    
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
    
    skip = (page - 1) * limit
    
    # Prioritize unread content
    unread_query = {**query}
    if read_ids:
        object_ids = []
        for rid in read_ids:
            try:
                object_ids.append(ObjectId(rid))
            except:
                pass
        if object_ids:
            unread_query["_id"] = {"$nin": object_ids}
    
    cursor = db.docs.find(unread_query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    
    # If not enough unread, pad with read docs
    if len(docs) < limit:
        remaining = limit - len(docs)
        read_cursor = db.docs.find({
            **query,
            "_id": {"$nin": [ObjectId(d["_id"]) for d in docs]}
        }).sort("created_at", -1).limit(remaining)
        read_docs = await read_cursor.to_list(length=remaining)
        docs.extend(read_docs)
    
    total = await db.docs.count_documents(query)
    bookmark_ids = user.get("bookmarks", [])
    
    result = []
    for d in docs:
        serialized = serialize_doc(d)
        serialized["is_bookmarked"] = str(d.get("id", "")) in bookmark_ids or serialized["id"] in bookmark_ids
        serialized["is_read"] = serialized["id"] in read_ids
        result.append(serialized)
    
    return {
        "feed": result,
        "total": total,
        "page": page,
        "has_more": (page * limit) < total
    }

@router.get("/categories")
async def get_categories(current_user=Depends(get_current_user)):
    return {
        "categories": ["DSA", "System Design", "OS", "DBMS", "CN", "Other"],
        "difficulties": ["Easy", "Medium", "Hard"],
        "popular_tags": [
            "arrays", "trees", "graphs", "dp", "sorting", "hashing",
            "binary-search", "recursion", "caching", "load-balancing",
            "microservices", "databases", "networking", "processes"
        ]
    }

@router.post("/{id}/mark-read")
async def mark_as_read(id: str, current_user=Depends(get_current_user)):
    db = get_db()
    from datetime import datetime
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {
            "$addToSet": {"reading_history": id},
            "$set": {f"last_read.{id}": datetime.utcnow()}
        }
    )
    return {"message": "Marked as read"}

@router.post("/{id}/add-to-revision")
async def add_to_revision(id: str, current_user=Depends(get_current_user)):
    db = get_db()
    from datetime import datetime
    entry = {
        "doc_id": id,
        "added_at": datetime.utcnow().isoformat(),
        "next_revision": datetime.utcnow().isoformat(),
        "interval_days": 1,
        "repetitions": 0
    }
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$addToSet": {"revision_queue": entry}}
    )
    return {"message": "Added to revision queue"}
