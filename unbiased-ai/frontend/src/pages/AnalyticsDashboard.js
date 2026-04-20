import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import { LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Target, Award, BarChart3 } from 'lucide-react';

const BIAS_COLORS = {
  gender: '#FF6B6B',
  racial: '#4ECDC4',
  political: '#45B7D1',
  age: '#FFA07A',
  cultural: '#98D8C8',
  religious: '#F7DC6F',
  socioeconomic: '#BB8FCE',
  other: '#85C1E2',
};

const COLORS = Object.values(BIAS_COLORS);

export default function AnalyticsDashboard() {
  const user = useStore((s) => s.user);
  const [analyses, setAnalyses] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    avgBiasScore: 0,
    improvementScore: 0,
    cleanContent: 0,
  });

  useEffect(() => {
    if (user?.uid) {
      loadAnalytics();
    }
  }, [user?.uid]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch last 30 analyses
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: true })
        .limit(30);

      if (error) throw error;

      setAnalyses(data || []);
      processAnalytics(data || []);
    } catch (err) {
      console.error('Error loading analytics:', err);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (data) => {
    if (data.length === 0) {
      setStats({
        totalAnalyses: 0,
        avgBiasScore: 0,
        improvementScore: 0,
        cleanContent: 0,
      });
      return;
    }

    // Calculate trend data (grouped by day)
    const trendMap = {};
    data.forEach((analysis) => {
      const date = new Date(analysis.created_at);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      if (!trendMap[dateStr]) {
        trendMap[dateStr] = { date: dateStr, score: 0, count: 0, avgBias: 0 };
      }
      trendMap[dateStr].score += analysis.bias_score || 0;
      trendMap[dateStr].count += 1;
    });

    const trend = Object.values(trendMap).map((d) => ({
      ...d,
      avgBias: d.count > 0 ? ((1 - d.score / d.count) * 100).toFixed(0) : 0,
      score: d.count > 0 ? (d.score / d.count).toFixed(3) : 0,
    }));
    setTrendData(trend);

    // Calculate category breakdown
    const categoryMap = {};
    data.forEach((analysis) => {
      const biasTypes = analysis.bias_types || {};
      Object.keys(biasTypes).forEach((type) => {
        categoryMap[type] = (categoryMap[type] || 0) + (biasTypes[type] || 0);
      });
    });

    const categories = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    setCategoryData(categories);

    // Calculate stats
    const avgBias = data.reduce((sum, a) => sum + (a.bias_score || 0), 0) / data.length;
    const firstScore = data[0]?.bias_score || 0;
    const lastScore = data[data.length - 1]?.bias_score || 0;
    const improvement = ((firstScore - lastScore) / Math.max(firstScore, 0.01)) * 100;
    const cleanCount = data.filter((a) => a.bias_score <= 0.3).length;

    setStats({
      totalAnalyses: data.length,
      avgBiasScore: (avgBias * 100).toFixed(1),
      improvementScore: improvement.toFixed(1),
      cleanContent: cleanCount,
    });
  };

  const getImprovementColor = (score) => {
    if (score > 30) return '#51cf66';
    if (score > 10) return '#ffd43b';
    return '#ff6b6b';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 32, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>
          PERSONAL ANALYTICS
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36 }}>
          Your <span className="text-neon-cyan">Insights</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>
          Track your progress toward more objective communication.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          Loading your analytics...
        </div>
      ) : analyses.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 60,
          background: 'rgba(0, 20, 40, 0.6)',
          borderRadius: 16,
          border: '1px solid rgba(0, 245, 255, 0.1)',
          color: 'var(--text-muted)',
        }}>
          <p style={{ marginBottom: 12 }}>No analyses yet. Start analyzing to see your insights!</p>
          <a href="/app/analyze" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: 600 }}>
            Go to Analyze →
          </a>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            {/* Total Analyses */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(0, 245, 255, 0.05))',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              borderRadius: 12,
              padding: 20,
              animation: 'slide-up 0.3s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <BarChart3 size={18} style={{ color: 'var(--cyan)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  TOTAL ANALYSES
                </span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--cyan)' }}>
                {stats.totalAnalyses}
              </div>
            </div>

            {/* Avg Bias Score */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05))',
              border: '1px solid rgba(255, 193, 7, 0.2)',
              borderRadius: 12,
              padding: 20,
              animation: 'slide-up 0.3s ease 0.1s both',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Target size={18} style={{ color: '#ffc107' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  AVG BIAS SCORE
                </span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#ffc107' }}>
                {stats.avgBiasScore}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                {stats.avgBiasScore <= 30 ? '✓ Excellent' : stats.avgBiasScore <= 60 ? 'Good' : 'Needs work'}
              </div>
            </div>

            {/* Improvement */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(81, 207, 102, 0.1), rgba(81, 207, 102, 0.05))',
              border: '1px solid rgba(81, 207, 102, 0.2)',
              borderRadius: 12,
              padding: 20,
              animation: 'slide-up 0.3s ease 0.2s both',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <TrendingUp size={18} style={{ color: getImprovementColor(stats.improvementScore) }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  IMPROVEMENT
                </span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: getImprovementColor(stats.improvementScore) }}>
                {stats.improvementScore}%
              </div>
            </div>

            {/* Clean Content */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 0, 255, 0.1), rgba(139, 0, 255, 0.05))',
              border: '1px solid rgba(139, 0, 255, 0.2)',
              borderRadius: 12,
              padding: 20,
              animation: 'slide-up 0.3s ease 0.3s both',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Award size={18} style={{ color: 'var(--magenta)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  CLEAN CONTENT
                </span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--magenta)' }}>
                {stats.cleanContent}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                out of {stats.totalAnalyses}
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
            {/* Trend Chart */}
            <div style={{
              background: 'rgba(0, 20, 40, 0.6)',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              borderRadius: 16,
              padding: 20,
            }}>
              <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
                30-Day Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,245,255,0.1)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" style={{ fontSize: 12 }} />
                  <YAxis stroke="var(--text-muted)" style={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(5, 12, 35, 0.95)',
                      border: '1px solid rgba(0, 245, 255, 0.3)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                    }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#00f5ff" fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category Chart */}
            {categoryData.length > 0 && (
              <div style={{
                background: 'rgba(0, 20, 40, 0.6)',
                border: '1px solid rgba(0, 245, 255, 0.2)',
                borderRadius: 16,
                padding: 20,
              }}>
                <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
                  Bias Categories
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(5, 12, 35, 0.95)',
                        border: '1px solid rgba(0, 245, 255, 0.3)',
                        borderRadius: 8,
                        color: 'var(--text-primary)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Detailed Stats */}
          <div style={{
            background: 'rgba(0, 20, 40, 0.6)',
            border: '1px solid rgba(0, 245, 255, 0.2)',
            borderRadius: 16,
            padding: 20,
          }}>
            <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
              Category Breakdown
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
              {categoryData.map((category, idx) => (
                <div key={category.name} style={{
                  padding: 12,
                  background: `${BIAS_COLORS[category.name]}20`,
                  border: `1px solid ${BIAS_COLORS[category.name]}40`,
                  borderRadius: 8,
                }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 4,
                    textTransform: 'capitalize',
                    color: BIAS_COLORS[category.name],
                  }}>
                    {category.name}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--cyan)' }}>
                    {category.value}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    instances
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
