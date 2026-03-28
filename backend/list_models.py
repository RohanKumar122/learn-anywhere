import httpx
import os
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GEMINI_API_KEY")

async def test():
    async with httpx.AsyncClient() as client:
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
        r = await client.get(url)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            models = r.json()
            names = [m['name'] for m in models.get('models', [])]
            print(f"Available models: {names}")
        else:
            print(f"Resp: {r.text}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test())
