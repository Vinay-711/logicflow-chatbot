import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock WebSocket
class WebSocketMock {
  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen();
    }, 10);
  }
  send(message) {
    // Echo or no-op
  }
  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose({ code: 1000, reason: 'Normal closure' });
  }
}
Object.defineProperty(window, 'WebSocket', { value: WebSocketMock });

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();
