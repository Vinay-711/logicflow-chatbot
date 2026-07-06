import { useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, Sparkles, Sun, Moon, Settings } from 'lucide-react';
import useThemeStore from '../stores/themeStore';

export default function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle Background Glows */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Top Navbar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 32px',
        width: '100%',
        maxWidth: 1120,
        margin: '0 auto',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px var(--accent-glow)'
          }}>
            <Bot size={16} color="white" />
          </div>
          <span style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
            LogicFlow
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: 8,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => navigate('/admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '8px 16px',
              borderRadius: 20,
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Settings size={14} /> Control Panel
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px 100px',
        textAlign: 'center',
        zIndex: 10,
        maxWidth: 720,
        margin: '0 auto'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--accent-glow)',
          border: '1px solid rgba(16,163,127,0.15)',
          borderRadius: 20,
          padding: '6px 14px',
          marginBottom: 24,
          fontSize: '0.75rem',
          fontWeight: 500,
          color: 'var(--accent)'
        }}>
          <Sparkles size={12} /> Futuristic Deterministic Engine
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 3.75rem)',
          fontWeight: 700,
          lineHeight: 1.15,
          marginBottom: 16,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)'
        }}>
          LogicFlow AI
        </h1>

        <p style={{
          fontSize: 'clamp(0.95rem, 1.8vw, 1.1rem)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: 32,
          fontWeight: 400
        }}>
          A clean, deterministic chatbot utilizing O(1) dictionary intent matching with seamless AI fallback. Featuring a real-time HUD thought matrix visualization.
        </p>

        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          width: '100%',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/chat')}
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '12px 28px',
              borderRadius: 24,
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px var(--accent-glow)',
              transition: 'transform 0.15s, opacity 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'none';
            }}
          >
            Start Chatting <ArrowRight size={16} />
          </button>
        </div>

        {/* Minimalist Pipeline Preview */}
        <div style={{
          marginTop: 64,
          padding: '20px 24px',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(8px)',
          width: '100%',
          maxWidth: 600
        }}>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            marginBottom: 16
          }}>
            Internal Processing Pipeline (IPO Model)
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            {[
              { title: 'Input', desc: 'Sanitization' },
              { title: 'Process', desc: 'O(1) Hash Map' },
              { title: 'Output', desc: 'Response Node' }
            ].map((step, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {step.desc}
                  </div>
                </div>
                {idx < 2 && (
                  <div style={{
                    flex: 1,
                    height: 1,
                    background: 'var(--border-color)',
                    margin: '0 16px'
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '24px 32px',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
        zIndex: 10
      }}>
        <div>Designed with ChatGPT UI Aesthetics</div>
        <div style={{ marginTop: 4, display: 'flex', justifyContent: 'center', gap: 12 }}>
          <span>FastAPI</span>
          <span>•</span>
          <span>React</span>
          <span>•</span>
          <span>SQLite</span>
          <span>•</span>
          <span>WebSockets</span>
        </div>
      </footer>
    </div>
  );
}
