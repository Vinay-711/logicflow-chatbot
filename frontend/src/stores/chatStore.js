/**
 * Chat Store — Zustand store for chat sessions and WebSocket management.
 */

import { create } from 'zustand';
import { api, createChatWebSocket } from '../api/client';
import { matchRuleBasedIntent, getLocalSessions, saveLocalSessions } from '../api/clientEngine';

const useChatStore = create((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isTyping: false,
  ws: null,
  isConnecting: false,
  isMatrixMode: false,
  logDrawerOpen: false,

  toggleMatrixMode: () => set((state) => ({ isMatrixMode: !state.isMatrixMode })),
  toggleLogDrawer: () => set((state) => ({ logDrawerOpen: !state.logDrawerOpen })),
  setLogDrawer: (open) => set({ logDrawerOpen: open }),

  /**
   * Load all chat sessions for the current user.
   */
  loadSessions: async () => {
    try {
      const sessions = await api.get('/chat/sessions');
      if (Array.isArray(sessions) && sessions.length > 0) {
        set({ sessions });
        return;
      }
    } catch (err) {
      // Fallback to local sessions
    }
    const local = getLocalSessions();
    set({ sessions: local });
  },

  /**
   * Create a new chat session.
   */
  createSession: async (title = 'New Chat') => {
    try {
      const session = await api.post('/chat/sessions', { title });
      if (session) {
        set((state) => ({
          sessions: [session, ...state.sessions],
        }));
        return session;
      }
    } catch (err) {
      // Fallback
    }

    const local = getLocalSessions();
    const newSession = {
      id: Date.now(),
      title,
      created_at: new Date().toISOString(),
      messages: []
    };
    saveLocalSessions([newSession, ...local]);
    set((state) => ({
      sessions: [newSession, ...state.sessions],
    }));
    return newSession;
  },

  /**
   * Select and load a chat session.
   */
  selectSession: async (sessionId) => {
    // Close existing WebSocket
    const { ws } = get();
    if (ws) {
      ws.close();
    }

    set({ activeSessionId: sessionId, messages: [], isTyping: false });

    try {
      const session = await api.get(`/chat/sessions/${sessionId}`);
      if (session && session.messages) {
        set({ messages: session.messages || [] });
        get().connectWebSocket(sessionId);
        return;
      }
    } catch (err) {
      // Fallback
    }

    const local = getLocalSessions();
    const found = local.find(s => String(s.id) === String(sessionId));
    set({ messages: found?.messages || [] });

    // Connect WebSocket if available
    get().connectWebSocket(sessionId);
  },

  /**
   * Connect WebSocket for real-time chat.
   */
  connectWebSocket: (sessionId) => {
    set({ isConnecting: true });

    const ws = createChatWebSocket(
      sessionId,
      (data) => {
        const { type } = data;

        if (type === 'typing') {
          set({ isTyping: true });
        } else if (type === 'message' || type === 'farewell') {
          set((state) => ({
            isTyping: false,
            messages: [...state.messages, {
              id: Date.now(),
              role: data.role || 'bot',
              content: data.content,
              matched_intent_id: data.matched_intent,
              timestamp: data.timestamp || new Date().toISOString(),
              match_info: data.match_info,
            }],
          }));
        } else if (type === 'error') {
          console.error('Chat error:', data.content);
          set({ isTyping: false });
        }
      },
      (error) => {
        console.error('WebSocket error:', error);
        set({ isConnecting: false });
      }
    );

    ws.onopen = () => {
      set({ isConnecting: false });
    };

    ws.onclose = (event) => {
      set({ ws: null, isConnecting: false });
    };

    set({ ws });
  },

  /**
   * Send a message through WebSocket, with automatic rule-based client engine fallback.
   */
  sendMessage: (content) => {
    const { ws, activeSessionId } = get();

    // Add user message to local state immediately
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
    }));

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'message', content }));
      return true;
    }

    // Client-side fallback rule-based chat engine
    set({ isTyping: true });
    setTimeout(() => {
      const match = matchRuleBasedIntent(content);
      const botMsg = {
        id: Date.now() + 1,
        role: 'bot',
        content: match.response,
        matched_intent_id: match.intent,
        timestamp: new Date().toISOString(),
        match_info: {
          strategy: match.strategy,
          confidence: match.confidence,
          matched_keyword: match.matched_keyword
        }
      };

      set((state) => {
        const nextMessages = [...state.messages, botMsg];
        const local = getLocalSessions();
        const updated = local.map(s => String(s.id) === String(activeSessionId) ? { ...s, messages: nextMessages } : s);
        saveLocalSessions(updated);
        return {
          isTyping: false,
          messages: nextMessages,
        };
      });
    }, 450);

    return true;
  },

  /**
   * Rename a session.
   */
  renameSession: async (sessionId, title) => {
    try {
      const updated = await api.put(`/chat/sessions/${sessionId}`, { title });
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, title: updated.title } : s
        ),
      }));
    } catch (err) {
      console.error('Failed to rename session:', err);
      throw err;
    }
  },

  /**
   * Delete a session.
   */
  deleteSession: async (sessionId) => {
    try {
      await api.delete(`/chat/sessions/${sessionId}`);
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
        activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
        messages: state.activeSessionId === sessionId ? [] : state.messages,
      }));

      // Close WebSocket if deleting active session
      const { ws, activeSessionId } = get();
      if (activeSessionId === sessionId && ws) {
        ws.close();
        set({ ws: null });
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      throw err;
    }
  },

  /**
   * Disconnect WebSocket and cleanup.
   */
  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.close();
    }
    set({ ws: null, isTyping: false });
  },
}));

export default useChatStore;
