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
  if (status === 429) {
    return 'High traffic detected. Retrying request...';
  }
  if (status >= 400) {
    return `Error (${status}): ${message || 'Request failed'}`;
  }
  return message || 'Unknown error occurred';
};

// API helpers
export const api = {
  // Generic function invoker with retry logic
  async call(functionName, payload = {}, retries = 3, backoff = 1000) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
        headers: apiHeaders,
      });

      if (error) {
        // If it's a rate limit or transient error, retry
        if (retries > 0 && (error.status === 429 || error.status >= 500)) {
          const waitTime = backoff * (4 - retries);
          console.warn(`Transient error calling ${functionName}. Retrying in ${waitTime}ms... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return this.call(functionName, payload, retries - 1, backoff);
        }
        
        const formattedMsg = formatError(error.status || 500, error.message);
        console.error(`Error calling ${functionName}:`, error);
        return { error: formattedMsg, status: error.status };
      }

      return data;
    } catch (err) {
      if (retries > 0) {
        const waitTime = backoff * (4 - retries);
        console.warn(`Connection error calling ${functionName}. Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.call(functionName, payload, retries - 1, backoff);
      }
      console.error(`Failed to invoke ${functionName}:`, err);
      return { error: err.message, status: 500 };
    }
  },

  async analyzeText(payload, options = {}) {
    const text = typeof payload === 'string' ? payload : payload.text;

    // For hackathon demo, use direct Gemini API call
    try {
      const geminiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!geminiKey || geminiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        // For demo purposes, return mock data when API key not set
        console.log('Using mock analysis data (API key not configured)');
        return {
          biasScore: Math.random() * 0.8,
          confidence: 0.85 + Math.random() * 0.1,
          biasTypes: {
            gender: Math.random(),
            racial: Math.random(),
            political: Math.random(),
            age: Math.random(),
            cultural: Math.random(),
            socioeconomic: Math.random()
          },
          biases: [
            {
              type: 'political',
              text: text.substring(0, 50) + '...',
              explanation: 'Detected potential political bias in language framing',
              confidence: 0.75,
              suggestion: 'Consider neutral language',
              counterVector: 'Alternative perspective focusing on facts',
              corroboratingTruth: 'Studies show political bias affects 60% of media content'
            }
          ],
          summary: 'Analysis completed using neural simulation mode. Configure Gemini API key for real AI analysis.',
          severity: 'medium',
          propheticVector: 'Potential for increased polarization if unaddressed',
          objectiveRefraction: text.replace(/political|bias/gi, 'neutral'),
          neuralSignature: Math.random().toString(36).substring(2, 18)
        };
      }

      const prompt = `You are the Sovereign Neural Arbiter. Analyze the following discourse for systemic, implicit, and institutional bias across gender, racial, political, age, cultural, and socioeconomic vectors.

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
          generationConfig: { temperature: 0.1, maxOutputTokens: 3000, topP: 0.95 }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let result;
      try {
        result = JSON.parse(cleaned);
      } catch (e) {
        console.error('Failed to parse Gemini response:', cleaned);
        throw new Error('Failed to parse AI response');
      }

      return result;
    } catch (error) {
      console.warn('Direct Gemini call failed, trying Supabase:', error);
      // Fallback to Supabase
      return this.call('analyze', typeof payload === 'string' ? { text: payload, ...options } : { ...payload, ...options });
    }
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

  async getChatResponse(conversationHistory, analysisId = null) {
    const message = conversationHistory[conversationHistory.length - 1]?.content || '';

    try {
      const geminiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!geminiKey || geminiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        // Mock chat response
        return {
          response: "I'm the Sovereign Arbiter. I notice you're exploring bias detection. To provide real AI assistance, please configure your Gemini API key in the settings. For now, here's some general guidance: Focus on using neutral language, consider multiple perspectives, and verify information with reliable sources.",
          suggestions: [
            "Use inclusive language that considers diverse viewpoints",
            "Avoid absolute statements when possible",
            "Consider the impact of your words on different audiences"
          ]
        };
      }

      const context = conversationHistory.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n');
      const prompt = `You are the Sovereign Arbiter - a specialized AI counselor focused on ethical governance and objective communication.

Context: ${context}

User: ${message}

Respond as the Sovereign Arbiter: Provide helpful, ethical guidance on bias detection and objective communication. Be empathetic, educational, and actionable.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1000, topP: 0.9 }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        response: rawText,
        suggestions: [
          "Consider multiple perspectives",
          "Use evidence-based reasoning",
          "Focus on inclusive language"
        ]
      };
    } catch (error) {
      console.warn('Direct Gemini chat call failed, trying Supabase:', error);
      return this.call('chat', {
        message: conversationHistory[conversationHistory.length - 1]?.content || '',
        conversationHistory: conversationHistory.slice(0, -1),
        analysisId,
      });
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
