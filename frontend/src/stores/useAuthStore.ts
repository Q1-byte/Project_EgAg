import { create } from 'zustand'

interface User {
  id: string
  email: string
  nickname: string
  profileImageUrl: string | null
  role: string
  tokenBalance: number
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, token) => {
    localStorage.setItem('accessToken', token)
    set({ user, accessToken: token, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('accessToken')
    set({ user: null, accessToken: null, isAuthenticated: false })
  },
}))
