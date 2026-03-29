from flask import Blueprint, request, jsonify, abort
from datetime import datetime
from database import get_db
from auth_utils import login_required
from config import settings
import httpx
import json

ai_bp = Blueprint('ai', __name__)

def call_gemini(prompt: str, history: list = [], mode: str = "cs") -> str:
    print(f"[AI LOG] Calling Gemini (Prompt length: {len(prompt)})")
    if not settings.GEMINI_API_KEY:
        print("[AI LOG] ERROR: GEMINI_API_KEY is not configured in settings.")
        return "⚠️ Gemini API key not configured. Add GEMINI_API_KEY to your .env file."
    
    print(f"[AI LOG] Using API Key: {settings.GEMINI_API_KEY[:4]}...{settings.GEMINI_API_KEY[-4:]}")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
    
    contents = []
    for msg in history:
        contents.append({
            "role": "user" if msg["role"] == "user" else "model",
            "parts": [{"text": msg["content"]}]
        })
    contents.append({"role": "user", "parts": [{"text": prompt}]})
    
    system_prompt = (
        "You are ConceptFlow AI, a premium intellectual partner. Focus on providing high-signal, "
        "structured, and deeply insightful answers. Use Markdown for clarity, and always aim for "
        "depth and conceptual understanding."
    )
    if mode == "cs":
        system_prompt = (
            "You are ConceptFlow AI — a world-class Computer Science Architect and Educator. "
            "Master complex technical concepts through first-principles thinking, intuitive analogies, "
            "and deep-dive technical analysis. For DSA, always include time/space complexity. "
            "For System Design, focus on trade-offs. Use clear Markdown headings and tables for comparisons."
        )

    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}
    }
    
    try:
        with httpx.Client(timeout=60) as client:
            print("[AI LOG] Sending request to Gemini...")
            resp = client.post(url, json=payload)
            if resp.status_code != 200:
                print(f"[AI LOG] ERROR: Gemini API returned Status {resp.status_code}")
                print(f"[AI LOG] BODY: {resp.text}")
                return f"⚠️ Gemini API error (Status {resp.status_code}): Check terminal logs."
            data = resp.json()
            if not data.get("candidates") or not data["candidates"][0].get("content"):
                print(f"[AI LOG] ERROR: No candidates in Gemini response. Full data: {json.dumps(data)}")
                return "⚠️ Gemini returned an empty response (likely safety filter)."
            answer = data["candidates"][0]["content"]["parts"][0]["text"]
            print(f"[AI LOG] SUCCESS: Received response (Length: {len(answer)})")
            return answer
    except Exception as e:
        print(f"[AI LOG] EXCEPTION: {str(e)}")
        return f"⚠️ Connection failed: {str(e)}"

def call_openai(prompt: str, history: list = [], mode: str = "cs") -> str:
    if not settings.OPENAI_API_KEY:
        return "⚠️ OpenAI API key not configured."
    
    system_prompt = (
        "You are ConceptFlow AI, a premium intellectual partner. Focus on providing high-signal, "
        "structured, and deeply insightful answers. Use Markdown for clarity, and always aim for "
        "depth and conceptual understanding."
    )
    if mode == "cs":
        system_prompt = (
            "You are ConceptFlow AI — a world-class Computer Science Architect and Educator. "
            "Master complex technical concepts through first-principles thinking, intuitive analogies, "
            "and deep-dive technical analysis. For DSA, always include time/space complexity. "
            "For System Design, focus on trade-offs. Use clear Markdown headings and tables for comparisons."
        )
    
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": prompt})
    
    try:
        with httpx.Client(timeout=60) as client:
            resp = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={"model": "gpt-3.5-turbo", "messages": messages, "max_tokens": 2048}
            )
            if resp.status_code != 200:
                return f"⚠️ OpenAI error (Status {resp.status_code}): {resp.text[:200]}"
            return resp.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"⚠️ Connection failed: {str(e)}"

@ai_bp.route("/format", methods=["POST"])
@login_required
def format_doc(current_user):
    data = request.json
    raw_text = data.get("text", "")
    print(f"[AI LOG] Formatting request received (Input text length: {len(raw_text)})")
    
    if not raw_text:
        return jsonify({"markdown": ""})
    
    prompt = f"""
    Transform the following messy text extracted from a PDF into a professionally formatted Markdown document.
    - Use clear headings (# and ##)
    - Fix broken paragraphs and sentences
    - Use bullet points for lists
    - Include code blocks if technical concepts are found
    - Keep it concise and logical for a learning feed.
    - DO NOT add conversational filler, only output the Markdown.
    
    RAW TEXT:
    {raw_text[:8000]}
    """
    
    try:
        # We now prioritize OpenAI as requested
        print("[AI LOG] Attempting formatting with OpenAI (ChatGPT)...")
        formatted = call_openai(prompt, mode="general")
        
        # If OpenAI is not configured, fallback to Gemini
        if "not configured" in formatted and settings.GEMINI_API_KEY:
            print("[AI LOG] OpenAI not configured, falling back to Gemini...")
            formatted = call_gemini(prompt, mode="general")
            
        if formatted.startswith("⚠️"):
            print(f"[AI LOG] Formatting failed: {formatted}")
            return jsonify({"error": formatted, "description": formatted}), 400
            
        return jsonify({"markdown": formatted})
    except Exception as e:
        print(f"[AI LOG] Format Exception: {e}")
        return jsonify({"markdown": raw_text})

@ai_bp.route("/ask", methods=["POST"])
@login_required
def ask_ai(current_user):
    data = request.json
    db = get_db()
    history = data.get("history", [])
    question = data.get("question", "")
    doc_id = data.get("doc_id")
    
    # Add document context if it's a specific discussion
    if doc_id:
        from bson import ObjectId
        try:
            doc = db.docs.find_one({"_id": ObjectId(doc_id)})
            if doc:
                if not history:
                    question = f"I want to discuss this document with you.\n\nTITLE: {doc['title']}\nCONTENT: {doc['content']}\n\nMY FIRST QUESTION: {question}"
                else:
                    question = f"(Discussing Doc: {doc['title']})\n{question}"
        except:
            pass
    
    provider = data.get("model_choice", "gemini").lower()
    mode = data.get("mode", "cs").lower()
    
    if provider == "openai" and settings.OPENAI_API_KEY:
        answer = call_openai(question, history, mode)
        provider = "openai"
    elif settings.GEMINI_API_KEY:
        answer = call_gemini(question, history, mode)
        provider = "gemini"
    elif settings.OPENAI_API_KEY:
        answer = call_openai(question, history, mode)
        provider = "openai"
    else:
        answer = generate_fallback_answer(question)
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
    
    provider = request.args.get("model_choice", "gemini").lower()
    
    if provider == "openai" and settings.OPENAI_API_KEY:
        raw = call_openai(prompt)
    elif settings.GEMINI_API_KEY:
        raw = call_gemini(prompt)
    else:
        return jsonify({"quiz": get_sample_quiz()})
    
    try:
        clean_raw = raw.strip()
        if "```" in clean_raw:
            import re
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', clean_raw)
            if json_match:
                clean_raw = json_match.group(1)
        
        start = clean_raw.find("[")
        end = clean_raw.rfind("]") + 1
        if start != -1 and end != 0:
            quiz = json.loads(clean_raw[start:end])
        else:
            quiz = get_sample_quiz()
    except Exception as e:
        print(f"Error parsing quiz JSON: {str(e)}")
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
    
    provider = request.args.get("model_choice", "gemini").lower()

    if provider == "openai" and settings.OPENAI_API_KEY:
        raw = call_openai(prompt)
    elif settings.GEMINI_API_KEY:
        raw = call_gemini(prompt)
    elif settings.OPENAI_API_KEY:
        raw = call_openai(prompt)
    else:
        return jsonify({"flashcards": [{"front": "What is the concept?", "back": "See the doc for details."}]})
    
    try:
        clean_raw = raw.strip()
        if "```" in clean_raw:
            import re
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', clean_raw)
            if json_match:
                clean_raw = json_match.group(1)

        start = clean_raw.find("[")
        end = clean_raw.rfind("]") + 1
        if start != -1 and end != 0:
            cards = json.loads(clean_raw[start:end])
        else:
            cards = [{"front": "Review needed", "back": "Could not parse flashcards"}]
    except Exception as e:
        print(f"Error parsing flashcards JSON: {str(e)}")
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
