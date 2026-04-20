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
  // Generic function invoker
  async call(functionName, payload = {}) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });
      if (error) {
        console.error(`Error calling ${functionName}:`, error);
        return { error: error.message };
      }
      return data;
    } catch (err) {
      console.error(`Failed to invoke ${functionName}:`, err);
      return { error: err.message };
    }
  },

  async analyzeText(payload, options = {}) {
    return this.call('analyze', typeof payload === 'string' ? { text: payload, ...options } : { ...payload, ...options });
  },

  async detectBias(content, type = 'text') {
    return this.call('detect-bias', { content, type });
  },

  async rewriteUnbiased(text, biasTypes = []) {
    return this.call('rewrite', { text, biasTypes });
  },

  async compareTexts(textA, textB) {
    return this.call('compare', { textA, textB });
  },

  async scanWebUrl(url) {
    return this.call('web-scan', { url });
  },

  async getChatResponse(conversationHistory, analysisId = null) {
    return this.call('chat', {
      message: conversationHistory[conversationHistory.length - 1]?.content || '',
      conversationHistory: conversationHistory.slice(0, -1),
      analysisId,
    });
  },

  async forecastBias(topic, period = '30day', context = []) {
    return this.call('forecast-bias', { topic, period, context });
  },

  async getNewsBias(topic) {
    return this.call('news-bias', { topic });
  },

  async getBiasFingerprint(content) {
    return this.call('bias-fingerprint', { content });
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

  // Database helpers
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

  async saveMessage(userId, role, content, analysisId = null) {
    try {
      const { data, error } = await supabase.from('messages').insert([{
        user_id: userId,
        role,
        content,
        analysis_id: analysisId,
      }]).select();
      if (error) throw error;
      return data[0];
    } catch (err) {
      console.error('Error saving message:', err);
      return null;
    }
  },

  async getConversationHistory(userId, analysisId = null) {
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      
      if (analysisId) {
        query = query.eq('analysis_id', analysisId);
      }
      
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching conversation history:', err);
      return [];
    }
  },
};
