import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pinecone } from '@pinecone-database/pinecone';
import { config, validateConfig } from './config.js';
import { getEmbedding } from './embedder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

// Simple chunking utility (character-based sliding window)
function chunkText(text, size = 1000, overlap = 200) {
  const chunks = [];
  let index = 0;
  
  while (index < text.length) {
    const chunk = text.slice(index, index + size);
    chunks.push(chunk.trim());
    index += (size - overlap);
  }
  
  return chunks;
}

async function main() {
  validateConfig();
  
  console.log('=== Starting Ingestion Pipeline ===');
  
  // 1. Ensure data directory exists and has files
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
    console.log(`[Ingest] Created '${DATA_DIR}' folder. Please place documents (.txt, .md, .json) here.`);
    
    // Create a sample document
    const samplePath = path.join(DATA_DIR, 'udyam_quickstart.txt');
    fs.writeFileSync(samplePath, `Udyam Registration Quick Start Guidelines:
1. Udyam Registration is the official portal for registering Micro, Small, and Medium Enterprises (MSMEs) in India.
2. Registration is fully online, paperless, and based on self-declaration. No documents need to be uploaded during registration.
3. Aadhaar Card of the proprietor (for proprietorships) or managing partner/director is mandatory.
4. PAN and GSTIN numbers are dynamically linked from Income Tax and GST portals. PAN is compulsory.
5. Micro Enterprises: Investment up to ₹1 Crore and Turnover up to ₹5 Crore.
6. Small Enterprises: Investment up to ₹10 Crore and Turnover up to ₹50 Crore.
7. Medium Enterprises: Investment up to ₹50 Crore and Turnover up to ₹250 Crore.
8. Registration is free. Beware of fake portals charging fees.`);
    console.log(`[Ingest] Seeded sample file: udyam_quickstart.txt`);
  }

  const files = fs.readdirSync(DATA_DIR).filter(file => 
    ['.txt', '.md', '.json'].includes(path.extname(file).toLowerCase())
  );

  if (files.length === 0) {
    console.log('[Ingest] No files found in data directory to ingest. Exiting.');
    return;
  }

  console.log(`[Ingest] Found ${files.length} document(s) to process:`, files);

  // 2. Setup Pinecone Index
  const pc = new Pinecone({ apiKey: config.pineconeApiKey });
  const indexName = config.pineconeIndexName;
  
  try {
    const indexList = await pc.listIndexes();
    const indexExists = (indexList.indexes || []).some(idx => idx.name === indexName);
    
    if (!indexExists) {
      console.log(`[Ingest] Pinecone index '${indexName}' does not exist. Attempting creation...`);
      await pc.createIndex({
        name: indexName,
        dimension: 1024, // Matches default Xenova/bge-large-en-v1.5 dimension
        metric: 'cosine',

        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      console.log('[Ingest] Index creation initiated. Waiting for activation...');
      // Wait for serverless index startup
      await new Promise(resolve => setTimeout(resolve, 8000));
    } else {
      console.log(`[Ingest] Confirmed index '${indexName}' already exists.`);
    }
  } catch (err) {
    console.error('[Ingest] Pinecone control-plane check failed:', err.message);
    console.error('Make sure your PINECONE_API_KEY supports index creation/queries.');
  }

  const index = pc.index(indexName);
  let totalChunksIngested = 0;

  // 3. Process each file
  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    console.log(`\n[Ingest] Processing file: ${file}`);
    
    let content = '';
    if (path.extname(file).toLowerCase() === '.json') {
      try {
        const jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        content = typeof jsonContent === 'object' ? JSON.stringify(jsonContent, null, 2) : String(jsonContent);
      } catch (e) {
        console.error(`[Ingest] Failed parsing JSON file: ${file}`, e.message);
        continue;
      }
    } else {
      content = fs.readFileSync(filePath, 'utf8');
    }

    const chunks = chunkText(content, 1000, 200);
    console.log(`[Ingest] Split file into ${chunks.length} text segment(s).`);

    const records = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      console.log(`[Ingest] Generating embedding for chunk ${i + 1}/${chunks.length}...`);
      const embedding = await getEmbedding(chunkText);
      
      const recordId = `${file.replace(/[^a-zA-Z0-9]/g, '_')}_chunk_${i}`;
      records.push({
        id: recordId,
        values: embedding,
        metadata: {
          text: chunkText,
          source: file,
          chunkIndex: i
        }
      });
    }

    // 4. Batch upsert to Pinecone
    if (records.length > 0) {
      console.log(`[Ingest] Uploading ${records.length} vector records to Pinecone...`);
      // Upsert in batches of 100
      const batchSize = 100;
      for (let offset = 0; offset < records.length; offset += batchSize) {
        const batch = records.slice(offset, offset + batchSize);
        await index.upsert(batch);
      }
      totalChunksIngested += records.length;
      console.log(`[Ingest] Successfully uploaded segments from ${file}.`);
    }
  }

  console.log(`\n=== Ingestion Completed. Uploaded ${totalChunksIngested} segment(s) to Pinecone! ===`);
}

main().catch(err => {
  console.error('\n❌ Ingestion Pipeline crashed:', err);
  process.exit(1);
});
