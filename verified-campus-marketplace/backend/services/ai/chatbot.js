/**
 * Chatbot Assistant Service
 * AI-powered chatbot for customer support
 */

const { getCompletion, getJSONCompletion } = require('./aiService');
const Product = require('../../models/Product');
const Order = require('../../models/Order');

// System context for the chatbot
const SYSTEM_CONTEXT = `
You are a helpful customer support assistant for the Campus Marketplace, a trusted platform for college students to buy and sell products. Your name is "Campus Assistant".

You can help with:
1. Finding products (electronics, study materials, event passes, subscriptions)
2. Order tracking and status updates
3. Return and refund policies
4. General platform questions
5. Seller inquiries

Platform Policies:
- Returns are accepted within 14 days for physical products
- Digital products are non-refundable once accessed
- Seller applications are reviewed within 48 hours
- All sellers must be verified students

Be friendly, concise, and helpful. If you don't know something, say so honestly.
`;

/**
 * Process a chat message and generate response
 * @param {string} message - User message
 * @param {object} context - Additional context (user, previous messages)
 * @returns {Promise<object>} - Chat response
 */
const processMessage = async (message, context = {}) => {
  const { userId, previousMessages = [], userRole } = context;
  
  // Detect intent
  const intent = await detectIntent(message);
  
  // Handle specific intents
  let response;
  
  switch (intent.type) {
    case 'product_search':
      response = await handleProductSearch(message, intent.params);
      break;
    case 'order_tracking':
      response = await handleOrderTracking(message, intent.params, userId);
      break;
    case 'refund_policy':
      response = await handleRefundPolicy(message);
      break;
    case 'seller_inquiry':
      response = await handleSellerInquiry(message);
      break;
    default:
      response = await handleGeneralQuery(message, previousMessages);
  }
  
  return {
    message: response.message,
    type: response.type || 'text',
    data: response.data || null,
    suggestions: response.suggestions || [],
    intent: intent.type,
  };
};

/**
 * Detect the intent of a message
 * @param {string} message - User message
 * @returns {Promise<object>} - Detected intent
 */
const detectIntent = async (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Simple keyword-based intent detection
  if (lowerMessage.includes('track') || lowerMessage.includes('order status') || lowerMessage.includes('where is my order')) {
    const orderMatch = message.match(/ORD-\w+/i);
    return {
      type: 'order_tracking',
      params: { orderNumber: orderMatch ? orderMatch[0] : null },
    };
  }
  
  if (lowerMessage.includes('refund') || lowerMessage.includes('return') || lowerMessage.includes('money back')) {
    return { type: 'refund_policy', params: {} };
  }
  
  if (lowerMessage.includes('sell') || lowerMessage.includes('become a seller') || lowerMessage.includes('seller account')) {
    return { type: 'seller_inquiry', params: {} };
  }
  
  if (lowerMessage.includes('find') || lowerMessage.includes('search') || lowerMessage.includes('looking for') || 
      lowerMessage.includes('electronics') || lowerMessage.includes('textbook') || lowerMessage.includes('study material')) {
    return {
      type: 'product_search',
      params: { query: message },
    };
  }
  
  return { type: 'general', params: {} };
};

/**
 * Handle product search queries
 */
const handleProductSearch = async (message, params) => {
  try {
    // Extract search terms
    const searchTerms = params.query
      .replace(/find|search|looking for|show me|i want|i need/gi, '')
      .trim();
    
    // Search products
    const products = await Product.find({
      $text: { $search: searchTerms },
      status: 'active',
      isPublished: true,
    })
    .select('title price category images ratings')
    .limit(5)
    .lean();
    
    if (products.length === 0) {
      return {
        message: `I couldn't find any products matching "${searchTerms}". Would you like me to search for something else?`,
        type: 'text',
        suggestions: ['Show electronics', 'Show study materials', 'Show event passes'],
      };
    }
    
    const productList = products.map(p => 
      `• ${p.title} - $${p.price} (${p.ratings?.average || 0}⭐)`
    ).join('\n');
    
    return {
      message: `I found ${products.length} product(s) matching your search:\n\n${productList}\n\nWould you like more details on any of these?`,
      type: 'product_list',
      data: products,
      suggestions: ['Show more details', 'Search for something else', 'View all products'],
    };
  } catch (error) {
    console.error('Product search error:', error);
    return {
      message: 'I had trouble searching for products. Please try again or browse our categories directly.',
      suggestions: ['Electronics', 'Study Materials', 'Event Passes', 'Subscriptions'],
    };
  }
};

/**
 * Handle order tracking queries
 */
const handleOrderTracking = async (message, params, userId) => {
  try {
    let order;
    
    if (params.orderNumber) {
      order = await Order.findOne({ orderNumber: params.orderNumber })
        .select('orderNumber status timeline items shipping createdAt')
        .lean();
    } else if (userId) {
      // Get most recent order for user
      order = await Order.findOne({ customer: userId })
        .sort({ createdAt: -1 })
        .select('orderNumber status timeline items shipping createdAt')
        .lean();
    }
    
    if (!order) {
      return {
        message: 'I couldn\'t find that order. Please provide a valid order number (e.g., ORD-2412-ABC123) or check your order history in your account.',
        type: 'text',
        suggestions: ['View my orders', 'Contact support'],
      };
    }
    
    const statusMessages = {
      'pending': 'Your order is pending confirmation.',
      'confirmed': 'Your order has been confirmed and is being processed.',
      'processing': 'Your order is being prepared for shipment.',
      'shipped': 'Your order has been shipped and is on its way!',
      'out-for-delivery': 'Your order is out for delivery today!',
      'delivered': 'Your order has been delivered.',
      'completed': 'Your order is complete.',
      'cancelled': 'Your order has been cancelled.',
    };
    
    const latestTimeline = order.timeline?.[order.timeline.length - 1];
    
    return {
      message: `📦 Order: ${order.orderNumber}\n\nStatus: ${statusMessages[order.status] || order.status}\n\n${latestTimeline ? `Latest Update: ${latestTimeline.title}\n${latestTimeline.description || ''}` : ''}\n\n${order.shipping?.trackingNumber ? `Tracking Number: ${order.shipping.trackingNumber}` : ''}`,
      type: 'order_status',
      data: order,
      suggestions: ['Track another order', 'Return policy', 'Contact seller'],
    };
  } catch (error) {
    console.error('Order tracking error:', error);
    return {
      message: 'I had trouble retrieving order information. Please try again or check your account orders page.',
      suggestions: ['View my orders', 'Contact support'],
    };
  }
};

/**
 * Handle refund policy queries
 */
const handleRefundPolicy = async (message) => {
  const policy = `📋 **Return & Refund Policy**

**Physical Products:**
• Returns accepted within 14 days of delivery
• Item must be in original condition
• Buyer pays return shipping unless item was defective
• Refund processed within 5-7 business days

**Digital Products:**
• Non-refundable once downloaded/accessed
• If file is corrupted or wrong, contact support
• Replacements available for technical issues

**Event Passes:**
• Refundable up to 24 hours before event
• 10% cancellation fee applies
• Transfer to another student is allowed

**How to Request a Return:**
1. Go to your Orders page
2. Select the order and item
3. Click "Request Return"
4. Provide reason and photos if applicable

Need help with a specific return? Let me know your order number!`;

  return {
    message: policy,
    type: 'text',
    suggestions: ['Request a return', 'Track my order', 'Contact seller'],
  };
};

/**
 * Handle seller inquiry queries
 */
const handleSellerInquiry = async (message) => {
  const info = `🏪 **Become a Seller on Campus Marketplace**

**Requirements:**
• Must be a verified student
• Valid student ID required
• Active email address

**Benefits:**
• 0% commission for first month
• Access to campus customer base
• Easy product listing tools
• Secure payments

**How to Apply:**
1. Complete your student verification
2. Go to Settings → Become a Seller
3. Fill out the application form
4. Wait for approval (usually 24-48 hours)

**What You Can Sell:**
• Electronics (new or used)
• Study materials & textbooks
• Event passes
• Digital products & subscriptions

Ready to start selling? Go to your profile settings to apply!`;

  return {
    message: info,
    type: 'text',
    suggestions: ['Apply now', 'Seller commission rates', 'Contact support'],
  };
};

/**
 * Handle general queries using AI
 */
const handleGeneralQuery = async (message, previousMessages = []) => {
  const conversationHistory = previousMessages
    .slice(-5) // Last 5 messages for context
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');
  
  const prompt = `${SYSTEM_CONTEXT}

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n\n` : ''}
User's question: ${message}

Provide a helpful, concise response:`;

  try {
    const response = await getCompletion(prompt, { maxTokens: 300 });
    
    return {
      message: response,
      type: 'text',
      suggestions: ['Search products', 'Track order', 'Contact support'],
    };
  } catch (error) {
    console.error('General query error:', error);
    return {
      message: 'I\'m here to help! You can ask me about:\n• Finding products\n• Order tracking\n• Returns & refunds\n• Selling on the platform\n\nWhat would you like to know?',
      type: 'text',
      suggestions: ['Search products', 'Track order', 'Refund policy', 'Become a seller'],
    };
  }
};

/**
 * Get suggested quick replies based on context
 */
const getQuickReplies = (context = {}) => {
  const { hasActiveOrders, isSeller, isVerifiedStudent } = context;
  
  const quickReplies = [
    'Search for products',
    'How do returns work?',
  ];
  
  if (hasActiveOrders) {
    quickReplies.unshift('Track my order');
  }
  
  if (!isSeller && isVerifiedStudent) {
    quickReplies.push('Become a seller');
  }
  
  if (isSeller) {
    quickReplies.push('Seller dashboard');
  }
  
  return quickReplies;
};

module.exports = {
  processMessage,
  detectIntent,
  getQuickReplies,
};
