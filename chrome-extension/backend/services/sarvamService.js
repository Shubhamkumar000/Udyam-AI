const axios = require('axios');

const SARVAM_API_BASE = process.env.SARVAM_API_BASE || 'https://api.sarvam.ai';
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

/**
 * Uses Sarvam AI (sarvam-m model) to analyze web form fields
 * and intelligently map them to the user's profile data.
 *
 * @param {object} params
 * @param {string} params.pageUrl - The URL of the page
 * @param {string} params.pageTitle - Page title
 * @param {Array}  params.forms - Extracted form fields from content script
 * @param {object} params.profile - User's profile data from MongoDB
 * @returns {object} fillMap: { selector -> value }
 */
async function analyzeAndMapFields({ pageUrl, pageTitle, forms, profile }) {
  // Build a clean representation of form fields for the LLM
  const formSummary = forms.flatMap(form =>
    form.fields.map(f => ({
      selector: f.selector,
      type: f.fieldType,
      label: f.labelText,
      placeholder: f.placeholder,
      name: f.name,
      id: f.id,
      ariaLabel: f.ariaLabel,
      autocomplete: f.autocomplete,
      options: f.options?.slice(0, 20), // limit for token budget
    }))
  );

  // Build profile context (only non-empty fields)
  const profileContext = Object.entries(profile)
    .filter(([, v]) => v && v.toString().trim() !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  console.log('[Sarvam] Profile context:', profileContext);
  console.log('[Sarvam] Form fields count:', formSummary.length);

  const prompt = `You are an AI assistant that helps fill web forms automatically.

PAGE URL: ${pageUrl}
PAGE TITLE: ${pageTitle}

USER PROFILE DATA:
${profileContext}

FORM FIELDS FOUND ON PAGE:
${JSON.stringify(formSummary, null, 2)}

TASK:
Analyze each form field and determine which profile data value should fill it.
Use the field's label, placeholder, name, id, autocomplete hint, and context clues from the page URL/title.

CRITICAL RULES:
1. The keys in your output MUST be the EXACT "selector" strings from the FORM FIELDS above. Do NOT invent selectors.
2. The values must come from USER PROFILE DATA. Do NOT invent data.
3. Only include fields you are confident about. Skip fields with no clear match.
4. For select/dropdown fields, use one of the available option values.
5. For date fields, use ISO format (YYYY-MM-DD).
6. For phone numbers, use the value as-is from the profile.

Return ONLY a valid JSON object, no explanation, no markdown code fences.

Example output:
{"#first_name": "Ashirwad", "input[name=email]": "ashirwad@example.com"}`;

  try {
    console.log('[Sarvam] Sending request to', `${SARVAM_API_BASE}/v1/chat/completions`);

    const response = await axios.post(
      `${SARVAM_API_BASE}/v1/chat/completions`,
      {
        model: 'sarvam-30b',
        messages: [
          {
            role: 'system',
            content: 'You are a precise form-filling assistant. You output only valid JSON, no markdown, no explanation. The JSON keys must be exact CSS selectors provided in the input.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.1, // low temperature for deterministic mapping
        reasoning_effort: null, // Disable reasoning/thinking to prevent hitting token limits or high latency
      },
      {
        headers: {
          'Authorization': `Bearer ${SARVAM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('[Sarvam] Response choices:', JSON.stringify(response.data?.choices, null, 2));

    const rawText = response.data?.choices?.[0]?.message?.content?.trim();
    console.log('[Sarvam] Raw response:', rawText);

    if (!rawText) {
      console.error('[Sarvam] Full response object:', JSON.stringify(response.data, null, 2));
      throw new Error('Sarvam AI returned empty response');
    }

    // Parse the JSON response
    const fillMap = parseJsonSafely(rawText);
    if (!fillMap || typeof fillMap !== 'object') {
      throw new Error(`Sarvam AI returned invalid JSON: ${rawText.substring(0, 200)}`);
    }

    // Helper to normalize selectors by removing quotes, backslashes, and brackets
    const normalizeSelector = (sel) => sel.replace(/['"\\\[\]]/g, '').trim().toLowerCase();

    // Map normalized selectors to original selectors
    const selectorLookup = {};
    formSummary.forEach(f => {
      selectorLookup[normalizeSelector(f.selector)] = f.selector;
    });

    const validatedMap = {};
    for (const [selector, value] of Object.entries(fillMap)) {
      const normalized = normalizeSelector(selector);
      const original = selectorLookup[normalized];
      if (original) {
        validatedMap[original] = value;
      } else {
        console.warn('[Sarvam] Discarding invalid selector from AI response:', selector);
      }
    }

    console.log('[Sarvam] Validated fill map:', JSON.stringify(validatedMap));
    return validatedMap;
  } catch (err) {
    if (err.response) {
      console.error('[Sarvam] API error:', err.response.status, JSON.stringify(err.response.data));
      throw new Error(`Sarvam AI API error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
}

function parseJsonSafely(text) {
  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  // Extract first JSON object
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;

  // 1. Clean any backslashes from closing key quotes before a colon (e.g. \": -> ":)
  let normalizedJsonString = match[0].replace(/\\+":/g, '":');

  // 2. Clean/normalize data-formfill-id selectors inside the JSON string to prevent syntax errors
  normalizedJsonString = normalizedJsonString.replace(
    /\[data-formfill-id=\\?["']?(ff-\d+-\d+-\d+)\\?["']?\]/g,
    '[data-formfill-id=$1]'
  );

  try {
    return JSON.parse(normalizedJsonString);
  } catch (e) {
    console.error('[Sarvam JSON parse error]:', e.message);
    // Try original match as a fallback
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

module.exports = { analyzeAndMapFields };
