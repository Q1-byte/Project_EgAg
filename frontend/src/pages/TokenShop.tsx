import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { useAuthStore } from '../stores/useAuthStore'
import Header from '../components/Header'
import { getPackages, requestBankTransfer, kakaoPayReady, tossPayConfirm } from '../api/payment'
import type { Package } from '../api/payment'

declare global {
  interface Window { IMP: any }
}

const TOSS_CLIENT_KEY = (import.meta as any).env?.VITE_TOSS_CLIENT_KEY || ''
const TOSS_WIDGET_KEY = (import.meta as any).env?.VITE_TOSS_WIDGET_KEY || ''

type PayMethod = 'kakaopay' | 'tosspay' | 'card' | 'bank'

interface BankInfo {
  bankName: string
  bankAccount: string
  accountHolder: string
  amount: number
  packageName: string
}

export default function TokenShop() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, nickname, tokenBalance, setTokenBalance } = useAuthStore()

  const [packages, setPackages] = useState<Package[]>([])
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null)
  const [payMethod, setPayMethod] = useState<PayMethod>('kakaopay')
  const [depositorName, setDepositorName] = useState('')
  const [selectedBank, setSelectedBank] = useState('kakao')
  const [loading, setLoading] = useState(false)
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [tossModal, setTossModal] = useState(false)
  const [tossModalReady, setTossModalReady] = useState(false)
  const [tossModalLoading, setTossModalLoading] = useState(false)
  const widgetsRef = useRef<any>(null)
  const tossOrderRef = useRef<string>('')

  useEffect(() => {
    getPackages().then(setPackages)

    // 카카오페이 결제 후 리다이렉트 처리
    const status = searchParams.get('status')
    if (status === 'success') {
      const tokens = searchParams.get('tokens')
      const balance = searchParams.get('balance')
      if (tokens) setSuccessMsg(`토큰 ${tokens}개가 충전되었습니다!`)
      if (balance) setTokenBalance(Number(balance))
    } else if (status === 'toss_success') {
      const paymentKey = searchParams.get('paymentKey')
      const orderId = searchParams.get('orderId')
      const amount = searchParams.get('amount')
      const packageId = sessionStorage.getItem('toss_package_id')
      sessionStorage.removeItem('toss_package_id')
      if (paymentKey && orderId && amount && packageId) {
        tossPayConfirm({ paymentKey, orderId, amount: Number(amount), packageId })
          .then(res => {
            if (res.newTokenBalance !== undefined) setTokenBalance(res.newTokenBalance)
            setSuccessMsg(`토큰이 충전되었습니다!`)
          })
          .catch((err: any) => {
            const msg = err?.response?.data?.message || err?.response?.data?.error?.message || '토스 결제 확인 중 오류가 발생했습니다.'
            setError(String(msg))
          })
      } else {
        setError('결제 정보가 올바르지 않습니다. 다시 시도해주세요.')
      }
    } else if (status === 'cancel') {
      setError('결제가 취소되었습니다.')
    } else if (status === 'fail') {
      setError('결제에 실패했습니다. 다시 시도해주세요.')
    }
  }, [])

  const handlePayment = async () => {
    if (!selectedPkg) { setError('패키지를 선택해주세요.'); return }
    if (!isAuthenticated) { navigate('/login'); return }

    setError('')
    setLoading(true)

    if (payMethod === 'kakaopay') {
      try {
        const { redirectUrl } = await kakaoPayReady(selectedPkg.id)
        window.location.href = redirectUrl
      } catch {
        setError('카카오페이 결제 준비 중 오류가 발생했습니다.')
        setLoading(false)
      }
      return
    }

    if (payMethod === 'tosspay') {
      try {
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
        const customerKey = (nickname || 'user').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)
        const payment = tossPayments.payment({ customerKey })
        const orderId = `egag_${selectedPkg.id.toLowerCase()}_${Date.now()}`
        sessionStorage.setItem('toss_package_id', selectedPkg.id)
        await payment.requestPayment({
          method: 'CARD',
          amount: { currency: 'KRW', value: selectedPkg.price },
          orderId,
          orderName: `${selectedPkg.displayName} (토큰 ${selectedPkg.tokenAmount}개)`,
          successUrl: `${window.location.origin}/token-shop?status=toss_success`,
          failUrl: `${window.location.origin}/token-shop?status=fail`,
          card: { flowMode: 'DIRECT', easyPay: 'TOSSPAY' },
        })
      } catch (err: any) {
        sessionStorage.removeItem('toss_package_id')
        setError(err?.message || '토스페이 결제 중 오류가 발생했습니다.')
      }
      setLoading(false)
      return
    }

    if (payMethod === 'card') {
      try {
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
        const customerKey = (nickname || 'user').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)
        const payment = tossPayments.payment({ customerKey })
        const orderId = `egag_${selectedPkg.id.toLowerCase()}_${Date.now()}`
        sessionStorage.setItem('toss_package_id', selectedPkg.id)
        await payment.requestPayment({
          method: 'CARD',
          amount: { currency: 'KRW', value: selectedPkg.price },
          orderId,
          orderName: `${selectedPkg.displayName} (토큰 ${selectedPkg.tokenAmount}개)`,
          successUrl: `${window.location.origin}/token-shop?status=toss_success`,
          failUrl: `${window.location.origin}/token-shop?status=fail`,
        })
      } catch (err: any) {
        sessionStorage.removeItem('toss_package_id')
        setError(err?.message || '카드 결제 중 오류가 발생했습니다.')
      }
      setLoading(false)
      return
    }

    if (payMethod === 'bank') {
      if (!depositorName.trim()) {
        setError('입금자명을 입력해주세요.')
        setLoading(false)
        return
      }
      try {
        const res = await requestBankTransfer({ packageId: selectedPkg.id, depositorName, bankType: selectedBank })
        setBankInfo({
          bankName: res.bankName!,
          bankAccount: res.bankAccount!,
          accountHolder: res.accountHolder!,
          amount: selectedPkg.price,
          packageName: selectedPkg.displayName,
        })
      } catch (err: any) {
        const msg = err?.response?.data?.error?.message || err?.response?.data?.message || '오류가 발생했습니다. 다시 시도해주세요.'
        setError(String(msg))
      }
      setLoading(false)
      return
    }

  }

  const openTossModal = () => {
    if (!selectedPkg || !TOSS_WIDGET_KEY) return
    setTossModal(true)
    setTossModalReady(false)
    widgetsRef.current = null

    const merchantUid = `egag_${selectedPkg.id.toLowerCase()}_${Date.now()}`
    tossOrderRef.current = merchantUid
    sessionStorage.setItem('toss_package_id', selectedPkg.id)

    setTimeout(async () => {
      try {
        const tossPayments = await loadTossPayments(TOSS_WIDGET_KEY)
        const customerKey = (nickname || 'user').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)
        const widgets = tossPayments.widgets({ customerKey })
        await widgets.setAmount({ currency: 'KRW', value: selectedPkg.price })
        await widgets.renderPaymentMethods({ selector: '#toss-modal-methods', variantKey: 'DEFAULT' })
        await widgets.renderAgreement({ selector: '#toss-modal-agreement', variantKey: 'AGREEMENT' })
        widgetsRef.current = widgets
        setTossModalReady(true)
      } catch (e: any) {
        sessionStorage.removeItem('toss_package_id')
        setTossModal(false)
        setError(e?.message || '토스 결제 초기화 실패')
      }
    }, 100)
  }

  const handleTossModalPay = async () => {
    if (!widgetsRef.current || !selectedPkg) return
    setTossModalLoading(true)
    try {
      await widgetsRef.current.requestPayment({
        orderId: tossOrderRef.current,
        orderName: `${selectedPkg.displayName} (토큰 ${selectedPkg.tokenAmount}개)`,
        successUrl: `${window.location.origin}/token-shop?status=toss_success`,
        failUrl: `${window.location.origin}/token-shop?status=fail`,
      })
    } catch (err: any) {
      sessionStorage.removeItem('toss_package_id')
      setError(err?.message || '결제 중 오류가 발생했습니다.')
      setTossModal(false)
    }
    setTossModalLoading(false)
  }

  const PKG_THEME: Record<string, { bg: string; glow: string; icon: React.ReactNode; accent: string }> = {
    BASIC:    { bg: 'linear-gradient(145deg,#fce8ed,#f2d0d8)', glow: 'rgba(196,122,138,0.22)', accent: '#c47a8a', icon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c47a8a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
    STANDARD: { bg: 'linear-gradient(145deg,#ddeaf8,#c8daf0)', glow: 'rgba(107,130,160,0.22)', accent: '#6B82A0', icon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6B82A0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/><circle cx="12" cy="12" r="3"/></svg> },
    PREMIUM:  { bg: 'linear-gradient(145deg,#ede0ff,#dbc8f8)', glow: 'rgba(139,92,246,0.22)', accent: '#7c3aed', icon: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5h4"/><path d="M18 9h2a2 2 0 0 0 2-2V5h-4"/><path d="M6 2h12v7a6 6 0 0 1-12 0V2z"/><path d="M12 15v4"/><path d="M8 19h8"/></svg> },
  }

  const PAY_METHODS = [
    { key: 'kakaopay' as PayMethod, label: '카카오페이', color: '#FEE500', textColor: '#3C1E1E',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.74 5.18 4.36 6.6l-.96 3.6 4.2-2.76c.78.12 1.58.18 2.4.18 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/></svg> },
    { key: 'tosspay'  as PayMethod, label: '토스페이',   color: '#0064FF', textColor: '#fff',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12l2.5 2.5L16 9"/></svg> },
    { key: 'card'     as PayMethod, label: '카드결제',   color: 'linear-gradient(135deg,#6B82A0,#c47a8a)', textColor: '#fff',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
    { key: 'bank'     as PayMethod, label: '무통장입금', color: 'rgba(255,255,255,0.85)', textColor: '#6B82A0',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B82A0" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  ]

  if (successMsg) {
    return (
      <div style={s.bg}>
        <Blobs />
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={s.resultCard}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#43aa8b,#2d8c72)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(67,170,139,0.35)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#1a1a2e', letterSpacing: -0.5 }}>충전 완료!</h2>
            <p style={{ margin: 0, fontSize: 15, color: '#6b7280', lineHeight: 1.7 }}>{successMsg}</p>
            <div style={{ background: 'rgba(107,130,160,0.08)', border: '1.5px solid rgba(107,130,160,0.2)', borderRadius: 16, padding: '14px 28px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 13, color: '#8a7a9a', fontWeight: 600 }}>현재 보유 토큰</p>
              <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 900, color: '#3a5a8a' }}>{tokenBalance}<span style={{ fontSize: 16, fontWeight: 600, marginLeft: 4 }}>개</span></p>
            </div>
            <button style={s.payBtn} onClick={() => navigate('/')}>홈으로 돌아가기</button>
          </div>
        </div>
      </div>
    )
  }

  if (bankInfo) {
    return (
      <div style={s.bg}>
        <Blobs />
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={s.resultCard}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#6B82A0,#4a6a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(107,130,160,0.35)' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#1a1a2e' }}>무통장 입금 안내</h2>
            <div style={{ width: '100%', background: 'rgba(245,240,248,0.7)', borderRadius: 18, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid rgba(107,130,160,0.12)' }}>
              {[
                { label: '은행', value: bankInfo.bankName },
                { label: '계좌번호', value: bankInfo.bankAccount },
                { label: '예금주', value: bankInfo.accountHolder },
                { label: '입금액', value: `${bankInfo.amount.toLocaleString()}원`, highlight: true },
                { label: '패키지', value: bankInfo.packageName },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#8a7a9a', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: highlight ? '#3a5a8a' : '#4a4a6a' }}>{value}</span>
                </div>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#a09ab0', textAlign: 'center', lineHeight: 1.7 }}>입금 확인 후 영업일 1일 이내 토큰이 지급됩니다.</p>
            <button style={s.payBtn} onClick={() => navigate('/')}>홈으로 돌아가기</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.bg}>
      <style>{`
        @keyframes ts-float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes ts-float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes ts-pop { 0%{transform:scale(0.92);opacity:0} 100%{transform:scale(1);opacity:1} }
        .pkg-card { transition: transform 0.18s, box-shadow 0.18s; }
        .pkg-card:hover { transform: translateY(-6px) scale(1.02) !important; }
        .pay-method { transition: all 0.15s; }
        .pay-method:hover { filter: brightness(1.06); transform: translateY(-2px); }
        .ts-pay-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .ts-pay-btn { transition: filter 0.15s, transform 0.15s; }
      `}</style>

      <Blobs />

      {tossModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#3a5a8a' }}>결제 수단 선택</h3>
              <button onClick={() => { setTossModal(false); sessionStorage.removeItem('toss_package_id') }}
                style={{ background: 'rgba(107,130,160,0.1)', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', color: '#6B82A0', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            {!tossModalReady && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#8a7a9a', fontSize: 14 }}>불러오는 중...</div>
            )}
            <div id="toss-modal-methods" />
            <div id="toss-modal-agreement" />
            {tossModalReady && (
              <button className="ts-pay-btn"
                style={{ ...s.payBtn, marginTop: 16, marginBottom: 0 }}
                onClick={handleTossModalPay}
                disabled={tossModalLoading}
              >
                {tossModalLoading ? '처리 중...' : `${selectedPkg?.price.toLocaleString()}원 결제하기`}
              </button>
            )}
          </div>
        </div>
      )}

      <Header />

      <main style={s.main}>
        {/* 히어로 */}
        <div style={{ textAlign: 'center', marginBottom: 8, animation: 'ts-pop 0.45s ease' }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#c47a8a', letterSpacing: 2, textTransform: 'uppercase' }}>Token Shop</p>
          <h1 style={s.title}>토큰 충전소</h1>
          <p style={s.subtitle}>AI 그림 기능을 마음껏 즐겨봐요</p>
          {tokenBalance !== undefined && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(107,130,160,0.2)', borderRadius: 100, padding: '8px 22px', marginTop: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B82A0" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/></svg>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#3a5a8a' }}>현재 보유 <strong style={{ fontSize: 17 }}>{tokenBalance}</strong>개</span>
            </div>
          )}
        </div>

        {/* 패키지 카드 */}
        <div style={s.packages}>
          {packages.map(pkg => {
            const theme = PKG_THEME[pkg.id] ?? PKG_THEME.BASIC
            const isSelected = selectedPkg?.id === pkg.id
            return (
              <div
                key={pkg.id}
                className="pkg-card"
                onClick={() => { setSelectedPkg(pkg); setError('') }}
                style={{
                  background: theme.bg,
                  borderRadius: 28, padding: '36px 28px 28px',
                  boxShadow: isSelected
                    ? `0 12px 40px ${theme.glow}, 0 0 0 2.5px ${theme.accent}`
                    : `0 6px 24px ${theme.glow}`,
                  width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  cursor: 'pointer', position: 'relative',
                  border: isSelected ? `2.5px solid ${theme.accent}` : '1.5px solid rgba(255,255,255,0.7)',
                  transform: isSelected ? 'translateY(-6px) scale(1.03)' : '',
                  transition: 'transform 0.18s, box-shadow 0.18s, border 0.18s',
                }}
              >
                {/* 배지 */}
                {pkg.id === 'BASIC' && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#c47a8a', color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '4px 14px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(196,122,138,0.4)' }}>입문</div>
                )}
                {pkg.popular && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#6B82A0', color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '4px 14px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(107,130,160,0.4)' }}>인기</div>
                )}
                {pkg.bestValue && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '4px 14px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(124,58,237,0.4)' }}>최고 혜택</div>
                )}
                <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  {theme.icon}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a2e', margin: 0, letterSpacing: -0.3 }}>{pkg.displayName}</h3>
                <div style={{ fontSize: 15, fontWeight: 700, color: theme.accent, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/></svg>
                  {pkg.tokenAmount}개
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#1a1a2e', letterSpacing: -1 }}>{pkg.price.toLocaleString()}원</div>
                <div style={{ fontSize: 12, color: '#9ca3af', background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '3px 10px' }}>개당 {Math.round(pkg.price / pkg.tokenAmount)}원</div>
                {isSelected && (
                  <div style={{ position: 'absolute', bottom: 14, right: 14, width: 22, height: 22, borderRadius: '50%', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 결제 수단 */}
        <div style={{ width: '100%', maxWidth: 620, marginBottom: 40 }}>
          <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#8a7a9a', letterSpacing: 1, marginBottom: 16, textTransform: 'uppercase' }}>결제 수단</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {PAY_METHODS.map(m => (
              <button
                key={m.key}
                className="pay-method"
                onClick={() => { setPayMethod(m.key); setError('') }}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                  padding: '16px 8px', borderRadius: 18, cursor: 'pointer',
                  background: payMethod === m.key ? m.color : 'rgba(255,255,255,0.7)',
                  border: payMethod === m.key ? 'none' : '1.5px solid rgba(107,130,160,0.18)',
                  boxShadow: payMethod === m.key ? '0 6px 20px rgba(0,0,0,0.12)' : 'none',
                  color: payMethod === m.key ? m.textColor : '#6B82A0',
                  fontWeight: 700, fontSize: 13,
                }}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {payMethod === 'bank' && (
            <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.7)', borderRadius: 18, padding: '20px', border: '1.5px solid rgba(107,130,160,0.15)' }}>
              <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#8a7a9a', margin: '0 0 12px' }}>입금 은행 선택</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {([
                  { key: 'kakao', label: '카카오뱅크' },
                  { key: 'toss',  label: '토스뱅크' },
                  { key: 'kb',    label: '국민은행' },
                  { key: 'shinhan', label: '신한은행' },
                ]).map(b => (
                  <button key={b.key} onClick={() => setSelectedBank(b.key)} style={{
                    flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: selectedBank === b.key ? '2px solid #6B82A0' : '1.5px solid rgba(107,130,160,0.2)',
                    background: selectedBank === b.key ? 'linear-gradient(135deg,rgba(107,130,160,0.15),rgba(196,122,138,0.12))' : 'rgba(255,255,255,0.8)',
                    color: selectedBank === b.key ? '#3a5a8a' : '#6B82A0',
                  }}>{b.label}</button>
                ))}
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#6B82A0', margin: '0 0 8px' }}>입금자명</p>
              <input style={s.depositorInput} placeholder="입금 시 사용할 이름을 입력하세요" value={depositorName} onChange={e => setDepositorName(e.target.value)} />
            </div>
          )}
        </div>

        {error && (
          <div style={{ width: '100%', maxWidth: 620, background: 'rgba(254,242,242,0.9)', border: '1px solid #FECACA', borderRadius: 12, padding: '10px 16px', fontSize: 13, color: '#DC2626', marginBottom: 16, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <button className="ts-pay-btn"
          style={{ ...s.payBtn, opacity: loading || !selectedPkg ? 0.6 : 1 }}
          onClick={handlePayment}
          disabled={loading || !selectedPkg}
        >
          {loading ? '처리 중...' : selectedPkg ? `${selectedPkg.price.toLocaleString()}원 결제하기` : '패키지를 선택해주세요'}
        </button>

        <button style={s.backBtn} onClick={() => navigate(-1)}>돌아가기</button>
      </main>
    </div>
  )
}

function Blobs() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-10%', left: '-8%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle,#d8e8f5 0%,transparent 70%)', animation: 'ts-float1 7s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: '20%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,#f2d8dc 0%,transparent 70%)', animation: 'ts-float2 9s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '5%', left: '20%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,#eddff5 0%,transparent 70%)', animation: 'ts-float1 11s ease-in-out infinite' }} />
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #f5f0f8 0%, #ede8f2 40%, #f0eee9 100%)',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px', height: 70, overflow: 'hidden',
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)',
    position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
    width: 'calc(100% - 48px)', maxWidth: 960,
    borderRadius: 100,
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
    border: '1px solid rgba(255,255,255,0.8)',
    zIndex: 100,
  },
  logo: { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  logoText: { fontSize: 20, fontWeight: 700, color: '#3a5a8a' },
  userGreet: { fontSize: 14, fontWeight: 600, color: '#4a4a6a' },
  tokenBadge: {
    fontSize: 13, fontWeight: 700, color: '#6B82A0',
    background: 'rgba(107,130,160,0.12)', border: '1px solid rgba(107,130,160,0.25)',
    borderRadius: 20, padding: '4px 14px',
  },
  navBtn: {
    fontSize: 13, fontWeight: 500, color: '#8a8aaa',
    background: 'none', border: '1px solid #ddd',
    borderRadius: 20, padding: '6px 16px', cursor: 'pointer',
  },
  main: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '130px 24px 80px',
  },
  title: {
    fontSize: 34, fontWeight: 800, margin: '48px 0 16px', letterSpacing: 2,
    padding: '4px 8px',
    background: 'linear-gradient(135deg, #3a5a8a 0%, #c47a8a 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  subtitle: { fontSize: 16, color: '#8a7a9a', margin: '0 0 48px' },
  packages: { display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 56, marginTop: 56 },
  pkgCard: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(245,240,248,0.7) 100%)',
    borderRadius: 28, padding: '32px 24px',
    boxShadow: '0 4px 24px rgba(107,130,160,0.10)', width: 200,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    cursor: 'pointer', border: '1.5px solid rgba(255,255,255,0.7)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    position: 'relative',
  },
  pkgCardSelected: {
    border: '2px solid #6B82A0',
    boxShadow: '0 8px 32px rgba(107,130,160,0.22)',
    transform: 'translateY(-4px)',
  },
  pkgCardPopular: {},
  badge: {
    position: 'absolute', top: -22, left: '50%', transform: 'translate(-50%, -100%)',
    background: '#7C3AED', color: '#fff', fontSize: 12, fontWeight: 700,
    borderRadius: 20, padding: '4px 0', whiteSpace: 'nowrap',
    width: 86, textAlign: 'center',
  },
  pkgIcon: { fontSize: 28, marginBottom: 4 },
  pkgName: { fontSize: 20, fontWeight: 800, color: '#4a4a6a', margin: 0 },
  pkgTokens: { fontSize: 16, fontWeight: 700, color: '#4a4a6a' },
  pkgPrice: { fontSize: 22, fontWeight: 800, color: '#4a4a6a' },
  pkgPer: { fontSize: 12, color: '#9CA3AF' },
  section: { width: '100%', maxWidth: 620, marginBottom: 56 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#3a5a8a', marginBottom: 16, textAlign: 'center' },
  methodRow: { display: 'flex', gap: 12 },
  methodBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '16px 12px', border: '1.5px solid rgba(107,130,160,0.2)', borderRadius: 18,
    background: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#6B82A0',
    transition: 'all 0.15s',
  },
  methodBtnActive: {
    border: '2px solid #6B82A0',
    background: 'linear-gradient(135deg, rgba(107,130,160,0.12) 0%, rgba(196,122,138,0.10) 100%)',
    color: '#3a5a8a',
  },
  depositorWrap: { marginTop: 32 },
  depositorLabel: { display: 'block', fontSize: 14, fontWeight: 600, color: '#6B82A0', marginBottom: 6 },
  depositorInput: {
    width: '100%', padding: '12px 14px', fontSize: 15,
    border: '1.5px solid rgba(107,130,160,0.25)', borderRadius: 12, outline: 'none',
    background: 'rgba(255,255,255,0.8)',
    boxSizing: 'border-box',
  },
  errorBox: {
    width: '100%', maxWidth: 620, background: 'rgba(254,242,242,0.9)', border: '1px solid #FECACA',
    borderRadius: 12, padding: '8px 12px', fontSize: 13, color: '#DC2626', marginBottom: 26,
    boxSizing: 'border-box', marginTop: -28,
  },
  payBtn: {
    width: '100%', maxWidth: 620, padding: '16px', fontSize: 17, fontWeight: 800,
    color: '#fff', border: 'none', borderRadius: 16, cursor: 'pointer',
    background: 'linear-gradient(135deg, #6B82A0, #c47a8a)',
    boxShadow: '0 4px 20px rgba(107,130,160,0.25)',
    marginBottom: 12,
  },
  backBtn: {
    background: 'none', border: 'none', color: '#8a8aaa',
    fontSize: 15, cursor: 'pointer', fontWeight: 600,
  },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modalBox: {
    background: '#fff', borderRadius: 24, padding: '28px 28px 24px',
    width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
  },
  resultCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,240,248,0.8) 100%)',
    borderRadius: 28, padding: '56px 48px',
    boxShadow: '0 8px 40px rgba(107,130,160,0.15)',
    border: '1.5px solid rgba(255,255,255,0.7)',
    textAlign: 'center', maxWidth: 440, width: '100%',
  },
  successBox: {
    margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 16,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,240,248,0.8) 100%)',
    borderRadius: 28, padding: '56px 48px',
    boxShadow: '0 8px 40px rgba(107,130,160,0.15)',
    border: '1.5px solid rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  successTitle: { fontSize: 28, fontWeight: 800, color: '#3a5a8a', margin: 0 },
  successDesc: { fontSize: 16, color: '#8a7a9a', margin: 0 },
  successBalance: { fontSize: 18, fontWeight: 700, color: '#6B82A0', margin: 0 },
  bankBox: {
    margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 16,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,240,248,0.8) 100%)',
    borderRadius: 28, padding: '48px 40px',
    boxShadow: '0 8px 40px rgba(107,130,160,0.15)',
    border: '1.5px solid rgba(255,255,255,0.7)',
    maxWidth: 440, width: '100%',
  },
  bankCard: {
    width: '100%', background: 'rgba(245,240,248,0.6)', borderRadius: 16,
    padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12,
    border: '1px solid rgba(107,130,160,0.12)',
  },
  bankRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  bankLabel: { fontSize: 14, color: '#8a7a9a', fontWeight: 600 },
  bankValue: { fontSize: 15, color: '#3a5a8a', fontWeight: 700 },
  bankNote: { fontSize: 13, color: '#a09ab0', textAlign: 'center', margin: 0 },
  primaryBtn: {
    padding: '14px 32px', fontSize: 16, fontWeight: 700, color: '#fff',
    background: 'linear-gradient(135deg, #6B82A0, #c47a8a)',
    border: 'none', borderRadius: 14, cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(107,130,160,0.25)',
  },
}
