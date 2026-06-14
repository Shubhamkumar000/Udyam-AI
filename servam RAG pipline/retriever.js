import { Pinecone } from '@pinecone-database/pinecone';
import { config, validateConfig } from './config.js';

let pineconeInstance = null;

function getPineconeClient() {
  validateConfig();
  if (!pineconeInstance) {
    pineconeInstance = new Pinecone({
      apiKey: config.pineconeApiKey
    });
  }
  return pineconeInstance;
}

/**
 * Query Pinecone for relevant document chunks.
 * @param {number[]} queryEmbedding - The vector embedding of the query.
 * @param {Object} [options] - Options for retrieval.
 * @param {number} [options.topK=4] - Number of chunks to retrieve.
 * @param {number} [options.minScore=0.3] - Minimum similarity score threshold.
 * @returns {Promise<Array<{text: string, source: string, score: number}>>}
 */
export async function retrieve(queryEmbedding, options = {}) {
  const topK = options.topK || 4;
  const minScore = options.minScore || 0.3;
  
  const pc = getPineconeClient();
  
  try {
    const index = pc.index(config.pineconeIndexName);
    
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true
    });
    
    // Format matches and filter by similarity score
    const matches = (queryResponse.matches || [])
      .filter(match => match.score >= minScore)
      .map(match => ({
        text: match.metadata?.text || '',
        source: match.metadata?.source || 'Unknown Source',
        score: match.score || 0
      }));
      
    console.log(`[Retriever] Retrieved ${matches.length} matching segments from Pinecone.`);
    return matches;
  } catch (error) {
    console.error('[Retriever] Pinecone query failed:', error.message);
    throw error;
  }
}
