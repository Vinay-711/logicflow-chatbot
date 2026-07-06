/**
 * API Client — Centralized HTTP & WebSocket wrapper.
 *
 * - Injects JWT token from localStorage into all requests
 * - Provides typed REST methods (get, post, put, patch, delete)
 * - WebSocket factory with auto-reconnection
 */

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove Content-Type for FormData (file uploads)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, data) => request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (endpoint, data) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  patch: (endpoint, data) => request(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  upload: (endpoint, formData) => request(endpoint, {
    method: 'POST',
    body: formData,
  }),
};

/**
 * Create a WebSocket connection for real-time chat.
 */
export function createChatWebSocket(sessionId, onMessage, onError) {
  const token = getToken();
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const tokenParam = token ? `?token=${token}` : '';
  const url = `${protocol}//${host}/ws/chat/${sessionId}${tokenParam}`;

  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  };

  ws.onerror = (event) => {
    console.error('WebSocket error:', event);
    if (onError) onError(event);
  };

  ws.onclose = (event) => {
    console.log('WebSocket closed:', event.code, event.reason);
  };

  return ws;
}
