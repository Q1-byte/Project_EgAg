import { create } from 'zustand'

interface AuthState {
  userId: string | null
  nickname: string | null
  tokenBalance: number
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (userId: string, nickname: string, tokenBalance: number, accessToken: string) => void
  setTokenBalance: (balance: number) => void
  logout: () => void
}

const storedToken = localStorage.getItem('accessToken')
const storedUserId = localStorage.getItem('userId')
const storedNickname = localStorage.getItem('nickname')
const storedBalance = localStorage.getItem('tokenBalance')

export const useAuthStore = create<AuthState>((set) => ({
  userId: storedUserId,
  nickname: storedNickname,
  tokenBalance: storedBalance ? parseInt(storedBalance) : 0,
  accessToken: storedToken,
  isAuthenticated: !!storedToken,
  setAuth: (userId, nickname, tokenBalance, accessToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('userId', userId)
    localStorage.setItem('nickname', nickname)
    localStorage.setItem('tokenBalance', String(tokenBalance))
    set({ userId, nickname, tokenBalance, accessToken, isAuthenticated: true })
  },
  setTokenBalance: (balance) => {
    localStorage.setItem('tokenBalance', String(balance))
    set({ tokenBalance: balance })
  },
  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('nickname')
    localStorage.removeItem('tokenBalance')
    set({ userId: null, nickname: null, tokenBalance: 0, accessToken: null, isAuthenticated: false })
  },
}))
