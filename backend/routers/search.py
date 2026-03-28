from flask import Blueprint, request, jsonify, abort
from database import get_db
from auth_utils import login_required
from bson import ObjectId

search_bp = Blueprint('search', __name__)

def serialize_doc(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@search_bp.route("/", methods=["GET"])
@login_required
def search_docs(current_user):
    q = request.args.get("q")
    if not q:
        abort(400, description="Query parameter 'q' is required")
        
    category = request.args.get("category")
    difficulty = request.args.get("difficulty")
    tag = request.args.get("tag")
    is_ai_generated = request.args.get("is_ai_generated")
    bookmarked_only = request.args.get("bookmarked_only") == "true"
    unread_only = request.args.get("unread_only") == "true"
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(current_user["id"])})
    
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
        query["is_ai_generated"] = is_ai_generated == "true"
    
    if bookmarked_only:
        bookmark_ids = user.get("bookmarks", [])
        if bookmark_ids:
            query["_id"] = {"$in": [ObjectId(bid) for bid in bookmark_ids]}
        else:
            return jsonify({"results": [], "total": 0, "query": q, "page": page})
    
    if unread_only:
        read_ids = user.get("reading_history", [])
        if read_ids:
            query["_id"] = {"$nin": [ObjectId(rid) for rid in read_ids]}
    
    skip = (page - 1) * limit
    cursor = db.docs.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = list(cursor)
    total = db.docs.count_documents(query)
    
    return jsonify({
        "results": [serialize_doc(d) for d in docs],
        "total": total,
        "query": q,
        "page": page,
    })
