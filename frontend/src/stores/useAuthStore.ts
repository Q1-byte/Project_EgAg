import { create } from 'zustand'

interface AuthState {
  userId: string | null
  nickname: string | null
  role: string | null
  tokenBalance: number
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (userId: string, nickname: string, role: string, tokenBalance: number, accessToken: string) => void
  needsOnboarding: boolean
  setAuth: (userId: string, nickname: string, tokenBalance: number, accessToken: string) => void
  setNeedsOnboarding: (value: boolean) => void
  setTokenBalance: (balance: number) => void
  logout: () => void
}

// 초기값 로드 로직을 함수화하여 가독성 향상
const getInitialAuth = () => {
  const accessToken = localStorage.getItem('accessToken');
  const role = localStorage.getItem('role');
  return {
    accessToken,
    role,
    userId: localStorage.getItem('userId'),
    nickname: localStorage.getItem('nickname'),
    tokenBalance: Number(localStorage.getItem('tokenBalance')) || 0,
    // 토큰과 역할이 모두 있어야 정상적인 관리자/유저 상태로 간주
    isAuthenticated: !!accessToken,
  };
};

const initialAuth = getInitialAuth();
const storedToken = localStorage.getItem('accessToken')
const storedUserId = localStorage.getItem('userId')
const storedNickname = localStorage.getItem('nickname')
const storedBalance = localStorage.getItem('tokenBalance')
const storedNeedsOnboarding = localStorage.getItem('needsOnboarding') === 'true'

export const useAuthStore = create<AuthState>((set) => ({
  userId: storedUserId,
  nickname: storedNickname,
  tokenBalance: storedBalance ? parseInt(storedBalance) : 0,
  accessToken: storedToken,
  isAuthenticated: !!storedToken,
  needsOnboarding: storedNeedsOnboarding,
  setAuth: (userId, nickname, tokenBalance, accessToken) => {
  ...initialAuth,

  setAuth: (userId, nickname, role, tokenBalance, accessToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('userId', userId)
    localStorage.setItem('nickname', nickname)
    localStorage.setItem('role', role)
    localStorage.setItem('tokenBalance', String(tokenBalance))

    set({
      userId,
      nickname,
      role,
      tokenBalance,
      accessToken,
      isAuthenticated: true
    })
  },
  setNeedsOnboarding: (value) => {
    if (value) localStorage.setItem('needsOnboarding', 'true')
    else localStorage.removeItem('needsOnboarding')
    set({ needsOnboarding: value })
  },

  setTokenBalance: (balance) => {
    localStorage.setItem('tokenBalance', String(balance))
    set({ tokenBalance: balance })
  },

  logout: () => {
    // 1️⃣ 로컬 스토리지 싹 비우기
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('nickname')
    localStorage.removeItem('role') // ⭐ 추가
    localStorage.removeItem('tokenBalance')

    // 2️⃣ Zustand 상태 초기화
    set({
      userId: null,
      nickname: null,
      role: null, // ⭐ 추가
      tokenBalance: 0,
      accessToken: null,
      isAuthenticated: false
    })
    localStorage.removeItem('needsOnboarding')
    set({ userId: null, nickname: null, tokenBalance: 0, accessToken: null, isAuthenticated: false, needsOnboarding: false })
  },
}))
