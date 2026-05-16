# Foomato AI Implementation Guide

## Overview
This guide covers the implementation of three AI features:
1. **Review Sentiment Analysis** - Analyzes food reviews and provides sentiment insights
2. **Semantic Search** - Natural language food search with AI embeddings
3. **AI Chatbot** - 24/7 customer support assistant

---

## 📦 Installation & Setup

### Step 1: Install Backend Dependencies

Open your terminal and navigate to the backend directory:

```bash
cd backend
```

Install the required AI/ML packages:

```bash
npm install @xenova/transformers langchain
```

**What these packages do:**
- `@xenova/transformers` - Runs transformer models directly in Node.js (no server needed)
- `langchain` - Framework for building with LLMs (optional, can be used later for advanced chatbot features)

### Step 2: Verify Backend Structure

The backend should now have this structure:
```
backend/src/
├── services/ai/
│   ├── sentiment.service.js      (Review analysis)
│   ├── search.service.js         (Semantic search)
│   └── chatbot.service.js        (AI chatbot)
├── routes/
│   └── ai.routes.js              (API endpoints)
└── app.js                        (Updated with AI routes)
```

### Step 3: Start the Backend

```bash
cd backend
npm run dev
```

The AI services will auto-initialize on first use. You'll see messages like:
```
Loading sentiment analysis model...
Loading semantic search model...
```

**Note:** First initialization takes ~30-60 seconds as models are downloaded.

---

## 🎨 Frontend Integration

### Step 1: Add Components to Your App

Import and use the three AI components in your app:

#### 1. **Add Chatbot to Main App**

In `frontend/src/App.jsx`:

```jsx
import ChatBot from './components/ChatBot';

function App() {
  return (
    <div className="App">
      {/* Your existing app content */}
      <ChatBot />  {/* Floating chat widget */}
    </div>
  );
}
```

#### 2. **Add Sentiment Analysis to Food Details**

In `frontend/src/Pages/genrel/Comments.jsx` or food detail page:

```jsx
import SentimentAnalysis from '../../components/SentimentAnalysis';

export default function Comments({ foodId }) {
  return (
    <div>
      <SentimentAnalysis foodId={foodId} />
      {/* Your existing comments code */}
    </div>
  );
}
```

#### 3. **Add Semantic Search to Home**

In `frontend/src/Pages/genrel/Home.jsx`:

```jsx
import SemanticSearch from '../../components/SemanticSearch';

export default function Home() {
  const [searchResults, setSearchResults] = useState([]);

  return (
    <div>
      <SemanticSearch onResults={setSearchResults} />
      {/* Display searchResults or existing food grid */}
    </div>
  );
}
```

---

## 📡 API Endpoints Reference

### Sentiment Analysis APIs

**Analyze sentiment of comment text:**
```http
POST /api/ai/sentiment/analyze
Content-Type: application/json

{
  "text": "This burger was absolutely delicious and fresh!"
}

Response:
{
  "success": true,
  "sentiment": {
    "label": "positive",
    "score": 0.9876,
    "text": "This burger was absolutely delicious and fresh!"
  }
}
```

**Get sentiment summary for a food item:**
```http
GET /api/ai/sentiment/food/:foodId

Response:
{
  "success": true,
  "summary": {
    "totalComments": 45,
    "positive": 38,
    "negative": 4,
    "neutral": 3,
    "positivePercentage": "84.44",
    "negativePercentage": "8.89",
    "averageScore": "0.856",
    "rating": "Good 👍"
  }
}
```

### Semantic Search APIs

**Search foods semantically:**
```http
GET /api/ai/search/semantic?query=spicy chicken&limit=10

Response:
{
  "success": true,
  "query": "spicy chicken",
  "results": [
    {
      "_id": "...",
      "name": "Spicy Chicken Tikka",
      "description": "Tender chicken marinated in spices...",
      "price": 299,
      "similarity": 0.89
    },
    ...
  ],
  "count": 8
}
```

### Chatbot APIs

**Get chatbot response:**
```http
POST /api/ai/chatbot/message
Content-Type: application/json

{
  "message": "How do I track my order?",
  "userId": "user123"
}

Response:
{
  "success": true,
  "botResponse": "📦 To track your order:\n1. Go to 'My Orders' in your profile\n2. Click on the order you want to track\n3. You'll see real-time delivery status...",
  "confidence": 0.8,
  "timestamp": "2026-05-13T10:30:00Z"
}
```

**Get conversation history:**
```http
GET /api/ai/chatbot/history/:userId

Response:
{
  "success": true,
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "bot", "content": "👋 Hello! How can I help?" },
    ...
  ],
  "lastInteraction": "2026-05-13T10:30:00Z"
}
```

---

## 🧪 Testing the Features

### 1. Test Sentiment Analysis

```javascript
// In browser console
fetch('/api/ai/sentiment/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'This food is amazing!' })
})
.then(r => r.json())
.then(d => console.log(d))
```

### 2. Test Semantic Search

```javascript
// Get food item first to test
fetch('/api/ai/search/semantic?query=pizza&limit=5')
  .then(r => r.json())
  .then(d => console.log(d))
```

### 3. Test Chatbot

```javascript
fetch('/api/ai/chatbot/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    message: 'How do I track my order?',
    userId: 'testuser'
  })
})
.then(r => r.json())
.then(d => console.log(d))
```

---

## ⚙️ Configuration

### Model Selection

The services use these pre-trained models:

**Sentiment Analysis:**
- Model: `Xenova/distilbert-base-uncased-finetuned-sst-2-english`
- Size: ~268MB
- Accuracy: ~93%

**Semantic Search:**
- Model: `Xenova/all-MiniLM-L6-v2`
- Size: ~90MB
- Embedding dimension: 384

**Chatbot:**
- Uses pattern matching + predefined responses (no LLM required)
- Can be upgraded to use LLMs later

### Environment Variables (Optional)

Create `.env` in backend root:

```env
# Optional: Add for advanced features
OPENAI_API_KEY=sk-...          # For future GPT integration
VECTOR_DB_URL=...              # For Pinecone/Weaviate later
```

---

## 🚀 Performance Tips

1. **First Load:** Models download on first use (~30-60 seconds)
   - Subsequent requests use cached models
   - Add loading spinner to UX

2. **Batch Processing:** For multiple comments, use batch API:
   ```javascript
   // Send multiple texts for analysis
   const comments = ['Great!', 'Not good', 'Amazing'];
   ```

3. **Caching:** Results are cached in memory
   - Clear cache if updating models: `node -e "delete require.cache[require.resolve('./path/to/model')]"`

4. **Model Size:** 
   - Total ~360MB downloaded initially
   - Future requests use cache

---

## 🔄 Future Enhancements

### Phase 2 Features:
1. **Dynamic Pricing** - Analyze demand and suggest prices
2. **Order Time Prediction** - ML model for delivery ETAs
3. **Fraud Detection** - Flag suspicious orders

### Phase 3 Features:
1. **Advanced Chatbot** - Integrate GPT-4 for natural conversation
2. **Personalization** - Recommendation engine
3. **Food Image Moderation** - Auto-detect inappropriate images

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@xenova/transformers'"
**Solution:**
```bash
cd backend
npm install @xenova/transformers
```

### Issue: "Model download fails / takes too long"
**Solution:**
- Check internet connection
- Models auto-retry on next request
- Clear cache: `rm -rf ~/.transformers_cache` (Mac/Linux)

### Issue: "ChatBot not appearing on frontend"
**Solution:**
- Verify ChatBot component is imported in App.jsx
- Check if fixed positioning conflicts with existing CSS
- Adjust z-index if needed

### Issue: "Search returns no results"
**Solution:**
- Ensure foods have names and descriptions
- Model needs ~10 foods minimum for good results
- Try simpler search terms first

---

## 📊 Monitoring

### Check AI Service Health
```javascript
fetch('/api/ai/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

Response:
```json
{
  "success": true,
  "message": "AI services are running",
  "features": ["sentiment-analysis", "semantic-search", "chatbot"]
}
```

---

## 📝 Next Steps

1. ✅ Install dependencies
2. ✅ Start backend (`npm run dev`)
3. ✅ Add ChatBot component to App.jsx
4. ✅ Add SentimentAnalysis to food pages
5. ✅ Add SemanticSearch to home page
6. ✅ Test all endpoints
7. 🎯 Deploy to production
8. 📈 Monitor usage and collect feedback

---

## 📞 Support

For issues or questions:
- Check API endpoints above
- Review error messages in browser console
- Verify backend is running on `http://localhost:5000`
- Ensure CORS is enabled in app.js

---

**Happy AI-powered development! 🤖**
