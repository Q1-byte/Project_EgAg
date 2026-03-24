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

const PKG_META: Record<string, {
  gradient: string
  glow: string
  accent: string
  badge: string | null
  badgeColor: string
  emoji: string
  textColor: string
}> = {
  BASIC: {
    gradient: 'linear-gradient(160deg, #fff0f3 0%, #ffe3ea 100%)',
    glow: 'rgba(255,107,157,0.18)',
    accent: '#e05c87',
    badge: '입문',
    badgeColor: '#e05c87',
    textColor: '#c0396b',
    emoji: '',
  },
  STANDARD: {
    gradient: 'linear-gradient(160deg, #f0f6ff 0%, #dceeff 100%)',
    glow: 'rgba(75,155,230,0.18)',
    accent: '#3a82d4',
    badge: '인기',
    badgeColor: '#3a82d4',
    textColor: '#2060b0',
    emoji: '',
  },
  PREMIUM: {
    gradient: 'linear-gradient(160deg, #f5f0ff 0%, #ecdeff 100%)',
    glow: 'rgba(139,92,246,0.18)',
    accent: '#7c3aed',
    badge: '최고 혜택',
    badgeColor: '#7c3aed',
    textColor: '#5b21b6',
    emoji: '',
  },
  ULTRA: {
    gradient: 'linear-gradient(160deg, #fff8ec 0%, #ffecd0 100%)',
    glow: 'rgba(240,150,30,0.18)',
    accent: '#e07b00',
    badge: '울트라',
    badgeColor: '#e07b00',
    textColor: '#a05500',
    emoji: '',
  },
}

const PAY_METHODS = [
  { key: 'kakaopay' as PayMethod, label: '카카오페이', bg: '#FEE500', color: '#3C1E1E',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.74 5.18 4.36 6.6l-.96 3.6 4.2-2.76c.78.12 1.58.18 2.4.18 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/></svg> },
  { key: 'tosspay'  as PayMethod, label: '토스페이',   bg: '#0064FF', color: '#fff',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l2.5 2.5L16 9"/></svg> },
  { key: 'card'     as PayMethod, label: '신용카드',   bg: 'linear-gradient(135deg,#3a82d4,#e05c87)', color: '#fff',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { key: 'bank'     as PayMethod, label: '무통장',     bg: 'rgba(245,245,250,1)', color: '#5a6a8a',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
]

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
  const [activeIndex, setActiveIndex] = useState(1)

  const goTo = (i: number, pkgList = packages) => {
    const len = pkgList.length
    if (!len) return
    const idx = ((i % len) + len) % len
    setActiveIndex(idx)
    setSelectedPkg(pkgList[idx])
    setError('')
  }

  useEffect(() => {
    getPackages().then(pkgs => { setPackages(pkgs); if (pkgs[1]) setSelectedPkg(pkgs[1]) })

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
            setError(String(err?.response?.data?.message || '토스 결제 확인 중 오류가 발생했습니다.'))
          })
      } else {
        setError('결제 정보가 올바르지 않습니다.')
      }
    } else if (status === 'cancel') {
      setError('결제가 취소되었습니다.')
    } else if (status === 'fail') {
      setError('결제에 실패했습니다.')
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
      if (!depositorName.trim()) { setError('입금자명을 입력해주세요.'); setLoading(false); return }
      try {
        const res = await requestBankTransfer({ packageId: selectedPkg.id, depositorName, bankType: selectedBank })
        setBankInfo({ bankName: res.bankName!, bankAccount: res.bankAccount!, accountHolder: res.accountHolder!, amount: selectedPkg.price, packageName: selectedPkg.displayName })
      } catch (err: any) {
        setError(String(err?.response?.data?.error?.message || err?.response?.data?.message || '오류가 발생했습니다.'))
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

  // ── 결제 완료 화면 ──
  if (successMsg) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f5ff', display: 'flex', flexDirection: 'column' }}>
        <Blobs />
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={rs.card}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#43c59e,#2aa87a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(67,197,158,0.3)' }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#1a1a2e' }}>충전 완료!</h2>
            <p style={{ margin: 0, fontSize: 16, color: '#666', lineHeight: 1.7 }}>{successMsg}</p>
            {tokenBalance !== undefined && (
              <div style={{ background: 'rgba(122,92,200,0.08)', borderRadius: 16, padding: '16px 32px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#9980c8', fontWeight: 700, letterSpacing: 1 }}>현재 보유 토큰</p>
                <p style={{ margin: '6px 0 0', fontSize: 32, fontWeight: 900, color: '#5a30b0' }}>{tokenBalance}<span style={{ fontSize: 16, marginLeft: 4 }}>개</span></p>
              </div>
            )}
            <button style={rs.btn} onClick={() => navigate('/')}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
              onMouseLeave={e => (e.currentTarget.style.filter = '')}
            >홈으로 돌아가기</button>
          </div>
        </div>
      </div>
    )
  }

  // ── 무통장 완료 화면 ──
  if (bankInfo) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f5ff', display: 'flex', flexDirection: 'column' }}>
        <Blobs />
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={rs.card}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#3a82d4,#2060b0)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(58,130,212,0.3)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#1a1a2e' }}>무통장 입금 안내</h2>
            <div style={{ width: '100%', background: '#fff', borderRadius: 18, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              {[
                { label: '은행', value: bankInfo.bankName },
                { label: '계좌번호', value: bankInfo.bankAccount },
                { label: '예금주', value: bankInfo.accountHolder },
                { label: '입금액', value: `${bankInfo.amount.toLocaleString()}원`, highlight: true },
                { label: '패키지', value: bankInfo.packageName },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f6', paddingBottom: 10 }}>
                  <span style={{ fontSize: 13, color: '#999', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: highlight ? '#5a30b0' : '#333' }}>{value}</span>
                </div>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#aaa', textAlign: 'center' }}>입금 확인 후 영업일 1일 이내 토큰이 지급됩니다.</p>
            <button style={rs.btn} onClick={() => navigate('/')}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
              onMouseLeave={e => (e.currentTarget.style.filter = '')}
            >홈으로 돌아가기</button>
          </div>
        </div>
      </div>
    )
  }

  // ── 메인 화면 ──
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(170deg,#f0eaff 0%,#e8f2ff 50%,#fff5f8 100%)', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      <style>{`
        @keyframes blob-drift1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-25px) scale(1.05)} }
        @keyframes blob-drift2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-25px,20px) scale(0.97)} }
        @keyframes blob-drift3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,30px) scale(1.04)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shine-sweep { 0%{left:-80%} 100%{left:130%} }
        .shine-layer {
          position: absolute; inset: 0; border-radius: 26px; overflow: hidden; pointer-events: none;
        }
        .shine-layer::after {
          content: '';
          position: absolute;
          top: 0; left: -80%; width: 60%; height: 100%;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%);
          animation: shine-sweep 0.55s ease forwards;
        }
        .pay-tab { transition: all 0.18s; }
        .pay-tab:hover { opacity: 0.88; transform: translateY(-2px); }
        .pay-btn-main { transition: filter 0.15s, transform 0.18s cubic-bezier(0.23,1,0.32,1); }
        .pay-btn-main:hover:not(:disabled) { filter: brightness(1.07); transform: translateY(-2px); }
      `}</style>

      <Blobs />

      {/* 토스 모달 */}
      {tossModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: '28px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 16px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a1a2e' }}>결제 수단 선택</h3>
              <button onClick={() => { setTossModal(false); sessionStorage.removeItem('toss_package_id') }}
                style={{ background: '#f5f5f8', border: 'none', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 16, color: '#666' }}>✕</button>
            </div>
            {!tossModalReady && <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: 14 }}>불러오는 중...</div>}
            <div id="toss-modal-methods" />
            <div id="toss-modal-agreement" />
            {tossModalReady && (
              <button className="pay-btn-main" style={{ width: '100%', marginTop: 16, padding: '16px', fontSize: 16, fontWeight: 800, color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer', background: 'linear-gradient(135deg,#7c3aed,#e05c87)' }}
                onClick={handleTossModalPay} disabled={tossModalLoading}>
                {tossModalLoading ? '처리 중...' : `${selectedPkg?.price.toLocaleString()}원 결제하기`}
              </button>
            )}
          </div>
        </div>
      )}

      <Header />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '120px 20px 80px', position: 'relative', zIndex: 1 }}>

        {/* ── 히어로 ── */}
        <div style={{ textAlign: 'center', marginBottom: 64, animation: 'slide-up 0.5s ease both' }}>
          <div style={{ display: 'inline-block', background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(224,92,135,0.12))', border: '1.5px solid rgba(124,58,237,0.2)', borderRadius: 100, padding: '6px 20px', marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#7c3aed', letterSpacing: 2, textTransform: 'uppercase' }}>Token Shop</span>
          </div>
          <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, color: '#1a1a2e', lineHeight: 1.15, letterSpacing: -1 }}>
            토큰을 충전하고<br />
            <span style={{ background: 'linear-gradient(135deg,#7c3aed,#e05c87)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              AI 그림을 마음껏!
            </span>
          </h1>
          <p style={{ margin: '0 auto 28px', fontSize: 16, color: '#888', maxWidth: 440, lineHeight: 1.7 }}>
            토큰 1개로 AI 그림 한 번을 그릴 수 있어요.<br />많이 살수록 더 저렴해져요
          </p>
        </div>

        {/* ── 커버플로우 캐러셀 ── */}
        <div style={{ width: '100%', maxWidth: 800, marginBottom: 64, position: 'relative', marginTop: -70 }}>
          {/* 카드 무대 */}
          <div style={{ position: 'relative', height: 420, perspective: '1000px', perspectiveOrigin: '50% 50%' }}>
            {packages.map((pkg, i) => {
              const meta = PKG_META[pkg.id] ?? PKG_META.BASIC
              const len = packages.length
              let offset = i - activeIndex
              if (offset > len / 2)  offset -= len
              if (offset < -len / 2) offset += len
              const absOff = Math.abs(offset)
              if (absOff > 1) return null

              const rotateY    = offset * 42
              const translateX = offset * 280
              const translateZ = offset === 0 ? 0 : -140
              const scale      = offset === 0 ? 1 : 0.72
              const opacity    = offset === 0 ? 1 : 0.5
              const zIndex     = offset === 0 ? 10 : 5

              return (
                <div
                  key={pkg.id}
                  onClick={() => { goTo(i) }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 260,
                    transform: `translateX(calc(-50% + ${translateX}px)) translateY(-50%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                    transition: 'transform 0.5s cubic-bezier(0.23,1,0.32,1), opacity 0.5s, box-shadow 0.4s',
                    opacity,
                    zIndex,
                    cursor: offset === 0 ? 'default' : 'pointer',
                    borderRadius: 28,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 0,
                    overflow: 'visible',
                    border: offset === 0 ? `2px solid ${meta.accent}` : '1.5px solid rgba(255,255,255,0.7)',
                    boxShadow: offset === 0 ? `0 20px 50px ${meta.glow}` : '0 4px 16px rgba(0,0,0,0.07)',
                  }}
                >
                  {/* shine on active */}
                  {offset === 0 && <div className="shine-layer" />}

                  {/* 할인율 - 금색 그라디언트, 카드 모서리 바깥 */}
                  {pkg.id !== 'BASIC' && (
                    <div style={{
                      position: 'absolute', top: -18, right: -18,
                      width: 60, height: 60, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FFE566 0%, #F5A623 55%, #C97B0A 100%)',
                      boxShadow: '0 4px 18px rgba(210,150,0,0.6), 0 0 0 3px #fff',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      transform: 'rotate(12deg)',
                      zIndex: 30,
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#6b3a00', lineHeight: 1, letterSpacing: -0.5 }}>
                        {pkg.id === 'STANDARD' ? '5%' : pkg.id === 'PREMIUM' ? '15%' : '20%'}
                      </span>
                      <span style={{ fontSize: 7.5, fontWeight: 900, color: '#8b5000', letterSpacing: 0.5 }}>SAVE</span>
                    </div>
                  )}

                  {/* 이미지 영역 */}
                  <div style={{
                    background: meta.gradient,
                    borderRadius: '26px 26px 0 0',
                    overflow: 'hidden',
                    padding: '14px',
                  }}>
                    <img
                      src="/token/token.png"
                      alt="token"
                      style={{ width: '100%', display: 'block', objectFit: 'contain', filter: `drop-shadow(0 8px 24px ${meta.glow})` }}
                    />
                  </div>

                  {/* 정보 영역 */}
                  <div style={{
                    position: 'relative',
                    background: 'rgba(255,255,255,0.92)',
                    borderTop: `1.5px solid ${meta.accent}25`,
                    borderRadius: '0 0 26px 26px',
                    padding: '24px 22px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}>
                    {/* 배지 - 이미지/정보칸 경계 가운데 */}
                    {meta.badge && (
                      <div style={{
                        position: 'absolute', top: 0, left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: meta.badgeColor, color: '#fff',
                        fontSize: 10, fontWeight: 800, borderRadius: 100,
                        padding: '4px 14px', whiteSpace: 'nowrap', letterSpacing: 0.5,
                        zIndex: 10,
                        boxShadow: `0 2px 8px ${meta.glow}`,
                      }}>
                        {meta.badge}
                      </div>
                    )}
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1a1a2e' }}>{pkg.displayName}</h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                      <span style={{ fontSize: 44, fontWeight: 900, color: meta.accent, lineHeight: 1, letterSpacing: -2 }}>{pkg.tokenAmount}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: meta.textColor }}>개</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '10px 20px', textAlign: 'center', width: '100%', boxSizing: 'border-box', borderTop: `1px solid ${meta.accent}20` }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', letterSpacing: -0.5 }}>
                        {pkg.price.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 600, marginLeft: 2 }}>원</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>개당 {Math.round(pkg.price / pkg.tokenAmount)}원</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 화살표 */}
          <button onClick={() => goTo(activeIndex - 1)}
            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button onClick={() => goTo(activeIndex + 1)}
            style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          {/* 도트 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, marginBottom: 8 }}>
            {packages.map((_, i) => (
              <div key={i} onClick={() => { goTo(i) }} style={{ width: i === activeIndex ? 24 : 8, height: 8, borderRadius: 4, background: i === activeIndex ? (PKG_META[packages[i]?.id]?.accent ?? '#7c3aed') : 'rgba(0,0,0,0.15)', transition: 'all 0.35s', cursor: 'pointer' }} />
            ))}
          </div>
        </div>

        {/* ── 결제 수단 ── */}
        <div style={{ width: '100%', maxWidth: 640, marginBottom: 32, animation: 'slide-up 0.5s ease 0.35s both' }}>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#bbb', letterSpacing: 2, marginBottom: 14, textTransform: 'uppercase' }}>결제 수단 선택</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {PAY_METHODS.map(m => (
              <button
                key={m.key}
                className="pay-tab"
                onClick={() => { setPayMethod(m.key); setError('') }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '18px 8px', borderRadius: 20, cursor: 'pointer',
                  background: payMethod === m.key ? m.bg : 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(12px)',
                  border: payMethod === m.key ? 'none' : '1.5px solid rgba(200,200,220,0.5)',
                  boxShadow: payMethod === m.key ? '0 6px 20px rgba(0,0,0,0.13)' : '0 2px 8px rgba(0,0,0,0.04)',
                  color: payMethod === m.key ? m.color : '#888',
                  fontWeight: 800, fontSize: 12,
                }}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {payMethod === 'bank' && (
            <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderRadius: 20, padding: '24px', border: '1.5px solid rgba(200,200,220,0.4)', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
              <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#bbb', margin: '0 0 14px', letterSpacing: 1 }}>입금 은행 선택</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 18 }}>
                {[{ key: 'kakao', label: '카카오뱅크' }, { key: 'toss', label: '토스뱅크' }, { key: 'kb', label: '국민은행' }, { key: 'shinhan', label: '신한은행' }].map(b => (
                  <button key={b.key} onClick={() => setSelectedBank(b.key)} style={{
                    padding: '10px 4px', borderRadius: 12, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    border: selectedBank === b.key ? '2px solid #7c3aed' : '1.5px solid #e8e8f0',
                    background: selectedBank === b.key ? 'rgba(124,58,237,0.08)' : '#fff',
                    color: selectedBank === b.key ? '#7c3aed' : '#888',
                  }}>{b.label}</button>
                ))}
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#666', margin: '0 0 8px' }}>입금자명</p>
              <input
                style={{ width: '100%', padding: '13px 16px', fontSize: 15, border: '1.5px solid #e0e0ee', borderRadius: 14, outline: 'none', background: '#fafafa', boxSizing: 'border-box' }}
                placeholder="입금 시 사용할 이름"
                value={depositorName}
                onChange={e => setDepositorName(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* 에러 */}
        {error && (
          <div style={{ width: '100%', maxWidth: 640, background: 'rgba(254,242,242,0.95)', border: '1px solid #fecaca', borderRadius: 14, padding: '12px 18px', fontSize: 14, color: '#dc2626', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* 결제 버튼 */}
        <div style={{ width: '100%', maxWidth: 640, animation: 'slide-up 0.5s ease 0.45s both' }}>
          <button
            className="pay-btn-main"
            style={{
              width: '100%', padding: '18px', fontSize: 17, fontWeight: 900,
              color: '#fff', border: 'none', borderRadius: 18, cursor: selectedPkg && !loading ? 'pointer' : 'default',
              background: selectedPkg ? 'linear-gradient(135deg,#7c3aed 0%,#e05c87 100%)' : 'linear-gradient(135deg,#ccc,#bbb)',
              boxShadow: selectedPkg ? '0 8px 28px rgba(124,58,237,0.35)' : 'none',
              opacity: loading ? 0.7 : 1,
              letterSpacing: 0.3,
            }}
            onClick={handlePayment}
            disabled={loading || !selectedPkg}
          >
            {loading ? '처리 중...' : selectedPkg ? `${selectedPkg.price.toLocaleString()}원 결제하기` : '패키지를 선택해주세요'}
          </button>
          <button
            style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: '#bbb', fontSize: 14, cursor: 'pointer', fontWeight: 600, transition: 'color 0.15s' }}
            onClick={() => navigate(-1)}
            onMouseEnter={e => (e.currentTarget.style.color = '#7c3aed')}
            onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
          >홈으로</button>
        </div>

      </main>
    </div>
  )
}

function Blobs() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: 650, height: 650, borderRadius: '50%', background: 'radial-gradient(circle,rgba(196,130,255,0.3) 0%,transparent 65%)', filter: 'blur(70px)', animation: 'blob-drift1 16s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: '5%', right: '-15%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,107,157,0.25) 0%,transparent 65%)', filter: 'blur(70px)', animation: 'blob-drift2 20s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '15%', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle,rgba(90,160,255,0.25) 0%,transparent 65%)', filter: 'blur(70px)', animation: 'blob-drift3 24s ease-in-out infinite' }} />
    </div>
  )
}

const rs: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    background: 'rgba(255,255,255,0.92)', borderRadius: 32,
    padding: '56px 52px', maxWidth: 440, width: '100%',
    boxShadow: '0 16px 60px rgba(124,58,237,0.1)',
    border: '1.5px solid rgba(255,255,255,0.8)', textAlign: 'center',
  },
  btn: {
    padding: '16px 40px', fontSize: 16, fontWeight: 800, color: '#fff',
    background: 'linear-gradient(135deg,#7c3aed,#e05c87)',
    border: 'none', borderRadius: 16, cursor: 'pointer',
    boxShadow: '0 6px 24px rgba(124,58,237,0.3)',
  },
}
