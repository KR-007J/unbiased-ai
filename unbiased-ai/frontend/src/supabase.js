import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API helpers
export const api = {
  async analyzeText(text, options = {}) {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
      body: JSON.stringify({ text, ...options }),
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
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
      body: JSON.stringify({ messages, context }),
    });
    return res.json();
  },
};
