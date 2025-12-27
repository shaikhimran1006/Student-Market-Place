/**
 * Fake Product Detector Service
 * Detects suspicious listings using AI analysis
 */

const { getJSONCompletion } = require('./aiService');
const Product = require('../../models/Product');

/**
 * Analyze a product for suspicious characteristics
 * @param {object} product - Product data to analyze
 * @param {object} marketData - Market comparison data
 * @returns {Promise<object>} - Analysis result
 */
const analyzeProduct = async (product, marketData = {}) => {
  const prompt = `
Analyze this product listing for potential fraud or suspicious characteristics:

Product Details:
- Title: ${product.title}
- Description: ${product.description}
- Price: $${product.price}
- Category: ${product.category}
- Condition: ${product.condition || 'Not specified'}

Market Context:
- Average market price for similar items: $${marketData.averagePrice || 'Unknown'}
- Price range: $${marketData.minPrice || 0} - $${marketData.maxPrice || 'Unknown'}

Analyze for:
1. Price anomalies (too low or suspiciously high)
2. Description quality (vague, copy-pasted, or misleading)
3. Common scam patterns
4. Listing completeness

Provide your analysis in JSON format:
{
  "isSuspicious": <boolean>,
  "suspicionScore": <0-100>,
  "flags": [
    {
      "type": "price" | "description" | "category" | "pattern",
      "severity": "low" | "medium" | "high",
      "description": "<explanation>"
    }
  ],
  "priceAnalysis": {
    "isAbnormal": <boolean>,
    "expectedRange": {"min": <number>, "max": <number>},
    "deviation": "<percentage from average>"
  },
  "descriptionAnalysis": {
    "qualityScore": <0-100>,
    "issues": ["<issue1>", "<issue2>"]
  },
  "recommendation": "approve" | "review" | "reject",
  "confidenceLevel": <0-100>
}`;

  try {
    const result = await getJSONCompletion(prompt, { maxTokens: 800 });
    
    if (!result) {
      return getDefaultAnalysis();
    }
    
    return {
      isFlagged: result.isSuspicious || false,
      suspicionScore: result.suspicionScore || 0,
      flags: result.flags || [],
      priceAnalysis: result.priceAnalysis || { isAbnormal: false },
      descriptionAnalysis: result.descriptionAnalysis || { qualityScore: 100, issues: [] },
      recommendation: result.recommendation || 'approve',
      confidenceLevel: result.confidenceLevel || 50,
      lastAnalyzedAt: new Date(),
    };
  } catch (error) {
    console.error('Product analysis error:', error);
    return getDefaultAnalysis();
  }
};

/**
 * Check for duplicate or similar product descriptions
 * @param {string} description - Product description to check
 * @param {string} category - Product category
 * @returns {Promise<object>} - Duplicate check result
 */
const checkForDuplicates = async (description, category, excludeProductId = null) => {
  try {
    // Find products in the same category
    const query = { category, status: 'active' };
    if (excludeProductId) {
      query._id = { $ne: excludeProductId };
    }
    
    const similarProducts = await Product.find(query)
      .select('title description _id')
      .limit(50);
    
    if (similarProducts.length === 0) {
      return {
        isDuplicate: false,
        similarProducts: [],
        similarityScore: 0,
      };
    }
    
    // Simple word matching for similarity
    const descWords = new Set(description.toLowerCase().split(/\s+/));
    const matches = [];
    
    for (const product of similarProducts) {
      const productWords = new Set(product.description.toLowerCase().split(/\s+/));
      const intersection = [...descWords].filter(word => productWords.has(word));
      const similarity = intersection.length / Math.max(descWords.size, productWords.size);
      
      if (similarity > 0.5) {
        matches.push({
          productId: product._id,
          title: product.title,
          similarityScore: Math.round(similarity * 100),
        });
      }
    }
    
    matches.sort((a, b) => b.similarityScore - a.similarityScore);
    
    return {
      isDuplicate: matches.length > 0 && matches[0].similarityScore > 80,
      similarProducts: matches.slice(0, 5),
      highestSimilarity: matches.length > 0 ? matches[0].similarityScore : 0,
    };
  } catch (error) {
    console.error('Duplicate check error:', error);
    return {
      isDuplicate: false,
      similarProducts: [],
      similarityScore: 0,
    };
  }
};

/**
 * Get market data for price comparison
 * @param {string} category - Product category
 * @param {string} title - Product title (for more accurate matching)
 * @returns {Promise<object>} - Market data
 */
const getMarketData = async (category, title = '') => {
  try {
    const stats = await Product.aggregate([
      { 
        $match: { 
          category, 
          status: 'active',
          price: { $gt: 0 }
        } 
      },
      {
        $group: {
          _id: null,
          averagePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          count: { $sum: 1 },
        },
      },
    ]);
    
    if (stats.length === 0) {
      return {
        averagePrice: null,
        minPrice: null,
        maxPrice: null,
        sampleSize: 0,
      };
    }
    
    return {
      averagePrice: Math.round(stats[0].averagePrice * 100) / 100,
      minPrice: stats[0].minPrice,
      maxPrice: stats[0].maxPrice,
      sampleSize: stats[0].count,
    };
  } catch (error) {
    console.error('Market data error:', error);
    return {
      averagePrice: null,
      minPrice: null,
      maxPrice: null,
      sampleSize: 0,
    };
  }
};

/**
 * Full product verification pipeline
 * @param {object} product - Product to verify
 * @returns {Promise<object>} - Complete analysis result
 */
const verifyProduct = async (product) => {
  try {
    // Get market data
    const marketData = await getMarketData(product.category, product.title);
    
    // Check for duplicates
    const duplicateCheck = await checkForDuplicates(
      product.description, 
      product.category,
      product._id
    );
    
    // Run AI analysis
    const aiAnalysis = await analyzeProduct(product, marketData);
    
    // Combine results
    const combinedScore = Math.max(
      aiAnalysis.suspicionScore,
      duplicateCheck.isDuplicate ? 70 : 0,
      isAbnormalPrice(product.price, marketData) ? 60 : 0
    );
    
    return {
      isFlagged: combinedScore >= 50,
      flagReason: combinedScore >= 50 
        ? generateFlagReason(aiAnalysis, duplicateCheck, product.price, marketData)
        : null,
      suspicionScore: combinedScore,
      priceAnalysis: {
        isAbnormal: isAbnormalPrice(product.price, marketData),
        marketAverage: marketData.averagePrice,
        deviation: calculateDeviation(product.price, marketData.averagePrice),
      },
      descriptionAnalysis: {
        isDuplicate: duplicateCheck.isDuplicate,
        similarProducts: duplicateCheck.similarProducts.map(p => p.productId),
        qualityScore: aiAnalysis.descriptionAnalysis?.qualityScore || 100,
      },
      recommendation: combinedScore >= 70 ? 'reject' : combinedScore >= 40 ? 'review' : 'approve',
      lastAnalyzedAt: new Date(),
    };
  } catch (error) {
    console.error('Product verification error:', error);
    return getDefaultAnalysis();
  }
};

// Helper functions
const isAbnormalPrice = (price, marketData) => {
  if (!marketData.averagePrice) return false;
  const deviation = Math.abs(price - marketData.averagePrice) / marketData.averagePrice;
  return deviation > 0.7; // More than 70% deviation
};

const calculateDeviation = (price, average) => {
  if (!average) return 0;
  return Math.round(((price - average) / average) * 100);
};

const generateFlagReason = (aiAnalysis, duplicateCheck, price, marketData) => {
  const reasons = [];
  
  if (duplicateCheck.isDuplicate) {
    reasons.push('Duplicate or very similar description found');
  }
  
  if (isAbnormalPrice(price, marketData)) {
    const deviation = calculateDeviation(price, marketData.averagePrice);
    reasons.push(`Price is ${Math.abs(deviation)}% ${deviation < 0 ? 'below' : 'above'} market average`);
  }
  
  if (aiAnalysis.flags && aiAnalysis.flags.length > 0) {
    aiAnalysis.flags.forEach(flag => {
      reasons.push(flag.description);
    });
  }
  
  return reasons.join('; ');
};

const getDefaultAnalysis = () => ({
  isFlagged: false,
  flagReason: null,
  suspicionScore: 0,
  priceAnalysis: { isAbnormal: false, marketAverage: null, deviation: 0 },
  descriptionAnalysis: { isDuplicate: false, similarProducts: [], qualityScore: 100 },
  recommendation: 'approve',
  lastAnalyzedAt: new Date(),
});

module.exports = {
  analyzeProduct,
  checkForDuplicates,
  getMarketData,
  verifyProduct,
};
