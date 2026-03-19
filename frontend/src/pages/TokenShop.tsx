import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { useAuthStore } from '../stores/useAuthStore'
import { getPackages, requestBankTransfer, kakaoPayReady, tossPayConfirm } from '../api/payment'
import type { Package } from '../api/payment'

declare global {
  interface Window { IMP: any }
}

const TOSS_CLIENT_KEY = (import.meta as any).env?.VITE_TOSS_CLIENT_KEY || ''

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
            const msg = err?.response?.data?.error?.message || '토스 결제 확인 중 오류가 발생했습니다.'
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
      if (!TOSS_CLIENT_KEY) {
        setError('토스페이 클라이언트 키가 설정되지 않았습니다. (VITE_TOSS_CLIENT_KEY)')
        setLoading(false)
        return
      }
      try {
        sessionStorage.setItem('toss_package_id', selectedPkg.id)
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
        const customerKey = (nickname || 'user').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)
        const payment = tossPayments.payment({ customerKey })
        const merchantUid = `egag_${selectedPkg.id.toLowerCase()}_${Date.now()}`
        await payment.requestPayment({
          method: 'CARD',
          amount: { currency: 'KRW', value: selectedPkg.price },
          orderId: merchantUid,
          orderName: `${selectedPkg.displayName} (토큰 ${selectedPkg.tokenAmount}개)`,
          successUrl: `${window.location.origin}/token-shop?status=toss_success`,
          failUrl: `${window.location.origin}/token-shop?status=fail`,
          card: { flowMode: 'DIRECT', easyPay: 'TOSSPAY' },
        })
      } catch (err: any) {
        sessionStorage.removeItem('toss_package_id')
        setError(err?.message || '토스페이 결제 중 오류가 발생했습니다.')
        setLoading(false)
      }
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

    // 카드결제 → Toss SDK로 처리
    if (!TOSS_CLIENT_KEY) {
      setError('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.')
      setLoading(false)
      return
    }
    try {
      sessionStorage.setItem('toss_package_id', selectedPkg.id)
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
      const customerKey = (nickname || 'user').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)
      const payment = tossPayments.payment({ customerKey })
      const merchantUid = `egag_${selectedPkg.id.toLowerCase()}_${Date.now()}`
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: selectedPkg.price },
        orderId: merchantUid,
        orderName: `${selectedPkg.displayName} (토큰 ${selectedPkg.tokenAmount}개)`,
        successUrl: `${window.location.origin}/token-shop?status=toss_success`,
        failUrl: `${window.location.origin}/token-shop?status=fail`,
      })
    } catch (err: any) {
      sessionStorage.removeItem('toss_package_id')
      setError(err?.message || '카드 결제 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  if (successMsg) {
    return (
      <div style={s.bg}>
        <div style={s.successBox}>
          <div style={{ fontSize: 56 }}>🎉</div>
          <h2 style={s.successTitle}>충전 완료!</h2>
          <p style={s.successDesc}>{successMsg}</p>
          <p style={s.successBalance}>현재 잔액: 🎟 {tokenBalance}개</p>
          <button style={s.primaryBtn} onClick={() => navigate('/')}>홈으로 돌아가기</button>
        </div>
      </div>
    )
  }

  if (bankInfo) {
    return (
      <div style={s.bg}>
        <div style={s.bankBox}>
          <div style={{ fontSize: 48 }}>🏦</div>
          <h2 style={s.successTitle}>무통장 입금 안내</h2>
          <div style={s.bankCard}>
            <div style={s.bankRow}><span style={s.bankLabel}>은행</span><span style={s.bankValue}>{bankInfo.bankName}</span></div>
            <div style={s.bankRow}><span style={s.bankLabel}>계좌번호</span><span style={s.bankValue}>{bankInfo.bankAccount}</span></div>
            <div style={s.bankRow}><span style={s.bankLabel}>예금주</span><span style={s.bankValue}>{bankInfo.accountHolder}</span></div>
            <div style={s.bankRow}><span style={s.bankLabel}>입금액</span><span style={{ ...s.bankValue, color: '#2563EB', fontWeight: 800 }}>{bankInfo.amount.toLocaleString()}원</span></div>
            <div style={s.bankRow}><span style={s.bankLabel}>패키지</span><span style={s.bankValue}>{bankInfo.packageName}</span></div>
          </div>
          <p style={s.bankNote}>입금 확인 후 영업일 1일 이내 토큰이 지급됩니다.</p>
          <button style={s.primaryBtn} onClick={() => navigate('/')}>홈으로 돌아가기</button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.bg}>
      {/* 헤더 */}
      <header style={s.header}>
        <div style={s.logo} onClick={() => navigate('/')} role="button">
          <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 110 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAuthenticated && nickname && (
            <>
              <span style={s.userGreet}>{nickname}님 안녕하세요!</span>
              <span style={s.tokenBadge}>🎟 {tokenBalance}개 보유 중</span>
            </>
          )}
          <button style={s.navBtn} onClick={() => navigate('/mypage')}>마이페이지</button>
          <button style={s.navBtn} onClick={() => navigate(-1)}>← 돌아가기</button>
        </div>
      </header>

      <main style={s.main}>
        <h1 style={s.title}>토큰 충전소</h1>
        <p style={s.subtitle}>토큰으로 AI 그림 기능을 이용할 수 있어요</p>

        {/* 패키지 선택 */}
        <div style={s.packages}>
          {packages.map(pkg => (
            <div
              key={pkg.id}
              style={{
                ...s.pkgCard,
                ...(pkg.popular ? s.pkgCardPopular : {}),
                ...(selectedPkg?.id === pkg.id ? s.pkgCardSelected : {}),
              }}
              onClick={() => { setSelectedPkg(pkg); setError('') }}
            >
              {pkg.id === 'BASIC' && <div style={{ ...s.badge, background: '#A78BFA' }}>✨ 입문</div>}
              {pkg.popular && <div style={s.badge}>🔥 인기</div>}
              {pkg.bestValue && <div style={{ ...s.badge, background: '#A78BFA' }}>🏆 최고 혜택</div>}
              <div style={s.pkgIcon}>
                {pkg.id === 'BASIC' ? '🎨' : pkg.id === 'STANDARD' ? '🖌️' : '🏆'}
              </div>
              <h3 style={s.pkgName}>{pkg.displayName}</h3>
              <div style={s.pkgTokens}>🎟 {pkg.tokenAmount}개</div>
              <div style={s.pkgPrice}>{pkg.price.toLocaleString()}원</div>
              <div style={s.pkgPer}>개당 {Math.round(pkg.price / pkg.tokenAmount)}원</div>
            </div>
          ))}
        </div>

        {/* 결제 수단 */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>결제 수단</h2>
          <div style={s.methodRow}>
            {([
              { key: 'kakaopay', label: '카카오페이', emoji: '💛' },
              { key: 'tosspay',  label: '토스페이',   emoji: '🔵' },
              { key: 'card',     label: '카드결제',   emoji: '💳' },
              { key: 'bank',     label: '무통장입금', emoji: '🏦' },
            ] as { key: PayMethod; label: string; emoji: string }[]).map(m => (
              <button
                key={m.key}
                style={{ ...s.methodBtn, ...(payMethod === m.key ? s.methodBtnActive : {}) }}
                onClick={() => { setPayMethod(m.key); setError('') }}
              >
                <span style={{ fontSize: 22 }}>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {payMethod === 'bank' && (
            <div style={s.depositorWrap}>
              <label style={{ ...s.depositorLabel, display: 'block', textAlign: 'center', marginBottom: 10 }}>입금 은행 선택</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {([
                  { key: 'kakao',   label: '카카오뱅크' },
                  { key: 'toss',    label: '토스뱅크'   },
                  { key: 'kb',      label: '국민은행'   },
                  { key: 'shinhan', label: '신한은행'   },
                ]).map(b => (
                  <button
                    key={b.key}
                    onClick={() => setSelectedBank(b.key)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
                      cursor: 'pointer',
                      border: selectedBank === b.key ? '2px solid #6B82A0' : '1.5px solid rgba(107,130,160,0.2)',
                      background: selectedBank === b.key
                        ? 'linear-gradient(135deg, rgba(107,130,160,0.15) 0%, rgba(196,122,138,0.12) 100%)'
                        : 'rgba(255,255,255,0.7)',
                      color: selectedBank === b.key ? '#3a5a8a' : '#6B82A0',
                    }}
                  >{b.label}</button>
                ))}
              </div>
              <label style={{ ...s.depositorLabel, textAlign: 'center', marginTop: 32 }}>입금자명</label>
              <input
                style={s.depositorInput}
                placeholder="입금 시 사용할 이름을 입력하세요"
                value={depositorName}
                onChange={e => setDepositorName(e.target.value)}
              />
            </div>
          )}
        </div>

        {error && <div style={s.errorBox}>{error}</div>}

        <button
          style={{ ...s.payBtn, opacity: loading || !selectedPkg ? 0.6 : 1 }}
          onClick={handlePayment}
          disabled={loading || !selectedPkg}
        >
          {loading ? '처리 중...' : selectedPkg
            ? `${selectedPkg.price.toLocaleString()}원 결제하기`
            : '패키지를 선택해주세요'}
        </button>

        <button style={s.backBtn} onClick={() => navigate(-1)}>← 돌아가기</button>
      </main>
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
