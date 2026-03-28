from flask import Blueprint, request, jsonify, abort
from datetime import datetime
from database import get_db
from auth_utils import hash_password, verify_password, create_access_token, login_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    
    if not name or not email or not password:
        abort(400, description="Missing fields")
        
    db = get_db()
    existing = db.users.find_one({"email": email})
    if existing:
        abort(400, description="Email already registered")
    
    user = {
        "name": name,
        "email": email,
        "password": hash_password(password),
        "created_at": datetime.utcnow(),
        "bookmarks": [],
        "reading_history": [],
        "revision_queue": [],
        "preferences": {"topics": [], "difficulty": "all"},
    }
    result = db.users.insert_one(user)
    token = create_access_token({"sub": str(result.inserted_id)})
    return jsonify({
        "token": token,
        "user": {"id": str(result.inserted_id), "name": name, "email": email}
    })

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    db = get_db()
    user = db.users.find_one({"email": email})
    if not user or not verify_password(password, user["password"]):
        abort(401, description="Invalid credentials")
    
    token = create_access_token({"sub": str(user["_id"])})
    return jsonify({
        "token": token,
        "user": {"id": str(user["_id"]), "name": user["name"], "email": user["email"]}
    })

@auth_bp.route("/me", methods=["GET"])
@login_required
def get_me(current_user):
    return jsonify({
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "created_at": current_user.get("created_at"),
        "preferences": current_user.get("preferences", {}),
    })
