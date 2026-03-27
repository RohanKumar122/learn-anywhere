"""
Run: python seed.py
Seeds the database with sample DSA and System Design content
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

MONGODB_URL = "mongodb://localhost:27017"
DB_NAME = "conceptflow"

SAMPLE_DOCS = [
    {
        "title": "Binary Search — The Complete Guide",
        "category": "DSA",
        "difficulty": "Easy",
        "tags": ["binary-search", "arrays", "searching"],
        "read_time_minutes": 5,
        "summary": "Master binary search: intuition, templates, and real interview patterns.",
        "content": """# Binary Search — The Complete Guide

## What Is It?
Binary search is an algorithm that finds a target value in a **sorted array** by repeatedly halving the search space.

**Time Complexity:** O(log n)  
**Space Complexity:** O(1)

## The Core Idea (Real World Analogy)
Imagine finding a word in a dictionary. You don't start from page 1 — you open the middle, decide left or right, and repeat. That's binary search.

## Template (Never Get It Wrong Again)

```python
def binary_search(nums: list, target: int) -> int:
    left, right = 0, len(nums) - 1
    
    while left <= right:
        mid = left + (right - left) // 2  # Avoid overflow
        
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1  # Not found
```

## When To Use Binary Search
- Array is sorted (or can be treated as sorted)
- You need O(log n) search
- Finding boundaries (first/last occurrence)
- "Minimize/maximize" problems with a feasibility function

## Common Interview Patterns

### 1. Find First/Last Occurrence
```python
def first_occurrence(nums, target):
    left, right = 0, len(nums) - 1
    result = -1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            result = mid
            right = mid - 1  # Keep searching left
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return result
```

### 2. Search in Rotated Array
Key insight: One half is always sorted.
```python
def search_rotated(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[left] <= nums[mid]:  # Left half sorted
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:  # Right half sorted
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1
    return -1
```

## Key Takeaway
> Binary search = eliminate half the search space each step. Master the template, then learn to apply it on non-obvious problems (answer spaces, matrix search, etc.)

**Top Interview Problems:** LC 704, 33, 34, 74, 153, 162, 875
""",
    },
    {
        "title": "System Design: URL Shortener (TinyURL)",
        "category": "System Design",
        "difficulty": "Medium",
        "tags": ["system-design", "hashing", "databases", "caching"],
        "read_time_minutes": 8,
        "summary": "Design a URL shortening service like TinyURL. Covers encoding, DB schema, caching, and scale.",
        "content": """# System Design: URL Shortener (TinyURL)

## Clarify Requirements First (Always Do This)

**Functional:**
- Given a URL → return short URL
- Given short URL → redirect to original
- Custom aliases (optional)
- Expiry (optional)

**Non-Functional:**
- 100M URLs/day (write)
- 10:1 read:write ratio → 1B reads/day
- Low latency reads (<10ms)
- URLs never lost (durability)
- Short URLs: ~7 chars

## High Level Design

```
Client → API Gateway → App Server → DB
                              ↓
                           Cache (Redis)
```

## The Core Problem: URL Encoding

### Option 1: MD5 Hash (Bad)
```
md5("https://google.com") → "1bc29b36f623ba82aaf6724fd3b16718"
Take first 7 chars → "1bc29b3"
```
Problem: Collisions possible!

### Option 2: Base62 Encoding (Good ✅)
```
Characters: a-z (26) + A-Z (26) + 0-9 (10) = 62
7 chars = 62^7 = ~3.5 trillion URLs
```

```python
import string
BASE62 = string.ascii_letters + string.digits

def encode(num: int) -> str:
    result = []
    while num > 0:
        result.append(BASE62[num % 62])
        num //= 62
    return ''.join(reversed(result))
```

Use an **auto-increment ID** → encode to Base62.

## Database Schema

```sql
urls (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  short_code  VARCHAR(10) UNIQUE INDEX,
  original    TEXT NOT NULL,
  user_id     BIGINT,
  created_at  TIMESTAMP,
  expires_at  TIMESTAMP NULL,
  click_count BIGINT DEFAULT 0
)
```

## Caching Strategy

- Store hot URLs in **Redis** (LRU eviction)
- Cache hit ratio ~80% for popular URLs
- Cache: `short_code → original_url`

## Scale Estimates

| Metric | Value |
|--------|-------|
| Writes/day | 100M |
| Writes/sec | ~1,200 |
| Reads/sec | ~12,000 |
| Storage/5yr | ~5TB |

## Key Takeaway
> URL shortener = ID generation + Base62 encoding + Redis caching. The hard parts are: avoiding collisions at scale, and handling the thundering herd on viral URLs.

**Follow-up Questions Interviewers Love:**
- How do you handle custom aliases?
- What if two users shorten the same URL?
- How do you prevent abuse/spam?
""",
    },
    {
        "title": "Dynamic Programming: 0/1 Knapsack",
        "category": "DSA",
        "difficulty": "Hard",
        "tags": ["dp", "knapsack", "optimization", "recursion"],
        "read_time_minutes": 7,
        "summary": "Complete guide to 0/1 Knapsack — recursion → memoization → tabulation → space optimization.",
        "content": """# Dynamic Programming: 0/1 Knapsack

## The Problem
Given `n` items each with a `weight` and `value`, and a bag with capacity `W` — maximize value without exceeding capacity.

**You can't split items (0/1 — take it or leave it).**

## Why DP?
- Naive recursion: O(2^n) — exponential
- DP: O(n × W) — polynomial

## Step 1: Recursive Solution (Build Intuition First)

```python
def knapsack_recursive(weights, values, W, n):
    # Base case
    if n == 0 or W == 0:
        return 0
    
    # If item too heavy, skip it
    if weights[n-1] > W:
        return knapsack_recursive(weights, values, W, n-1)
    
    # Max of: include item OR exclude item
    include = values[n-1] + knapsack_recursive(weights, values, W - weights[n-1], n-1)
    exclude = knapsack_recursive(weights, values, W, n-1)
    
    return max(include, exclude)
```

## Step 2: Memoization (Top-Down DP)

```python
def knapsack_memo(weights, values, W, n, memo={}):
    if (n, W) in memo:
        return memo[(n, W)]
    if n == 0 or W == 0:
        return 0
    if weights[n-1] > W:
        result = knapsack_memo(weights, values, W, n-1, memo)
    else:
        include = values[n-1] + knapsack_memo(weights, values, W - weights[n-1], n-1, memo)
        exclude = knapsack_memo(weights, values, W, n-1, memo)
        result = max(include, exclude)
    
    memo[(n, W)] = result
    return result
```

## Step 3: Tabulation (Bottom-Up DP)

```python
def knapsack_dp(weights, values, W, n):
    # dp[i][w] = max value using first i items, capacity w
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    
    for i in range(1, n + 1):
        for w in range(W + 1):
            # Don't take item i
            dp[i][w] = dp[i-1][w]
            # Take item i (if it fits)
            if weights[i-1] <= w:
                dp[i][w] = max(dp[i][w], values[i-1] + dp[i-1][w - weights[i-1]])
    
    return dp[n][W]
```

## Step 4: Space Optimization (1D Array)

```python
def knapsack_optimized(weights, values, W, n):
    dp = [0] * (W + 1)
    
    for i in range(n):
        # MUST iterate right to left to avoid using item twice
        for w in range(W, weights[i] - 1, -1):
            dp[w] = max(dp[w], values[i] + dp[w - weights[i]])
    
    return dp[W]
```

## Key Takeaway
> Every DP problem: define state → write recurrence → optimize. For knapsack: `dp[i][w] = max value with i items and capacity w`. Space optimize by going 1D + reverse iteration.

**Related Problems:** Subset Sum, Partition Equal Subset Sum (LC 416), Target Sum (LC 494)
""",
    },
    {
        "title": "Redis vs Kafka — When To Use What",
        "category": "System Design",
        "difficulty": "Medium",
        "tags": ["redis", "kafka", "caching", "messaging", "system-design"],
        "read_time_minutes": 6,
        "summary": "Clear comparison of Redis and Kafka with real-world use cases, interview-ready answers.",
        "content": """# Redis vs Kafka — When To Use What

## The One-Line Summary

| | Redis | Kafka |
|--|-------|-------|
| **Type** | In-memory data store + cache | Distributed event streaming |
| **Use for** | Fast reads, caching, sessions | Event pipelines, async processing |
| **Analogy** | A whiteboard (fast, temporary) | A conveyor belt (ordered, durable) |

## Redis Deep Dive

### What Is It?
Redis = **RE**mote **DI**ctionary **S**erver. Stores data in memory with optional persistence.

### Core Data Structures
```
String:  SET user:1:name "Rohan"
Hash:    HSET user:1 name "Rohan" age 25
List:    LPUSH notifications "msg1" "msg2"
Set:     SADD online_users "user:1"
ZSet:    ZADD leaderboard 1500 "user:1"  ← Sorted!
```

### When To Use Redis
✅ Session storage (JWT token cache)  
✅ Rate limiting (sliding window counter)  
✅ Leaderboards (sorted sets)  
✅ Pub/Sub for real-time notifications  
✅ Cache for DB queries  
✅ Distributed locks  

### Limitation
❌ Data is lost on crash (unless persistence configured)  
❌ Not designed for high-throughput event streaming  

## Kafka Deep Dive

### What Is It?
Kafka = distributed **commit log**. Producers write events; consumers read at their own pace.

```
Producer → [Topic: orders] → Consumer Group A (payment service)
                           → Consumer Group B (inventory service)
                           → Consumer Group C (analytics)
```

### Why Kafka Is Special
- **Retention**: Messages stored for days/weeks (replay!)
- **Throughput**: Millions of messages/second
- **Ordering**: Guaranteed within a partition
- **Fault tolerant**: Replication across brokers

### When To Use Kafka
✅ Event sourcing (audit trail)  
✅ Microservices communication (decoupled)  
✅ Real-time analytics pipeline  
✅ CDC (Change Data Capture from DB)  
✅ Log aggregation  

### Limitation
❌ Overkill for simple caching  
❌ Higher operational complexity  

## Interview Answer Template

> *"Redis is my go-to for caching, session management, and anything requiring sub-millisecond reads. Kafka is for event-driven architectures where I need reliable, ordered, replayable message delivery between services. In a ride-sharing app, I'd use Redis to cache driver locations (high read, low latency) and Kafka to stream ride events to billing, notifications, and analytics services."*

## Key Takeaway
> **Redis = Speed + Simplicity. Kafka = Scale + Reliability.**  
> They complement each other — many systems use both.
""",
    },
    {
        "title": "OS: Processes vs Threads",
        "category": "OS",
        "difficulty": "Easy",
        "tags": ["os", "processes", "threads", "concurrency"],
        "read_time_minutes": 4,
        "summary": "Clear explanation of processes vs threads with diagrams and interview-ready answers.",
        "content": """# OS: Processes vs Threads

## Process
A **process** is a running program with its own isolated memory space.

```
Process A                Process B
┌──────────────┐         ┌──────────────┐
│ Code Segment │         │ Code Segment │
│ Data Segment │         │ Data Segment │
│ Heap         │         │ Heap         │
│ Stack        │         │ Stack        │
│ File handles │         │ File handles │
└──────────────┘         └──────────────┘
   Isolated!                Isolated!
```

## Thread
A **thread** is a lightweight unit of execution within a process. Threads **share** memory.

```
Process
┌─────────────────────────────┐
│ Code Segment (shared)       │
│ Data Segment (shared)       │
│ Heap (shared)               │
│ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │Stack1│ │Stack2│ │Stack3│ │ ← Each thread has own stack
│ └──────┘ └──────┘ └──────┘ │
└─────────────────────────────┘
```

## Key Differences

| | Process | Thread |
|--|---------|--------|
| Memory | Separate | Shared |
| Creation | Slow (fork) | Fast |
| Communication | IPC needed | Shared memory |
| Crash impact | Isolated | Kills all threads |
| Context switch | Expensive | Cheap |

## Real World Example

**Web Browser:**
- Each tab = separate **process** (crash isolation)
- Each tab has multiple **threads** (rendering, JS engine, network)

**Web Server (Node.js vs Java):**
- Node.js: Single-threaded + event loop
- Java Tomcat: Thread per request (or thread pool)

## Interview Answer

> *"A process is an isolated execution environment with its own memory space. A thread lives within a process and shares memory with other threads. Processes are safer (crashes don't affect others) but heavier. Threads are lighter and communicate easily but require synchronization (mutex, semaphore) to avoid race conditions."*

## Key Takeaway
> Process = isolation. Thread = efficiency. Choose based on whether you need safety (process) or speed + shared state (thread).
""",
    },
]

async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    
    # Check if already seeded
    count = await db.docs.count_documents({"is_public": True})
    if count > 0:
        print(f"✅ Already seeded ({count} public docs found). Skipping.")
        client.close()
        return
    
    # Create a system user for public content
    system_user = await db.users.find_one({"email": "system@conceptflow.ai"})
    if not system_user:
        from passlib.context import CryptContext
        pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
        result = await db.users.insert_one({
            "name": "ConceptFlow",
            "email": "system@conceptflow.ai",
            "password": pwd.hash("system-password-not-for-login"),
            "created_at": datetime.utcnow(),
        })
        system_id = str(result.inserted_id)
    else:
        system_id = str(system_user["_id"])
    
    # Insert docs
    docs_to_insert = []
    for doc in SAMPLE_DOCS:
        word_count = len(doc["content"].split())
        docs_to_insert.append({
            **doc,
            "owner_id": system_id,
            "owner_name": "ConceptFlow",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "read_time_minutes": doc.get("read_time_minutes", max(1, word_count // 200)),
            "view_count": 0,
            "personal_notes": [],
            "is_published": True,
            "is_public": True,
            "is_ai_generated": False,
        })
    
    result = await db.docs.insert_many(docs_to_insert)
    print(f"✅ Seeded {len(result.inserted_ids)} docs")
    
    # Create text index for search
    await db.docs.create_index([("title", "text"), ("content", "text"), ("tags", "text")])
    print("✅ Created text indexes")
    
    client.close()
    print("\n🎉 Database seeded! Run the server and start learning.\n")

if __name__ == "__main__":
    asyncio.run(seed())
