import { getEmbedding } from './embedder.js';
import { retrieve } from './retriever.js';
import { compilePrompt } from './promptOrchestrator.js';
import { generateAnswer } from './generator.js';

/**
 * Executes a full hybrid RAG (Retrieval-Augmented Generation) query cycle.
 * 
 * @param {string} query - The user's input question.
 * @param {Array<{role: string, content: string}>} [chatHistory=[]] - Optional history of conversation.
 * @param {Object} [options={}] - Configurable options for retrieval and generation.
 * @param {number} [options.topK=4] - Number of document matches to pull from Pinecone.
 * @param {number} [options.confidenceThreshold=0.75] - Confidence threshold for RAG activation.
 * @param {string} [options.language='English'] - Output language ('English', 'Hindi', etc.).
 * @param {string} [options.tone='professional'] - Reply tone style ('professional', 'simplified', 'verbose').
 * @param {string} [options.model] - Override model name for Sarvam AI.
 * @param {number} [options.temperature] - Generation temperature.
 * @returns {Promise<{answer: string, mode: string, context: Array<{text: string, source: string, score: number}>, prompt: Array<{role: string, content: string}>}>}
 */
export async function chatRAG(query, chatHistory = [], options = {}) {
  if (!query || typeof query !== 'string') {
    throw new Error('A valid query string is required for the RAG pipeline.');
  }

  console.log(`\n=== Starting Hybrid RAG Execution for: "${query}" ===`);

  // Step 1: Retrieval Phase - Get query embedding
  console.log('[Step 1/4] Generating query vector embedding...');
  const queryVector = await getEmbedding(query);

  // Step 2: Retrieval Phase - Query vector database (retrieving matches with minScore 0.0 for threshold check)
  console.log('[Step 2/4] Querying Pinecone vector store...');
  const contextChunks = await retrieve(queryVector, {
    topK: options.topK || 4,
    minScore: 0.0
  });

  // Step 3: Confidence & Mode Selection
  const CONFIDENCE_THRESHOLD = options.confidenceThreshold ?? 0.75;
  const relevantMatches = contextChunks.filter(
    m => m.score >= CONFIDENCE_THRESHOLD
  );

  const mode = relevantMatches.length > 0 ? 'rag' : 'fallback';
  console.log(`[Step 3/4] Confidence check completed. Mode: '${mode.toUpperCase()}' (Threshold: ${CONFIDENCE_THRESHOLD}, Matches above threshold: ${relevantMatches.length}/${contextChunks.length})`);

  // Step 4: Prompt Orchestration Phase - Build messages block
  const messages = compilePrompt(query, relevantMatches, chatHistory, {
    language: options.language,
    tone: options.tone
  }, mode);

  // Step 5: Generation Phase - Request response from Sarvam AI
  console.log('[Step 5/5] Sending prompt to Sarvam AI...');
  const answer = await generateAnswer(messages, {
    model: options.model,
    temperature: options.temperature
  });

  console.log('=== RAG Execution Completed ===\n');

  return {
    answer,
    mode,
    context: relevantMatches,
    prompt: messages
  };
}

