const express = require('express');
const router = express.Router();
const sentimentService = require('../services/ai/sentiment.service');
const searchService = require('../services/ai/search.service');
const chatbotService = require('../services/ai/chatbot.service');
const Comment = require('../models/comment.model');
const Food = require('../models/food.model');

// ========== SENTIMENT ANALYSIS ENDPOINTS ==========

// Analyze sentiment of a single comment
router.post('/sentiment/analyze', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const sentiment = await sentimentService.analyzeSentiment(text);

    res.json({
      success: true,
      sentiment,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Sentiment API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get sentiment analysis for a food item
router.get('/sentiment/food/:foodId', async (req, res) => {
  try {
    const { foodId } = req.params;

    // Get all comments for this food
    const comments = await Comment.find({ foodId }).select('text').lean();

    if (comments.length === 0) {
      return res.json({
        success: true,
        summary: {
          totalComments: 0,
          message: 'No comments yet',
        },
      });
    }

    // Analyze sentiments
    const texts = comments.map((c) => c.text);
    const sentiments = await sentimentService.analyzeBatchSentiments(texts);

    // Generate summary
    const summary = sentimentService.generateSentimentSummary(sentiments);

    res.json({
      success: true,
      summary,
      details: sentiments.slice(0, 10), // Return top 10 for frontend
    });
  } catch (error) {
    console.error('Sentiment API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== SEMANTIC SEARCH ENDPOINTS ==========

// Semantic search across food items
router.get('/search/semantic', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Get all foods with embeddings
    const foods = await Food.find()
      .select('name description price _id')
      .lean();

    // Process each food item if it doesn't have embedding
    const processedFoods = [];
    for (const food of foods) {
      try {
        const embedding = await searchService.getEmbedding(
          `${food.name} ${food.description}`
        );
        processedFoods.push({ ...food, embedding });
      } catch (err) {
        console.warn(`Failed to process food ${food._id}:`, err.message);
      }
    }

    // Perform semantic search
    const results = await searchService.semanticSearch(query, processedFoods);

    res.json({
      success: true,
      query,
      results: results.slice(0, parseInt(limit)),
      count: results.length,
    });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get embeddings for a specific text
router.post('/search/embedding', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const embedding = await searchService.getEmbedding(text);

    res.json({
      success: true,
      text,
      embeddingLength: embedding.length,
      // Don't return full embedding (too large), just confirm success
    });
  } catch (error) {
    console.error('Embedding API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CHATBOT ENDPOINTS ==========

// Get chatbot response
router.post('/chatbot/message', async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const response = chatbotService.generateResponse(message, userId);

    res.json({
      success: true,
      botResponse: response.message,
      confidence: response.confidence,
      timestamp: response.timestamp,
    });
  } catch (error) {
    console.error('Chatbot API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get conversation history
router.get('/chatbot/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const history = chatbotService.getConversationHistory(userId);

    res.json({
      success: true,
      messages: history.messages,
      lastInteraction: history.lastInteraction,
    });
  } catch (error) {
    console.error('Chatbot history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear conversation history
router.post('/chatbot/clear/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    chatbotService.clearConversationHistory(userId);

    res.json({
      success: true,
      message: 'Conversation history cleared',
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== HEALTH CHECK ==========

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI services are running',
    features: ['sentiment-analysis', 'semantic-search', 'chatbot'],
  });
});

module.exports = router;
