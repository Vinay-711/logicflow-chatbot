import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Chat from '../pages/Chat';
import useChatStore from '../stores/chatStore';
import useAuthStore from '../stores/authStore';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

// Mock Zustand stores
vi.mock('../stores/chatStore', () => {
  const store = {
    messages: [],
    activeSessionId: null,
    isTyping: false,
    createSession: vi.fn(),
    selectSession: vi.fn(),
    sendMessage: vi.fn(),
    loadSessions: vi.fn(),
    disconnect: vi.fn(),
    sessions: [],
  };
  const useChatStoreMock = (selector) => selector ? selector(store) : store;
  Object.assign(useChatStoreMock, {
    getState: () => store,
    subscribe: vi.fn(),
  });
  return { default: useChatStoreMock };
});

vi.mock('../stores/authStore', () => {
  const store = {
    user: { id: 1, email: 'test@example.com', username: 'TestUser', is_admin: false },
    token: 'mock-token',
    logout: vi.fn(),
  };
  const useAuthStoreMock = (selector) => selector ? selector(store) : store;
  Object.assign(useAuthStoreMock, {
    getState: () => store,
    subscribe: vi.fn(),
  });
  return { default: useAuthStoreMock };
});

describe('Chat Component Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders welcome screen when no session is active', () => {
    render(<Chat />);
    expect(screen.getByText(/How can I help you today\?/i)).toBeInTheDocument();
    expect(screen.getByText("New Chat")).toBeInTheDocument();
  });

  it('triggers session creation when clicking Start New Chat', () => {
    const store = useChatStore.getState();
    store.createSession.mockResolvedValueOnce({ id: 123, title: 'New Chat' });

    render(<Chat />);
    const button = screen.getByRole('button', { name: "New Chat" });
    fireEvent.click(button);

    expect(store.createSession).toHaveBeenCalled();
  });
});
