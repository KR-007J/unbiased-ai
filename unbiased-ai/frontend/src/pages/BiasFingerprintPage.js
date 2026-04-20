import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { LineWave } from 'react-loader-spinner';
import { api } from '../supabase';

export default function BiasFingerprintPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generateFingerprint = async () => {
    if (!content.trim()) {
      toast.error('Please enter some text to analyze!');
      return;
    }

    setLoading(true);
    try {
      const data = await api.getBiasFingerprint(content);

      if (data.error) throw new Error(data.error);
      setResult(data);
      toast.success('Fingerprint generated!');
    } catch (err) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getCharacteristicColor = (value) => {
    if (value >= 80) return '#00ff88';
    if (value >= 60) return '#00f5ff';
    if (value >= 40) return '#ffd700';
    return '#ff3366';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>👁️ Bias Fingerprint</h1>
        <p className="subtitle">Your unique writing signature - know your bias style</p>
      </div>

      <div className="input-section">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your writing here to discover your unique bias fingerprint..."
          className="fingerprint-input"
          maxLength={2000}
        />
        <div className="input-footer">
          <span className="char-count">{content.length}/2000 characters</span>
          <button
            className="analyze-button"
            onClick={generateFingerprint}
            disabled={loading || !content.trim()}
          >
            {loading ? (
              <LineWave color="#000" height={25} width={40} />
            ) : (
              '🔍 Generate Fingerprint'
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="fingerprint-results">
          <div className="fingerprint-card">
            <div className="fingerprint-badge">
              <span className="emoji">{result.fingerprint?.emoji}</span>
              <span className="archetype">{result.fingerprint?.archetype}</span>
            </div>

            <div className="fingerprint-details">
              <div className="detail-row">
                <span className="label">Style:</span>
                <span className="value">{result.fingerprint?.style}</span>
              </div>
              <div className="detail-row">
                <span className="label">Tone:</span>
                <span className="value">{result.fingerprint?.tone}</span>
              </div>
              <div className="detail-row">
                <span className="label">Perspective:</span>
                <span className="value">{result.fingerprint?.perspective}</span>
              </div>
              <div className="detail-row">
                <span className="label">Bias Tendency:</span>
                <span className="value">{result.fingerprint?.biasTendency?.join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="characteristics-card">
            <h3>📊 Characteristics</h3>
            <div className="characteristics-grid">
              {Object.entries(result.characteristics || {}).map(([key, value]) => (
                <div key={key} className="characteristic-bar">
                  <div className="bar-label">
                    <span>{key.replace(/_/g, ' ')}</span>
                    <span className="bar-value">{value}/100</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${value}%`,
                        background: getCharacteristicColor(value)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="comparison-card">
            <h3>💬 Your Voice</h3>
            <blockquote>
              "{result.comparison_quote}"
            </blockquote>
          </div>

          <div className="feedback-grid">
            <div className="strengths-card">
              <h3>✅ Strengths</h3>
              <ul>
                {result.strengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="improve-card">
              <h3>📈 Areas to Improve</h3>
              <ul>
                {result.areas_to_improve?.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>

          <button 
            className="share-fingerprint-btn"
            onClick={() => {
              const text = `👁️ My Bias Fingerprint: ${result.fingerprint?.archetype} ${result.fingerprint?.emoji}\nStyle: ${result.fingerprint?.style}\nTone: ${result.fingerprint?.tone}\nCheck yours at Unbiased AI!`;
              navigator.clipboard.writeText(text);
              toast.success('Shareable summary copied to clipboard!');
            }}
          >
            📢 Share My Fingerprint
          </button>

          <div className="tips-card">
            <h3>💡 Tips for More Neutral Writing</h3>
            <div className="tips-list">
              {result.tips?.map((tip, i) => (
                <div key={i} className="tip-item">
                  <span className="tip-number">{i + 1}</span>
                  <span className="tip-text">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input-section {
          max-width: 800px;
          margin: 0 auto 40px;
        }

        .fingerprint-input {
          width: 100%;
          height: 200px;
          padding: 20px;
          background: rgba(5, 12, 35, 0.8);
          border: 1px solid rgba(0, 245, 255, 0.3);
          border-radius: 12px;
          color: var(--text);
          font-size: 15px;
          font-family: var(--font-body);
          resize: none;
        }

        .fingerprint-input:focus {
          outline: none;
          border-color: var(--cyan);
        }

        .input-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 15px;
        }

        .char-count {
          color: var(--text-dim);
          font-size: 12px;
        }

        .analyze-button {
          padding: 15px 30px;
          background: linear-gradient(135deg, var(--cyan), var(--blue));
          border: none;
          border-radius: 12px;
          color: #000;
          font-weight: bold;
          cursor: pointer;
        }

        .analyze-button:disabled {
          opacity: 0.7;
        }

        .fingerprint-results {
          max-width: 800px;
          margin: 0 auto;
        }

        .fingerprint-card {
          background: linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(255, 0, 170, 0.1));
          border: 2px solid var(--cyan);
          border-radius: 20px;
          padding: 30px;
          text-align: center;
          margin-bottom: 30px;
        }

        .fingerprint-badge {
          margin-bottom: 20px;
        }

        .fingerprint-badge .emoji {
          font-size: 60px;
          display: block;
          margin-bottom: 10px;
        }

        .fingerprint-badge .archetype {
          font-size: 24px;
          font-weight: bold;
          background: linear-gradient(135deg, var(--cyan), var(--magenta));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .fingerprint-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .detail-row {
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }

        .detail-row .label {
          display: block;
          font-size: 11px;
          color: var(--text-dim);
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .detail-row .value {
          color: var(--cyan);
          font-weight: 500;
        }

        .characteristics-card,
        .comparison-card,
        .feedback-grid,
        .tips-card {
          background: rgba(5, 12, 35, 0.8);
          border: 1px solid rgba(0, 245, 255, 0.2);
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 20px;
        }

        .characteristics-grid {
          margin-top: 20px;
        }

        .characteristic-bar {
          margin-bottom: 15px;
        }

        .bar-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 13px;
        }

        .bar-value {
          color: var(--cyan);
          font-weight: bold;
        }

        .bar-track {
          height: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 5px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          border-radius: 5px;
          transition: width 0.5s ease;
        }

        .comparison-card blockquote {
          margin-top: 15px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.3);
          border-left: 4px solid var(--cyan);
          font-style: italic;
          font-size: 16px;
          line-height: 1.6;
        }

        .feedback-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .strengths-card li,
        .improve-card li {
          margin: 10px 0;
          padding-left: 10px;
        }

        .strengths-card {
          border-color: rgba(0, 255, 136, 0.3);
        }

        .improve-card {
          border-color: rgba(255, 200, 0, 0.3);
        }

        .share-fingerprint-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, var(--cyan), var(--magenta));
          border: none;
          border-radius: 12px;
          color: #000;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          margin-bottom: 20px;
          transition: transform 0.2s;
        }

        .share-fingerprint-btn:hover {
          transform: scale(1.02);
        }

        .tips-list {
          margin-top: 15px;
        }

        .tip-item {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          margin: 15px 0;
        }

        .tip-number {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--cyan);
          border-radius: 50%;
          color: #000;
          font-weight: bold;
          flex-shrink: 0;
        }

        .tip-text {
          padding-top: 4px;
        }
      `}</style>
    </div>
  );
}