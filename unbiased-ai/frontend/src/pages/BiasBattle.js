import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { LineWave } from 'react-loader-spinner';
import BiasMeter from '../components/BiasMeter';
import { supabase } from '../supabase';

export default function BiasBattle() {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('battle');

  const runBattle = async () => {
    if (!textA.trim() || !textB.trim()) {
      toast.error('Please enter both texts to battle!');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bias-battle', {
        body: { textA, textB }
      });

      if (error) throw error;
      setResult(data);
      toast.success('Battle complete!');
    } catch (err) {
      toast.error(err.message || 'Battle failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTextA('');
    setTextB('');
    setResult(null);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Bias Battle</h1>
        <p className="subtitle">Challenge your text against another - may the most neutral win!</p>
      </div>

      {!result ? (
        <div className="battle-arena">
          <div className="battle-texts">
            <div className="battle-card battle-card-a">
              <div className="battle-label">TEXT A</div>
              <textarea
                value={textA}
                onChange={(e) => setTextA(e.target.value)}
                placeholder="Enter your text here..."
                className="battle-input"
                maxLength={1000}
              />
              <div className="char-count">{textA.length}/1000</div>
            </div>

            <div className="vs-divider">
              <span>VS</span>
            </div>

            <div className="battle-card battle-card-b">
              <div className="battle-label">TEXT B</div>
              <textarea
                value={textB}
                onChange={(e) => setTextB(e.target.value)}
                placeholder="Enter opponent's text here..."
                className="battle-input"
                maxLength={1000}
              />
              <div className="char-count">{textB.length}/1000</div>
            </div>
          </div>

          <button
            className="battle-button"
            onClick={runBattle}
            disabled={loading || !textA.trim() || !textB.trim()}
          >
            {loading ? (
              <LineWave color="#00f5ff" height={30} width={50} />
            ) : (
              '⚔️ START BATTLE'
            )}
          </button>
        </div>
      ) : (
        <div className="battle-result">
          <div className="winner-announcement">
            {result.winner === 'A' && (
              <div className="winner-box winner-a">
                <span className="trophy">🏆</span>
                <h2>Text A Wins!</h2>
                <p>Less bias = Victory</p>
              </div>
            )}
            {result.winner === 'B' && (
              <div className="winner-box winner-b">
                <span className="trophy">🏆</span>
                <h2>Text B Wins!</h2>
                <p>Less bias = Victory</p>
              </div>
            )}
            {result.winner === 'DRAW' && (
              <div className="winner-box draw">
                <span className="trophy">🤝</span>
                <h2>It's a Draw!</h2>
                <p>Both texts are equally neutral</p>
              </div>
            )}
          </div>

          <div className="scores-display">
            <div className="score-card score-a">
              <h3>Text A Bias Score</h3>
              <BiasMeter value={result.scoreA} />
              <p className="score-number">{result.scoreA}/100</p>
              <p className="bias-level">{result.analysisA?.overallBiasLevel}</p>
            </div>

            <div className="score-card score-b">
              <h3>Text B Bias Score</h3>
              <BiasMeter value={result.scoreB} />
              <p className="score-number">{result.scoreB}/100</p>
              <p className="bias-level">{result.analysisB?.overallBiasLevel}</p>
            </div>
          </div>

          <div className="analysis-details">
            <div className="detail-card">
              <h4>Text A Analysis</h4>
              {result.analysisA?.biasInstances?.length > 0 ? (
                <ul className="bias-list">
                  {result.analysisA.biasInstances.map((inst, i) => (
                    <li key={i} className={`severity-${inst.severity}`}>
                      <span className="phrase">"{inst.phrase}"</span>
                      <span className="type">{inst.type}</span>
                      <span className="explanation">{inst.explanation}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-bias">No bias detected!</p>
              )}
            </div>

            <div className="detail-card">
              <h4>Text B Analysis</h4>
              {result.analysisB?.biasInstances?.length > 0 ? (
                <ul className="bias-list">
                  {result.analysisB.biasInstances.map((inst, i) => (
                    <li key={i} className={`severity-${inst.severity}`}>
                      <span className="phrase">"{inst.phrase}"</span>
                      <span className="type">{inst.type}</span>
                      <span className="explanation">{inst.explanation}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-bias">No bias detected!</p>
              )}
            </div>
          </div>

          <div className="improvement-tips">
            <h4>💡 Improvement Tips</h4>
            <div className="tips-grid">
              <div className="tip-card">
                <div className="tip-header">
                  <h5>For Text A</h5>
                  <button 
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(textA);
                      toast.success('Text A copied!');
                    }}
                    title="Copy Text A"
                  >
                    📋
                  </button>
                </div>
                {result.improvementTips?.[0] && <p>{result.improvementTips[0]}</p>}
              </div>
              <div className="tip-card">
                <div className="tip-header">
                  <h5>For Text B</h5>
                  <button 
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(textB);
                      toast.success('Text B copied!');
                    }}
                    title="Copy Text B"
                  >
                    📋
                  </button>
                </div>
                {result.improvementTips?.[1] && <p>{result.improvementTips[1]}</p>}
              </div>
            </div>
          </div>

          <button className="reset-button" onClick={reset}>
            🔄 New Battle
          </button>
        </div>
      )}

      <style>{`
        .battle-arena {
          max-width: 1000px;
          margin: 0 auto;
        }

        .battle-texts {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 20px;
          align-items: center;
          margin-bottom: 30px;
        }

        .battle-card {
          background: rgba(5, 12, 35, 0.8);
          border: 1px solid rgba(0, 245, 255, 0.2);
          border-radius: 12px;
          padding: 20px;
        }

        .battle-card-a {
          border-color: rgba(0, 245, 255, 0.4);
        }

        .battle-card-b {
          border-color: rgba(255, 0, 170, 0.4);
        }

        .battle-label {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 2px;
          margin-bottom: 10px;
          color: var(--cyan);
        }

        .battle-card-b .battle-label {
          color: var(--magenta);
        }

        .battle-input {
          width: 100%;
          height: 200px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 15px;
          color: var(--text);
          font-family: var(--font-body);
          resize: none;
        }

        .battle-input:focus {
          outline: none;
          border-color: var(--cyan);
        }

        .char-count {
          text-align: right;
          font-size: 11px;
          color: var(--text-dim);
          margin-top: 5px;
        }

        .vs-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--cyan), var(--magenta));
          font-weight: bold;
          font-size: 14px;
        }

        .battle-button {
          width: 100%;
          padding: 20px;
          background: linear-gradient(135deg, var(--cyan), var(--magenta));
          border: none;
          border-radius: 12px;
          color: #000;
          font-weight: bold;
          font-size: 18px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .battle-button:hover:not(:disabled) {
          transform: scale(1.02);
        }

        .battle-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .battle-result {
          max-width: 1000px;
          margin: 0 auto;
        }

        .winner-announcement {
          text-align: center;
          margin-bottom: 40px;
        }

        .winner-box {
          padding: 40px;
          border-radius: 20px;
          animation: glow 2s ease-in-out infinite;
        }

        .winner-a {
          background: linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(0, 100, 255, 0.2));
          border: 2px solid var(--cyan);
        }

        .winner-b {
          background: linear-gradient(135deg, rgba(255, 0, 170, 0.2), rgba(255, 100, 0, 0.2));
          border: 2px solid var(--magenta);
        }

        .draw {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
          border: 2px solid var(--text-dim);
        }

        .winner-box h2 {
          font-size: 36px;
          margin: 10px 0;
        }

        .trophy {
          font-size: 60px;
        }

        .scores-display {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }

        .score-card {
          background: rgba(5, 12, 35, 0.8);
          border: 1px solid rgba(0, 245, 255, 0.2);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .score-number {
          font-size: 48px;
          font-weight: bold;
          color: var(--cyan);
        }

        .bias-level {
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 2px;
        }

        .analysis-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }

        .detail-card {
          background: rgba(5, 12, 35, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
        }

        .bias-list {
          list-style: none;
          padding: 0;
        }

        .bias-list li {
          padding: 10px;
          margin: 5px 0;
          border-radius: 8px;
          font-size: 13px;
        }

        .severity-high {
          background: rgba(255, 0, 0, 0.2);
          border-left: 3px solid red;
        }

        .severity-medium {
          background: rgba(255, 200, 0, 0.2);
          border-left: 3px solid yellow;
        }

        .severity-low {
          background: rgba(0, 255, 100, 0.2);
          border-left: 3px solid green;
        }

        .bias-list .phrase {
          display: block;
          font-style: italic;
          color: var(--text);
        }

        .bias-list .type {
          display: block;
          font-size: 11px;
          color: var(--cyan);
          text-transform: uppercase;
        }

        .no-bias {
          color: var(--success);
          text-align: center;
        }

        .improvement-tips {
          background: rgba(5, 12, 35, 0.8);
          border: 1px solid rgba(0, 245, 255, 0.2);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
        }

        .tips-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .tip-card {
          padding: 15px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
        }

        .tip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
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

        .reset-button {
          width: 100%;
          padding: 15px;
          background: transparent;
          border: 1px solid var(--cyan);
          border-radius: 12px;
          color: var(--cyan);
          font-size: 16px;
          cursor: pointer;
        }

        .reset-button:hover {
          background: rgba(0, 245, 255, 0.1);
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 245, 255, 0.3); }
          50% { box-shadow: 0 0 40px rgba(0, 245, 255, 0.6); }
        }
      `}</style>
    </div>
  );
}