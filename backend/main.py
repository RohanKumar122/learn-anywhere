from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException
from flask_cors import CORS
from routers.auth import auth_bp
from routers.docs import docs_bp
from routers.feed import feed_bp
from routers.ai import ai_bp
from routers.revision import revision_bp
from routers.search import search_bp
from database import connect_db

app = Flask(__name__)
# Enable CORS for All Origins (similar to current FastAPI config)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(docs_bp, url_prefix="/api/docs")
app.register_blueprint(feed_bp, url_prefix="/api/feed")
app.register_blueprint(ai_bp, url_prefix="/api/ai")
app.register_blueprint(revision_bp, url_prefix="/api/revision")
app.register_blueprint(search_bp, url_prefix="/api/search")

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Flask Backend reached!"})

@app.route("/")
def root():
    return jsonify({"message": "ConceptFlow AI Flask API running"})

# Connect to DB once at module level (Flask idiomatic or via context)
connect_db()

@app.errorhandler(HTTPException)
def handle_exception(e):
    # Return JSON instead of HTML for HTTP errors
    return jsonify({
        "detail": e.description,
    }), e.code

if __name__ == "__main__":
    app.run(port=3000, debug=True)
