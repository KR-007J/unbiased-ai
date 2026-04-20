import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { LineWave } from 'react-loader-spinner';
import { api } from '../supabase';

const TRENDING_TOPICS = [
  { label: 'Climate Policy', query: 'climate policy' },
  { label: 'Immigration', query: 'immigration' },
  { label: 'Healthcare', query: 'healthcare reform' },
  { label: 'Economy', query: 'economy jobs' },
  { label: 'Education', query: 'education schools' },
];

export default function NewsBiasPage() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyzeNews = async (query) => {
    if (!query.trim()) {
      toast.error('Please enter a topic to analyze!');
      return;
    }

    setLoading(true);
    setTopic(query);
    try {
      const data = await api.getNewsBias(query);

      if (data.error) throw new Error(data.error);
      setResult(data);
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getBiasPercentage = (type) => {
    switch (type) {
      case 'left': return 10;
      case 'center-left': return 35;
      case 'center': return 50;
      case 'center-right': return 65;
      case 'right': return 90;
      default: return 50;
    }
  };

  const getBiasColor = (type) => {
    switch (type) {
      case 'left': return '#00f5ff';
      case 'right': return '#ff3366';
      case 'center-left': return '#00ff88';
      case 'center-right': return '#ff9900';
      case 'center': return '#888';
      default: return '#888';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📰 Live News Bias Scanner</h1>
        <p className="subtitle">See how different outlets cover the same story</p>
      </div>

      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a news topic (e.g., climate policy, healthcare)..."
            className="search-input"
            onKeyDown={(e) => e.key === 'Enter' && analyzeNews(topic)}
          />
          <button
            className="search-button"
            onClick={() => analyzeNews(topic)}
            disabled={loading}
          >
            {loading ? <LineWave color="#000" height={25} width={40} /> : '🔍 Analyze'}
          </button>
        </div>

        <div className="trending-topics">
          <span className="trending-label">Trending:</span>
          {TRENDING_TOPICS.map((t) => (
            <button
              key={t.query}
              className="trending-tag"
              onClick={() => analyzeNews(t.query)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="analysis-results">
          <div className="topic-header">
            <h2>Topic: {result.topic}</h2>
            <p className="analysis-date">
              Analyzed: {new Date(result.analysisDate).toLocaleString()}
            </p>
          </div>

          <div className="bias-spectrum">
            <div className="spectrum-bar">
              <div className="spectrum-label left">← Left</div>
              <div className="spectrum-gradient-container">
                <div className="spectrum-gradient"></div>
                {result.sourceAnalysis?.map((source, idx) => (
                  <div 
                    key={idx}
                    className="spectrum-marker"
                    style={{ 
                      left: `${getBiasPercentage(source.sourceType)}%`,
                      backgroundColor: getBiasColor(source.sourceType)
                    }}
                    title={source.sourceType}
                  >
                    <div className="marker-tooltip">{source.sourceType}</div>
                  </div>
                ))}
              </div>
              <div className="spectrum-label right">Right →</div>
            </div>
          </div>

          <div className="source-cards">
            {result.sourceAnalysis?.map((source, idx) => (
              <div 
                key={idx} 
                className="source-card"
                style={{ borderColor: getBiasColor(source.sourceType) }}
              >
                <div className="source-header">
                  <span 
                    className="source-type"
                    style={{ background: getBiasColor(source.sourceType) }}
                  >
                    {source.sourceType}
                  </span>
                </div>

                <div className="headline-section">
                  <h4>Example Headline</h4>
                  <p className="headline">"{source.exampleHeadline}"</p>
                </div>

                <div className="neutral-version">
                  <div className="neutral-header">
                    <h4>🆕 Neutral Version</h4>
                    <button 
                      className="copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(source.neutralVersion);
                        toast.success('Copied to clipboard!');
                      }}
                      title="Copy neutral headline"
                    >
                      📋
                    </button>
                  </div>
                  <p>{source.neutralVersion}</p>
                </div>

                <div className="key-phrases">
                  <h4>Key Phrases</h4>
                  <div className="phrases-list">
                    {source.keyPhrases?.map((phrase, i) => (
                      <span key={i} className="phrase-tag">{phrase}</span>
                    ))}
                  </div>
                </div>

                <div className="angle-bias">
                  <div className="angle">
                    <strong>Angle:</strong> {source.angle}
                  </div>
                  <div className="bias">
                    <strong>Bias:</strong> {source.potentialBias}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="overall-assessment">
            <h3>📊 Overall Assessment</h3>
            <p>{result.overallBiasAssessment}</p>
          </div>

          <div className="reader-tips">
            <h3>💡 Tips for Readers</h3>
            <ul>
              {result.tipsForReaders?.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <style>{`
        .search-section {
          max-width: 800px;
          margin: 0 auto 40px;
        }

        .search-box {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .search-input {
          flex: 1;
          padding: 15px 20px;
          background: rgba(5, 12, 35, 0.8);
          border: 1px solid rgba(0, 245, 255, 0.3);
          border-radius: 12px;
          color: var(--text);
          font-size: 16px;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--cyan);
        }

        .search-button {
          padding: 15px 30px;
          background: linear-gradient(135deg, var(--cyan), var(--blue));
          border: none;
          border-radius: 12px;
          color: #000;
          font-weight: bold;
          cursor: pointer;
        }

        .search-button:disabled {
          opacity: 0.7;
        }

        .trending-topics {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .trending-label {
          color: var(--text-dim);
          font-size: 12px;
        }

        .trending-tag {
          padding: 8px 16px;
          background: rgba(0, 245, 255, 0.1);
          border: 1px solid rgba(0, 245, 255, 0.3);
          border-radius: 20px;
          color: var(--cyan);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .trending-tag:hover {
          background: rgba(0, 245, 255, 0.2);
          transform: translateY(-2px);
        }

        .analysis-results {
          max-width: 1000px;
          margin: 0 auto;
        }

        .topic-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .topic-header h2 {
          font-size: 28px;
          margin-bottom: 5px;
        }

        .analysis-date {
          color: var(--text-dim);
          font-size: 12px;
        }

        .bias-spectrum {
          margin-bottom: 40px;
          padding: 20px;
          background: rgba(5, 12, 35, 0.5);
          border-radius: 16px;
          border: 1px solid rgba(0, 245, 255, 0.1);
        }

        .spectrum-bar {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .spectrum-gradient-container {
          flex: 1;
          position: relative;
          height: 12px;
          padding: 4px 0;
        }

        .spectrum-gradient {
          height: 8px;
          background: linear-gradient(90deg, 
            #00f5ff 0%, 
            #00ff88 25%, 
            #888 50%, 
            #ff9900 75%, 
            #ff3366 100%
          );
          border-radius: 4px;
        }

        .spectrum-marker {
          position: absolute;
          top: -2px;
          width: 4px;
          height: 20px;
          border-radius: 2px;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          transform: translateX(-50%);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .spectrum-marker:hover {
          height: 30px;
          top: -7px;
          width: 6px;
          z-index: 10;
        }

        .marker-tooltip {
          position: absolute;
          bottom: 150%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .spectrum-marker:hover .marker-tooltip {
          opacity: 1;
        }

        .spectrum-label {
          font-size: 12px;
          color: var(--text-dim);
          font-family: var(--font-mono);
          width: 60px;
        }

        .spectrum-label.right {
          text-align: right;
        }

        .source-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .source-card {
          background: rgba(5, 12, 35, 0.8);
          border: 2px solid;
          border-radius: 12px;
          padding: 20px;
          transition: transform 0.2s;
        }

        .source-card:hover {
          transform: translateY(-5px);
        }

        .source-header {
          margin-bottom: 15px;
        }

        .source-type {
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: bold;
          color: #000;
        }

        .headline-section h4,
        .neutral-version h4,
        .key-phrases h4 {
          font-size: 12px;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .headline {
          font-size: 16px;
          font-style: italic;
          line-height: 1.4;
        }

        .neutral-version {
          background: rgba(0, 245, 255, 0.1);
          padding: 12px;
          border-radius: 8px;
          margin: 15px 0;
          border: 1px solid rgba(0, 245, 255, 0.2);
        }

        .neutral-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }

        .neutral-version p {
          color: var(--success);
          font-weight: 500;
          margin: 0;
        }

        .copy-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 14px;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .copy-btn:hover {
          opacity: 1;
        }

        .phrases-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .phrase-tag {
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          font-size: 12px;
        }

        .angle-bias {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 13px;
        }

        .angle, .bias {
          margin: 5px 0;
        }

        .bias {
          color: var(--magenta);
        }

        .overall-assessment,
        .reader-tips {
          background: rgba(5, 12, 35, 0.8);
          border: 1px solid rgba(0, 245, 255, 0.2);
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 20px;
        }

        .reader-tips ul {
          padding-left: 20px;
        }

        .reader-tips li {
          margin: 10px 0;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}