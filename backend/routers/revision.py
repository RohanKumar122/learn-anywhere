from fastapi import APIRouter, Depends
from database import get_db
from auth_utils import get_current_user
from bson import ObjectId
from datetime import datetime, timedelta

router = APIRouter()

def serialize_doc(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

# SM-2 Spaced Repetition Algorithm
def calculate_next_interval(repetitions: int, quality: int, interval: int) -> tuple:
    """
    quality: 0-5 (0=forgot, 3=hard, 4=good, 5=easy)
    Returns (new_interval_days, new_repetitions)
    """
    if quality < 3:
        return 1, 0  # Reset
    
    if repetitions == 0:
        new_interval = 1
    elif repetitions == 1:
        new_interval = 6
    else:
        new_interval = round(interval * 2.5)
    
    return new_interval, repetitions + 1

@router.get("/due")
async def get_due_revisions(current_user=Depends(get_current_user)):
    """Get all docs due for revision today"""
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    revision_queue = user.get("revision_queue", [])
    
    now = datetime.utcnow()
    due_items = []
    
    for item in revision_queue:
        try:
            next_rev = datetime.fromisoformat(item["next_revision"])
            if next_rev <= now:
                # Fetch the doc
                try:
                    doc = await db.docs.find_one({"_id": ObjectId(item["doc_id"])})
                    if doc:
                        serialized = serialize_doc(doc)
                        serialized["revision_meta"] = {
                            "repetitions": item.get("repetitions", 0),
                            "interval_days": item.get("interval_days", 1),
                            "added_at": item.get("added_at"),
                            "overdue_days": (now - next_rev).days
                        }
                        due_items.append(serialized)
                except:
                    pass
        except:
            pass
    
    # Also get recently-read docs not seen in 5+ days (weak concepts)
    reading_history = user.get("reading_history", [])
    last_read = user.get("last_read", {})
    forgotten = []
    
    for doc_id in reading_history[:20]:  # Check last 20 read docs
        last_read_time = last_read.get(doc_id)
        if last_read_time:
            try:
                if isinstance(last_read_time, str):
                    last_read_dt = datetime.fromisoformat(last_read_time)
                else:
                    last_read_dt = last_read_time
                days_ago = (now - last_read_dt).days
                if days_ago >= 5:
                    forgotten.append({"doc_id": doc_id, "days_ago": days_ago})
            except:
                pass
    
    return {
        "due": due_items,
        "due_count": len(due_items),
        "forgotten_count": len(forgotten),
        "forgotten": forgotten[:5]  # Top 5 forgotten
    }

@router.post("/{doc_id}/complete")
async def complete_revision(doc_id: str, quality: int = 4, current_user=Depends(get_current_user)):
    """
    quality: 0=forgot, 3=hard, 4=good, 5=easy
    """
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    revision_queue = user.get("revision_queue", [])
    
    updated_queue = []
    for item in revision_queue:
        if item["doc_id"] == doc_id:
            new_interval, new_reps = calculate_next_interval(
                item.get("repetitions", 0),
                quality,
                item.get("interval_days", 1)
            )
            next_revision = (datetime.utcnow() + timedelta(days=new_interval)).isoformat()
            item["interval_days"] = new_interval
            item["repetitions"] = new_reps
            item["next_revision"] = next_revision
            item["last_reviewed"] = datetime.utcnow().isoformat()
        updated_queue.append(item)
    
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"revision_queue": updated_queue}}
    )
    return {"message": "Revision recorded", "next_review_days": new_interval if 'new_interval' in dir() else 1}

@router.delete("/{doc_id}")
async def remove_from_revision(doc_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    await db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$pull": {"revision_queue": {"doc_id": doc_id}}}
    )
    return {"message": "Removed from revision"}

@router.get("/stats")
async def get_revision_stats(current_user=Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    
    revision_queue = user.get("revision_queue", [])
    reading_history = user.get("reading_history", [])
    
    total_docs = await db.docs.count_documents({"owner_id": current_user["id"]})
    
    return {
        "total_docs": total_docs,
        "in_revision": len(revision_queue),
        "docs_read": len(reading_history),
        "streak_days": 0,  # TODO: implement streak tracking
    }
