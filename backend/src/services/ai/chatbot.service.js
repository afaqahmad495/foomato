// Simple Chatbot Service using pattern matching and pre-defined responses
// Can be extended with LLM integration later

const conversationHistory = new Map(); // Store conversation context per user

const faqDatabase = [
  {
    keywords: ["hello", "hi", "hey", "greet"],
    response:
      "👋 Hello! Welcome to Foomato. How can I help you today? You can ask about orders, delivery, payments, or restaurants.",
  },
  {
    keywords: ["order", "track", "where", "status"],
    response:
      "📦 To track your order:\n1. Go to 'My Orders' in your profile\n2. Click on the order you want to track\n3. You'll see real-time delivery status and estimated arrival time\n\nDo you need help with a specific order?",
  },
  {
    keywords: ["delivery", "time", "how long", "eta"],
    response:
      "⏱️ Delivery time depends on:\n- Distance from restaurant\n- Current order volume\n- Delivery mode (pickup/delivery)\n\nYou can see the estimated time when placing your order. Real-time updates are shown in 'My Orders'.",
  },
  {
    keywords: ["payment", "card", "failed", "declined"],
    response:
      "💳 Payment Issues? Here's what to do:\n1. Check your internet connection\n2. Verify card details are correct\n3. Try a different payment method\n4. Contact your bank if the card is blocked\n\nStill having issues? Contact support@foomato.com",
  },
  {
    keywords: ["refund", "cancel", "money back"],
    response:
      "💰 Refund Policy:\n- Cancel before restaurant confirms: Full refund\n- Cancel after confirmation: Contact support\n- Refunds processed within 3-5 business days\n\nWould you like to cancel an order?",
  },
  {
    keywords: ["restaurant", "partner", "food partner", "seller"],
    response:
      "🏪 Restaurant Info:\n- Browse all restaurants on the home page\n- Filter by cuisine, ratings, or delivery time\n- Check reviews and photos\n- Save favorites for quick access\n\nWhat type of food are you looking for?",
  },
  {
    keywords: ["review", "rating", "comment", "feedback"],
    response:
      "⭐ Share Your Feedback:\n1. Go to your completed order\n2. Click 'Leave Review'\n3. Add rating and comments\n4. Your review helps other users!\n\nWould you like to rate a recent order?",
  },
  {
    keywords: ["promo", "discount", "coupon", "code"],
    response:
      "🎉 Special Offers:\n- Check the home page for daily deals\n- Look for restaurant-specific promotions\n- Subscribe to notifications for exclusive codes\n- Check your email for subscriber-only offers\n\nAny code giving you trouble?",
  },
  {
    keywords: ["help", "support", "contact", "issue", "problem"],
    response:
      "🆘 We're here to help! \n\nCommon topics:\n- Order issues? 📦\n- Payment problems? 💳\n- Delivery delays? ⏱️\n- Restaurant question? 🏪\n- Other? Please describe\n\nWhat's your issue?",
  },
  {
    keywords: ["thanks", "thank you", "appreciate", "great", "good"],
    response:
      "😊 You're welcome! We appreciate your business. Don't hesitate to reach out if you need anything else!",
  },
];

// Initialize user conversation context
function initializeUserContext(userId) {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, {
      messages: [],
      context: {},
      lastInteraction: new Date(),
    });
  }
}

// Find matching FAQ based on user query
function findMatchingFAQ(query) {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/);

  let bestMatch = null;
  let maxMatches = 0;

  for (const faq of faqDatabase) {
    let matches = 0;
    for (const keyword of faq.keywords) {
      if (words.some((word) => word.includes(keyword) || keyword.includes(word))) {
        matches++;
      }
    }

    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = faq;
    }
  }

  return bestMatch;
}

// Generate chatbot response
function generateResponse(query, userId) {
  // Initialize context if needed
  initializeUserContext(userId);

  // Find matching FAQ
  const match = findMatchingFAQ(query);

  const response = {
    message: match
      ? match.response
      : "😕 I didn't quite understand that. Can you rephrase? Or type 'help' for common topics.",
    confidence: match ? 0.8 : 0.2,
    timestamp: new Date(),
    userId,
  };

  // Store in conversation history
  const userHistory = conversationHistory.get(userId);
  userHistory.messages.push({ role: "user", content: query });
  userHistory.messages.push({ role: "bot", content: response.message });
  userHistory.lastInteraction = new Date();

  // Keep only last 20 messages
  if (userHistory.messages.length > 40) {
    userHistory.messages = userHistory.messages.slice(-40);
  }

  return response;
}

// Get conversation history for a user
function getConversationHistory(userId) {
  initializeUserContext(userId);
  return conversationHistory.get(userId);
}

// Clear conversation history (when starting new chat)
function clearConversationHistory(userId) {
  conversationHistory.delete(userId);
}

module.exports = {
  generateResponse,
  getConversationHistory,
  clearConversationHistory,
  initializeUserContext,
};
