/**
 * Auth Store — Zustand store for authentication state.
 * 
 * Bypassed version: Login system disabled, automatically authenticated as Admin.
 */

import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: { id: 1, email: "admin@logicflow.ai", username: "Admin", is_admin: true },
  token: "mocked-token-for-open-access",
  isLoading: false,
  error: null,

  get isAuthenticated() {
    return true;
  },

  get isAdmin() {
    return true;
  },

  init: async () => {
    // No-op
  },

  signup: async (email, password, username) => {
    return { access_token: "mocked", user: { id: 1, is_admin: true } };
  },

  login: async (email, password) => {
    return { access_token: "mocked", user: { id: 1, is_admin: true } };
  },

  logout: () => {
    // No-op
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
