const { pipeline } = require("@xenova/transformers");

let embeddingModel = null;

// Initialize embedding model
async function initEmbeddingModel() {
  if (!embeddingModel) {
    console.log("Loading semantic search model...");
    embeddingModel = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }
  return embeddingModel;
}

// Generate embeddings for text
async function getEmbedding(text) {
  try {
    const model = await initEmbeddingModel();
    const embedding = await model(text, {
      pooling: "mean",
      normalize: true,
    });

    // Convert to array if needed
    return Array.from(embedding.data);
  } catch (error) {
    console.error("Embedding error:", error.message);
    throw error;
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

// Semantic search function
async function semanticSearch(query, foodItems) {
  try {
    const queryEmbedding = await getEmbedding(query);

    const scoredItems = foodItems
      .map((item) => ({
        ...item,
        similarity: cosineSimilarity(queryEmbedding, item.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .filter((item) => item.similarity > 0.3); // Filter low similarity results

    return scoredItems;
  } catch (error) {
    console.error("Semantic search error:", error.message);
    return [];
  }
}

// Pre-process food data with embeddings
async function processFoodItem(food) {
  try {
    const searchText = `${food.name} ${food.description}`;
    const embedding = await getEmbedding(searchText);

    return {
      ...food,
      embedding,
      searchText,
    };
  } catch (error) {
    console.error("Error processing food item:", error.message);
    return food;
  }
}

module.exports = {
  getEmbedding,
  semanticSearch,
  processFoodItem,
  cosineSimilarity,
};
