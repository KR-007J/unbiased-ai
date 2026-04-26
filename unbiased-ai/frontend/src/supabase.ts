import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';

const supabaseUrl = import.meta.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.REACT_APP_SUPABASE_ANON_KEY;

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
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
      const headers = {
        ...apiHeaders,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
        headers,
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
    const fallback = await this.call('analyze', typeof payload === 'string' ? { text: payload, ...options } : { ...payload, ...options });
    
    if (fallback?.error) {
      return normalizeAnalysisResponse(buildMockAnalysis(text), text);
    }
    return normalizeAnalysisResponse(fallback?.data || fallback, text);
  },

  async streamAnalyze(payload, onChunk) {
    if (!isSupabaseConfigured) throw new Error('Supabase not configured');
    
    const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
    const response = await fetch(`${import.meta.env.REACT_APP_SUPABASE_URL}/functions/v1/analyze`, {
      method: 'POST',
      headers: {
        ...apiHeaders,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...payload, stream: true }),
    });

    if (!response.ok) throw new Error(`Stream failed: ${response.statusText}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      // Gemini SSE can have multiple data: lines in one chunk
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            fullText += content;
            onChunk(fullText);
          } catch (e) {
            console.error('Error parsing stream chunk', e);
          }
        }
      }
    }
    
    return parseJsonResponse(fullText);
  },

  async detectBias(content, type = 'text') {
    return this.call('detect-bias', { content, type });
  },

  async rewriteUnbiased(text, biasTypes = []) {
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
  },

  async compareTexts(textA, textB) {
    return this.call('compare', { textA, textB });
  },

  async askArbiter(message, history = []) {
    // Note: This feature is being replaced by Neural Engine logic in AnalyzePage
    return this.call('chat', { message, history });
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
