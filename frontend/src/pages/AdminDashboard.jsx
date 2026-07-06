import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Edit3, Trash2, ToggleLeft, ToggleRight, Download,
  Upload, Bot, BarChart3, AlertTriangle, ArrowLeft, X, Save,
  Sun, Moon, ChevronDown, Tag, MessageSquare,
} from 'lucide-react';
import { api } from '../api/client';
import useAuthStore from '../stores/authStore';
import useThemeStore from '../stores/themeStore';
import toast from 'react-hot-toast';

/* ─── Intent Form Modal ──────────────────────────────────── */
function IntentFormModal({ intent, onClose, onSave }) {
  const [name, setName] = useState(intent?.name || '');
  const [keywords, setKeywords] = useState(intent?.keywords?.join(', ') || '');
  const [response, setResponse] = useState(intent?.response || '');
  const [category, setCategory] = useState(intent?.category || 'general');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        name,
        keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
        response,
        category,
      };

      if (intent) {
        await api.put(`/admin/intents/${intent.id}`, data);
        toast.success('Intent updated!');
      } else {
        await api.post('/admin/intents', data);
        toast.success('Intent created!');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}
    onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%', maxWidth: 540, padding: 32,
          animation: 'bounce-in 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {intent ? 'Edit Intent' : 'Create New Intent'}
          </h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 6 }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Name</label>
            <input className="glass-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. pricing_info" required id="intent-name" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Keywords <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(comma-separated)</span>
            </label>
            <input className="glass-input" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="pricing, cost, price, plans" required id="intent-keywords" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Category</label>
            <input className="glass-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="general" id="intent-category" />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Response</label>
            <textarea
              className="glass-input"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Bot response (supports **bold**, *italic*, emoji)"
              required
              rows={5}
              style={{ resize: 'vertical', minHeight: 120 }}
              id="intent-response"
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Intent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Admin Dashboard Page ───────────────────────────────── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const [intents, setIntents] = useState([]);
  const [unmatched, setUnmatched] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingIntent, setEditingIntent] = useState(null);
  const [activeTab, setActiveTab] = useState('intents');
  const [loading, setLoading] = useState(true);

  const loadIntents = async () => {
    try {
      const data = await api.get(`/admin/intents?per_page=100${search ? `&search=${search}` : ''}`);
      setIntents(data);
    } catch (err) {
      toast.error('Failed to load intents');
    }
    setLoading(false);
  };

  const loadUnmatched = async () => {
    try {
      const data = await api.get('/admin/unmatched?per_page=50');
      setUnmatched(data);
    } catch (err) {
      toast.error('Failed to load unmatched queries');
    }
  };

  useEffect(() => {
    loadIntents();
    loadUnmatched();
  }, [search]);

  const handleToggle = async (id) => {
    try {
      await api.patch(`/admin/intents/${id}/toggle`);
      loadIntents();
      toast.success('Intent toggled');
    } catch (err) {
      toast.error('Failed to toggle');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/intents/${id}`);
      loadIntents();
      toast.success('Intent deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleExport = async () => {
    try {
      const data = await api.get('/admin/intents/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'intents_export.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Intents exported!');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.upload('/admin/intents/import', formData);
      toast.success(`Imported ${result.imported}, skipped ${result.skipped}`);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} errors during import`);
      }
      loadIntents();
    } catch (err) {
      toast.error('Import failed');
    }
    e.target.value = '';
  };

  const handleCreateFromUnmatched = (query) => {
    setEditingIntent(null);
    setShowModal(true);
    // Pre-fill with the unmatched query as a keyword
    setTimeout(() => {
      const nameInput = document.getElementById('intent-keywords');
      if (nameInput) nameInput.value = query;
    }, 100);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px', borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/chat')} className="btn-ghost" style={{ padding: 6 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Admin Dashboard
            </h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Manage intents, view analytics, and close the feedback loop
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={toggleTheme} className="btn-ghost" style={{ padding: 6 }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => navigate('/admin/analytics')} className="btn-secondary">
            <BarChart3 size={16} /> Analytics
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[
            { key: 'intents', label: 'Intents', icon: <Tag size={14} />, count: intents.length },
            { key: 'unmatched', label: 'Unmatched Queries', icon: <AlertTriangle size={14} />, count: unmatched.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 10, border: 'none',
                fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600,
                cursor: 'pointer',
                background: activeTab === tab.key ? 'var(--accent-glow)' : 'transparent',
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.icon} {tab.label}
              <span style={{
                background: activeTab === tab.key ? 'var(--accent)' : 'var(--bg-surface)',
                color: activeTab === tab.key ? 'white' : 'var(--text-muted)',
                padding: '2px 8px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700,
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'intents' && (
          <>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="glass-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="Search intents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  id="admin-search"
                />
              </div>
              <button onClick={() => { setEditingIntent(null); setShowModal(true); }} className="btn-primary">
                <Plus size={16} /> Add Intent
              </button>
              <button onClick={handleExport} className="btn-secondary">
                <Download size={16} /> Export
              </button>
              <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={16} /> Import
                <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Intent Table */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      {['Status', 'Name', 'Keywords', 'Category', 'Hits', 'Actions'].map((h) => (
                        <th key={h} style={{
                          padding: '12px 16px', textAlign: 'left', fontWeight: 700,
                          color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {intents.map((intent) => (
                      <tr
                        key={intent.id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => handleToggle(intent.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: intent.is_active ? '#10b981' : 'var(--text-muted)' }}
                          >
                            {intent.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                          </button>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {intent.name}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {intent.keywords.slice(0, 4).map((k, i) => (
                              <span key={i} style={{
                                background: 'var(--accent-glow)', color: 'var(--accent)',
                                padding: '2px 8px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 500,
                              }}>
                                {k}
                              </span>
                            ))}
                            {intent.keywords.length > 4 && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                +{intent.keywords.length - 4}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          {intent.category}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontWeight: 700, color: intent.hit_count > 0 ? 'var(--accent)' : 'var(--text-muted)',
                          }}>
                            {intent.hit_count}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => { setEditingIntent(intent); setShowModal(true); }}
                              className="btn-ghost" style={{ padding: 6 }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => handleDelete(intent.id)} className="btn-ghost" style={{ padding: 6, color: '#f43f5e' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {intents.length === 0 && (
                <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No intents found. {search && 'Try a different search term.'}
                </p>
              )}
            </div>
          </>
        )}

        {activeTab === 'unmatched' && (
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                💡 These are queries that didn't match any intent. Use this feedback to improve your knowledge base.
              </p>
            </div>
            {unmatched.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                🎉 No unmatched queries! Your knowledge base is covering all user needs.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      {['Query', 'Time', 'Action'].map((h) => (
                        <th key={h} style={{
                          padding: '12px 16px', textAlign: 'left', fontWeight: 700,
                          color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {unmatched.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                          "{log.query}"
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => handleCreateFromUnmatched(log.query)}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            <Plus size={12} /> Create Intent
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Intent Form Modal */}
      {showModal && (
        <IntentFormModal
          intent={editingIntent}
          onClose={() => { setShowModal(false); setEditingIntent(null); }}
          onSave={() => { loadIntents(); loadUnmatched(); }}
        />
      )}
    </div>
  );
}
