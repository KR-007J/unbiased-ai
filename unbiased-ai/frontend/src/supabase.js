import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API helpers
export const api = {
  async analyzeText(payload, options = {}) {
    const body = typeof payload === 'string' ? { text: payload, ...options } : { ...payload, ...options };
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`API Error (${res.status}):`, errorText);
        return { error: `Backend unavailable (${res.status}). Ensure Supabase functions are deployed with latest code.` };
      }
      return await res.json();
    } catch (err) {
      console.error('Network error:', err);
      return { error: `Network error: ${err.message}. Check backend deployment.` };
    }
  },

  async detectBias(content, type = 'text') {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/detect-bias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({ content, type }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`API Error (${res.status}):`, errorText);
        return { error: `Backend unavailable (${res.status})` };
      }
      return await res.json();
    } catch (err) {
      console.error('Network error:', err);
      return { error: `Network error: ${err.message}` };
    }
  },

  async rewriteUnbiased(text, biasTypes = []) {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({ text, biasTypes }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`API Error (${res.status}):`, errorText);
        return { error: `Backend unavailable (${res.status}). Ensure Supabase functions are deployed.` };
      }
      return await res.json();
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({ textA, textB }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`API Error (${res.status}):`, errorText);
        return { error: `Backend unavailable (${res.status})` };
      }
      return await res.json();
    } catch (err) {
      console.error('Network error:', err);
      return { error: `Network error: ${err.message}` };
    }
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
      console.error(`Streaming request failed (${res.status}):`, text);
      throw new Error(`System returned status ${res.status}. ${text.slice(0, 150)}`);
    }

    if (!res.body) {
      throw new Error('Response body is null - Backend not responding');
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
