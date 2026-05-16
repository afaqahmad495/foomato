# System Architecture & Flow Diagrams

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                           │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   ChatBot 💬   │  │   Sentiment 📊  │  │  Search 🔍  │  │
│  │    Widget      │  │    Display      │  │  Component  │  │
│  └────────┬───────┘  └────────┬────────┘  └────────┬────┘  │
└───────────┼───────────────────┼───────────────────┼────────┘
            │                   │                   │
            ▼                   ▼                   ▼
      ┌──────────────────────────────────────────────────┐
      │         FRONTEND (React + Vite)                   │
      │  ┌─────────────────────────────────────────────┐ │
      │  │  API Calls to Backend (fetch/axios)        │ │
      │  └────────────────────┬───────────────────────┘ │
      └─────────────────────────┼──────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  HTTP/JSON Requests  │
                    │  Port: 5000 (local)  │
                    └───────────┬───────────┘
                                │
      ┌─────────────────────────▼───────────────────────┐
      │      BACKEND (Node.js + Express)                │
      │  ┌──────────────────────────────────────────┐   │
      │  │  /api/ai/chatbot/message                │   │
      │  │  /api/ai/sentiment/analyze              │   │
      │  │  /api/ai/sentiment/food/:id             │   │
      │  │  /api/ai/search/semantic                │   │
      │  │  /api/ai/chatbot/history/:id            │   │
      │  └─────────┬────────────────────────────────┘   │
      │            │                                    │
      │  ┌─────────▼──────────────────────────────────┐ │
      │  │    AI Services Layer                     │ │
      │  │  ┌────────┐  ┌────────┐  ┌─────────────┐│ │
      │  │  │Sentiment│  │ Search │  │  Chatbot   ││ │
      │  │  │Service  │  │Service │  │  Service   ││ │
      │  │  └────┬───┘  └───┬────┘  └─────┬──────┘│ │
      │  │       │          │             │       │ │
      │  │  ┌────▼──────────▼─────────────▼────┐  │ │
      │  │  │  @xenova/transformers Library    │  │ │
      │  │  │  • DistilBERT (sentiment)        │  │ │
      │  │  │  • MiniLM (embeddings)           │  │ │
      │  │  │  • Model Caching                 │  │ │
      │  │  └──────────────────────────────────┘  │ │
      │  └─────────────────────────────────────────┘ │
      │            │                                 │
      │  ┌─────────▼─────────────────────────────┐   │
      │  │  MongoDB (optional)                   │   │
      │  │  • Food Collection                    │   │
      │  │  • Comments Collection                │   │
      │  │  • User Data                          │   │
      │  └───────────────────────────────────────┘   │
      └─────────────────────────────────────────────┘
```

---

## 📊 Data Flow - Sentiment Analysis

```
User reads food comments
        │
        ▼
    Food Detail Page
   (SentimentAnalysis.jsx)
        │
        ▼
GET /api/ai/sentiment/food/:foodId
        │
        ▼
  sentiment.service.js
   (Backend)
        │
        ├─► Fetch all comments from DB
        │
        ├─► For each comment, run through:
        │       DistilBERT Model
        │       └─► positive/negative/neutral
        │
        ├─► Calculate Statistics:
        │   • Count sentiments
        │   • Calculate percentages
        │   • Average score
        │
        ▼
Return: {
  totalComments: 45,
  positive: 38,
  negative: 4,
  neutral: 3,
  rating: "Good 👍"
}
        │
        ▼
Display on UI:
  • Bar chart
  • Stats cards
  • Overall rating
```

---

## 🔍 Data Flow - Semantic Search

```
User types: "spicy chicken"
        │
        ▼
SemanticSearch Component
        │
        ▼
GET /api/ai/search/semantic?query=spicy chicken
        │
        ▼
search.service.js
        │
        ├─► Get query embedding:
        │   "spicy chicken" → [0.23, 0.45, -0.12, ...]
        │
        ├─► Get all foods from DB
        │   For each food:
        │   ├─► Generate: food_name + description
        │   ├─► Get embedding via MiniLM model
        │   │   "Spicy Chicken Tikka..." → [0.21, 0.46, -0.11, ...]
        │   └─► Calculate cosine similarity
        │       Result: 0.89 (89% match)
        │
        ├─► Sort by similarity (highest first)
        │
        ├─► Filter (only show > 30% similarity)
        │
        ▼
Return top 10 results:
[
  { name: "Spicy Chicken Tikka", similarity: 0.89 },
  { name: "Chicken Curry", similarity: 0.76 },
  { name: "Spicy Biryani", similarity: 0.71 },
  ...
]
        │
        ▼
Display with relevance bars
```

---

## 💬 Data Flow - Chatbot

```
User sends: "How do I cancel my order?"
        │
        ▼
ChatBot Component
   (User ID: from localStorage)
        │
        ▼
POST /api/ai/chatbot/message
   { message: "How do I cancel my order?", userId: "123" }
        │
        ▼
chatbot.service.js
        │
        ├─► Initialize user context (if first message)
        │
        ├─► Search FAQ Database:
        │   Keywords: ["cancel", "order"]
        │   ↓
        │   Finds matching FAQ entry:
        │   "cancel", "money back", "refund"
        │
        ├─► Return predefined response:
        │   "💰 Refund Policy:
        │    - Cancel before restaurant confirms: Full refund
        │    - Cancel after confirmation: Contact support..."
        │
        ├─► Store in conversation history:
        │   {
        │     userId: "123",
        │     messages: [
        │       { role: "user", content: "How do I cancel?" },
        │       { role: "bot", content: "💰 Refund Policy..." }
        │     ]
        │   }
        │
        ▼
Return response + confidence
        │
        ▼
Display in ChatBot widget with timestamp
```

---

## 🔗 Component Dependencies

```
App.jsx
  │
  ├─► ChatBot.jsx ─────► /api/ai/chatbot/message
  │                      /api/ai/chatbot/history/:id
  │
  ├─► Home.jsx
  │   └─► SemanticSearch.jsx ─► /api/ai/search/semantic
  │
  └─► FoodDetail.jsx
      └─► SentimentAnalysis.jsx ─► /api/ai/sentiment/food/:id
```

---

## 📁 File Organization

```
foomato/
├── backend/
│   └── src/
│       ├── services/
│       │   └── ai/
│       │       ├── sentiment.service.js   (Sentiment logic)
│       │       ├── search.service.js      (Search logic)
│       │       └── chatbot.service.js     (Chat logic)
│       │
│       ├── routes/
│       │   └── ai.routes.js               (API endpoints)
│       │
│       └── app.js                         (Register routes)
│
└── frontend/
    └── src/
        ├── components/
        │   ├── ChatBot.jsx                (Chat widget)
        │   ├── ChatBot.css
        │   ├── SentimentAnalysis.jsx      (Sentiment display)
        │   ├── SentimentAnalysis.css
        │   ├── SemanticSearch.jsx         (Search widget)
        │   └── SemanticSearch.css
        │
        ├── Pages/
        │   ├── genrel/
        │   │   ├── Home.jsx               (Add SemanticSearch)
        │   │   └── Comments.jsx           (Add SentimentAnalysis)
        │   │
        │   └── food-partner/
        │       └── (existing files)
        │
        └── App.jsx                        (Add ChatBot)
```

---

## 🔄 Request/Response Flow

### Example: Sentiment Analysis Request

```
FRONTEND                           BACKEND
    │                                 │
    │──────► GET /api/ai/sentiment────►│
    │        /food/60d5ec49c1d2e      │
    │                                 │
    │                           ┌─────▼─────┐
    │                           │ Find food  │
    │                           │ comments   │
    │                           └─────┬─────┘
    │                                 │
    │                           ┌─────▼────────────┐
    │                           │ Analyze each     │
    │                           │ sentiment via    │
    │                           │ DistilBERT      │
    │                           └─────┬────────────┘
    │                                 │
    │                           ┌─────▼────────────┐
    │                           │ Generate summary │
    │                           │ statistics       │
    │                           └─────┬────────────┘
    │                                 │
    │◄──────────────────────────────────
    │ {success: true, summary: {...}}
    │
    ├──► Update UI with:
    │    • Sentiment bars
    │    • Stats cards
    │    • Rating emoji
    │
    └─► Display to user
```

---

## 🎯 Model Initialization Timeline

```
Backend Startup
    │
    ├─► First API request (any AI endpoint)
    │   │
    │   ├─► Check if model cached locally
    │   │   └─► NO → Download from Hugging Face (~30-60s)
    │   │       └─► Save to local cache
    │   │
    │   └─► Load model into memory (~5-10s)
    │       └─► Ready for requests
    │
    └─► Subsequent requests
        └─► Use cached model (<500ms response)
```

---

## 🌐 API Endpoint Map

```
/api/ai/
├── /health
│   └─► GET → Check service status
│
├── /sentiment/
│   ├─► POST /analyze → Single comment analysis
│   │   └─ Body: { text: "..." }
│   │
│   └─► GET /food/:foodId → Food sentiment summary
│       └─ Query params: none
│
├── /search/
│   ├─► GET /semantic → Semantic search
│   │   └─ Query: ?query=...&limit=10
│   │
│   └─► POST /embedding → Get text embedding
│       └─ Body: { text: "..." }
│
└── /chatbot/
    ├─► POST /message → Get bot response
    │   └─ Body: { message: "...", userId: "..." }
    │
    ├─► GET /history/:userId → Chat history
    │   └─ Params: userId
    │
    └─► POST /clear/:userId → Clear history
        └─ Params: userId
```

---

## 💾 Data Storage

```
MongoDB (if configured):
├── foods
│   ├── _id
│   ├── name
│   ├── description
│   ├── price
│   └── (embedding stored here if using persistent storage)
│
├── comments
│   ├── _id
│   ├── foodId → foods._id
│   ├── userId → users._id
│   ├── text
│   └── (sentiment can be stored here)
│
└── orders
    ├── _id
    ├── foodId
    ├── userId
    └── status

In-Memory Cache (Node.js):
├── Loaded AI Models
│   ├── DistilBERT (sentiment)
│   └── MiniLM (embeddings)
│
└── Conversation History
    └── conversationHistory Map
        ├── userId1 → [messages...]
        ├── userId2 → [messages...]
        └── ...
```

---

## ⚡ Performance Optimization

```
Request comes in
    │
    ├─► Check if model loaded in memory
    │   └─► YES → Use it
    │   └─► NO → Load from disk cache
    │       └─► Still NO → Download (~30-60s)
    │
    ├─► Process AI task
    │   └─► Sentiment: ~200-500ms
    │   └─► Search: ~100-300ms
    │   └─► Chatbot: ~50-100ms
    │
    ├─► Cache result if applicable
    │
    └─► Return response
        └─► ~500ms (with cached model)
        └─► 30-60s (first request, model download)
```

---

## 🔐 Security Considerations

```
Frontend                          Backend
│                                 │
├─► User Input                    │
│   ├─ Sanitize text              │
│   ├─ Validate length            │
│   └─ Check for injection        │
│                                 │
└─► Send to /api/ai/*─────────►   │
                              ├─► CORS Check ✓
                              ├─► Input validation
                              ├─► Rate limiting (optional)
                              ├─► AI model processing
                              └─► Return results
                                  │
                              └──► Frontend receives
                                   ├─ Sanitized response
                                   └─ Display to user
```

---

## 📈 Scaling Roadmap

```
Phase 1: ✅ COMPLETE
├── Single-model deployment
├── In-memory caching
└── Basic APIs

Phase 2: Optional
├── Load balancing
├── Redis caching
├── Model optimization
└── Database persistence

Phase 3: Optional  
├── Microservices
├── Model serving (TensorFlow Serving)
├── Async job queue (Bull/RabbitMQ)
└── Advanced monitoring
```

---

**This architecture is modular, scalable, and ready for production! 🚀**
