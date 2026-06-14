# Sarvam AI + Pinecone RAG Pipeline

An intelligent, Indic-language-ready Retrieval-Augmented Generation (RAG) pipeline designed for corporate and MSME compliance advisory.

---

## System Architecture

```
                       ┌────────────────────────┐
                       │   Local Documents      │
                       │   (.txt, .md, .json)   │
                       └───────────┬────────────┘
                                   │ (Read/Parse)
                                   ▼
                       ┌────────────────────────┐
                       │   Chunking Engine      │
                       └───────────┬────────────┘
                                   │ (Text Segments)
                                   ▼
                       ┌────────────────────────┐
                       │  ONNX Embedding model  │ (Runs locally via
                       │ (Xenova/all-MiniLM-L6) │  @xenova/transformers)
                       └───────────┬────────────┘
                                   │ (384-dim Vectors)
                                   ▼
                       ┌────────────────────────┐
                       │  Pinecone Vector DB    │ (Index Storage)
                       └───────────┬────────────┘
                                   ▲
                                   │ (Semantic Query Search)
 ┌──────────────┐      ┌───────────┴────────────┐
 │  User Input  ├─────▶│  Pipeline Orchestrator │
 └──────────────┘      └───────────┬────────────┘
                                   │ (Augmented Prompt Messages)
                                   ▼
                       ┌────────────────────────┐
                       │     Sarvam AI LLM      │ (Text Generation
                       │     (sarvam-105b)      │  via Chat Completions)
                       └───────────┬────────────┘
                                   │
                                   ▼
                       ┌────────────────────────┐
                       │  Multi-Turn Response   │ (Console Reply)
                       └────────────────────────┘
```

The pipeline uses a **modular architecture** with strict separation of concerns:
- **`embedder.js`**: Generates text embeddings locally using ONNX runtime, removing third-party API dependencies or model usage costs for vectorization.
- **`retriever.js`**: Handles vector queries and filters outputs from Pinecone index.
- **`promptOrchestrator.js`**: Manages prompt composition, formats references, maps conversation memory, and enforces tone/language constraints.
- **`generator.js`**: Interfaces directly with the Sarvam AI completions API.
- **`orchestrator.js`**: Coordinates the retrieval, prompt compilation, and text generation phases.

---

## Quick Start

### 1. Setup Environment
First, clone or change directory to `servam RAG pipline`, copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Open `.env` and enter your API credentials:
```env
SARVAM_API_KEY=your_sarvam_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=udyam-compliance-index
```

### 2. Create your Pinecone Index
Ensure you have created a Pinecone vector index in your Pinecone console:
- **Index Name**: Matching `PINECONE_INDEX_NAME` (e.g. `udyam-compliance-index`)
- **Dimensions**: **384** (the output dimension of the local `all-MiniLM-L6-v2` model)
- **Metric**: **Cosine**

*Note: If the index does not exist, the ingestion script will automatically try to request serverless AWS creation.*

### 3. Run Ingestion Pipeline
Put your reference files (`.txt`, `.md`, or `.json` documents) in the `data/` directory. If the `data/` directory doesn't exist or is empty, the script will automatically create a sample file `udyam_quickstart.txt`.

Run the ingestion tool to chunk your data, generate embeddings, and upsert them to Pinecone:
```bash
npm run ingest
```

### 4. Execute RAG Queries
You can run query calls in three modes:

#### HTTP API Server Mode
Start the web server to expose the RAG pipeline as an HTTP API:
```bash
npm start
```

Once running, you can send `POST` requests to `http://localhost:5002/api/query`. Here is a sample `curl` command:
```bash
curl -X POST http://localhost:5002/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the turnover limit for Small Enterprises?",
    "chatHistory": [],
    "options": {
      "language": "Hindi",
      "tone": "simplified"
    }
  }'
```


#### One-Shot CLI Mode
Query directly from the terminal by passing the question as arguments:
```bash
npm run query "What is the turnover threshold for a Small Enterprise?"
```

#### Interactive Chat Mode
Run without arguments to start an interactive chat session with multi-turn memory:
```bash
npm run query
```

Inside the interactive chat shell:
- Type your question and hit **Enter** to see the response along with retrieved citations.
- Type `/lang <Language>` to change the reply language (e.g., `/lang Hindi` or `/lang Tamil`).
- Type `/tone <Tone>` to change the tone constraint (e.g., `/tone simplified` or `/tone verbose`).
- Type `exit` or `quit` to end the session.

