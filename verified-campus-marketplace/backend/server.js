/**
 * Server entry
 */

require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// Connect to DB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
