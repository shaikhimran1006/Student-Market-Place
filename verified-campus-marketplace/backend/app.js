/**
 * Express App configuration
 */

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware');
const { initializeFirebase } = require('./config/firebase');
const { initializeAI } = require('./services/ai');

const app = express();

// Disable etag to avoid 304/empty-body cache issues in dev
app.disable('etag');

// Init external services
initializeFirebase();
initializeAI();

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// CORS
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Routes
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ name: 'Verified Campus Marketplace API', status: 'running' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
