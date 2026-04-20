import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import { Trophy, Award, Zap, TrendingUp } from 'lucide-react';

export default function CommunityHub() {
  const user = useStore((s) => s.user);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all-time'); // all-time | this-month

  useEffect(() => {
    loadData();
  }, [user?.uid, selectedPeriod]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load leaderboard
      const view = selectedPeriod === 'all-time' ? 'top_users_all_time' : 'top_users_this_month';
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from(view)
        .select('*');
      
      if (leaderboardError) throw leaderboardError;
      setLeaderboard(leaderboardData || []);

      // Load user profile if logged in
      if (user?.uid) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.uid)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        setUserProfile(profileData);

        // Load user badges
        const { data: badgesData, error: badgesError } = await supabase
          .from('badges')
          .select('*')
          .eq('user_id', user.uid);
        
        if (badgesError) throw badgesError;
        setUserBadges(badgesData || []);
      }
    } catch (err) {
      console.error('Error loading community data:', err);
      toast.error('Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (badgeType) => {
    const icons = {
      'first_analysis': '🎯',
      'bias_buster': '⚡',
      '100_analyses': '💯',
      'expert_contributor': '👑',
      'leaderboard_top_10': '🏆',
    };
    return icons[badgeType] || '⭐';
  };

  const BADGE_INFO = {
    'first_analysis': { name: 'First Step', description: 'Completed your first analysis' },
    'bias_buster': { name: 'Bias Buster', description: 'Detected 10+ bias instances' },
    '100_analyses': { name: 'Century', description: 'Completed 100 analyses' },
    'expert_contributor': { name: 'Expert', description: 'Top 10 leaderboard rank' },
    'leaderboard_top_10': { name: 'Elite', description: 'Ranked in top 10' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 32, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>
          COMMUNITY NETWORK
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36 }}>
          Community <span className="text-neon-cyan">Hub</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>
          Celebrate contributors, share insights, and collaborate on building a more objective future.
        </p>
      </div>

      {/* User Stats (if logged in) */}
      {user && userProfile && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.05), rgba(139, 0, 255, 0.05))',
          border: '1px solid rgba(0, 245, 255, 0.2)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
          animation: 'slide-up 0.3s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Your Profile</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{userProfile.display_name || user.email}</p>
            </div>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 12px',
              background: 'rgba(0, 245, 255, 0.2)',
              borderRadius: 8,
              color: 'var(--cyan)',
              textTransform: 'capitalize',
            }}>
              {userProfile.contribution_level}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                ANALYSES
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cyan)' }}>
                {userProfile.total_analyses}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                BADGES EARNED
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--magenta)' }}>
                {userBadges.length}
              </div>
            </div>
          </div>

          {/* User Badges */}
          {userBadges.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0, 245, 255, 0.1)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                BADGES
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {userBadges.map((badge) => (
                  <div key={badge.id} style={{
                    padding: '8px 12px',
                    background: 'rgba(255, 215, 0, 0.1)',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  title={badge.badge_description}
                  >
                    <span style={{ marginRight: 4 }}>{getBadgeIcon(badge.badge_type)}</span>
                    {badge.badge_name || BADGE_INFO[badge.badge_type]?.name || badge.badge_type}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Period Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['all-time', 'this-month'].map((period) => (
          <button key={period}
            onClick={() => setSelectedPeriod(period)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: selectedPeriod === period ? '2px solid var(--cyan)' : '1px solid rgba(0, 245, 255, 0.2)',
              background: selectedPeriod === period ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            {period === 'all-time' ? 'ALL TIME' : 'THIS MONTH'}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Trophy size={20} style={{ color: 'var(--cyan)' }} />
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Leaderboard</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            Loading leaderboard...
          </div>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No data yet. Be the first to join!
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxHeight: '600px',
            overflowY: 'auto',
          }}>
            {leaderboard.map((entry, idx) => {
              const rank = idx + 1;
              const isCurrentUser = user?.uid === entry.user_id;
              const getMedalIcon = (rank) => {
                if (rank === 1) return '🥇';
                if (rank === 2) return '🥈';
                if (rank === 3) return '🥉';
                return `#${rank}`;
              };

              return (
                <div key={entry.user_id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    background: isCurrentUser
                      ? 'rgba(0, 245, 255, 0.1)'
                      : 'rgba(0, 20, 40, 0.6)',
                    border: isCurrentUser
                      ? '2px solid rgba(0, 245, 255, 0.3)'
                      : '1px solid rgba(0, 245, 255, 0.1)',
                    borderRadius: 12,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 20, 40, 0.8)';
                    e.currentTarget.style.borderColor = 'rgba(0, 245, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isCurrentUser ? 'rgba(0, 245, 255, 0.1)' : 'rgba(0, 20, 40, 0.6)';
                    e.currentTarget.style.borderColor = isCurrentUser ? 'rgba(0, 245, 255, 0.3)' : 'rgba(0, 245, 255, 0.1)';
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    fontSize: 20,
                    fontWeight: 700,
                    minWidth: 40,
                    textAlign: 'center',
                  }}>
                    {getMedalIcon(rank)}
                  </div>

                  {/* User Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}>
                      {entry.display_name || `User ${rank}`}
                      {isCurrentUser && <span style={{ color: 'var(--cyan)', marginLeft: 8 }}>(You)</span>}
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      gap: 8,
                    }}>
                      <span>📊 {entry.analysis_count || 0} analyses</span>
                      {entry.badge_count && <span>🎖️ {entry.badge_count} badges</span>}
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{
                    textAlign: 'right',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}>
                    <div style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--cyan)',
                    }}>
                      {(entry.avg_bias_score * 100).toFixed(0) || 0}%
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      avg score
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
