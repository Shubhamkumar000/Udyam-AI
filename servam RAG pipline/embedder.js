import { pipeline } from '@xenova/transformers';
import { config } from './config.js';

let extractorInstance = null;

// Lazy-load the extraction pipeline
async function getExtractor() {
  if (!extractorInstance) {
    console.log(`[Embedder] Loading local ONNX embedding model '${config.embeddingModel}'...`);
    console.log(`[Embedder] Note: This may take a few moments on first run to download model files.`);
    extractorInstance = await pipeline('feature-extraction', config.embeddingModel);
    console.log('[Embedder] Embedding model loaded successfully!');
  }
  return extractorInstance;
}

/**
 * Generate a vector embedding for a given text.
 * @param {string} text - The input text to embed.
 * @returns {Promise<number[]>} Embedding array
 */
export async function getEmbedding(text) {
  try {
    const extractor = await getExtractor();
    const output = await extractor(text, {
      pooling: 'mean',
      normalize: true
    });
    
    // Convert ONNX Tensor/Float32Array to standard JavaScript array
    return Array.from(output.data);
  } catch (error) {
    console.error('[Embedder] Failed to generate embedding:', error);
    throw error;
  }
}
