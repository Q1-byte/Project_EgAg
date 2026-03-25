import { useNavigate, Link } from 'react-router-dom'
import { consumeToken } from '../api/canvas'
import { useEffect, useRef, useState, useMemo } from 'react'
import { useAuthStore } from '../stores/useAuthStore'
import { Pencil, Layers, Ticket, Sparkles, Timer, ArrowRight, MessageCircle, ChevronUp, CalendarCheck } from 'lucide-react'
import Header from '../components/Header'
import { exploreArtworks } from '../api/artwork'
import type { ArtworkResponse } from '../types'
import AttendanceModal, { getAttendDismissKey } from '../components/AttendanceModal'
import { getTodayAttendance } from '../api/user'

function ArtworkCarousel() {
  const navigate = useNavigate()
  const [artworks, setArtworks] = useState<ArtworkResponse[]>([])
  const [adminImages, setAdminImages] = useState<string[]>([])
  const ringRef = useRef<HTMLDivElement>(null)
  const angleRef = useRef(0)
  const rafRef = useRef<number | undefined>(undefined)
  const pausedRef = useRef(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_main_images')
      if (saved) {
        const parsed: (string | null)[] = JSON.parse(saved)
        setAdminImages(parsed.filter(Boolean) as string[])
      }
    } catch {}

    exploreArtworks('latest', undefined, 50)
      .then(data => setArtworks(data.filter(a => a.imageUrl).slice(0, 10)))
      .catch(() => {})
  }, [])

  const items: { id: string; imageUrl: string; artworkId?: string }[] =
    adminImages.length > 0
      ? adminImages.map((src, i) => ({ id: String(i), imageUrl: src }))
      : artworks.map(a => ({ id: a.id, imageUrl: a.imageUrl!, artworkId: a.id }))

  useEffect(() => {
    if (items.length === 0) return
    const animate = () => {
      angleRef.current += 0.18
      if (ringRef.current) {
        ringRef.current.style.transform =
          `rotateX(-5deg) rotateZ(8deg) rotateY(${angleRef.current}deg)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current!)
  }, [items.length])

  if (items.length === 0) return null

  const n = items.length
  const radius = 380
  const cardW = 230
  const cardH = 300

  return (
    <div
      style={{ position: 'relative', zIndex: 2, width: '100%', height: 480, perspective: '2500px' }}
    >
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, transformStyle: 'preserve-3d' }}>
        <div ref={ringRef} style={{ transformStyle: 'preserve-3d' }}>
          {items.map((item, i) => {
            const theta = (i / n) * 2 * Math.PI
            const x = radius * Math.cos(theta)
            const z = radius * Math.sin(theta)
            const cardAngleDeg = (theta * 180) / Math.PI
            return (
              <div
                key={item.id}
                onClick={() => item.artworkId && navigate(`/artwork/${item.artworkId}`)}
                style={{
                  position: 'absolute',
                  width: cardW,
                  height: cardH,
                  marginLeft: -cardW / 2,
                  marginTop: -cardH / 2,
                  transform: `translateX(${x}px) translateZ(${z}px) rotateY(${-cardAngleDeg}deg)`,
                  borderRadius: 20,
                  overflow: 'hidden',
                  cursor: item.artworkId ? 'pointer' : 'default',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  opacity: 1,
                }}
              >
                <img
                  src={item.imageUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                />
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

function SparkleStars() {
  const stars = useMemo(() => {
    const shapes = ['•', '·']
    const colors = ['#ffffff', '#ffd43b', '#ffb3c6', '#a0c4ff', '#b5ead7', '#ffc8dd']
    return Array.from({ length: 70 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 8 + Math.random() * 14,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      duration: 1.5 + Math.random() * 3,
      delay: Math.random() * 4,
      isCross: false,
    }))
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
      {stars.map(s => (
        <span key={s.id} style={{
          position: 'absolute',
          left: `${s.x}%`,
          top: `${s.y}%`,
          fontSize: s.size,
          color: s.color,
          animation: `${s.isCross ? 'twinkle-cross' : 'twinkle'} ${s.duration}s ease-in-out ${s.delay}s infinite`,
          opacity: 0,
          filter: `blur(${s.isCross ? 0 : 0.3}px) drop-shadow(0 0 ${s.size * 0.4}px ${s.color})`,
          lineHeight: 1,
        }}>
          {s.shape}
        </span>
      ))}
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const userId = useAuthStore(s => s.userId)
  const tokenBalance = useAuthStore(s => s.tokenBalance)
  const setTokenBalance = useAuthStore(s => s.setTokenBalance)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [hasAttendedToday, setHasAttendedToday] = useState(false)
  const featureRefs = useRef<(HTMLDivElement | null)[]>([])
  const featureSectionRef = useRef<HTMLElement | null>(null)
  const [showTop, setShowTop] = useState(false)
  const [showTokenModal, setShowTokenModal] = useState<'canvas' | 'deco' | 'time' | null>(null)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    const noShowUntil = localStorage.getItem(getAttendDismissKey(userId ?? 'guest'))
    const isDismissed = noShowUntil && Date.now() < Number(noShowUntil)
    if (isDismissed) return
    getTodayAttendance()
      .then(({ attended }) => {
        setHasAttendedToday(attended)
        if (!attended) setShowAttendanceModal(true)
      })
      .catch(() => {
        // API 실패해도 dismiss 아니면 모달 오픈
        setShowAttendanceModal(true)
      })
  }, [isAuthenticated])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('feature-visible')
          } else {
            entry.target.classList.remove('feature-visible')
          }
        })
      },
      { threshold: 0.15 }
    )
    featureRefs.current.forEach(el => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  const handleStarCursor = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const stars = ['✦', '★', '✶', '✸', '⋆']
    const colors = ['#fff', '#ffe066', '#c47a8a', '#a0c4ff', '#b5ead7']
    const star = document.createElement('span')
    star.textContent = stars[Math.floor(Math.random() * stars.length)]
    star.style.cssText = `
      position:absolute; left:${x}px; top:${y}px;
      color:${colors[Math.floor(Math.random() * colors.length)]};
      font-size:${12 + Math.random() * 14}px;
      pointer-events:none; user-select:none; z-index:10;
      animation:star-pop ${0.5 + Math.random() * 0.4}s ease-out forwards;
    `
    e.currentTarget.appendChild(star)
    setTimeout(() => star.remove(), 900)
  }

  return (
    <div style={s.bg}>
      <style>{`
        @keyframes star-pop { 0%{transform:translate(-50%,-50%) scale(0) rotate(0deg);opacity:1} 100%{transform:translate(-50%,-50%) scale(1.4) rotate(45deg);opacity:0} }
        @keyframes twinkle { 0%,100%{opacity:0;transform:scale(0.4)} 50%{opacity:1;transform:scale(1)} }
        @keyframes twinkle-cross { 0%,100%{opacity:0;transform:scale(0.3) rotate(0deg)} 50%{opacity:0.9;transform:scale(1) rotate(20deg)} }
        @keyframes shootStar {
          0%     { transform: rotate(45deg) translateX(-20px); opacity: 0; }
          4%     { opacity: 0.4; }
          6%     { opacity: 1; }
          20%    { transform: rotate(45deg) translateX(620px); opacity: 0; }
          20.01% { transform: rotate(45deg) translateX(-20px); opacity: 0; }
          100%   { transform: rotate(45deg) translateX(-20px); opacity: 0; }
        }
        @keyframes shootStarRev {
          0%     { transform: rotate(135deg) translateX(-20px); opacity: 0; }
          4%     { opacity: 0.4; }
          6%     { opacity: 1; }
          20%    { transform: rotate(135deg) translateX(620px); opacity: 0; }
          20.01% { transform: rotate(135deg) translateX(-20px); opacity: 0; }
          100%   { transform: rotate(135deg) translateX(-20px); opacity: 0; }
        }
        .shoot-star {
          position: absolute;
          height: 2px;
          border-radius: 0 1px 1px 0;
          opacity: 0;
          filter: blur(0.4px);
        }
        .shoot-star::after {
          content: '';
          position: absolute;
          right: -3px;
          top: 50%;
          transform: translateY(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: white;
          box-shadow:
            0 0 2px 1px rgba(255,255,255,1),
            0 0 8px 3px rgba(210,230,255,0.9),
            0 0 18px 6px rgba(170,200,255,0.6),
            0 0 35px 10px rgba(140,175,255,0.3);
        }
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes blob1 { 0%{transform:translateY(0px);opacity:1} 50%{transform:translateY(-80px);opacity:0.4} 100%{transform:translateY(0px);opacity:1} }
        @keyframes blob2 { 0%{transform:translateY(0px);opacity:0.5} 50%{transform:translateY(80px);opacity:1} 100%{transform:translateY(0px);opacity:0.5} }
        @keyframes blob3 { 0%{transform:translateY(0px);opacity:1} 50%{transform:translateY(-60px);opacity:0.45} 100%{transform:translateY(0px);opacity:1} }
        @keyframes smoke1 {
          0%   { transform:translate(0,0) scale(1);      border-radius:42% 58% 70% 30%/45% 45% 55% 55%; opacity:0.22; }
          20%  { transform:translate(28px,-35px) scale(1.07); border-radius:60% 40% 30% 70%/60% 30% 70% 40%; opacity:0.28; }
          40%  { transform:translate(-18px,50px) scale(0.94); border-radius:30% 70% 60% 40%/50% 65% 30% 60%; opacity:0.18; }
          65%  { transform:translate(45px,15px) scale(1.05); border-radius:55% 45% 65% 35%/35% 65% 35% 65%; opacity:0.25; }
          80%  { transform:translate(-30px,-20px) scale(0.98); border-radius:48% 52% 40% 60%/60% 40% 55% 45%; opacity:0.20; }
          100% { transform:translate(0,0) scale(1);      border-radius:42% 58% 70% 30%/45% 45% 55% 55%; opacity:0.22; }
        }
        @keyframes smoke2 {
          0%   { transform:translate(0,0) scale(1);      border-radius:58% 42% 45% 55%/60% 40% 60% 40%; opacity:0.18; }
          30%  { transform:translate(-40px,30px) scale(1.1);  border-radius:40% 60% 70% 30%/45% 55% 45% 55%; opacity:0.24; }
          60%  { transform:translate(35px,-45px) scale(0.92); border-radius:65% 35% 55% 45%/30% 70% 40% 60%; opacity:0.15; }
          100% { transform:translate(0,0) scale(1);      border-radius:58% 42% 45% 55%/60% 40% 60% 40%; opacity:0.18; }
        }
        @keyframes smoke3 {
          0%   { transform:translate(0,0) scale(1);      border-radius:70% 30% 50% 50%/40% 60% 40% 60%; opacity:0.15; }
          25%  { transform:translate(50px,25px) scale(1.06); border-radius:35% 65% 40% 60%/55% 45% 65% 35%; opacity:0.20; }
          50%  { transform:translate(-25px,-50px) scale(0.96); border-radius:55% 45% 70% 30%/65% 35% 50% 50%; opacity:0.12; }
          75%  { transform:translate(-45px,35px) scale(1.03); border-radius:45% 55% 35% 65%/40% 60% 55% 45%; opacity:0.18; }
          100% { transform:translate(0,0) scale(1);      border-radius:70% 30% 50% 50%/40% 60% 40% 60%; opacity:0.15; }
        }
        .footer-policy-link { color: #7a6a9a; text-decoration: none; transition: color 0.2s, text-decoration 0.2s; }
        .footer-policy-link:hover { color: #c47a8a; text-decoration: underline; }
        .card-canvas:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 60px rgba(196,122,138,0.25) !important; }
        .card-deco:hover   { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 60px rgba(107,130,160,0.25) !important; }
        .card-time:hover   { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 60px rgba(212,168,0,0.25) !important; }
        .start-btn:hover   { filter: brightness(1.08); }
        .egag-cards { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; padding: 0 16px; }
        .egag-card  { width: clamp(260px, 28vw, 300px); }
        .egag-header-right span, .egag-header-right button { font-size: clamp(12px, 1.2vw, 14px) !important; }
        .profile-avatar:hover { filter: brightness(1.1); transform: scale(1.06); }
        .fab-inquiry { transition: box-shadow 0.2s, transform 0.15s; }
        .fab-inquiry:hover { transform: scale(1.06); box-shadow: 0 8px 32px rgba(107,130,160,0.4) !important; }
        @keyframes attendanceWiggle {
          0%, 100% { transform: rotate(0deg); }
          4%       { transform: rotate(-7deg); }
          8%       { transform: rotate(7deg); }
          12%      { transform: rotate(-5deg); }
          16%      { transform: rotate(5deg); }
          20%      { transform: rotate(-2deg); }
          24%      { transform: rotate(2deg); }
          28%      { transform: rotate(0deg); }
        }
        .fab-attendance { transition: box-shadow 0.2s; }
        .fab-attendance:hover { transform: scale(1.06) !important; box-shadow: 0 8px 32px rgba(107,130,160,0.4) !important; animation: none !important; }
        .fab-attendance-pulse { animation: attendanceWiggle 3.5s ease-in-out infinite; animation-delay: 1.5s; }
        .fab-top { transition: box-shadow 0.2s, transform 0.3s, opacity 0.3s; }
        .fab-top:hover { transform: translateY(-2px) scale(1.08) !important; box-shadow: 0 8px 32px rgba(107,130,160,0.35) !important; }
        .star-field {
          background-image:
            radial-gradient(circle, rgba(255,255,255,0.75) 1px, transparent 1px),
            radial-gradient(circle, rgba(255,255,255,0.45) 1px, transparent 1px),
            radial-gradient(circle, rgba(200,180,255,0.5) 1px, transparent 1px);
          background-size: 220px 220px, 340px 340px, 160px 160px;
          background-position: 10px 20px, 80px 140px, 40px 80px;
        }
        .egag-main-title { font-size: clamp(28px, 5vw, 48px) !important; }
        .egag-main-desc  { font-size: clamp(14px, 1.5vw, 17px) !important; }
        @media (max-width: 600px) {
          .egag-card { width: 100% !important; }
          .egag-cards { padding: 0 20px; }
        }
        /* ── feature section animations ── */
        .feature-item { opacity: 0; }
        .feat-img {
          opacity: 0;
          transform: translateX(-64px);
          transition: transform 1s cubic-bezier(0.16,1,0.3,1), opacity 0.9s ease;
        }
        .feat-txt {
          opacity: 0;
          transform: translateX(64px);
          transition: transform 1s cubic-bezier(0.16,1,0.3,1) 0.18s, opacity 0.9s ease 0.18s;
        }
        .feat-row-rev .feat-img { transform: translateX(64px); }
        .feat-row-rev .feat-txt { transform: translateX(-64px); }
        .feature-visible { opacity: 1; }
        .feature-visible .feat-img,
        .feature-visible .feat-txt { opacity: 1; transform: translateX(0); }
        .feat-intro {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.9s ease, transform 0.9s ease;
        }
        .feat-intro.feature-visible { opacity: 1; transform: translateY(0); }
        .feat-cta { transition: gap 0.2s, opacity 0.2s; display:inline-flex; align-items:center; gap:6px; }
        .feat-cta:hover { gap: 12px !important; opacity: 0.75; }
        @media (max-width: 860px) {
          .feat-row, .feat-row-rev { flex-direction: column !important; }
          .feat-img, .feat-txt { transform: translateY(40px) !important; }
          .feature-visible .feat-img,
          .feature-visible .feat-txt { transform: translateY(0) !important; }
        }
        @media (max-width: 600px) {
          .egag-card { width: 100% !important; }
          .egag-cards { padding: 0 20px; }
          .fab-inquiry, .fab-attendance { padding: 10px 14px !important; font-size: 13px !important; right: 16px !important; gap: 6px !important; }
          .fab-top { right: 16px !important; width: 40px !important; height: 40px !important; }
        }
      `}</style>

      {/* 배경 blob */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* 메인 blob들 */}
        {/* 분홍 — 왼쪽 위 */}
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,150,180,0.25) 0%, transparent 65%)', animation: 'blob1 7s ease-in-out infinite', filter: 'blur(80px)' }} />
        {/* 노랑 — 오른쪽 */}
        <div style={{ position: 'absolute', top: '15%', right: '-12%', width: 720, height: 720, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,220,80,0.25) 0%, transparent 65%)', animation: 'blob2 9s ease-in-out infinite', filter: 'blur(80px)' }} />
        {/* 파랑 — 아래 왼쪽 */}
        <div style={{ position: 'absolute', bottom: '0%', left: '10%', width: 680, height: 680, borderRadius: '50%', background: 'radial-gradient(circle, rgba(130,175,230,0.25) 0%, transparent 65%)', animation: 'blob3 11s ease-in-out infinite', filter: 'blur(80px)' }} />
        {/* 보조 blob들 */}
        <div style={{ position: 'absolute', top: '40%', left: '25%', width: 580, height: 580, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,150,180,0.15) 0%, transparent 65%)', animation: 'blob2 13s ease-in-out infinite', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', top: '-5%', right: '20%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,220,80,0.18) 0%, transparent 65%)', animation: 'blob1 8s ease-in-out infinite 2s', filter: 'blur(75px)' }} />
        {/* 배경 로고 워터마크 */}
        <img
          src="/Egag_logo-removebg.png"
          alt=""
          style={{
            position: 'absolute', top: '46%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(360px, 44vw, 600px)',
            opacity: 0.11,
            filter: 'blur(0.5px) saturate(0.6)',
            userSelect: 'none', pointerEvents: 'none',
          }}
        />
      </div>

      <Header hideOnScroll />

      {/* 메인 */}
      <main style={{ ...s.main, position: 'relative', overflow: 'hidden' }}>

        {/* SVG 연기 필터 */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <filter id="smoke-filter" x="-50%" y="-50%" width="200%" height="200%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012 0.008" numOctaves="4" seed="8" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="55" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>

        {/* 연기 레이어 */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          {/* 핑크 연기 — 왼쪽 위 */}
          <div style={{
            position: 'absolute', top: '-10%', left: '-5%',
            width: 700, height: 560,
            background: 'radial-gradient(ellipse at 40% 50%, rgba(255,140,180,0.45) 0%, rgba(255,100,160,0.20) 40%, transparent 70%)',
            filter: 'url(#smoke-filter) blur(24px)',
            animation: 'smoke1 14s ease-in-out infinite',
          }} />
        </div>

        <p style={{ ...s.eyebrow, position: 'relative', zIndex: 2 }}><Sparkles size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />AI 그림 놀이터</p>
        <h1 className="egag-main-title" style={{ ...s.mainTitle, position: 'relative', zIndex: 2 }}>무엇을 그려볼까요?</h1>
        <p className="egag-main-desc" style={{ ...s.mainDesc, position: 'relative', zIndex: 2 }}>AI와 함께하는 3가지 그림 놀이, 지금 바로 시작해봐요</p>

        <div style={{ marginTop: 60 }}>
          <ArtworkCarousel />
        </div>

      </main>

      {/* SVG 웨이브 전환 */}
      <div style={{ position: 'relative', zIndex: 1, lineHeight: 0, marginTop: 60 }}>
        <svg viewBox="0 0 1440 130" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }} preserveAspectRatio="none">
          <path d="M0,70 C240,130 600,10 900,80 C1140,140 1320,30 1440,65 L1440,130 L0,130 Z" fill="rgba(35,24,58,0.5)" />
          <path d="M0,90 C300,20 700,120 1050,60 C1260,20 1380,90 1440,75 L1440,130 L0,130 Z" fill="#1a1428" />
        </svg>
      </div>

      {/* 기능 소개 섹션 */}
      <section style={{ ...s.featureSection, position: 'relative' }} onMouseMove={handleStarCursor}>
        <SparkleStars />

        {/* 별 레이어 */}
        <div className="star-field" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', borderRadius: 'inherit' }} />

        {/* 별똥별 레이어 */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
          {/* 좌상단 → 우하단 (위쪽) */}
          {[
            { top: '5%',  left: '5%',  width: 130, delay: 0,   dur: 18 },
            { top: '2%',  left: '20%', width: 100, delay: 7,   dur: 22 },
            { top: '8%',  left: '10%', width: 150, delay: 13,  dur: 20 },
            { top: '15%', left: '3%',  width: 110, delay: 20,  dur: 25 },
          ].map((s, i) => (
            <div key={`top-${i}`} className="shoot-star" style={{
              top: s.top,
              left: s.left,
              width: s.width,
              background: 'linear-gradient(to right, transparent 0%, rgba(180,205,255,0.1) 30%, rgba(255,255,255,0.55) 65%, rgba(255,255,255,0.95) 85%, white 100%)',
              animation: `shootStar ${s.dur}s ease-in ${s.delay}s infinite`,
            }} />
          ))}
          {/* 우상단 → 좌하단 (아래쪽) */}
          {[
            { top: '60%', left: '85%', width: 120, delay: 4,   dur: 20 },
            { top: '70%', left: '75%', width: 100, delay: 11,  dur: 18 },
            { top: '55%', left: '90%', width: 140, delay: 17,  dur: 23 },
            { top: '75%', left: '80%', width: 110, delay: 25,  dur: 21 },
          ].map((s, i) => (
            <div key={`bot-${i}`} className="shoot-star" style={{
              top: s.top,
              left: s.left,
              width: s.width,
              background: 'linear-gradient(to right, transparent 0%, rgba(180,205,255,0.1) 30%, rgba(255,255,255,0.55) 65%, rgba(255,255,255,0.95) 85%, white 100%)',
              animation: `shootStarRev ${s.dur}s ease-in ${s.delay}s infinite`,
            }} />
          ))}
        </div>
        {/* 성운 glow */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '10%', left: '5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,40,160,0.18) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', top: '45%', right: '0%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,60,150,0.15) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', bottom: '5%', left: '30%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,30,100,0.14) 0%, transparent 65%)' }} />
        </div>

        {/* 섹션 헤더 */}
        <div className="feat-intro" ref={el => { featureRefs.current[3] = el }} style={s.featIntro}>
          <p style={s.featEyebrow}>Features</p>
          <h2 style={s.featSectionTitle}>세 가지 방법으로<br />즐기는 AI 그림 놀이</h2>
          <div style={s.featDivider} />
        </div>

        {/* 마법 그림판: 이미지 왼쪽, 텍스트 오른쪽 */}
        <div className="feature-item feat-row" ref={el => { featureRefs.current[0] = el }} style={s.featureRow}>
          <div className="feat-img" style={s.featureImgWrap}>
            <img src="/icon/img1.png" alt="마법 그림판" style={s.featureImg} />
          </div>
          <div className="feat-txt" style={s.featureText}>
            <span style={{ ...s.featureBadge, color: '#e8a0b0', background: 'rgba(196,122,138,0.15)', border: '1px solid rgba(196,122,138,0.4)' }}>마법 그림판</span>
            <h3 style={s.featureTitle}>AI가 내 그림을<br />맞춰요!</h3>
            <p style={s.featureDesc}>
              캔버스에 자유롭게 그림을 그려보세요.<br />
              AI가 분석하고 카툰·동화·마법 3D<br />스타일로 변환해드려요.
            </p>
            <button className="feat-cta" style={s.featCta} onClick={() => isAuthenticated ? setShowTokenModal('canvas') : navigate('/login')}>
              시작하기
            </button>
          </div>
        </div>

        {/* 거울 그림판: 텍스트 왼쪽, 이미지 오른쪽 */}
        <div className="feature-item feat-row-rev" ref={el => { featureRefs.current[1] = el }} style={{ ...s.featureRow, flexDirection: 'row-reverse' as const }}>
          <div className="feat-img" style={s.featureImgWrap}>
            <img src="/icon/img2.png" alt="거울 그림판" style={s.featureImg} />
          </div>
          <div className="feat-txt" style={{ ...s.featureText, alignItems: 'flex-end' as const, textAlign: 'right' as const }}>
            <span style={{ ...s.featureBadge, color: '#90b8e0', background: 'rgba(107,130,160,0.18)', border: '1px solid rgba(107,130,160,0.45)' }}>거울 그림판</span>
            <h3 style={s.featureTitle}>반만 그려도<br />완성!</h3>
            <p style={s.featureDesc}>
              캔버스 절반에만 그림을 그리면<br />
              AI 미러가 반대쪽을 대칭으로<br />완성해줘요.
            </p>
            <button className="feat-cta" style={s.featCta} onClick={() => isAuthenticated ? setShowTokenModal('deco') : navigate('/login')}>
              시작하기
            </button>
          </div>
        </div>

        {/* 시간초 그림판: 이미지 왼쪽, 텍스트 오른쪽 */}
        <div className="feature-item feat-row" ref={el => { featureRefs.current[2] = el }} style={s.featureRow}>
          <div className="feat-img" style={s.featureImgWrap}>
            <img src="/icon/img3.png" alt="시간초 그림판" style={s.featureImg} />
          </div>
          <div className="feat-txt" style={s.featureText}>
            <span style={{ ...s.featureBadge, color: '#e8c850', background: 'rgba(212,168,0,0.15)', border: '1px solid rgba(212,168,0,0.4)' }}>시간초 그림판</span>
            <h3 style={s.featureTitle}>두근두근<br />제한 시간!</h3>
            <p style={s.featureDesc}>
              주어진 주제를 제한 시간 안에 그려요.<br />
              AI가 맞히면 성공! 친구·가족과<br />함께하면 더욱 재밌어요.
            </p>
            <button className="feat-cta" style={s.featCta} onClick={() => isAuthenticated ? setShowTokenModal('time') : navigate('/login')}>
              시작하기
            </button>
          </div>
        </div>

      </section>

      <footer style={s.footer}>
        © 2025 EgAg · AI 그림판 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <Link to="/terms" className="footer-policy-link">이용약관</Link> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <Link to="/privacy" className="footer-policy-link">개인정보처리방침</Link>
      </footer>

      {/* 스크롤 상단 버튼 */}
      <button
        className="fab-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          position: 'fixed', bottom: isAuthenticated ? 152 : 92, right: 32,
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(107,130,160,0.25)',
          boxShadow: '0 4px 24px rgba(107,130,160,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 200,
          opacity: showTop ? 1 : 0,
          transform: showTop ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.3s, transform 0.3s',
          pointerEvents: showTop ? 'auto' : 'none',
        }}
      >
        <ChevronUp size={20} color="#6B82A0" strokeWidth={2.5} />
      </button>

      {/* 출석체크 모달 */}
      {showAttendanceModal && (
        <AttendanceModal
          onClose={() => setShowAttendanceModal(false)}
          onSuccess={() => setHasAttendedToday(true)}
        />
      )}

      {/* 플로팅 출석체크 버튼 */}
      {isAuthenticated && (
        <button
          className={`fab-attendance${hasAttendedToday ? '' : ' fab-attendance-pulse'}`}
          onClick={() => setShowAttendanceModal(true)}
          style={{
            position: 'fixed', bottom: 92, right: 32,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 22px', borderRadius: 100,
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(107,130,160,0.25)',
            boxShadow: '0 4px 24px rgba(107,130,160,0.2)',
            fontSize: 14, fontWeight: 700,
            color: '#4a5a7a',
            cursor: 'pointer', zIndex: 200,
            transition: 'all 0.2s',
          }}
        >
          <CalendarCheck size={18} color="#6B82A0" />
          출석체크
        </button>
      )}

      {/* 플로팅 문의 버튼 */}
      <button
        className="fab-inquiry"
        onClick={() => navigate('/contact')}
        style={{
          position: 'fixed', bottom: 32, right: 32,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '14px 22px', borderRadius: 100,
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(107,130,160,0.25)',
          boxShadow: '0 4px 24px rgba(107,130,160,0.2)',
          fontSize: 14, fontWeight: 700, color: '#4a5a7a',
          cursor: 'pointer', zIndex: 200,
        }}
      >
        <MessageCircle size={18} color="#6B82A0" />
        문의하기
      </button>

      {/* 토큰 확인 모달 */}
      {showTokenModal && (
        <div
          onClick={() => setShowTokenModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(10,8,20,0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(255,255,255,0.97)',
              borderRadius: 28, padding: '40px 36px',
              width: '100%', maxWidth: 380,
              boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              textAlign: 'center',
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: showTokenModal === 'deco' ? 'rgba(107,130,160,0.12)' : showTokenModal === 'time' ? 'rgba(212,168,0,0.12)' : 'rgba(196,122,138,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
            }}>
              <Ticket size={26} color={showTokenModal === 'deco' ? '#4a6a8a' : showTokenModal === 'time' ? '#b08800' : '#a85a6a'} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: '#1a1a2e', letterSpacing: -0.5 }}>
              토큰 1개가 필요해요
            </h3>
            <p style={{ fontSize: 14, color: '#8a8aaa', lineHeight: 1.75, margin: '4px 0 8px' }}>
              {showTokenModal === 'canvas' && 'AI 변환을 요청할 때 토큰 1개가 차감돼요.'}
              {showTokenModal === 'deco' && 'AI 미러 변환을 요청할 때 토큰 1개가 차감돼요.'}
              {showTokenModal === 'time' && '시간초 그림판을 시작할 때 토큰 1개가 차감돼요.'}
              <br />현재 보유 토큰 <strong style={{ color: '#4a5a7a' }}>{tokenBalance}개</strong>
            </p>
            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 8 }}>
              <button
                onClick={() => setShowTokenModal(null)}
                style={{
                  flex: 1, padding: '13px', fontSize: 15, fontWeight: 600,
                  background: 'none', border: '1.5px solid #e2e8f0',
                  borderRadius: 14, cursor: 'pointer', color: '#8a8aaa',
                }}
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (showTokenModal === 'time') {
                    try {
                      const res = await consumeToken()
                      setTokenBalance(res.tokenBalance)
                    } catch {
                      alert('토큰이 부족합니다.')
                      return
                    }
                  }
                  setShowTokenModal(null)
                  navigate(showTokenModal === 'deco' ? '/decalcomania' : showTokenModal === 'time' ? '/time-attack' : '/canvas')
                }}
                style={{
                  flex: 1, padding: '13px', fontSize: 15, fontWeight: 700,
                  background: showTokenModal === 'deco'
                    ? 'linear-gradient(135deg, #6B82A0, #4a6a8a)'
                    : showTokenModal === 'time'
                    ? 'linear-gradient(135deg, #d4a800, #b08800)'
                    : 'linear-gradient(135deg, #c47a8a, #a85a6a)',
                  border: 'none', borderRadius: 14, cursor: 'pointer', color: '#fff',
                }}
              >
                시작할게요!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #f5f0f8 0%, #ede8f2 40%, #f0eee9 100%)',
    fontFamily: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflowX: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px', height: 70, overflow: 'visible',
    background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(16px)',
    position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
    width: 'calc(100% - 48px)', maxWidth: 960,
    borderRadius: 100,
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
    border: '1px solid rgba(255,255,255,0.8)',
    zIndex: 100,
  },
  logo: { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  userGreet: { fontSize: 14, fontWeight: 600, color: '#4a4a6a' },
  tokenBadge: {
    fontSize: 13, fontWeight: 700, color: '#6B82A0',
    background: 'rgba(107,130,160,0.12)', border: '1px solid rgba(107,130,160,0.25)',
    borderRadius: 20, padding: '4px 14px',
  },
  logoutBtn: {
    fontSize: 13, fontWeight: 500, color: '#8a8aaa',
    background: 'none', border: '1px solid #ddd',
    borderRadius: 20, padding: '6px 16px', cursor: 'pointer',
  },
  loginBtn: {
    fontSize: 14, fontWeight: 600, color: '#6B82A0',
    background: 'none', border: '1px solid rgba(107,130,160,0.4)',
    borderRadius: 20, padding: '7px 20px', cursor: 'pointer',
  },
  signupBtn: {
    fontSize: 14, fontWeight: 700, color: '#fff',
    background: 'linear-gradient(135deg, #6B82A0, #c47a8a)',
    border: 'none', borderRadius: 20, padding: '7px 20px', cursor: 'pointer',
  },
  main: {
    flex: 1, position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '130px 24px 60px',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: 13, fontWeight: 600, letterSpacing: 2,
    color: '#c47a8a', margin: '0 0 16px',
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 58, fontWeight: 900, margin: '0 0 16px',
    letterSpacing: -1, lineHeight: 1.2, padding: '4px 8px',
    fontFamily: "'Jua', sans-serif",
    color: '#d4607a',
    WebkitTextFillColor: '#d4607a',
  },
  mainDesc: {
    fontSize: 17, color: '#8a7a9a', margin: '0 0 60px', lineHeight: 1.7,
  },
  cards: {
    display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap',
    marginTop: 40,
  },
  cardCanvas: {
    background: 'linear-gradient(145deg, #fce8ed 0%, #f2d0d8 100%)',
    borderRadius: 28, padding: '36px 32px',
    boxShadow: '0 8px 40px rgba(196,122,138,0.18)',
    width: 300, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    gap: 14, cursor: 'pointer',
    border: '1.5px solid rgba(255,255,255,0.7)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    textAlign: 'left',
  },
  cardDeco: {
    background: 'linear-gradient(145deg, #ddeaf8 0%, #c8daf0 100%)',
    borderRadius: 28, padding: '36px 32px',
    boxShadow: '0 8px 40px rgba(107,130,160,0.18)',
    width: 300, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    gap: 14, cursor: 'pointer',
    border: '1.5px solid rgba(255,255,255,0.7)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    textAlign: 'left',
  },
  cardTime: {
    background: 'linear-gradient(145deg, #fdf5cc 0%, #f5e580 100%)',
    borderRadius: 28, padding: '36px 32px',
    boxShadow: '0 8px 40px rgba(212,168,0,0.18)',
    width: 300, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    gap: 14, cursor: 'pointer',
    border: '1.5px solid rgba(255,255,255,0.7)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    textAlign: 'left',
  },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  cardIconWrap: {
    fontSize: 32, width: 56, height: 56, borderRadius: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)',
  },
  cardTag: {
    fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '4px 12px',
  },
  cardTitle: { fontSize: 24, fontWeight: 900, margin: 0, fontFamily: "'Jua', sans-serif" },
  cardDesc: { fontSize: 14, lineHeight: 1.75, margin: 0, flex: 1 },
  cardBtn: {
    width: '100%', padding: '14px', fontSize: 15, fontWeight: 700,
    color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer',
    transition: 'filter 0.15s',
    letterSpacing: 0.3,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  featureSection: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 100,
    width: '100%',
    padding: '60px 24px 140px',
    background: '#1a1428',
  },
  featInner: {
    maxWidth: 1080, margin: '0 auto', width: '100%',
    display: 'flex', flexDirection: 'column' as const, gap: 120,
  },
  featIntro: {
    textAlign: 'center' as const,
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 16,
    position: 'relative' as const, zIndex: 1,
    width: '100%', maxWidth: 860,
  },
  featEyebrow: {
    fontSize: 12, fontWeight: 700, letterSpacing: 4,
    color: '#7a6a9a', margin: 0, textTransform: 'uppercase' as const,
  },
  featSectionTitle: {
    fontSize: 'clamp(32px, 4.5vw, 52px)' as unknown as number,
    fontWeight: 900, margin: 0,
    letterSpacing: -1, lineHeight: 1.12,
    color: '#f0ecfa',
    fontFamily: "'Jua', sans-serif",
  },
  featDivider: {
    width: 48, height: 3, borderRadius: 99,
    background: 'linear-gradient(90deg, #c47a8a, #6B82A0)',
    marginTop: 8,
  },
  featureRow: {
    display: 'flex', alignItems: 'center', gap: 56,
    position: 'relative' as const, zIndex: 1,
    width: '100%', maxWidth: 860,
  },
  featureImgWrap: {
    flex: '0 0 auto',
    width: 'clamp(240px, 38%, 380px)' as unknown as number,
    aspectRatio: '1 / 1' as unknown as number,
    borderRadius: 36,
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.05)',
  },
  featureImg: {
    width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block',
  },
  featureText: {
    flex: 1,
    display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start' as const, gap: 20,
    minWidth: 0,
  },
  featureBadge: {
    display: 'inline-block',
    fontSize: 13, fontWeight: 700, borderRadius: 100, padding: '6px 16px',
    letterSpacing: 0.3,
  },
  featureTitle: {
    fontSize: 'clamp(32px, 3.8vw, 52px)' as unknown as number,
    fontWeight: 900, margin: 0,
    color: '#f0ecfa', letterSpacing: -0.5, lineHeight: 1.1,
    fontFamily: "'Jua', sans-serif",
  },
  featureDesc: {
    fontSize: 17, color: '#8888aa', lineHeight: 1.9, margin: 0,
  },
  featCta: {
    fontSize: 16, fontWeight: 700,
    color: '#d0c8f0', background: 'none', border: 'none',
    cursor: 'pointer', padding: 0, letterSpacing: -0.3,
    marginTop: 4,
  },
  footer: {
    position: 'relative', zIndex: 1,
    textAlign: 'center', padding: '24px', fontSize: 12, color: '#4a4a6a',
    background: '#1a1428',
  },
}

