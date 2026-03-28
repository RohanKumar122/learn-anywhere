from flask import Blueprint, request, jsonify, abort
from datetime import datetime
from database import get_db
from auth_utils import login_required
from config import settings
import httpx
import json

ai_bp = Blueprint('ai', __name__)

def call_gemini(prompt: str, history: list = []) -> str:
    if not settings.GEMINI_API_KEY:
        return "⚠️ Gemini API key not configured. Add GEMINI_API_KEY to your .env file."
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={settings.GEMINI_API_KEY}"
    
    contents = []
    for msg in history:
        contents.append({
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [{"text": msg["content"]}]
        })
    contents.append({"role": "user", "parts": [{"text": prompt}]})
    
    system_prompt = """You are ConceptFlow AI — an expert CS tutor specializing in DSA, System Design, OS, DBMS, and Networking.

Your style:
- Clear, structured markdown responses
- Use code blocks for examples
- Give real-world analogies
- Include interview tips when relevant
- Keep explanations concise but complete
- Use headers to organize long answers
- Always end with a "Key Takeaway" section for complex topics

Format your response in clean Markdown."""

    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}
    }
    
    with httpx.Client(timeout=30) as client:
        resp = client.post(url, json=payload)
        if resp.status_code != 200:
            abort(502, description=f"Gemini API error: {resp.text}")
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]

def call_openai(prompt: str, history: list = []) -> str:
    if not settings.OPENAI_API_KEY:
        return "⚠️ OpenAI API key not configured. Add OPENAI_API_KEY to your .env file."
    
    messages = [
        {"role": "system", "content": "You are ConceptFlow AI — an expert CS tutor. Answer in clean Markdown with code examples and real-world analogies. Be concise but thorough."}
    ]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": prompt})
    
    with httpx.Client(timeout=30) as client:
        resp = client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            json={"model": "gpt-3.5-turbo", "messages": messages, "max_tokens": 2048}
        )
        if resp.status_code != 200:
            abort(502, description=f"OpenAI error: {resp.text}")
        return resp.json()["choices"][0]["message"]["content"]

@ai_bp.route("/ask", methods=["POST"])
@login_required
def ask_ai(current_user):
    data = request.json
    db = get_db()
    history = data.get("history", [])
    
    provider = data.get("model_choice", "gemini").lower()
    
    if provider == "openai" and settings.OPENAI_API_KEY:
        answer = call_openai(data.get("question"), history)
        provider = "openai"
    elif settings.GEMINI_API_KEY:
        answer = call_gemini(data.get("question"), history)
        provider = "gemini"
    elif settings.OPENAI_API_KEY:
        answer = call_openai(data.get("question"), history)
        provider = "openai"
    else:
        answer = generate_fallback_answer(data.get("question"))
        provider = "fallback"
    
    chat_entry = {
        "user_id": current_user["id"],
        "question": data.get("question"),
        "answer": answer,
        "provider": provider,
        "created_at": datetime.utcnow(),
        "saved_as_doc": False
    }
    result = db.chats.insert_one(chat_entry)
    
    return jsonify({
        "answer": answer,
        "chat_id": str(result.inserted_id),
        "provider": provider
    })

@ai_bp.route("/save-as-doc", methods=["POST"])
@login_required
def save_ai_answer_as_doc(current_user):
    data = request.json
    db = get_db()
    content = data.get("content", "")
    word_count = len(content.split())
    read_time = max(1, word_count // 200)
    
    doc = {
        "title": data.get("title"),
        "content": content,
        "summary": content[:200] + "..." if len(content) > 200 else content,
        "category": data.get("category", "Other"),
        "tags": data.get("tags", []),
        "difficulty": data.get("difficulty", "Medium"),
        "is_ai_generated": True,
        "is_public": False,
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
    return jsonify({"doc_id": str(result.inserted_id), "message": "Saved as doc!"})

@ai_bp.route("/chats", methods=["GET"])
@login_required
def get_chat_history(current_user):
    db = get_db()
    cursor = db.chats.find({"user_id": current_user["id"]}).sort("created_at", -1).limit(50)
    chats = list(cursor)
    for c in chats:
        c["id"] = str(c["_id"])
        del c["_id"]
    return jsonify({"chats": chats})

@ai_bp.route("/generate-quiz/<doc_id>", methods=["POST"])
@login_required
def generate_quiz(current_user, doc_id):
    db = get_db()
    from bson import ObjectId
    doc = db.docs.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        abort(404, description="Doc not found")
    
    prompt = f"""Based on this document, generate 5 multiple choice quiz questions in JSON format:

Title: {doc['title']}
Content: {doc['content'][:2000]}

Return ONLY valid JSON array like:
[
  {{
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": "..."
  }}
]"""
    
    if settings.GEMINI_API_KEY:
        raw = call_gemini(prompt)
    elif settings.OPENAI_API_KEY:
        raw = call_openai(prompt)
    else:
        return jsonify({"quiz": get_sample_quiz()})
    
    try:
        start = raw.find("[")
        end = raw.rfind("]") + 1
        quiz = json.loads(raw[start:end])
    except:
        quiz = get_sample_quiz()
    
    return jsonify({"quiz": quiz})

@ai_bp.route("/generate-flashcards/<doc_id>", methods=["POST"])
@login_required
def generate_flashcards(current_user, doc_id):
    db = get_db()
    from bson import ObjectId
    doc = db.docs.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        abort(404, description="Doc not found")
    
    prompt = f"""Create 5 flashcards from this document as JSON:

Title: {doc['title']}
Content: {doc['content'][:2000]}

Return ONLY valid JSON array:
[{{"front": "concept/question", "back": "explanation/answer"}}]"""
    
    if settings.GEMINI_API_KEY:
        raw = call_gemini(prompt)
    elif settings.OPENAI_API_KEY:
        raw = call_openai(prompt)
    else:
        return jsonify({"flashcards": [{"front": "What is the concept?", "back": "See the doc for details."}]})
    
    try:
        start = raw.find("[")
        end = raw.rfind("]") + 1
        cards = json.loads(raw[start:end])
    except:
        cards = [{"front": "Review needed", "back": "Could not parse flashcards"}]
    
    return jsonify({"flashcards": cards})

def generate_fallback_answer(question: str) -> str:
    return f"""## Answer (Demo Mode)

No AI API key is configured. To enable AI responses, add your **GEMINI_API_KEY** or **OPENAI_API_KEY** to the `.env` file.

**Your question was:** {question}

### To configure AI:
1. Get a free Gemini API key at [Google AI Studio](https://makersuite.google.com/)
2. Add `GEMINI_API_KEY=your_key_here` to `backend/.env`
3. Restart the server

---
*ConceptFlow AI is ready to answer your DSA and System Design questions!*"""

def get_sample_quiz():
    return [
        {
            "question": "Configure an AI API key to generate real quiz questions",
            "options": ["GEMINI_API_KEY", "OPENAI_API_KEY", "Both work", "Neither needed"],
            "correct": 2,
            "explanation": "Both Gemini and OpenAI APIs are supported"
        }
    ]
