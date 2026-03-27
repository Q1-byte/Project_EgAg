import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'

const TOSS_CLIENT_KEY: string = (import.meta as any).env?.VITE_TOSS_CLIENT_KEY ?? ''

export default function TossPayPage() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const orderId = searchParams.get('orderId')
    const amount = Number(searchParams.get('amount'))
    const orderName = searchParams.get('orderName') || '토큰 충전'
    const callbackUrl = searchParams.get('callbackUrl') || `${window.location.origin}/token-shop?status=toss_success`
    const failUrl = `${window.location.origin}/token-shop?status=fail`

    if (!orderId || !amount) return

    loadTossPayments(TOSS_CLIENT_KEY).then(tossPayments => {
      const payment = tossPayments.payment({ customerKey: `toss_${orderId}` })
      return payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: amount },
        orderId,
        orderName,
        successUrl: callbackUrl,
        failUrl,
        card: { flowMode: 'DIRECT', easyPay: 'TOSSPAY' },
      })
    }).catch(() => {
      window.location.href = failUrl
    })
  }, [])

  return null
}
