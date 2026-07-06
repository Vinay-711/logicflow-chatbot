/**
 * Theme Store — Zustand store for dark/light theme management.
 */

import { create } from 'zustand';

const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem('theme') || 'dark',

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    set({ theme: newTheme });
  },

  initTheme: () => {
    const theme = get().theme;
    document.documentElement.setAttribute('data-theme', theme);
  },
}));

export default useThemeStore;
