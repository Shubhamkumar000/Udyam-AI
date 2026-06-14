import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from local .env file
dotenv.config({ path: path.join(__dirname, '.env') });

export const config = {
  sarvamApiKey: process.env.SARVAM_API_KEY,
  pineconeApiKey: process.env.PINECONE_API_KEY,
  pineconeIndexName: process.env.PINECONE_INDEX_NAME || 'udyam-compliance-index',
  embeddingModel: process.env.EMBEDDING_MODEL || 'Xenova/bge-large-en-v1.5',

  sarvamModel: process.env.SARVAM_MODEL || 'sarvam-105b',
  sarvamApiUrl: 'https://api.sarvam.ai/v1/chat/completions',
  port: parseInt(process.env.PORT || '5002', 10),
};


// Validation
export function validateConfig() {
  const missing = [];
  if (!config.sarvamApiKey) missing.push('SARVAM_API_KEY');
  if (!config.pineconeApiKey) missing.push('PINECONE_API_KEY');
  
  if (missing.length > 0) {
    console.error(`\n❌ Error: Missing required environment variables: ${missing.join(', ')}`);
    console.error(`Please copy .env.example to .env and fill in your API credentials.\n`);
    process.exit(1);
  }
}
