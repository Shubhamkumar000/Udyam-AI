/**
 * Prompt Orchestration Layer.
 * Manages the composition of AI prompts, formatting guidelines, 
 * language translation constraints, and context inclusion rules.
 */

/**
 * Build the grounded RAG prompt when relevant context is retrieved.
 * @param {string} query - The user's query.
 * @param {string} context - The retrieved context.
 * @returns {string} The prompt instructions.
 */
export function buildRAGPrompt(query, context) {
  return `
You are an AI Compliance Assistant for Indian businesses.

Use the retrieved compliance context as the primary source of truth.

If the retrieved context contains the answer:
- provide a detailed response using that context
- mention important compliance rules, timelines, fees, and requirements

If the context is incomplete:
- combine the retrieved context with your general knowledge carefully
- clearly distinguish inferred/general information from retrieved information

Retrieved Context:
${context}

User Question:
${query}

Generate a professional and detailed answer.
`;
}

/**
 * Build the fallback prompt when Pinecone retrieval is weak or empty.
 * @param {string} query - The user's query.
 * @returns {string} The prompt instructions.
 */
export function buildFallbackPrompt(query) {
  return `
You are an AI Compliance Assistant for Indian businesses.

No relevant compliance documents were retrieved from the vector database.

Answer the user's question using your general knowledge.

Guidelines:
- provide practical and accurate guidance
- avoid hallucinating exact penalties or legal clauses unless confident
- clearly mention when rules may vary by state or department
- keep the answer professional and detailed

User Question:
${query}

Generate the best possible answer.
`;
}

/**
 * Combines query, context chunks, and history into a structured message array.
 * @param {string} query - The user's query.
 * @param {Array<{text: string, source: string, score: number}>} contextChunks - Retreived document text segments.
 * @param {Array<{role: string, content: string}>} [chatHistory=[]] - Historical multi-turn conversation.
 * @param {Object} [options={}] - Configurable output behaviors.
 * @param {string} [options.language='English'] - Target language for response (e.g. English, Hindi, Kannada, Telugu, Tamil).
 * @param {string} [options.tone='professional'] - Tone of reply ('professional', 'simplified', 'verbose').
 * @param {string} [mode='rag'] - Prompt mode ('rag' or 'fallback').
 * @returns {Array<{role: string, content: string}>} Array of message objects for Sarvam completions endpoint.
 */
export function compilePrompt(query, contextChunks, chatHistory = [], options = {}, mode = 'rag') {
  const language = options.language || 'English';
  const tone = options.tone || 'professional';
  
  // 1. Compile base instructions based on mode
  let instructions = '';
  if (mode === 'rag') {
    let contextContent = '';
    contextChunks.forEach((chunk, i) => {
      contextContent += `[Source ${i + 1}]: ${chunk.source} (Similarity: ${(chunk.score * 100).toFixed(1)}%)\n`;
      contextContent += `${chunk.text}\n\n`;
    });
    instructions = buildRAGPrompt(query, contextContent);
  } else {
    instructions = buildFallbackPrompt(query);
  }
  
  // Apply language constraint
  instructions += `\n\nRESPONSE LANGUAGE CONSTRAINT: You MUST respond entirely in ${language}.`;
  if (language.toLowerCase() !== 'english') {
    instructions += ` Write in the script corresponding to ${language} (e.g. Devanagari for Hindi).`;
  }
  
  // Apply tone constraint
  if (tone === 'simplified') {
    instructions += `\n\nTONE CONSTRAINT: Explain in simple terms as if speaking to a small business owner who is new to compliance. Avoid heavy legal terminology, and explain abbreviations (like NOC, FSSAI, GST) in full.`;
  } else if (tone === 'verbose') {
    instructions += `\n\nTONE CONSTRAINT: Provide a highly detailed, step-by-step advisory answer. Mention exact regulatory sections, document requirements, and possible penalty schedules or renewal timelines if applicable.`;
  } else {
    instructions += `\n\nTONE CONSTRAINT: Keep the response direct, professional, clear, and business-focused.`;
  }

  // 3. Map to final message flow
  const messages = [
    { role: 'system', content: instructions.trim() }
  ];

  // Append history for conversational continuity
  if (chatHistory && chatHistory.length > 0) {
    messages.push(...chatHistory);
  }

  // Append context-augmented user message
  messages.push({ role: 'user', content: query });

  return messages;
}

