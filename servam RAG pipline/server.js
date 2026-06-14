import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config.js';
import { chatRAG } from './orchestrator.js';

// Ensure config has all required variables before starting
validateConfig();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// GET /api/health - Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    config: {
      indexName: config.pineconeIndexName,
      embeddingModel: config.embeddingModel,
      generationModel: config.sarvamModel
    }
  });
});

// POST /api/query - Exposes the RAG retrieval and generation loop
app.post('/api/query', async (req, res, next) => {
  try {
    const { query, chatHistory, options } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'A valid "query" string is required in the request body.'
      });
    }

    const result = await chatRAG(query, chatHistory || [], options || {});

    res.json({
      success: true,
      answer: result.answer,
      mode: result.mode,
      sources: result.context.map(c => ({
        source: c.source,
        score: c.score
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[HTTP Server Error]:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'An internal server error occurred in the RAG pipeline.'
  });
});

// Start listening
const server = app.listen(config.port, () => {
  console.log(`\n🚀 UdyamAI RAG API Server is running on http://localhost:${config.port}`);
  console.log(`   - POST requests: http://localhost:${config.port}/api/query`);
  console.log(`   - Health check:  http://localhost:${config.port}/api/health\n`);
});

export default server;
