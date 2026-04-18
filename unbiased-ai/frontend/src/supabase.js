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

  async getChatResponse(messages, context = '') {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ messages, context }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { response: `System Error (${res.status}): ${text.slice(0, 100)}` };
      }
      return await res.json();
    } catch (err) {
      return { response: `Connection Error: ${err.message}` };
    }
  },

  async getChatResponseStreaming(messages, context = '', onChunk) {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/chat`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({ messages, context }),
    });
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`Streaming request failed (${res.status}):`, text);
      throw new Error(`System Error (${res.status}): ${text.slice(0, 150)}`);
    }

    if (!res.body) {
      throw new Error('Backend disconnected: No response stream');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let chunkCount = 0;
    let partialLine = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (partialLine) {
            processLine(partialLine);
          }
          console.log(`Stream complete. Received ${chunkCount} chunks, total length: ${fullResponse.length}`);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = (partialLine + chunk).split('\n');
        partialLine = lines.pop() || '';

        for (const line of lines) {
          processLine(line);
        }
      }

      function processLine(line) {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        if (trimmed.startsWith('data: ')) {
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              const errMsg = parsed.error.message || parsed.error;
              throw new Error(`Backend error: ${errMsg}`);
            }
            
            let textChunk = '';
            if (parsed.candidates && parsed.candidates[0]?.content?.parts?.[0]?.text) {
              textChunk = parsed.candidates[0].content.parts[0].text;
            } else if (parsed.text) {
              textChunk = parsed.text;
            }

            if (textChunk) {
              fullResponse += textChunk;
              chunkCount++;
              if (onChunk) {
                onChunk(textChunk);
              }
            }
          } catch (e) {
            console.warn('Failed to parse SSE chunk:', trimmed, e);
          }
        }
      }

      if (!fullResponse || fullResponse.length === 0) {
        throw new Error('No content received from stream');
      }

      return { response: fullResponse };
    } catch (err) {
      console.error('Stream reading error:', err);
      throw err;
    }
  },
};
