// Vercel Serverless Function Entry Point
// This properly wraps the Express app for Vercel's serverless platform

// Set environment to production for Vercel
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const app = require('../server');

// Export the Express app directly
// Vercel's @vercel/node runtime will handle the conversion to serverless
module.exports = app;
