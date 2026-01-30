// Vercel Serverless Function Entry Point
// This exports the Express app for Vercel's serverless platform

const app = require('../server');

// Export the app as a serverless function
module.exports = app;
