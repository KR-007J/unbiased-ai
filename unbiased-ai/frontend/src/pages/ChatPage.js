import React, { useState, useRef, useEffect } from 'react';

import { api } from '../supabase';
import { useStore } from '../store';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  'Forecast the bias evolution in climate reporting',
  'Explain the mathematical logic of Sovereign Refraction',
  'How does the Sentinel layer protect against sentiment manipulation?',
  'Analyze the neural signature of a biased text',
  'Differences between explicit bias and predictive vectors',
];

export default function ChatPage() {
  const user = useStore((s) => s.user);
  const setIsStreaming = useStore((s) => s.setIsStreaming);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Sovereign Neural Interface online. I am your Sentinel Arbiter. I can explain complex bias vectors, forecast manipulations, and refract biased discourse into pure objectivity. How may I assist your audit today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    const userMsg = { role: 'user', content: msg, timestamp: new Date() };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    setIsStreaming(true);

    try {
      const currentAnalysis = useStore.getState().currentAnalysis;
      const conversationHistory = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));
      
      // Add a placeholder for the assistant response
      const assistantMsgIndex = messages.length + 1;
      setMessages((m) => [...m, { role: 'assistant', content: '', timestamp: new Date(), streaming: true }]);

      // Try streaming first, fall back to non-streaming
      let fullResponse = '';
      
      try {
        await api.getChatResponseStreaming(
          [...conversationHistory, { role: 'user', content: msg }],
          currentAnalysis,
          (chunk) => {
            fullResponse += chunk;
            setMessages((m) => {
              const updated = [...m];
              updated[assistantMsgIndex].content = fullResponse;
              return updated;
            });
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        );
      } catch (streamErr) {
        // Fall back to non-streaming
        console.warn('Streaming failed, falling back to non-streaming:', streamErr);
        const data = await api.getChatResponse([...conversationHistory, { role: 'user', content: msg }], currentAnalysis);
        fullResponse = data?.response || '';
        setMessages((m) => {
          const updated = [...m];
          updated[assistantMsgIndex].content = fullResponse;
          return updated;
        });
      }

      if (!fullResponse) {
        throw new Error('Neural response is empty');
      }

      // Mark as no longer streaming
      setMessages((m) => {
        const updated = [...m];
        updated[assistantMsgIndex].streaming = false;
        return updated;
      });
    } catch (error) {
      console.error('Chat Error:', error);
      toast.error('Neural link interrupted');
      const errorMsg = error.message?.includes('[SYSTEM_ERROR]') ? error.message : 'The Sentinel layer encountered a synchronization anomaly. Please retry.';
      setMessages((m) => [...m, { role: 'assistant', content: errorMsg, timestamp: new Date(), error: true }]);
    } finally {
      setLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 32, maxWidth: 900 }}>
      <div style={{ marginBottom: 24, flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>NEURAL INTERFACE</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36 }}>
          FAIRNESS <span className="text-neon-cyan">CHAT</span>
        </h1>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20,
        paddingRight: 8, marginBottom: 24, minHeight: 0,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', gap: 16,
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            animation: 'slide-up 0.3s ease',
          }}>
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #8b00ff, #ff00aa)'
                : 'linear-gradient(135deg, #0080ff, #00f5ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, boxShadow: msg.role === 'user'
                ? '0 0 15px rgba(139,0,255,0.4)'
                : '0 0 15px rgba(0,245,255,0.4)',
            }}>
              {msg.role === 'user' ? (user?.displayName?.[0] || '?') : '⬡'}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: '72%',
              padding: '16px 20px',
              borderRadius: msg.role === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, rgba(139,0,255,0.2), rgba(255,0,170,0.1))'
                : 'rgba(8,20,55,0.7)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(139,0,255,0.3)' : 'rgba(0,245,255,0.15)'}`,
              backdropFilter: 'blur(20px)',
              boxShadow: msg.error ? '0 0 10px rgba(255,51,102,0.2)' : 'none',
            }}>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.8,
                color: msg.error ? 'var(--red)' : 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                {msg.timestamp?.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: 16, animation: 'slide-up 0.3s ease' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #0080ff, #00f5ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>⬡</div>
            <div style={{
              padding: '16px 20px', borderRadius: '4px 20px 20px 20px',
              background: 'rgba(8,20,55,0.7)', border: '1px solid rgba(0,245,255,0.15)',
              display: 'flex', gap: 6, alignItems: 'center',
            }}>
              {[0, 1, 2].map((j) => (
                <div key={j} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--cyan)', opacity: 0.7,
                  animation: `pulse-cyan 1.2s ${j * 0.3}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, flexShrink: 0 }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} style={{
              padding: '8px 14px', borderRadius: 8,
              background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.2)',
              color: 'var(--text-secondary)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 12, transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,245,255,0.12)'; e.currentTarget.style.color = 'var(--cyan)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,245,255,0.06)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="glass-card" style={{ padding: 16, flexShrink: 0, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <textarea
          ref={inputRef}
          className="textarea-cyber"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about bias, fairness, inclusion... (Enter to send, Shift+Enter for newline)"
          style={{ minHeight: 52, maxHeight: 160, resize: 'none', flex: 1, border: 'none', background: 'transparent', padding: '8px 0' }}
          disabled={loading}
          rows={1}
        />
        <button
          className="btn-primary"
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{ flexShrink: 0, padding: '12px 20px' }}
        >
          {loading ? '...' : '▶ SEND'}
        </button>
      </div>
    </div>
  );
}
