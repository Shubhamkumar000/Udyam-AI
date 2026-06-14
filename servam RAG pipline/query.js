import readline from 'readline';
import { chatRAG } from './orchestrator.js';

// Extract query from arguments
const args = process.argv.slice(2);
const commandLineQuery = args.join(' ');

async function startInteractiveSession() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const chatHistory = [];
  console.log('\n💬 UdyamAI RAG Pipeline Interactive Advisor');
  console.log('Type your compliance query. Type "exit" or "quit" to close.');
  console.log('Commands:');
  console.log('  /lang <name> - Switch output language (e.g. /lang Hindi)');
  console.log('  /tone <name> - Switch tone style (e.g. /tone simplified)\n');

  let activeLanguage = 'English';
  let activeTone = 'professional';

  const ask = () => {
    rl.question('\n👤 You: ', async (userInput) => {
      const input = userInput.trim();
      
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        console.log('Goodbye!');
        rl.close();
        return;
      }

      if (!input) {
        ask();
        return;
      }

      // Handle custom language config switch
      if (input.startsWith('/lang ')) {
        activeLanguage = input.replace('/lang ', '').trim();
        console.log(`🌐 System: Language set to '${activeLanguage}'`);
        ask();
        return;
      }

      // Handle custom tone config switch
      if (input.startsWith('/tone ')) {
        activeTone = input.replace('/tone ', '').trim();
        console.log(`🎭 System: Tone set to '${activeTone}'`);
        ask();
        return;
      }

      try {
        const start = Date.now();
        const result = await chatRAG(input, chatHistory, {
          language: activeLanguage,
          tone: activeTone
        });
        const duration = ((Date.now() - start) / 1000).toFixed(2);

        console.log(`\n🤖 UdyamAI Copilot (${duration}s) [Lang: ${activeLanguage}, Tone: ${activeTone}, Mode: ${result.mode.toUpperCase()}]:`);
        console.log(result.answer);

        console.log('\n📚 Retrieved Reference Citations:');
        if (result.context && result.context.length > 0) {
          result.context.forEach((doc, idx) => {
            console.log(`   [Source ${idx + 1}] File: ${doc.source} (Similarity: ${(doc.score * 100).toFixed(1)}%)`);
          });
        } else {
          console.log('   (No local context matched above threshold. Used fallback general knowledge.)');
        }

        // Maintain multi-turn memory
        chatHistory.push({ role: 'user', content: input });
        chatHistory.push({ role: 'assistant', content: result.answer });
        
        // Prevent history bloat (keep last 6 turns for context length)
        if (chatHistory.length > 12) {
          chatHistory.splice(0, 2);
        }

      } catch (err) {
        console.error('❌ Error during chat execution:', err.message);
      }
      ask();
    });
  };

  ask();
}

async function main() {
  if (commandLineQuery) {
    // Single prompt execution mode
    try {
      const start = Date.now();
      const result = await chatRAG(commandLineQuery, [], {
        language: 'English',
        tone: 'professional'
      });
      const duration = ((Date.now() - start) / 1000).toFixed(2);

      console.log('\n' + '='.repeat(60));
      console.log(`🔍 Retrieved Context [Mode: ${result.mode.toUpperCase()}]:`);
      result.context.forEach((doc, idx) => {
        console.log(`  [Source ${idx + 1}] ${doc.source} (Match: ${(doc.score * 100).toFixed(1)}%)`);
      });
      if (result.context.length === 0) {
        console.log('  No context matches met the confidence threshold. Using fallback mode.');
      }
      console.log('='.repeat(60));
      console.log(`🤖 UdyamAI Copilot Answer (in ${duration}s):`);
      console.log(result.answer);
      console.log('='.repeat(60) + '\n');
    } catch (err) {
      console.error('❌ Error running pipeline query:', err.message);
    }
  } else {
    // Interactive chat session mode
    await startInteractiveSession();
  }
}

main().catch(err => {
  console.error('Run failed:', err);
});
