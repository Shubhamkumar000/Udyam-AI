import { config, validateConfig } from './config.js';

/**
 * Interface with Sarvam AI Chat Completion API.
 * @param {Array<{role: string, content: string}>} messages - The message array (system, user, assistant).
 * @param {Object} [options] - Generation options.
 * @param {string} [options.model] - The Sarvam model name override.
 * @param {number} [options.temperature] - Temperature value.
 * @returns {Promise<string>} The AI generated reply.
 */
export async function generateAnswer(messages, options = {}) {
  validateConfig();
  
  const model = options.model || config.sarvamModel;
  const temperature = options.temperature ?? 0.2;
  
  console.log(`[Generator] Initiating completion request using Sarvam model '${model}'...`);
  
  try {
    const response = await fetch(config.sarvamApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': config.sarvamApiKey
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    
    if (!reply) {
      throw new Error('Sarvam AI returned an empty response choices payload.');
    }
    
    return reply.trim();
  } catch (error) {
    console.error('[Generator] Sarvam AI generation failed:', error.message);
    throw error;
  }
}
