import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email?: string;
  name: string;
  role: string; // 호환성 유지 (ADMIN 등)
  grade: string; // 회원 등급 (MEMBER, AGENT, MANAGER, BRANCH_CHIEF, DIVISION_CHIEF, CENTER, ADMIN)
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Auth state rehydration error:', error);
          return;
        }
        // 토큰과 user 상태 동기화
        // localStorage에 토큰이 없는데 Zustand에 user가 있으면 상태 초기화
        const token = localStorage.getItem('token');
        if (!token && state?.user) {
          console.warn('Token not found in localStorage, clearing auth state');
          useAuthStore.getState().logout();
        }
        // 반대로 토큰이 있는데 user가 없으면 토큰도 삭제
        if (token && !state?.user) {
          console.warn('User not found in auth state, clearing token');
          localStorage.removeItem('token');
        }
      },
    },
  ),
);
