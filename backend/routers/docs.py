from flask import Blueprint, request, jsonify, abort
from datetime import datetime
from bson import ObjectId
from database import get_db
from auth_utils import login_required

docs_bp = Blueprint('docs', __name__)

def serialize_doc(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@docs_bp.route("/", methods=["POST"])
@login_required
def create_doc(current_user):
    data = request.json
    db = get_db()
    content = data.get("content", "")
    word_count = len(content.split())
    read_time = max(1, word_count // 200)
    
    doc = {
        "title": data.get("title"),
        "content": content,
        "summary": data.get("summary", ""),
        "category": data.get("category", "DSA"),
        "tags": data.get("tags", []),
        "difficulty": data.get("difficulty", "Medium"),
        "is_ai_generated": data.get("is_ai_generated", False),
        "is_public": data.get("is_public", False),
        "owner_id": current_user["id"],
        "owner_name": current_user["name"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "read_time_minutes": read_time,
        "view_count": 0,
        "personal_notes": [],
        "is_published": True,
    }
    result = db.docs.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    return jsonify(doc)

@docs_bp.route("/", methods=["GET"])
@login_required
def list_docs(current_user):
    db = get_db()
    category = request.args.get("category")
    difficulty = request.args.get("difficulty")
    tag = request.args.get("tag")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    
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
    docs = list(cursor)
    total = db.docs.count_documents(query)
    
    return jsonify({
        "docs": [serialize_doc(d) for d in docs],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    })

@docs_bp.route("/<id>", methods=["GET"])
@login_required
def get_doc(current_user, id):
    db = get_db()
    if not ObjectId.is_valid(id):
        abort(400, description="Invalid ID")
    doc = db.docs.find_one({"_id": ObjectId(id)})
    if not doc:
        abort(404, description="Doc not found")
    if doc["owner_id"] != current_user["id"] and not doc.get("is_public"):
        abort(403, description="Access denied")
    
    db.users.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$addToSet": {"reading_history": id},
         "$set": {f"last_read.{id}": datetime.utcnow()}}
    )
    db.docs.update_one({"_id": ObjectId(id)}, {"$inc": {"view_count": 1}})
    
    return jsonify(serialize_doc(doc))

@docs_bp.route("/<id>", methods=["PUT"])
@login_required
def update_doc(current_user, id):
    db = get_db()
    data = request.json
    if not ObjectId.is_valid(id):
        abort(400, description="Invalid ID")
    doc = db.docs.find_one({"_id": ObjectId(id)})
    if not doc:
        abort(404, description="Not found")
    if doc["owner_id"] != current_user["id"]:
        abort(403, description="Not your doc")
    
    updates = {k: v for k, v in data.items() if v is not None}
    updates["updated_at"] = datetime.utcnow()
    db.docs.update_one({"_id": ObjectId(id)}, {"$set": updates})
    updated = db.docs.find_one({"_id": ObjectId(id)})
    return jsonify(serialize_doc(updated))

@docs_bp.route("/<id>", methods=["DELETE"])
@login_required
def delete_doc(current_user, id):
    db = get_db()
    if not ObjectId.is_valid(id):
        abort(400, description="Invalid ID")
    doc = db.docs.find_one({"_id": ObjectId(id)})
    if not doc or doc["owner_id"] != current_user["id"]:
        abort(403, description="Not authorized")
    db.docs.delete_one({"_id": ObjectId(id)})
    return jsonify({"message": "Deleted"})

@docs_bp.route("/<id>/bookmark", methods=["POST"])
@login_required
def toggle_bookmark(current_user, id):
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(current_user["id"])})
    bookmarks = user.get("bookmarks", [])
    
    if id in bookmarks:
        db.users.update_one({"_id": ObjectId(current_user["id"])}, {"$pull": {"bookmarks": id}})
        return jsonify({"bookmarked": False})
    else:
        db.users.update_one({"_id": ObjectId(current_user["id"])}, {"$addToSet": {"bookmarks": id}})
        return jsonify({"bookmarked": True})

@docs_bp.route("/<id>/note", methods=["POST"])
@login_required
def add_personal_note(current_user, id):
    db = get_db()
    data = request.json
    note = {
        "user_id": current_user["id"],
        "note": data.get("note"),
        "highlight": data.get("highlight"),
        "created_at": datetime.utcnow().isoformat()
    }
    db.docs.update_one(
        {"_id": ObjectId(id)},
        {"$push": {"personal_notes": note}}
    )
    return jsonify({"message": "Note added", "note": note})

@docs_bp.route("/bookmarks/list", methods=["GET"])
@login_required
def get_bookmarks(current_user):
    db = get_db()
    user = db.users.find_one({"_id": ObjectId(current_user["id"])})
    bookmark_ids = user.get("bookmarks", [])
    if not bookmark_ids:
        return jsonify({"docs": []})
    
    object_ids = [ObjectId(bid) for bid in bookmark_ids]
    cursor = db.docs.find({"_id": {"$in": object_ids}})
    docs = list(cursor)
    return jsonify({"docs": [serialize_doc(d) for d in docs]})
