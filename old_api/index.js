// Vercel Serverless Function wrapper for Express backend
// This file exports the Express app for Vercel to handle as a serverless function

const app = require('../backend/server');

// Export the Express app for Vercel
module.exports = app;
