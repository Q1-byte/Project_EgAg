import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { getPackages, completePortonePayment, requestBankTransfer, kakaoPayReady } from '../api/payment'
import type { Package } from '../api/payment'

declare global {
  interface Window { IMP: any }
}

const PORTONE_CODE = (import.meta as any).env?.VITE_PORTONE_CODE || 'imp00000000'

type PayMethod = 'kakaopay' | 'card' | 'bank'

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
  const [loading, setLoading] = useState(false)
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    getPackages().then(setPackages)
    if (window.IMP) window.IMP.init(PORTONE_CODE)

    // 카카오페이 결제 후 리다이렉트 처리
    const status = searchParams.get('status')
    if (status === 'success') {
      const tokens = searchParams.get('tokens')
      const balance = searchParams.get('balance')
      if (tokens) setSuccessMsg(`토큰 ${tokens}개가 충전되었습니다!`)
      if (balance) setTokenBalance(Number(balance))
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

    if (payMethod === 'bank') {
      if (!depositorName.trim()) {
        setError('입금자명을 입력해주세요.')
        setLoading(false)
        return
      }
      try {
        const res = await requestBankTransfer({ packageId: selectedPkg.id, depositorName })
        setBankInfo({
          bankName: res.bankName!,
          bankAccount: res.bankAccount!,
          accountHolder: res.accountHolder!,
          amount: selectedPkg.price,
          packageName: selectedPkg.displayName,
        })
      } catch {
        setError('오류가 발생했습니다. 다시 시도해주세요.')
      }
      setLoading(false)
      return
    }

    const merchantUid = `egag_${selectedPkg.id.toLowerCase()}_${Date.now()}`
    window.IMP.request_pay({
      pg: payMethod === 'kakaopay' ? 'kakaopay' : 'html5_inicis',
      pay_method: 'card',
      merchant_uid: merchantUid,
      name: `${selectedPkg.displayName} (토큰 ${selectedPkg.tokenAmount}개)`,
      amount: selectedPkg.price,
      buyer_name: nickname || '',
    }, async (rsp: any) => {
      if (rsp.success) {
        try {
          const res = await completePortonePayment({
            impUid: rsp.imp_uid,
            merchantUid: rsp.merchant_uid,
            packageId: selectedPkg.id,
          })
          if (res.newTokenBalance !== undefined) setTokenBalance(res.newTokenBalance)
          setSuccessMsg(`토큰 ${selectedPkg.tokenAmount}개가 충전되었습니다!`)
        } catch {
          setError('결제 검증 중 오류가 발생했습니다.')
        }
      } else {
        setError(`결제 실패: ${rsp.error_msg}`)
      }
      setLoading(false)
    })
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
          <span style={{ fontSize: 22 }}>🪞</span>
          <span style={s.logoText}>Decal<b>co</b></span>
        </div>
        {isAuthenticated && (
          <span style={s.tokenBadge}>🎟 {tokenBalance}개 보유 중</span>
        )}
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
              {pkg.popular && <div style={s.badge}>🔥 인기</div>}
              {pkg.bestValue && <div style={{ ...s.badge, background: '#7C3AED' }}>🏆 최고 혜택</div>}
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
              <label style={s.depositorLabel}>입금자명</label>
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
    background: 'linear-gradient(160deg, #EFF6FF 0%, #F0FDF4 60%, #FFF7ED 100%)',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 40px', borderBottom: '1px solid #E2E8F0',
    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
    position: 'sticky', top: 0, zIndex: 10,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  logoText: { fontSize: 20, fontWeight: 700, color: '#1D4ED8' },
  tokenBadge: {
    fontSize: 14, fontWeight: 700, color: '#1D4ED8',
    background: '#EFF6FF', border: '1px solid #BFDBFE',
    borderRadius: 20, padding: '4px 14px',
  },
  main: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '80px 24px 64px',
  },
  title: { fontSize: 34, fontWeight: 800, color: '#0F172A', margin: '48px 0 8px', letterSpacing: 2 },
  subtitle: { fontSize: 16, color: '#64748B', margin: '0 0 24px' },
  packages: { display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 56, marginTop: 56 },
  pkgCard: {
    background: '#fff', borderRadius: 20, padding: '32px 24px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)', width: 200,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    cursor: 'pointer', border: '2px solid #F1F5F9',
    transition: 'transform 0.15s, box-shadow 0.15s',
    position: 'relative',
  },
  pkgCardSelected: {
    border: '2px solid #3B82F6',
    boxShadow: '0 4px 24px rgba(59,130,246,0.2)',
    transform: 'translateY(-4px)',
  },
  pkgCardPopular: { border: '2px solid #F59E0B' },
  badge: {
    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
    background: '#F59E0B', color: '#fff', fontSize: 12, fontWeight: 700,
    borderRadius: 20, padding: '3px 12px', whiteSpace: 'nowrap',
  },
  pkgIcon: { fontSize: 28, marginBottom: 4 },
  pkgName: { fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 },
  pkgTokens: { fontSize: 16, fontWeight: 700, color: '#2563EB' },
  pkgPrice: { fontSize: 22, fontWeight: 800, color: '#0F172A' },
  pkgPer: { fontSize: 12, color: '#94A3B8' },
  section: { width: '100%', maxWidth: 620, marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 16 },
  methodRow: { display: 'flex', gap: 12 },
  methodBtn: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '16px 12px', border: '2px solid #E2E8F0', borderRadius: 14,
    background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#475569',
    transition: 'all 0.15s',
  },
  methodBtnActive: {
    border: '2px solid #3B82F6', background: '#EFF6FF', color: '#1D4ED8',
  },
  depositorWrap: { marginTop: 16 },
  depositorLabel: { display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 },
  depositorInput: {
    width: '100%', padding: '12px 14px', fontSize: 15,
    border: '2px solid #E2E8F0', borderRadius: 10, outline: 'none',
    boxSizing: 'border-box',
  },
  errorBox: {
    width: '100%', maxWidth: 620, background: '#FEF2F2', border: '1px solid #FECACA',
    borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#DC2626', marginBottom: 16,
  },
  payBtn: {
    width: '100%', maxWidth: 620, padding: '16px', fontSize: 17, fontWeight: 800,
    color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer',
    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    marginBottom: 12,
  },
  backBtn: {
    background: 'none', border: 'none', color: '#64748B',
    fontSize: 15, cursor: 'pointer', fontWeight: 600,
  },
  successBox: {
    margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 16, background: '#fff', borderRadius: 24, padding: '56px 48px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)', textAlign: 'center',
  },
  successTitle: { fontSize: 28, fontWeight: 800, color: '#0F172A', margin: 0 },
  successDesc: { fontSize: 16, color: '#475569', margin: 0 },
  successBalance: { fontSize: 18, fontWeight: 700, color: '#2563EB', margin: 0 },
  bankBox: {
    margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 16, background: '#fff', borderRadius: 24, padding: '48px 40px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)', maxWidth: 440, width: '100%',
  },
  bankCard: {
    width: '100%', background: '#F8FAFC', borderRadius: 14,
    padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12,
  },
  bankRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  bankLabel: { fontSize: 14, color: '#64748B', fontWeight: 600 },
  bankValue: { fontSize: 15, color: '#0F172A', fontWeight: 700 },
  bankNote: { fontSize: 13, color: '#94A3B8', textAlign: 'center', margin: 0 },
  primaryBtn: {
    padding: '14px 32px', fontSize: 16, fontWeight: 700, color: '#fff',
    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    border: 'none', borderRadius: 12, cursor: 'pointer',
  },
}
