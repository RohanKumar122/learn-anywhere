import httpx
import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
model = "gemini-1.5-flash"
# Try v1beta
url_beta = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
# Try v1
url_v1 = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={key}"

payload = {
    "contents": [{"parts": [{"text": "hi"}]}]
}

async def test():
    async with httpx.AsyncClient() as client:
        print(f"Testing v1beta with key: {key[:5]}...")
        r = await client.post(url_beta, json=payload)
        print(f"v1beta status: {r.status_code}")
        print(f"v1beta resp: {r.text[:100]}")
        
        print(f"Testing v1...")
        r = await client.post(url_v1, json=payload)
        print(f"v1 status: {r.status_code}")
        print(f"v1 resp: {r.text[:100]}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test())
