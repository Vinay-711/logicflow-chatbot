import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Bot, Plus, MessageSquare, Trash2, Edit3, Check, X, Settings,
  Sun, Moon, LogOut, BarChart3, PanelLeftClose, PanelLeft, User,
  Mic, MicOff, Volume2, VolumeX, ArrowUp, Cpu, LayoutGrid, Sparkles, Terminal, Activity
} from 'lucide-react';
import useChatStore from '../stores/chatStore';
import useAuthStore from '../stores/authStore';
import useThemeStore from '../stores/themeStore';
import toast from 'react-hot-toast';

/* ─── Typing Indicator (ChatGPT Style) ────────────────────── */
function TypingIndicator() {
  return (
    <div style={{
      width: '100%',
      padding: '16px 0',
      background: 'transparent',
    }}>
      <div style={{ maxWidth: 768, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 6, flexShrink: 0,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>
          <Bot size={16} color="white" />
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', paddingTop: 10 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: '50%', background: 'var(--text-muted)',
              animation: `typing 1.4s infinite ${i * 0.2}s`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Holographic Voice Mode Waveform ────────────────────── */
function VoiceWaveform({ isListening }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    // Waveform animates when user is listening OR browser speech is speaking
    const checkSpeakingAndAnimate = () => {
      const isSpeaking = window.speechSynthesis && window.speechSynthesis.speaking;
      const isActive = isListening || isSpeaking;

      if (!isActive) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let phase = 0;

      const resize = () => {
        if (canvas) {
          canvas.width = canvas.parentElement.clientWidth || 300;
          canvas.height = 40;
        }
      };
      resize();

      const color = isListening ? '#ef4444' : '#10a37f';

      const render = () => {
        if (!canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const drawWave = (amplitude, frequency, speed, opacity, strokeWidth) => {
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = strokeWidth;
          ctx.globalAlpha = opacity;
          ctx.shadowBlur = 8;
          ctx.shadowColor = color;

          for (let x = 0; x < canvas.width; x++) {
            const normX = x / canvas.width;
            const envelope = Math.sin(normX * Math.PI); // Fades waves at the ends
            const y = canvas.height / 2 + Math.sin(x * frequency + phase * speed) * amplitude * envelope;
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        };

        phase += 0.15;

        // Render 3 overlapping sine waves for a holographic feel
        drawWave(12, 0.05, 1.0, 0.6, 2);
        drawWave(7, 0.1, -1.2, 0.3, 1.5);
        drawWave(4, 0.15, 0.8, 0.15, 1);

        animationRef.current = requestAnimationFrame(render);
      };

      if (!animationRef.current) {
        render();
      }
    };

    // Poll speaking status to start/stop waveform cleanly
    const interval = setInterval(checkSpeakingAndAnimate, 200);
    checkSpeakingAndAnimate();

    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening]);

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      padding: '4px 0',
      height: 40,
      position: 'relative',
      zIndex: 5
    }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', maxWidth: 480 }} />
    </div>
  );
}

/* ─── Interactive Rich Widgets for Intent Responses ──────── */
function PricingWidget() {
  const plans = [
    { name: 'Starter', price: 'Free', features: ['100 matched intents/mo', 'O(1) search engine', 'Admin dashboard access', 'Rule feedback loop'], note: 'Great for prototyping' },
    { name: 'Professional', price: '$49/mo', features: ['Unlimited intents & logs', 'Tier 2 AI fallback', 'Real-time WebSocket chat', 'Speech-to-Text inputs'], note: 'For growing businesses', popular: true },
    { name: 'Enterprise', price: 'Custom', features: ['Dedicated isolated database', 'Custom NLP pre-processing', 'SLA guaranteed uptime', '24/7 technical support'], note: 'For custom deployments' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 16, width: '100%' }}>
      {plans.map((p, idx) => (
        <div key={idx} style={{
          padding: 16, borderRadius: 12, border: p.popular ? '1px solid var(--accent)' : '1px solid var(--border-color)',
          background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', position: 'relative',
        }}>
          {p.popular && (
            <span style={{
              position: 'absolute', top: -10, right: 10, background: 'var(--accent)', color: 'white',
              fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10, letterSpacing: '0.05em',
            }}>POPULAR</span>
          )}
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{p.name}</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 2px' }}>{p.price}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--accent)', marginBottom: 12 }}>{p.note}</span>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {p.features.map((f, i) => <li key={i}>✓ {f}</li>)}
          </ul>
          <button className={p.popular ? "btn-primary" : "btn-secondary"} style={{ width: '100%', padding: '6px 0', fontSize: '0.75rem', marginTop: 'auto', borderRadius: 8 }} onClick={() => toast.success(`${p.name} plan chosen (simulation)`)}>
            Select Plan
          </button>
        </div>
      ))}
    </div>
  );
}

function HoursWidget() {
  const days = [
    { day: 'Monday', hours: '9:00 AM - 6:00 PM' },
    { day: 'Tuesday', hours: '9:00 AM - 6:00 PM' },
    { day: 'Wednesday', hours: '9:00 AM - 6:00 PM' },
    { day: 'Thursday', hours: '9:00 AM - 6:00 PM' },
    { day: 'Friday', hours: '9:00 AM - 6:00 PM' },
    { day: 'Saturday', hours: 'Closed' },
    { day: 'Sunday', hours: 'Closed' },
  ];

  const now = new Date();
  const dayOfWeek = now.getDay();
  const hours = now.getHours();
  const isOpen = dayOfWeek >= 1 && dayOfWeek <= 5 && hours >= 9 && hours < 18;

  return (
    <div style={{ padding: 16, borderRadius: 12, marginTop: 16, maxWidth: 350, background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Operation Status</span>
        <span style={{
          fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 8,
          background: isOpen ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          color: isOpen ? '#10b981' : '#ef4444',
        }}>
          {isOpen ? '● Open Now' : '○ Closed'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {days.map((d, i) => {
          const isToday = now.getDay() === (i === 6 ? 0 : i + 1);
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: isToday ? 600 : 400, color: isToday ? 'var(--accent)' : 'var(--text-secondary)' }}>
              <span>{d.day} {isToday && '(Today)'}</span>
              <span>{d.hours}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ServicesWidget() {
  const services = [
    { title: 'Deterministic NLP', desc: 'Dictionary-backed O(1) matching engine designed for lightning fast intent mapping.' },
    { title: 'Generative Fallback', desc: 'Hybrid routing layer leveraging Gemini 2.5 standard context for open domain queries.' },
    { title: 'Real-Time Sync', desc: 'Persistent duplex communication using HTML5 WebSockets for zero latency chat.' },
    { title: 'Interactive Analytics', desc: 'Dynamic visualization dashboards built using custom React Recharts.' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 16 }}>
      {services.map((s, i) => (
        <div key={i} style={{ padding: 12, borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>{s.title}</h4>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

function LocationWidget() {
  return (
    <div style={{ padding: 16, borderRadius: 12, marginTop: 16, maxWidth: 350, background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Our Office</span>
      <h4 style={{ fontSize: '0.85rem', fontWeight: 600, margin: '4px 0 8px' }}>LogicFlow AI Headquarters</h4>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.4 }}>
        📍 123 Logic Street, Suite 404<br />
        Silicon Valley, CA 94025
      </p>
      <div style={{
        height: 100, borderRadius: 8, background: 'var(--bg-surface-hover)',
        border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 6, marginBottom: 12,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite' }} />
        <span style={{ fontSize: '0.6rem', fontWeight: 500, color: 'var(--text-muted)' }}>Live Map (Silicon Valley)</span>
      </div>
      <button className="btn-secondary" style={{ width: '100%', padding: '6px 0', fontSize: '0.75rem', borderRadius: 8 }} onClick={() => window.open('https://maps.google.com', '_blank')}>
        Open Google Maps
      </button>
    </div>
  );
}

function CareersWidget() {
  const jobs = [
    { title: 'Senior AI Engineer', dept: 'Engineering', loc: 'Remote / SF' },
    { title: 'Frontend Developer (React)', dept: 'Product Team', loc: 'Remote' }
  ];

  return (
    <div style={{ padding: 16, borderRadius: 12, marginTop: 16, maxWidth: 350, background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Careers</span>
      <h4 style={{ fontSize: '0.85rem', fontWeight: 600, margin: '4px 0 12px' }}>Join the LogicFlow Team</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {jobs.map((j, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{j.title}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{j.dept} • {j.loc}</div>
            </div>
            <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.65rem', borderRadius: 6 }} onClick={() => toast.success(`Simulated application for ${j.title} submitted!`)}>
              Apply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Message Row (ChatGPT-style) ────────────────────────── */
function MessageBubble({ message }) {
  const isBot = message.role === 'bot';
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  const [isSpeaking, setIsSpeaking] = useState(false);

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      let cleanText = message.content
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/[\*\_\`]/g, '');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const renderContent = (text) => {
    let html = text
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; max-height: 450px; border-radius: 8px; margin-top: 10px; display: block;" />')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const matchedIntent = message.matched_intent_name || message.matched_intent_id;

  return (
    <div className="chatgpt-msg-container" style={{
      background: isBot ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
    }}>
      <div className="chatgpt-msg-inner">
        {/* Avatar */}
        <div className="chatgpt-avatar" style={{
          background: isBot ? 'var(--accent)' : '#9b59b6',
          color: 'white'
        }}>
          {isBot ? <Bot size={16} /> : <User size={16} />}
        </div>

        {/* Content */}
        <div className="chatgpt-content">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isBot ? 'LogicFlow' : 'You'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{time}</span>
            {isBot && (
              <button
                onClick={toggleSpeech}
                style={{
                  background: 'none', border: 'none', padding: '2px 4px',
                  color: isSpeaking ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                  transition: 'color 0.15s',
                }}
                title={isSpeaking ? "Stop reading" : "Read aloud"}
              >
                {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
            )}
          </div>
          <div style={{
            fontSize: '0.92rem', lineHeight: 1.6,
            color: 'var(--text-primary)',
            wordBreak: 'break-word',
          }}>
            {renderContent(message.content)}
          </div>

          {isBot && matchedIntent === 'pricing' && <PricingWidget />}
          {isBot && matchedIntent === 'hours' && <HoursWidget />}
          {isBot && matchedIntent === 'services' && <ServicesWidget />}
          {isBot && matchedIntent === 'location' && <LocationWidget />}
          {isBot && matchedIntent === 'careers' && <CareersWidget />}
        </div>
      </div>
    </div>
  );
}

/* ─── Quick Reply Chips ──────────────────────────────────── */
function QuickReplies({ onSelect }) {
  const chips = [
    { label: '❓ Help', value: 'help' },
    { label: '💰 Pricing', value: 'pricing' },
    { label: '🕐 Hours', value: 'hours' },
    { label: '📞 Contact', value: 'contact' },
    { label: '🤖 About', value: 'about' },
    { label: '😂 Joke', value: 'joke' },
  ];

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, justifyContent: 'center' }}>
      {chips.map((c) => (
        <button
          key={c.value}
          onClick={() => onSelect(c.value)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 100, padding: '5px 12px',
            fontSize: '0.75rem', fontWeight: 500,
            color: 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'var(--font-sans)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = 'var(--accent)';
            e.target.style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'var(--border-color)';
            e.target.style.color = 'var(--text-secondary)';
          }}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Session Sidebar (ChatGPT-style) ────────────────────── */
function SessionSidebar({ isOpen }) {
  const { sessions, activeSessionId, createSession, selectSession, renameSession, deleteSession } = useChatStore();
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const handleNewChat = async () => {
    try {
      const session = await createSession();
      selectSession(session.id);
    } catch (err) {
      toast.error('Failed to create session');
    }
  };

  const handleRename = async (id) => {
    if (editTitle.trim()) {
      try {
        await renameSession(id, editTitle.trim());
      } catch (err) {
        toast.error('Failed to rename');
      }
    }
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    try {
      await deleteSession(id);
      toast.success('Session deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div style={{
      width: isOpen ? 260 : 0, minWidth: isOpen ? 260 : 0,
      height: '100%', overflow: 'hidden',
      transition: 'all 0.25s ease',
      background: 'var(--sidebar-bg)',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid var(--border-color)',
    }}>
      <div style={{ padding: '14px 12px', }}>
        <button onClick={handleNewChat} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)',
          background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 500,
          transition: 'background 0.15s ease',
          textAlign: 'left'
        }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Plus size={16} /> New chat
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
        {sessions.length === 0 ? (
          <p style={{
            textAlign: 'center', color: 'var(--text-muted)',
            fontSize: '0.75rem', padding: 20,
          }}>
            No conversations yet
          </p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className={`session-row ${s.id === activeSessionId ? 'sidebar-item-active' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 8,
                cursor: 'pointer', marginBottom: 2,
                transition: 'background 0.15s ease',
                position: 'relative'
              }}
              onClick={() => selectSession(s.id)}
              onMouseEnter={(e) => {
                if (s.id !== activeSessionId) e.currentTarget.style.background = 'var(--bg-surface-hover)';
                const btns = e.currentTarget.querySelectorAll('.session-action');
                btns.forEach(b => b.style.opacity = 1);
              }}
              onMouseLeave={(e) => {
                if (s.id !== activeSessionId) e.currentTarget.style.background = 'transparent';
                const btns = e.currentTarget.querySelectorAll('.session-action');
                btns.forEach(b => b.style.opacity = 0);
              }}
            >
              <MessageSquare size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              {editingId === s.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(s.id)}
                    className="glass-input"
                    style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 6 }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button onClick={(e) => { e.stopPropagation(); handleRename(s.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 2 }}>
                    <Check size={13} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <>
                  <span style={{
                    flex: 1, fontSize: '0.85rem', fontWeight: 400,
                    color: s.id === activeSessionId ? 'var(--text-primary)' : 'var(--text-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {s.title}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(s.id); setEditTitle(s.title); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, opacity: 0, transition: 'opacity 0.15s' }}
                    className="session-action"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f43f5e', padding: 2, opacity: 0, transition: 'opacity 0.15s' }}
                    className="session-action"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Sidebar Footer */}
      <div style={{
        padding: '16px 12px',
        borderTop: '1px solid var(--border-color)',
        background: 'rgba(0, 0, 0, 0.05)',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
      }}>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
          System Designed & Crafted by
        </div>
        <div style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>
          VINAY
        </div>
      </div>
    </div>
  );
}

/* ─── AI Thought Matrix Drawer ───────────────────────────── */
function AIThoughtMatrix({ isOpen, onClose, matchInfo, isTyping }) {
  const strategyLabel = matchInfo?.strategy === 'exact'
    ? 'O(1) Exact Keyword Match'
    : matchInfo?.strategy === 'phrase'
      ? 'O(1) Phrase Match'
      : matchInfo?.strategy === 'token'
        ? 'Token Match'
        : matchInfo?.strategy === 'fallback'
          ? 'Gemini AI Fallback'
          : 'Idle';

  const isFallback = matchInfo?.strategy === 'fallback';

  return (
    <div style={{
      width: isOpen ? 340 : 0, minWidth: isOpen ? 340 : 0,
      height: '100%', overflow: 'hidden',
      transition: 'all 0.25s ease',
      background: '#0a0d10',
      borderLeft: isOpen ? '1px solid rgba(16, 163, 127, 0.2)' : 'none',
      display: 'flex', flexDirection: 'column',
      zIndex: 10,
    }}>
      {/* Title block */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid rgba(16, 163, 127, 0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#07090c',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color="#10a37f" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10a37f', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            IPO_THOUGHT_MATRIX.HUD
          </span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10a37f', display: 'flex', alignItems: 'center' }}>
          <X size={16} />
        </button>
      </div>

      {/* Main panel body */}
      <div style={{
        flex: 1, padding: 16, overflowY: 'auto',
        fontFamily: 'monospace', fontSize: '0.75rem',
        color: '#10a37f', background: '#050709',
        lineHeight: 1.5,
      }}>
        {isTyping ? (
          <div>
            {/* SVG Pipeline Animation during processing */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <svg width="220" height="80" viewBox="0 0 220 80">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <circle cx="30" cy="40" r="14" fill="none" stroke="#10a37f" strokeWidth="2" filter="url(#glow)">
                  <animate attributeName="r" values="12;16;12" dur="1s" repeatCount="indefinite" />
                </circle>
                <text x="30" y="44" textAnchor="middle" fill="#10a37f" fontSize="10" fontWeight="bold">IN</text>

                <line x1="44" y1="40" x2="106" y2="40" stroke="#10a37f" strokeWidth="1.5" strokeDasharray="4,4">
                  <animate attributeName="stroke-dashoffset" values="0;-20" dur="1s" repeatCount="indefinite" />
                </line>

                <circle cx="120" cy="40" r="14" fill="none" stroke="#8e8e8e" strokeWidth="1.5" />
                <text x="120" y="44" textAnchor="middle" fill="#8e8e8e" fontSize="10">PRC</text>

                <line x1="134" y1="40" x2="176" y2="40" stroke="#8e8e8e" strokeWidth="1.5" strokeDasharray="4,4" />

                <circle cx="190" cy="40" r="14" fill="none" stroke="#8e8e8e" strokeWidth="1.5" />
                <text x="190" y="44" textAnchor="middle" fill="#8e8e8e" fontSize="9">OUT</text>
              </svg>
            </div>
            <div className="terminal-cursor" style={{ marginTop: 20 }}>
              <span className="terminal-glow-text">SYS_STATUS: PARSING INPUT & NORMALIZING...</span><br/>
              <span className="terminal-accent-text">&gt; CALCULATION: COMPUTING LOOKUP HASH KEYS...</span>
            </div>
          </div>
        ) : matchInfo ? (
          <div>
            {/* Visual SVG node pipeline loaded */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
              <svg width="280" height="90" viewBox="0 0 280 90">
                <defs>
                  <filter id="glow-teal">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <filter id="glow-purple">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Input Node */}
                <circle cx="30" cy="45" r="15" fill="#10a37f" fillOpacity="0.1" stroke="#10a37f" strokeWidth="2" filter="url(#glow-teal)" />
                <text x="30" y="49" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">INPUT</text>

                {/* Connection line 1 */}
                <line x1="45" y1="45" x2="105" y2="45" stroke="#10a37f" strokeWidth="2">
                  <animate attributeName="stroke-dashoffset" values="0;-20" dur="0.8s" repeatCount="indefinite" />
                </line>

                {/* Process Node */}
                <circle cx="120" cy="45" r="15" fill="#10a37f" fillOpacity="0.15" stroke="#10a37f" strokeWidth="2" filter="url(#glow-teal)" />
                <text x="120" y="49" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">PROC</text>

                {/* Connection line 2 */}
                <line x1="135" y1="45" x2="195" y2="45" stroke={isFallback ? "#8b5cf6" : "#10a37f"} strokeWidth="2" />

                {/* Output Node */}
                <circle cx="210" cy="45" r="15" fill={isFallback ? "#8b5cf6" : "#10a37f"} fillOpacity="0.15" stroke={isFallback ? "#8b5cf6" : "#10a37f"} strokeWidth="2" filter={isFallback ? "url(#glow-purple)" : "url(#glow-teal)"} />
                <text x="210" y="49" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">OUT</text>

                {/* AI Portal Node (floating offset for Gemini Fallback) */}
                {isFallback && (
                  <>
                    <path d="M 120 30 L 165 15 L 210 30" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3,3" />
                    <circle cx="165" cy="15" r="12" fill="#8b5cf6" fillOpacity="0.2" stroke="#8b5cf6" strokeWidth="2" filter="url(#glow-purple)" />
                    <text x="165" y="18" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">GEMINI</text>
                  </>
                )}
              </svg>
            </div>

            {/* Diagnostic Logs HUD cards */}
            <div className="futuristic-card" style={{ padding: 12, borderRadius: 8, marginBottom: 12, border: '1px solid rgba(16,163,127,0.25)' }}>
              <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Terminal size={14} color="#10a37f" />
                STAGE 1: INPUT SANITIZATION
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                &gt; Raw Input: <span style={{ color: '#10a37f' }}>"{matchInfo.raw_input}"</span><br />
                &gt; Sanitized: <span style={{ color: '#10a37f' }}>"{matchInfo.sanitized_input}"</span><br />
                &gt; Lowercase: YES | collapsing-whitespace: YES
              </div>
            </div>

            <div className="futuristic-card" style={{ padding: 12, borderRadius: 8, marginBottom: 12, border: '1px solid rgba(16,163,127,0.25)' }}>
              <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={14} color="#10a37f" />
                STAGE 2: intent MATCHING
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                &gt; Method: <span style={{ color: isFallback ? '#8b5cf6' : '#10a37f', fontWeight: 'bold' }}>{strategyLabel}</span><br />
                {matchInfo.matched_keyword && (
                  <span>&gt; Hash Key matched: <span style={{ color: '#00ffff' }}>"{matchInfo.matched_keyword}"</span><br /></span>
                )}
                &gt; Index lookup complexity: <span style={{ color: '#00ffff' }}>O(1) average</span><br />
                &gt; Engine Latency: <span style={{ color: '#00ffff' }}>{matchInfo.execution_time_ms} ms</span>
              </div>
            </div>

            <div className="futuristic-card" style={{ padding: 12, borderRadius: 8, border: isFallback ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(16, 163, 127, 0.25)' }}>
              <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bot size={14} color={isFallback ? "#8b5cf6" : "#10a37f"} />
                STAGE 3: telemetry OUTPUT
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                &gt; Analytics Logged: <span style={{ color: '#00ffff' }}>{matchInfo.hit_count_incremented ? 'hit_count += 1' : 'None (fallback)'}</span><br />
                &gt; Intent Category: <span style={{ color: '#00ffff' }}>{matchInfo.strategy ? matchInfo.strategy.toUpperCase() : "GENERAL"}</span><br />
                &gt; System State: <span style={{ color: '#00ff66' }}>CONNECTED_IDLE</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', color: '#4d9c61',
            textAlign: 'center', padding: 20, minHeight: 250
          }}>
            <Cpu size={24} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: 4 }}>NO ENGINE SESSION ACTIVE</p>
            <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>Send a message to view the real-time IPO execution thought matrix.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Chat Page ─────────────────────────────────────── */
export default function Chat() {
  const navigate = useNavigate();
  const {
    messages, activeSessionId, isTyping,
    createSession, selectSession, sendMessage, loadSessions, disconnect,
    isMatrixMode, logDrawerOpen, toggleMatrixMode, toggleLogDrawer,
    ws, isConnecting
  } = useChatStore();
  
  const isWsConnected = ws && ws.readyState === 1; // WebSocket.OPEN
  const { user, token, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const lastBotMessage = [...messages].reverse().find(m => m.role === 'bot');
  const activeMatchInfo = lastBotMessage?.match_info;

  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        toast.success("Voice transcribed successfully!");
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech Recognition is not supported by your browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    if (token) {
      loadSessions();
    }
    return () => disconnect();
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text) => {
    const msg = text || input.trim();
    if (!msg || !activeSessionId) return;
    const success = sendMessage(msg);
    if (success) {
      setInput('');
      inputRef.current?.focus();
    } else {
      toast.error('WebSocket disconnected. Reconnecting...');
    }
  };

  const handleNewChat = async () => {
    try {
      const session = await createSession();
      selectSession(session.id);
    } catch (err) {
      toast.error('Failed to create chat');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={isMatrixMode ? "matrix-active" : ""} style={{ height: '100vh', display: 'flex', overflow: 'hidden', background: 'var(--bg-primary)', position: 'relative' }}>
      {/* Matrix overlays */}
      <div className="matrix-grid-overlay" />
      <div className="scanline" />

      {/* Sidebar */}
      {token && <SessionSidebar isOpen={sidebarOpen} />}

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 2 }}>
        {/* Minimal header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost" style={{ padding: 6 }}>
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                LogicFlow
              </span>
              {activeSessionId && (
                <div 
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isWsConnected ? '#10a37f' : isConnecting ? '#f59e0b' : '#ef4444',
                    boxShadow: isWsConnected ? '0 0 6px #10a37f' : isConnecting ? '0 0 6px #f59e0b' : '0 0 6px #ef4444',
                    transition: 'all 0.3s ease'
                  }}
                  title={isWsConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected (Offline)'}
                />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={toggleMatrixMode}
              className="btn-ghost"
              style={{ padding: 6, color: isMatrixMode ? '#00ff66' : 'var(--text-secondary)' }}
              title="Toggle Matrix Grid Mode"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={toggleLogDrawer}
              className="btn-ghost"
              style={{ padding: 6, color: logDrawerOpen ? '#10a37f' : 'var(--text-secondary)' }}
              title="Toggle HUD Thought Matrix"
            >
              <Cpu size={16} />
            </button>
            <button onClick={toggleTheme} className="btn-ghost" style={{ padding: 6 }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => navigate('/admin')} className="btn-ghost" style={{ padding: 6 }} title="Control Panel">
              <Settings size={16} />
            </button>
            <button onClick={() => navigate('/')} className="btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 10px' }}>
              Home
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!activeSessionId ? (
            /* Empty State */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', animation: 'fade-in 0.5s ease',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
                boxShadow: '0 4px 12px var(--accent-glow)'
              }}>
                <Bot size={24} color="white" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                How can I help you today?
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 28, textAlign: 'center', maxWidth: 400, fontSize: '0.9rem' }}>
                Start a new conversation to explore the rule-based AI engine.<br/>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, display: 'block' }}>
                  System Designed & Engineered with ❤️ by <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Vinay</span>
                </span>
              </p>
              <button onClick={handleNewChat} className="btn-primary" style={{ padding: '10px 24px' }}>
                <Plus size={16} /> New Chat
              </button>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble key={msg.id || i} message={msg} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Holographic Voice Waveform overlay */}
        {activeSessionId && <VoiceWaveform isListening={isListening} />}

        {/* Input Area — centered pill input */}
        {activeSessionId && (
          <div style={{
            padding: '12px 16px 20px',
            background: 'var(--bg-primary)',
          }}>
            <div style={{ maxWidth: 768, margin: '0 auto' }}>
              <QuickReplies onSelect={(v) => handleSend(v)} />
              <div style={{
                display: 'flex', gap: 8, alignItems: 'flex-end',
                background: 'var(--input-bg)',
                borderRadius: 24, padding: '4px 8px 4px 16px',
                border: '1px solid var(--border-color)',
              }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message LogicFlow..."
                  rows={1}
                  style={{
                    flex: 1, resize: 'none', minHeight: 40, maxHeight: 120,
                    paddingTop: 10, paddingBottom: 10,
                    background: 'transparent', border: 'none', outline: 'none',
                    color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
                    fontSize: '0.92rem',
                  }}
                  id="chat-input"
                />
                <button
                  onClick={toggleListening}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isListening ? '#ef4444' : 'transparent',
                    color: isListening ? 'white' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                  className={isListening ? "pulsing-mic" : ""}
                  title={isListening ? "Listening... click to stop" : "Voice dictation"}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    flexShrink: 0, cursor: input.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: input.trim() ? 'var(--text-primary)' : 'var(--bg-surface-hover)',
                    color: input.trim() ? 'var(--bg-primary)' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                  id="chat-send"
                >
                  <ArrowUp size={16} />
                </button>
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 8 }}>
                LogicFlow uses rule-based matching with AI fallback. Responses may vary.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Futuristic HUD AI Thought Matrix Drawer */}
      <AIThoughtMatrix
        isOpen={logDrawerOpen}
        onClose={toggleLogDrawer}
        matchInfo={activeMatchInfo}
        isTyping={isTyping}
      />
    </div>
  );
}
