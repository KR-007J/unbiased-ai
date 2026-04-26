import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../supabase';
import { useStore } from '../store';
import toast from 'react-hot-toast';

export default function ArbiterPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'I am the Sovereign Neural Arbiter. How can I assist you in your pursuit of objective discourse today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const user = useStore(s => s.user);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-10); // Keep last 10 messages for context
      const res = await api.askArbiter(input, history);
      
      if (res.error) throw new Error(res.error);

      const assistantMsg = {
        role: 'assistant',
        content: res.text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      toast.error('Neural Uplink failed. Falling back to core logic.');
      const fallbackMsg = {
        role: 'assistant',
        content: "I apologize, but my connection to the Sovereign Intelligence layer is currently experiencing interference. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>CONVERSATIONAL AGENT</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36 }}>
            NEURAL <span className="text-neon-cyan">ARBITER</span>
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 4 }}>MODEL UPLINK</div>
          <div className="badge" style={{ background: 'rgba(0,245,255,0.05)', color: 'var(--cyan)', border: '1px solid rgba(0,245,255,0.2)' }}>
            GEMINI 1.5 FLASH (24/7 ACTIVE)
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        <div 
          ref={scrollRef}
          style={{ 
            flex: 1, 
            padding: 24, 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 16,
            background: 'rgba(0,0,0,0.2)'
          }}
          className="scroll-fade"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 8
                }}
              >
                <div style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: 10, 
                  color: msg.role === 'user' ? 'var(--purple)' : 'var(--cyan)',
                  letterSpacing: 1
                }}>
                  {msg.role === 'user' ? (user?.displayName || 'OPERATOR') : 'ARBITER'}
                </div>
                <div style={{
                  padding: '12px 18px',
                  borderRadius: 16,
                  background: msg.role === 'user' ? 'rgba(139,0,255,0.1)' : 'rgba(0,245,255,0.05)',
                  border: msg.role === 'user' ? '1px solid rgba(139,0,255,0.2)' : '1px solid rgba(0,245,255,0.2)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  boxShadow: msg.role === 'user' ? '0 4px 15px rgba(0,0,0,0.2)' : 'none'
                }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ alignSelf: 'flex-start', display: 'flex', gap: 4, padding: '12px 18px', background: 'rgba(255,255,255,0.05)', borderRadius: 16 }}
            >
              <div className="dot-pulse" style={{ background: 'var(--cyan)' }} />
              <div className="dot-pulse" style={{ background: 'var(--cyan)', animationDelay: '0.2s' }} />
              <div className="dot-pulse" style={{ background: 'var(--cyan)', animationDelay: '0.4s' }} />
            </motion.div>
          )}
        </div>

        <form 
          onSubmit={sendMessage}
          style={{ 
            padding: 24, 
            background: 'rgba(2, 5, 20, 0.9)', 
            borderTop: '1px solid rgba(0,245,255,0.1)',
            display: 'flex',
            gap: 12
          }}
        >
          <input
            className="input-cyber"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the Arbiter about bias mitigation or discourse neutrality..."
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || !input.trim()}
            style={{ padding: '0 24px', height: 'auto' }}
          >
            SEND
          </button>
        </form>
      </div>

      <style>{`
        .dot-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
