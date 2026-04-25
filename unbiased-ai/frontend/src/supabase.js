import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const createNoopSupabaseClient = () => {
  const chainable = {
    select: () => chainable,
    eq: () => chainable,
    order: () => chainable,
    limit: () => chainable,
    delete: () => chainable,
    insert: () => chainable,
    then: (resolve) => resolve({ data: [], error: null })
  };
  return {
    functions: {
      invoke: async () => ({
        data: null,
        error: { message: 'Supabase is not configured', status: 503 },
      }),
    },
    from: () => chainable,
  };
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createNoopSupabaseClient();

const apiHeaders = {
  'Content-Type': 'application/json',
};

const formatError = (status, message) => {
  if (status === 500) {
    return `Backend Error: ${message || 'API request failed. Check Supabase logs.'}`;
  }
  if (status === 503) {
    return message || 'Backend unavailable. Configure Supabase to enable live analysis.';
  }
  if (status === 429) {
    return 'High traffic detected. Retrying request...';
  }
  if (status >= 400) {
    return `Error (${status}): ${message || 'Request failed'}`;
  }
  return message || 'Unknown error occurred';
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sanitizeJsonString = (value = '') => value.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

const parseJsonResponse = (value, fallback = {}) => {
  const cleaned = sanitizeJsonString(value);
  if (!cleaned) return fallback;

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse AI response');
  }
};

const buildMockAnalysis = (text = '') => ({
  biasScore: 0.32,
  confidence: 0.87,
  biasTypes: {
    gender: 0.22,
    racial: 0.18,
    political: 0.41,
    age: 0.16,
    cultural: 0.27,
    socioeconomic: 0.19,
  },
  biases: [
    {
      type: 'political',
      text: text.substring(0, 80) || 'Sample excerpt',
      explanation: 'The wording leans toward a broad adversarial framing instead of verifiable description.',
      confidence: 0.78,
      suggestion: 'Replace absolute claims with sourced, specific statements.',
      counterVector: 'A neutral framing would separate opinion, evidence, and attribution.',
      corroboratingTruth: 'Claims with loaded wording are more likely to be perceived as partisan.',
    },
  ],
  summary: 'Simulation mode is active because live AI services are not fully configured. The response shape matches the production pipeline so the demo remains usable.',
  severity: 'medium',
  propheticVector: 'Repeated use of loaded phrasing can increase polarization and reduce trust.',
  objectiveRefraction: text ? text.replace(/\b(always|never|all|none)\b/gi, 'often') : 'Provide a neutral rewrite here.',
  neuralSignature: Math.random().toString(36).substring(2, 18).padEnd(16, '0').slice(0, 16),
});

const normalizeAnalysisResponse = (data, originalText = '') => {
  const normalized = data || {};
  return {
    biasScore: typeof normalized.biasScore === 'number' ? normalized.biasScore : 0,
    confidence: typeof normalized.confidence === 'number' ? normalized.confidence : 0.8,
    biasTypes: normalized.biasTypes || {},
    biases: Array.isArray(normalized.biases) ? normalized.biases : [],
    summary: normalized.summary || 'Analysis completed.',
    severity: normalized.severity || 'medium',
    propheticVector: normalized.propheticVector || '',
    objectiveRefraction: normalized.objectiveRefraction || '',
    rewritten: normalized.rewritten || normalized.rewrittenText || normalized.objectiveRefraction || '',
    rewriteExplanation: normalized.rewriteExplanation || normalized.explanation || '',
    neuralSignature: normalized.neuralSignature || Math.random().toString(36).substring(2, 18).padEnd(16, '0').slice(0, 16),
    original_text: normalized.original_text || originalText,
    crossReferences: normalized.crossReferences || [],
  };
};

export const api = {
  async call(functionName, payload = {}, retries = 3, backoff = 1000) {
    if (!isSupabaseConfigured) {
      return { error: 'Backend unavailable. Configure Supabase to enable live analysis.', status: 503 };
    }

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
        headers: apiHeaders,
      });

      if (error) {
        if (retries > 0 && (error.status === 429 || error.status >= 500)) {
          const waitTime = backoff * (4 - retries);
          await delay(waitTime);
          return this.call(functionName, payload, retries - 1, backoff);
        }

        const formattedMsg = formatError(error.status || 500, error.message);
        return { error: formattedMsg, status: error.status };
      }

      return data;
    } catch (err) {
      if (retries > 0) {
        const waitTime = backoff * (4 - retries);
        await delay(waitTime);
        return this.call(functionName, payload, retries - 1, backoff);
      }
      return { error: err.message, status: 500 };
    }
  },

  async analyzeText(payload, options = {}) {
    const text = typeof payload === 'string' ? payload : payload.text;

    try {
      const geminiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!geminiKey || geminiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        return normalizeAnalysisResponse(buildMockAnalysis(text), text);
      }

      const prompt = `You are the Sovereign Neural Engine. Analyze the following discourse for systemic, implicit, and institutional bias across gender, racial, political, age, cultural, and socioeconomic vectors.

INPUT DATA:
"""
${text}
"""

RESPOND ONLY WITH A PURE JSON OBJECT:
{
  "biasScore": <number 0.0 to 1.0>,
  "confidence": <number 0.0 to 1.0>,
  "biasTypes": {
    "gender": <0-1>, "racial": <0-1>, "political": <0-1>, "age": <0-1>, "cultural": <0-1>, "socioeconomic": <0-1>
  },
  "biases": [
    {
      "type": "gender|racial|political|age|cultural|socioeconomic",
      "text": "<exact string from input>",
      "explanation": "<logical analysis of the bias vector>",
      "confidence": <0-1>,
      "suggestion": "<unbiased alternative phrase>",
      "counterVector": "<An opposing perspective>",
      "corroboratingTruth": "<A factual data point>"
    }
  ],
  "summary": "<2-3 sentence executive summary>",
  "severity": "low|medium|high|critical",
  "propheticVector": "<Prediction of impact>",
  "objectiveRefraction": "<Surgically rewritten version>",
  "neuralSignature": "<16-char hex proof>"
}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 3000, topP: 0.95 },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return normalizeAnalysisResponse(parseJsonResponse(data.candidates?.[0]?.content?.parts?.[0]?.text), text);
    } catch {
      const fallback = await this.call('analyze', typeof payload === 'string' ? { text: payload, ...options } : { ...payload, ...options });
      if (fallback?.error) {
        return normalizeAnalysisResponse(buildMockAnalysis(text), text);
      }
      return normalizeAnalysisResponse(fallback?.data || fallback, text);
    }
  },

  async detectBias(content, type = 'text') {
    try {
      const geminiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!geminiKey || geminiKey === 'YOUR_GEMINI_API_KEY_HERE') throw new Error('No key');

      const prompt = `Analyze this ${type} for bias. Respond with a brief JSON object containing score (0-1) and primary bias type.
      
      CONTENT:
      """
      ${content}
      """`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
        }),
      });

      if (!response.ok) throw new Error('API failed');
      const data = await response.json();
      return parseJsonResponse(data.candidates?.[0]?.content?.parts?.[0]?.text, {});
    } catch {
      return this.call('detect-bias', { content, type });
    }
  },

  async rewriteUnbiased(text, biasTypes = []) {
    try {
      const geminiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!geminiKey || geminiKey === 'YOUR_GEMINI_API_KEY_HERE') throw new Error('No key');

      const prompt = `Rewrite this text to be completely neutral and unbiased, addressing these vectors: ${biasTypes.join(', ')}.
      
      TEXT:
      """
      ${text}
      """
      
      Respond only with the rewritten text.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) throw new Error('API failed');
      const data = await response.json();
      const rewritten = sanitizeJsonString(data.candidates?.[0]?.content?.parts?.[0]?.text || text);
      return { rewritten, rewrittenText: rewritten, explanation: 'Generated directly by Gemini.' };
    } catch {
      const fallback = await this.call('rewrite', { text, biasTypes });
      if (fallback?.error) {
        return {
          rewritten: text,
          rewrittenText: text,
          explanation: 'Live rewrite is unavailable. Showing the original text to avoid losing user input.',
        };
      }
      return {
        rewritten: fallback?.rewritten || fallback?.rewrittenText || fallback?.data?.rewritten || fallback?.data?.rewrittenText || text,
        rewrittenText: fallback?.rewrittenText || fallback?.rewritten || fallback?.data?.rewrittenText || fallback?.data?.rewritten || text,
        explanation: fallback?.explanation || fallback?.data?.explanation || 'Rewritten via backend service.',
      };
    }
  },

  async compareTexts(textA, textB) {
    try {
      const geminiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!geminiKey || geminiKey === 'YOUR_GEMINI_API_KEY_HERE') throw new Error('No key');

      const prompt = `Compare these two texts for bias.
      
      TEXT A:
      """
      ${textA}
      """
      
      TEXT B:
      """
      ${textB}
      """
      
      Respond with a JSON object comparing their scores and identifying the less biased one.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1000 },
        }),
      });

      if (!response.ok) throw new Error('API failed');
      const data = await response.json();
      return parseJsonResponse(data.candidates?.[0]?.content?.parts?.[0]?.text, {});
    } catch {
      return this.call('compare', { textA, textB });
    }
  },

  async getSystemHealth() {
    return this.call('monitoring', { action: 'health' });
  },

  async getSystemMetrics() {
    return this.call('monitoring', { action: 'metrics' });
  },

  async exportGDPRData() {
    return this.call('gdpr', { action: 'export' });
  },

  async deleteGDPRData() {
    return this.call('gdpr', { action: 'erasure' });
  },

  async getHistory(userId) {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },

  async saveAnalysis(analysis) {
    if (!isSupabaseConfigured) {
      return analysis;
    }
    const { data, error } = await supabase.from('analyses').insert([analysis]).select();
    if (error) throw error;
    return data[0];
  },
};
