from config import settings
import os
print(f"File exists .env: {os.path.exists('.env')}")
print(f"GEMINI_API_KEY (from settings): '{settings.GEMINI_API_KEY}'")
print(f"OPENAI_API_KEY (from settings): '{settings.OPENAI_API_KEY}'")
print(f"GEMINI_API_KEY (from os.environ): '{os.environ.get('GEMINI_API_KEY')}'")
