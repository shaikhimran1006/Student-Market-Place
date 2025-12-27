/**
 * AI Services Index
 * Central export for all AI services
 */

const aiService = require('./aiService');
const reviewAnalyzer = require('./reviewAnalyzer');
const fakeDetector = require('./fakeDetector');
const chatbot = require('./chatbot');

module.exports = {
  ...aiService,
  ...reviewAnalyzer,
  ...fakeDetector,
  chatbot,
};
