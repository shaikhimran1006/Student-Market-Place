/**
 * Review Analyzer Service
 * Analyzes product reviews for sentiment, pros/cons extraction
 */

const { getJSONCompletion, getCompletion } = require('./aiService');

/**
 * Analyze a single review for sentiment
 * @param {string} reviewText - The review text to analyze
 * @returns {Promise<object>} - Sentiment analysis result
 */
const analyzeReviewSentiment = async (reviewText) => {
  const prompt = `
Analyze the following product review and provide sentiment analysis:

Review: "${reviewText}"

Provide your analysis in the following JSON format:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "sentimentScore": <number between -1 (very negative) and 1 (very positive)>,
  "summary": "<brief 1-sentence summary>",
  "extractedPros": ["<pro1>", "<pro2>"],
  "extractedCons": ["<con1>", "<con2>"],
  "isSpam": <boolean>,
  "spamScore": <number between 0 and 1>
}`;

  try {
    const result = await getJSONCompletion(prompt);
    
    if (!result) {
      return getDefaultSentimentResult();
    }
    
    return {
      sentiment: result.sentiment || 'neutral',
      sentimentScore: result.sentimentScore || 0,
      summary: result.summary || 'Unable to analyze review.',
      extractedPros: result.extractedPros || [],
      extractedCons: result.extractedCons || [],
      isSpam: result.isSpam || false,
      spamScore: result.spamScore || 0,
      analyzedAt: new Date(),
    };
  } catch (error) {
    console.error('Review sentiment analysis error:', error);
    return getDefaultSentimentResult();
  }
};

/**
 * Summarize multiple reviews for a product
 * @param {Array} reviews - Array of review objects
 * @returns {Promise<object>} - Review summary
 */
const summarizeProductReviews = async (reviews) => {
  if (!reviews || reviews.length === 0) {
    return {
      overallSentiment: 'neutral',
      summary: 'No reviews available yet.',
      pros: [],
      cons: [],
      keyHighlights: [],
      recommendationRate: 0,
    };
  }
  
  const reviewTexts = reviews.map((r, i) => 
    `Review ${i + 1} (Rating: ${r.rating}/5): ${r.content}`
  ).join('\n\n');
  
  const prompt = `
Analyze these product reviews and provide a comprehensive summary:

${reviewTexts}

Provide your analysis in the following JSON format:
{
  "overallSentiment": "positive" | "negative" | "neutral" | "mixed",
  "summary": "<2-3 sentence summary of overall customer feedback>",
  "pros": ["<top 3-5 frequently mentioned positives>"],
  "cons": ["<top 3-5 frequently mentioned negatives>"],
  "keyHighlights": ["<notable points from reviews>"],
  "recommendationRate": <estimated percentage of customers who would recommend, 0-100>,
  "averageSentimentScore": <number between -1 and 1>
}`;

  try {
    const result = await getJSONCompletion(prompt, { maxTokens: 800 });
    
    if (!result) {
      return getDefaultReviewSummary(reviews);
    }
    
    return {
      overallSentiment: result.overallSentiment || 'neutral',
      summary: result.summary || 'Review summary unavailable.',
      pros: result.pros || [],
      cons: result.cons || [],
      keyHighlights: result.keyHighlights || [],
      recommendationRate: result.recommendationRate || 50,
      averageSentimentScore: result.averageSentimentScore || 0,
      reviewCount: reviews.length,
      averageRating: calculateAverageRating(reviews),
      analyzedAt: new Date(),
    };
  } catch (error) {
    console.error('Review summarization error:', error);
    return getDefaultReviewSummary(reviews);
  }
};

/**
 * Compare reviews for multiple products
 * @param {Array} productsWithReviews - Array of {productName, reviews[]}
 * @returns {Promise<object>} - Comparison analysis
 */
const compareProductReviews = async (productsWithReviews) => {
  if (!productsWithReviews || productsWithReviews.length < 2) {
    return {
      comparison: 'Need at least 2 products to compare.',
      winner: null,
    };
  }
  
  const comparisonData = productsWithReviews.map(p => ({
    name: p.productName,
    avgRating: calculateAverageRating(p.reviews),
    reviewCount: p.reviews.length,
    sampleReviews: p.reviews.slice(0, 3).map(r => r.content),
  }));
  
  const prompt = `
Compare these products based on their reviews:

${JSON.stringify(comparisonData, null, 2)}

Provide your comparison in the following JSON format:
{
  "comparison": "<detailed comparison paragraph>",
  "winner": "<product name with best overall reviews>",
  "rankings": [
    {"product": "<name>", "rank": 1, "highlights": ["<key points>"]},
    ...
  ],
  "comparisonTable": {
    "quality": {"<product1>": "<rating>", "<product2>": "<rating>"},
    "value": {"<product1>": "<rating>", "<product2>": "<rating>"},
    "customerSatisfaction": {"<product1>": "<rating>", "<product2>": "<rating>"}
  }
}`;

  try {
    const result = await getJSONCompletion(prompt, { maxTokens: 1000 });
    return result || { comparison: 'Unable to generate comparison.', winner: null };
  } catch (error) {
    console.error('Review comparison error:', error);
    return { comparison: 'Error generating comparison.', winner: null };
  }
};

// Helper functions
const calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};

const getDefaultSentimentResult = () => ({
  sentiment: 'neutral',
  sentimentScore: 0,
  summary: 'Unable to analyze review.',
  extractedPros: [],
  extractedCons: [],
  isSpam: false,
  spamScore: 0,
  analyzedAt: new Date(),
});

const getDefaultReviewSummary = (reviews) => ({
  overallSentiment: 'neutral',
  summary: 'Review analysis unavailable.',
  pros: [],
  cons: [],
  keyHighlights: [],
  recommendationRate: 50,
  averageSentimentScore: 0,
  reviewCount: reviews.length,
  averageRating: calculateAverageRating(reviews),
  analyzedAt: new Date(),
});

module.exports = {
  analyzeReviewSentiment,
  summarizeProductReviews,
  compareProductReviews,
};
