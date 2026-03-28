from flask import Blueprint, request, jsonify, abort
from database import get_db
from auth_utils import login_required
from bson import ObjectId
from datetime import datetime

feed_bp = Blueprint('feed', __name__)

def serialize_doc(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@feed_bp.route("/", methods=["GET"])
@login_required
def get_feed(current_user):
    db = get_db()
    category = request.args.get("category")
    difficulty = request.args.get("difficulty")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))
    
    user = db.users.find_one({"_id": ObjectId(current_user["id"])})
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
    docs = list(cursor)
    
    # If not enough unread, pad with read docs
    if len(docs) < limit:
        remaining = limit - len(docs)
        read_cursor = db.docs.find({
            **query,
            "_id": {"$nin": [ObjectId(d["_id"]) for d in docs]}
        }).sort("created_at", -1).limit(remaining)
        read_docs = list(read_cursor)
        docs.extend(read_docs)
    
    total = db.docs.count_documents(query)
    bookmark_ids = user.get("bookmarks", [])
    
    result = []
    for d in docs:
        serialized = serialize_doc(d)
        serialized["is_bookmarked"] = str(d.get("id", "")) in bookmark_ids or serialized["id"] in bookmark_ids
        serialized["is_read"] = serialized["id"] in read_ids
        result.append(serialized)
    
    return jsonify({
        "feed": result,
        "total": total,
        "page": page,
        "has_more": (page * limit) < total
    })

@feed_bp.route("/categories", methods=["GET"])
@login_required
def get_categories(current_user):
    return jsonify({
        "categories": ["DSA", "System Design", "OS", "DBMS", "CN", "Other"],
        "difficulties": ["Easy", "Medium", "Hard"],
        "popular_tags": [
            "arrays", "trees", "graphs", "dp", "sorting", "hashing",
            "binary-search", "recursion", "caching", "load-balancing",
            "microservices", "databases", "networking", "processes"
        ]
    })

@feed_bp.route("/<id>/mark-read", methods=["POST"])
@login_required
def mark_as_read(current_user, id):
    db = get_db()
    db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {
            "$addToSet": {"reading_history": id},
            "$set": {f"last_read.{id}": datetime.utcnow()}
        }
    )
    return jsonify({"message": "Marked as read"})

@feed_bp.route("/<id>/add-to-revision", methods=["POST"])
@login_required
def add_to_revision(current_user, id):
    db = get_db()
    entry = {
        "doc_id": id,
        "added_at": datetime.utcnow().isoformat(),
        "next_revision": datetime.utcnow().isoformat(),
        "interval_days": 1,
        "repetitions": 0
    }
    db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$addToSet": {"revision_queue": entry}}
    )
    return jsonify({"message": "Added to revision queue"})
