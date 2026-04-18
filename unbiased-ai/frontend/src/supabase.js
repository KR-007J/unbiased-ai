import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API helpers
export const api = {
  async analyzeText(payload, options = {}) {
    const body = typeof payload === 'string' ? { text: payload, ...options } : { ...payload, ...options };
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
      body: JSON.stringify(body),
    });
    return res.json();
  },

  async detectBias(content, type = 'text') {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/detect-bias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
      body: JSON.stringify({ content, type }),
    });
    return res.json();
  },

  async rewriteUnbiased(text, biasTypes = []) {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
      body: JSON.stringify({ text, biasTypes }),
    });
    return res.json();
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
    const { data, error } = await supabase.from('analyses').insert([analysis]).select();
    if (error) throw error;
    return data[0];
  },

  async compareTexts(textA, textB) {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
      body: JSON.stringify({ textA, textB }),
    });
    return res.json();
  },

  async getChatResponse(messages, context = '') {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ messages, context }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { response: `[INTEGRITY_ERROR]: System returned status ${res.status}. ${text.slice(0, 100)}` };
      }
      return await res.json();
    } catch (err) {
      return { response: `[NEURAL_DISCONNECTION]: ${err.message}` };
    }
  },

  async getChatResponseStreaming(messages, context = '', onChunk) {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ messages, context, stream: true }),
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`System returned status ${res.status}. ${text.slice(0, 100)}`);
      }

      if (!res.body) {
        throw new Error('Response body is null');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullResponse += parsed.text;
                if (onChunk) {
                  onChunk(parsed.text);
                }
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              console.warn('Failed to parse SSE chunk:', e);
            }
          }
        }
      }

      return { response: fullResponse };
    } catch (err) {
      return { response: `[NEURAL_DISCONNECTION]: ${err.message}` };
    }
  },
};
