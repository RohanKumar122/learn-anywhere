from pymongo import MongoClient
from config import settings

client: MongoClient = None
db = None

def get_db():
    global client, db
    if db is None:
        client = MongoClient(settings.MONGODB_URL)
        db = client[settings.DB_NAME]
    return db

def connect_db():
    get_db()

def disconnect_db():
    global client
    if client:
        client.close()
