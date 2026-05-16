const { pipeline } = require("@xenova/transformers");

let sentimentClassifier = null;

// Initialize the sentiment analysis model
async function initSentimentModel() {
  if (!sentimentClassifier) {
    console.log("Loading sentiment analysis model...");
    sentimentClassifier = await pipeline(
      "sentiment-analysis",
      "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
    );
  }
  return sentimentClassifier;
}

// Analyze sentiment of comment text
async function analyzeSentiment(text) {
  try {
    const classifier = await initSentimentModel();
    const result = await classifier(text, {
      truncate: true,
    });

    if (!result || result.length === 0) {
      throw new Error("No sentiment result");
    }

    // Convert to standardized format
    const sentiment = result[0];
    return {
      label: sentiment.label.toLowerCase(), // "positive" or "negative"
      score: sentiment.score,
      text: text.substring(0, 500), // Limit text length
    };
  } catch (error) {
    console.error("Sentiment analysis error:", error.message);
    return {
      label: "neutral",
      score: 0.5,
      text: text.substring(0, 500),
      error: error.message,
    };
  }
}

// Batch analyze multiple comments
async function analyzeBatchSentiments(comments) {
  const results = [];
  for (const comment of comments) {
    const sentiment = await analyzeSentiment(comment);
    results.push(sentiment);
  }
  return results;
}

// Generate summary of sentiments
function generateSentimentSummary(sentiments) {
  const positive = sentiments.filter((s) => s.label === "positive").length;
  const negative = sentiments.filter((s) => s.label === "negative").length;
  const neutral = sentiments.filter((s) => s.label === "neutral").length;
  const total = sentiments.length;

  const avgScore =
    sentiments.reduce((acc, s) => acc + s.score, 0) / total || 0;

  return {
    totalComments: total,
    positive,
    negative,
    neutral,
    positivePercentage: ((positive / total) * 100).toFixed(2),
    negativePercentage: ((negative / total) * 100).toFixed(2),
    averageScore: avgScore.toFixed(3),
    rating:
      positive > negative ? "Good 👍" : negative > positive ? "Poor 👎" : "Mixed 😐",
  };
}

module.exports = {
  analyzeSentiment,
  analyzeBatchSentiments,
  generateSentimentSummary,
};
