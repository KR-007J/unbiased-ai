import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Common headers for all API calls
const apiHeaders = {
  'Content-Type': 'application/json',
};

// Helper to format error messages
const formatError = (status, message) => {
  if (status === 500) {
    return `Backend Error: ${message || 'API request failed. Check Supabase logs.'}`;
  }
  if (status >= 400) {
    return `Error (${status}): ${message || 'Request failed'}`;
  }
  return message || 'Unknown error occurred';
};

// API helpers
export const api = {
  async analyzeText(payload, options = {}) {
    const body = typeof payload === 'string' ? { text: payload, ...options } : { ...payload, ...options };
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: formatError(res.status, data.error || res.statusText) };
      }
      return data;
    } catch (err) {
      console.error('Network error:', err);
      return { error: `Network error: ${err.message}` };
    }
  },

  async detectBias(content, type = 'text') {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/detect-bias`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ content, type }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: formatError(res.status, data.error || res.statusText) };
      }
      return data;
    } catch (err) {
      console.error('Network error:', err);
      return { error: `Network error: ${err.message}` };
    }
  },

  async rewriteUnbiased(text, biasTypes = []) {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/rewrite`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ text, biasTypes }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: formatError(res.status, data.error || res.statusText) };
      }
      return data;
    } catch (err) {
      console.error('Network error:', err);
      return { error: `Network error: ${err.message}` };
    }
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
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/compare`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ textA, textB }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: formatError(res.status, data.error || res.statusText) };
      }
      return data;
    } catch (err) {
      console.error('Network error:', err);
      return { error: `Network error: ${err.message}` };
    }
  },
};
