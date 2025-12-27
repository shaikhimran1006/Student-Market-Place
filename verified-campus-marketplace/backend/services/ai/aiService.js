/**
 * AI Service - Core AI functionality
 * Supports OpenAI and Gemini APIs
 */

const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize AI clients
let openai = null;
let gemini = null;

const initializeAI = () => {
  const hasOpenAI = process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-your');
  const hasGemini = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith('your-');

  // Initialize OpenAI if API key exists and is not placeholder
  if (hasOpenAI) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('✅ OpenAI initialized');
  }
  
  // Initialize Gemini if API key exists and is not placeholder
  if (hasGemini) {
    gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✅ Gemini AI initialized');
  }
  
  if (!openai && !gemini) {
    console.warn('⚠️ No AI API keys configured. Using mock AI responses (set OPENAI_API_KEY or GEMINI_API_KEY to enable real AI).');
  }
};

/**
 * Get AI completion from available provider
 * @param {string} prompt - The prompt to send
 * @param {object} options - Additional options
 * @returns {Promise<string>} - AI response
 */
const getCompletion = async (prompt, options = {}) => {
  const { maxTokens = 500, temperature = 0.7 } = options;
  
  // Try OpenAI first
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI error:', error.message);
      // Fall through to try Gemini
    }
  }
  
  // Try Gemini
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini error:', error.message);
    }
  }
  
  // Return mock response if no AI available
  return getMockResponse(prompt);
};

/**
 * Get JSON completion from AI
 * @param {string} prompt - The prompt to send
 * @param {object} options - Additional options
 * @returns {Promise<object>} - Parsed JSON response
 */
const getJSONCompletion = async (prompt, options = {}) => {
  const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON, no additional text.`;
  
  const response = await getCompletion(jsonPrompt, options);
  
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (error) {
    console.error('JSON parse error:', error.message);
    return null;
  }
};

/**
 * Mock response for development without AI keys
 */
const getMockResponse = (prompt) => {
  if (prompt.includes('sentiment')) {
    return JSON.stringify({
      sentiment: 'positive',
      score: 0.75,
      summary: 'Generally positive feedback with minor concerns.',
      pros: ['Good quality', 'Fast delivery', 'Value for money'],
      cons: ['Packaging could be better'],
    });
  }
  
  if (prompt.includes('fake') || prompt.includes('suspicious')) {
    return JSON.stringify({
      isSuspicious: false,
      suspicionScore: 15,
      reasons: [],
      recommendation: 'Product appears legitimate',
    });
  }
  
  if (prompt.includes('chatbot') || prompt.includes('assistant')) {
    return 'I\'m your Campus Marketplace assistant! I can help you find products, track orders, and answer questions about our platform. What would you like to know?';
  }
  
  return 'AI response placeholder';
};

module.exports = {
  initializeAI,
  getCompletion,
  getJSONCompletion,
};
