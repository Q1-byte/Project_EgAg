import { useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuthStore } from '../stores/useAuthStore'

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null // ms 단위로 변환
  } catch {
    return null
  }
}

export function useTokenRefresh() {
  const { accessToken, setAuth, nickname, userId, tokenBalance, logout } = useAuthStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!accessToken) return

    const expiry = getTokenExpiry(accessToken)
    if (!expiry) return

    // 만료 1분 전에 갱신 시도
    const delay = expiry - Date.now() - 60_000

    if (delay <= 0) {
      // 이미 만료됐거나 1분 이내 → 즉시 갱신
      refresh()
      return
    }

    timerRef.current = setTimeout(refresh, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [accessToken])

  async function refresh() {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) { logout(); return }

    try {
      const res = await axios.post('/api/auth/reissue', { refreshToken })
      const { accessToken: newAccess, refreshToken: newRefresh, role, tokenBalance: newBalance } = res.data
      localStorage.setItem('accessToken', newAccess)
      localStorage.setItem('refreshToken', newRefresh)
      const store = useAuthStore.getState()
      store.setAuth(
        userId ?? store.userId ?? '',
        nickname ?? store.nickname ?? '',
        role ?? localStorage.getItem('role') ?? 'USER',
        newBalance ?? tokenBalance ?? store.tokenBalance,
        newAccess
      )
    } catch {
      logout()
    }
  }
}
