import { create } from 'zustand'

interface AuthState {
  userId: string | null
  nickname: string | null
  role: string | null
  tokenBalance: number
  accessToken: string | null
  isAuthenticated: boolean
  needsOnboarding: boolean
  profileImageUrl: string | null
  setAuth: (userId: string, nickname: string, role: string, tokenBalance: number, accessToken: string) => void
  setNeedsOnboarding: (value: boolean) => void
  setTokenBalance: (balance: number) => void
  setProfileImageUrl: (url: string | null) => void
  logout: () => void
}

// 로컬 스토리지에서 초기값을 가져오는 로직
const getStoredValue = (key: string) => localStorage.getItem(key);

export const useAuthStore = create<AuthState>((set) => ({
  // 초기 상태 설정
  userId: getStoredValue('userId'),
  nickname: getStoredValue('nickname'),
  role: getStoredValue('role'),
  tokenBalance: Number(getStoredValue('tokenBalance')) || 0,
  accessToken: getStoredValue('accessToken'),
  isAuthenticated: !!getStoredValue('accessToken'),
  needsOnboarding: getStoredValue('needsOnboarding') === 'true',
  profileImageUrl: getStoredValue('profileImageUrl'),

  // 로그인 시 정보 저장
  setAuth: (userId, nickname, role, tokenBalance, accessToken) => {
    localStorage.setItem('userId', userId)
    localStorage.setItem('nickname', nickname)
    localStorage.setItem('role', role)
    localStorage.setItem('tokenBalance', String(tokenBalance))
    localStorage.setItem('accessToken', accessToken)

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

  setProfileImageUrl: (url) => {
    if (url) localStorage.setItem('profileImageUrl', url)
    else localStorage.removeItem('profileImageUrl')
    set({ profileImageUrl: url })
  },

  logout: () => {
    // 로컬 스토리지 삭제
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
    localStorage.removeItem('nickname')
    localStorage.removeItem('role')
    localStorage.removeItem('tokenBalance')
    localStorage.removeItem('needsOnboarding')
    localStorage.removeItem('profileImageUrl')

    // Zustand 상태 초기화
    set({
      userId: null,
      nickname: null,
      role: null,
      tokenBalance: 0,
      accessToken: null,
      isAuthenticated: false,
      needsOnboarding: false,
      profileImageUrl: null
    })
  },
}))