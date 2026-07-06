/**
 * Chat Store — Zustand store for chat sessions and WebSocket management.
 */

import { create } from 'zustand';
import { api, createChatWebSocket } from '../api/client';

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
      set({ sessions });
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  },

  /**
   * Create a new chat session.
   */
  createSession: async (title = 'New Chat') => {
    try {
      const session = await api.post('/chat/sessions', { title });
      set((state) => ({
        sessions: [session, ...state.sessions],
      }));
      return session;
    } catch (err) {
      console.error('Failed to create session:', err);
      throw err;
    }
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
      set({ messages: session.messages || [] });
    } catch (err) {
      console.error('Failed to load session:', err);
    }

    // Connect WebSocket
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
      console.log('WebSocket closed:', event.code, event.reason);
      set({ ws: null, isConnecting: false });
      
      // Auto-reconnect if the session is still active
      if (get().activeSessionId === sessionId) {
        console.log('Attempting WebSocket auto-reconnect in 2 seconds...');
        setTimeout(() => {
          if (get().activeSessionId === sessionId) {
            get().connectWebSocket(sessionId);
          }
        }, 2000);
      }
    };

    set({ ws });
  },

  /**
   * Send a message through WebSocket.
   * Returns true if sent successfully, false otherwise.
   */
  sendMessage: (content) => {
    const { ws, activeSessionId } = get();
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }

    // Add user message to local state immediately
    set((state) => ({
      messages: [...state.messages, {
        id: Date.now(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      }],
    }));

    // Send via WebSocket
    ws.send(JSON.stringify({ type: 'message', content }));
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
