import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  ArrowLeft, MessageSquare, Users, Tag, AlertTriangle,
  TrendingUp, Sun, Moon, Activity,
} from 'lucide-react';
import { api } from '../api/client';
import useThemeStore from '../stores/themeStore';
import toast from 'react-hot-toast';

const COLORS = ['#00d4aa', '#06b6d4', '#8b5cf6', '#f43f5e', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];

function StatCard({ icon, label, value, color, subtext }) {
  return (
    <div className="glass-card" style={{
      padding: 24, display: 'flex', alignItems: 'flex-start', gap: 16,
      transition: 'transform 0.2s ease',
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}20`, color: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {value}
        </div>
        {subtext && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtext}</div>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card" style={{ padding: '10px 14px', fontSize: '0.75rem' }}>
      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await api.get('/admin/analytics');
      setAnalytics(data);
    } catch (err) {
      toast.error('Failed to load analytics');
    }
    setLoading(false);
  };

  if (loading || !analytics) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Activity size={32} style={{ animation: 'pulse-soft 1.5s infinite', marginBottom: 12 }} />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const textColor = theme === 'dark' ? '#94a3b8' : '#475569';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px', borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/admin')} className="btn-ghost" style={{ padding: 6 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Analytics Dashboard
            </h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Monitor chatbot performance and usage patterns
            </p>
          </div>
        </div>
        <button onClick={toggleTheme} className="btn-ghost" style={{ padding: 6 }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard
            icon={<MessageSquare size={22} />}
            label="Total Messages"
            value={analytics.total_messages.toLocaleString()}
            color="#06b6d4"
          />
          <StatCard
            icon={<Users size={22} />}
            label="Chat Sessions"
            value={analytics.total_sessions.toLocaleString()}
            color="#8b5cf6"
            subtext={`Avg. ${analytics.avg_session_length} msgs/session`}
          />
          <StatCard
            icon={<Tag size={22} />}
            label="Active Intents"
            value={analytics.total_intents}
            color="#00d4aa"
          />
          <StatCard
            icon={<AlertTriangle size={22} />}
            label="Fallback Rate"
            value={`${analytics.fallback_rate}%`}
            color="#f43f5e"
            subtext={`${analytics.total_unmatched} unmatched queries`}
          />
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 20 }}>
          {/* Messages Per Day */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              <TrendingUp size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Messages Per Day
            </h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={analytics.messages_per_day}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: textColor }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: textColor }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Messages"
                    stroke="#00d4aa"
                    strokeWidth={2.5}
                    dot={{ fill: '#00d4aa', r: 4 }}
                    activeDot={{ r: 6, fill: '#00d4aa' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 10 Intents */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              <Tag size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Top 10 Matched Intents
            </h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={analytics.top_intents} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: textColor }} />
                  <YAxis dataKey="intent_name" type="category" width={100} tick={{ fontSize: 11, fill: textColor }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hit_count" name="Hits" fill="#00d4aa" radius={[0, 6, 6, 0]} barSize={20}>
                    {analytics.top_intents.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Intent Category Distribution */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              Intent Category Distribution
            </h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={getCategoryData(analytics.top_intents)}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {getCategoryData(analytics.top_intents).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Usage Summary */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              Usage Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Total Messages', value: analytics.total_messages, max: analytics.total_messages, color: '#06b6d4' },
                { label: 'Matched Queries', value: analytics.total_messages - analytics.total_unmatched, max: analytics.total_messages, color: '#10b981' },
                { label: 'Unmatched Queries', value: analytics.total_unmatched, max: analytics.total_messages, color: '#f43f5e' },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                  <div style={{
                    height: 8, borderRadius: 100, background: 'var(--bg-surface)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 100, background: item.color,
                      width: `${item.max > 0 ? (item.value / item.max) * 100 : 0}%`,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getCategoryData(topIntents) {
  const map = {};
  topIntents.forEach((i) => {
    map[i.category] = (map[i.category] || 0) + i.hit_count;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}
