import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { getArtwork, toggleLikeArtwork, reportArtwork, updateArtworkTitle } from '../api/artwork'
import type { ArtworkResponse } from '../types'
import Header from '../components/Header'
import { ArrowLeft, Link2, Flag, Pencil, Check, X } from 'lucide-react'
import LikeButton from '../components/LikeButton'
import { useAuthStore } from '../stores/useAuthStore'

export default function ArtworkDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const stateTitle = (location.state as any)?.title as string | undefined
  const [artwork, setArtwork] = useState<ArtworkResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [slideIndex, setSlideIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('부적절한 콘텐츠')
  const [reportDescription, setReportDescription] = useState('')
  const [copied, setCopied] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [titleSaving, setTitleSaving] = useState(false)
  const { userId: currentUserId } = useAuthStore()

  useEffect(() => {
    if (!id) return
    getArtwork(id)
        .then(data => {
          setArtwork(data)
          setIsLiked(data.isLiked ?? false)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
  }, [id])

  const handleLike = async () => {
    if (!id || !artwork) return
    setIsAnimating(true)
    try {
      await toggleLikeArtwork(id)
      setIsLiked(!isLiked)
      setArtwork({ ...artwork, likeCount: isLiked ? artwork.likeCount - 1 : artwork.likeCount + 1 })
    } catch (error) {
      console.error('Failed to toggle like:', error)
    } finally {
      setTimeout(() => setIsAnimating(false), 400)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(window.location.href)
      } else {
        const ta = document.createElement('textarea')
        ta.value = window.location.href
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('주소 복사에 실패했어요. 주소창의 주소를 직접 복사해주세요.')
    }
  }

  const handleEditTitle = () => {
    setTitleInput(artwork?.title || '')
    setEditingTitle(true)
  }

  const handleSaveTitle = async () => {
    if (!id || !artwork || !titleInput.trim()) return
    setTitleSaving(true)
    try {
      await updateArtworkTitle(id, titleInput.trim())
      setArtwork({ ...artwork, title: titleInput.trim() })
      setEditingTitle(false)
    } catch { /* 실패 시 무시 */ }
    finally { setTitleSaving(false) }
  }

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      await reportArtwork(id, { reason: reportReason, description: reportDescription || '상세 내용 없음' })
      alert('신고가 접수되었습니다.')
      setIsReportModalOpen(false)
      setReportDescription('')
    } catch (error: any) {
      alert(error.response?.data?.message || '신고 제출에 실패했습니다.')
    }
  }

  if (loading) {
    return (
        <div style={s.bg}>
          <Header />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#a09ab0', fontSize: 15 }}>불러오는 중...</p>
          </div>
        </div>
    )
  }

  if (!artwork) {
    return (
        <div style={s.bg}>
          <Header />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <p style={{ fontSize: 48 }}>😢</p>
            <p style={{ color: '#a09ab0', fontWeight: 600 }}>작품을 찾을 수 없어요</p>
            <button onClick={() => navigate(-1)} style={s.backBtn}>돌아가기</button>
          </div>
        </div>
    )
  }

  const hasAI = artwork.strokeData && artwork.strokeData.some(s => s.isAI)

  return (
      <div style={s.bg}>
        <style>{`
          @keyframes blob1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-60px)} }
          @keyframes blob2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(60px)} }
          @keyframes blob3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-40px)} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes heartPop { 0%{transform:scale(1)} 50%{transform:scale(1.35)} 100%{transform:scale(1)} }
          .ad-back-btn:hover { background: rgba(107,130,160,0.12) !important; }
          .ad-like-btn:hover:not(:disabled) { opacity: 0.88; }
          .ad-like-btn.popping { animation: heartPop 0.4s ease; }
          .ad-share-btn:hover { background: rgba(107,130,160,0.14) !important; }
          .ad-report-btn:hover { background: rgba(196,122,138,0.14) !important; }
          .ad-creator-row:hover { background: rgba(107,130,160,0.1) !important; }
          @media (max-width: 640px) {
            .ad-main { padding: 90px 14px 60px !important; }
            .ad-layout { flex-direction: column !important; gap: 16px !important; }
            .ad-img-panel { flex: none !important; width: 100% !important; }
            .ad-info-panel { flex: none !important; width: 100% !important; }
            .ad-card { padding: 20px 16px !important; }
            .ad-modal-card { padding: 24px 20px !important; max-width: calc(100vw - 32px) !important; }
          }
          @media (min-width: 641px) and (max-width: 860px) {
            .ad-main { padding: 120px 20px 60px !important; }
          }
        `}</style>

        <div style={s.blobs}>
          <div style={{ ...s.blob, top: '-10%', left: '-8%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,150,180,0.2) 0%, transparent 65%)', animation: 'blob1 7s ease-in-out infinite' }} />
          <div style={{ ...s.blob, top: '20%', right: '-10%', width: 480, height: 480, background: 'radial-gradient(circle, rgba(107,130,160,0.16) 0%, transparent 65%)', animation: 'blob2 9s ease-in-out infinite' }} />
          <div style={{ ...s.blob, bottom: '5%', left: '20%', width: 420, height: 420, background: 'radial-gradient(circle, rgba(255,220,80,0.13) 0%, transparent 65%)', animation: 'blob3 11s ease-in-out infinite' }} />
        </div>

        <Header />

        <main style={s.main} className="ad-main">
          {/* 뒤로가기 */}
          <button className="ad-back-btn" onClick={() => navigate(-1)} style={s.backTopBtn}>
            <ArrowLeft size={15} strokeWidth={2.5} />
            돌아가기
          </button>

          <div style={s.layout} className="ad-layout">
            {/* 이미지 패널 */}
            <div style={s.imgPanel} className="ad-img-panel">
              <div style={{ ...s.imgCard, position: 'relative' }}>
                <div style={s.topicBadge}>{artwork.topic || 'hi!'}</div>

                <div style={s.slideWrap}>
                  <div style={{ ...s.slidePanel, opacity: slideIndex === 0 ? 1 : 0, pointerEvents: slideIndex === 0 ? 'auto' : 'none' }}>
                    {artwork.userImageData ? (
                        <img src={artwork.userImageData} alt="user 그림" style={s.img} />
                    ) : (
                        <div style={s.imgPlaceholder}>✏️</div>
                    )}
                  </div>
                  <div style={{ ...s.slidePanel, opacity: slideIndex === 1 ? 1 : 0, pointerEvents: slideIndex === 1 ? 'auto' : 'none' }}>
                    {artwork.imageUrl ? (
                        <img src={artwork.imageUrl} alt="AI 그림" style={s.img} />
                    ) : (
                        <div style={s.imgPlaceholder}>🤖</div>
                    )}
                  </div>

                  {slideIndex > 0 && (
                      <button style={{ ...s.slideArrow, left: 12 }} onClick={() => setSlideIndex(0)}>‹</button>
                  )}
                  {slideIndex < 1 && (
                      <button style={{ ...s.slideArrow, right: 12 }} onClick={() => setSlideIndex(1)}>›</button>
                  )}

                  <div style={s.slideLabel}>{slideIndex === 0 ? 'user 그림' : 'AI 그림'}</div>

                  <div style={s.dotRow}>
                    {[0, 1].map(i => (
                        <div key={i} style={{ ...s.dot, background: slideIndex === i ? '#fff' : 'rgba(255,255,255,0.45)' }} onClick={() => setSlideIndex(i)} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 정보 패널 */}
            <div style={s.infoPanel} className="ad-info-panel">
              <div style={s.card} className="ad-card">
                {/* 제목 + 편집 */}
                {editingTitle ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        autoFocus
                        value={titleInput}
                        onChange={e => setTitleInput(e.target.value.slice(0, 12))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveTitle()
                          if (e.key === 'Escape') setEditingTitle(false)
                        }}
                        maxLength={12}
                        style={{
                          width: '100%', fontSize: 22, fontWeight: 900,
                          fontFamily: "'Jua', sans-serif",
                          border: 'none', borderBottom: '2px solid #c47a8a',
                          background: 'transparent', outline: 'none',
                          color: '#4a4a6a', padding: '2px 0', boxSizing: 'border-box',
                        }}
                      />
                      <span style={{ position: 'absolute', right: 2, bottom: -18, fontSize: 11, color: titleInput.length >= 12 ? '#c47a8a' : '#b0a8bc', fontWeight: 600 }}>
                        {titleInput.length}/12
                      </span>
                    </div>
                    <button onClick={handleSaveTitle} disabled={titleSaving || !titleInput.trim()} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#43aa8b', display: 'flex', padding: 4,
                    }}><Check size={18} strokeWidth={2.5} /></button>
                    <button onClick={() => setEditingTitle(false)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#9ca3af', display: 'flex', padding: 4,
                    }}><X size={18} strokeWidth={2.5} /></button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h1 style={s.artTitle}>{artwork.title || stateTitle || 'hi!'}</h1>
                    {currentUserId === artwork.userId && (
                      <button onClick={handleEditTitle} title="제목 수정" style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#b0a8bc', display: 'flex', padding: 4, flexShrink: 0,
                        transition: 'color 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#c47a8a'}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#b0a8bc'}
                      >
                        <Pencil size={15} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                )}

                {/* 작가 */}
                <Link to={`/user/${artwork.userId}`} className="ad-creator-row" style={s.creatorRow}>
                  <div style={s.creatorAvatar}>
                    {artwork.userNickname ? artwork.userNickname[0].toUpperCase() : 'A'}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: '#a09ab0', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>그린 사람</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#6B82A0' }}>{artwork.userNickname || '익명의 화가'}</p>
                  </div>
                </Link>

                {/* 통계 — 그린 횟수 제외 */}
                <div style={s.statsRow}>
                  <div style={s.statBox}>
                    <p style={s.statLabel}>좋아요</p>
                    <p style={s.statValue}>{artwork.likeCount}개</p>
                  </div>
                  <div style={s.statBox}>
                    <p style={s.statLabel}>상태</p>
                    <p style={s.statValue}>{artwork.status === 'DRAWING' ? '그리는 중' : '완성!'}</p>
                  </div>
                  <div style={s.statBox}>
                    <p style={s.statLabel}>날짜</p>
                    <p style={s.statValue}>{new Date(artwork.createdAt).toLocaleDateString('ko-KR')}</p>
                  </div>
                </div>

                {/* 이야기 */}
                <div style={s.storyBox}>
                  <p style={s.storyLabel}>그림 이야기</p>
                  <p style={s.storyText}>
                    {hasAI
                        ? `'${artwork.topic}'라는 주제로 AI와 함께 번갈아 그린 작품이에요. 붓 터치 하나하나에 담긴 상상력이 놀랍지 않나요?`
                        : `'${artwork.topic}'라는 주제로 탄생한 소중한 작품이에요. 정성스럽게 완성한 멋진 그림이에요!`
                    }
                  </p>
                </div>

                {/* 응원하기 버튼 */}
                <LikeButton
                  isLiked={isLiked}
                  likeCount={artwork.likeCount}
                  onToggle={handleLike}
                />

                {/* 공유 / 신고 */}
                <div style={s.secondaryBtns}>
                  <button className="ad-share-btn" onClick={handleShare} style={s.shareBtn}>
                    <Link2 size={14} />
                    {copied ? '복사됨!' : '공유하기'}
                  </button>
                  <button className="ad-report-btn" onClick={() => setIsReportModalOpen(true)} style={s.reportBtn}>
                    <Flag size={14} />
                    신고
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* 신고 모달 */}
        {isReportModalOpen && (
            <div style={s.modalBackdrop} onClick={() => setIsReportModalOpen(false)}>
              <div style={s.modalCard} className="ad-modal-card" onClick={e => e.stopPropagation()}>
                <h2 style={s.modalTitle}>작품 신고하기</h2>
                <p style={s.modalSub}>어떤 문제가 있나요? 빠르게 확인해볼게요.</p>

                <form onSubmit={submitReport} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={s.modalLabel}>신고 이유</label>
                    <select value={reportReason} onChange={e => setReportReason(e.target.value)} style={s.modalInput}>
                      <option value="부적절한 콘텐츠">부적절한 콘텐츠 (선정성, 폭력성 등)</option>
                      <option value="저작권 침해">저작권 침해 의심</option>
                      <option value="스팸/광고">스팸 또는 부적절한 홍보</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <div>
                    <label style={s.modalLabel}>상세 내용 (선택)</label>
                    <textarea
                        value={reportDescription}
                        onChange={e => setReportDescription(e.target.value)}
                        placeholder="구체적으로 알려주시면 도움이 돼요..."
                        style={{ ...s.modalInput, minHeight: 100, resize: 'vertical' as const }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" style={s.modalSubmit}>신고 제출</button>
                    <button type="button" onClick={() => setIsReportModalOpen(false)} style={s.modalCancel}>취소</button>
                  </div>
                </form>
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
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  blobs: {
    position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
  },
  blob: {
    position: 'absolute', borderRadius: '50%', filter: 'blur(60px)',
  },
  main: {
    flex: 1,
    maxWidth: 1080,
    width: '100%',
    margin: '0 auto',
    padding: '180px 24px 80px',
    position: 'relative',
    zIndex: 1,
    animation: 'fadeUp 0.5s ease both',
  },
  backTopBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    marginBottom: 20,
    padding: '8px 16px',
    fontSize: 13, fontWeight: 600, color: '#6B82A0',
    background: 'rgba(107,130,160,0.07)',
    border: '1.5px solid rgba(107,130,160,0.18)',
    borderRadius: 100, cursor: 'pointer',
    transition: 'background 0.15s',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.7)',
    border: '1.5px solid rgba(107,130,160,0.2)',
    borderRadius: 12, padding: '8px 18px',
    fontSize: 13, fontWeight: 600, color: '#6B82A0',
    cursor: 'pointer',
  },
  layout: {
    display: 'flex', gap: 28, alignItems: 'stretch', flexWrap: 'wrap' as const,
  },
  imgPanel: {
    flex: '1 1 380px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  slideWrap: {
    position: 'relative', width: '100%', minHeight: 400,
  },
  slidePanel: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', transition: 'opacity 0.35s ease', minHeight: 400,
  },
  slideArrow: {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 3,
    background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(6px)',
    border: 'none', borderRadius: '50%', width: 36, height: 36,
    fontSize: 22, fontWeight: 700, color: '#6B82A0', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 12px rgba(107,130,160,0.2)',
  },
  slideLabel: {
    position: 'absolute', bottom: 44, left: '50%', transform: 'translateX(-50%)', zIndex: 3,
    background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
    color: '#fff', fontSize: 12, fontWeight: 700,
    borderRadius: 20, padding: '4px 14px', letterSpacing: 0.5, whiteSpace: 'nowrap',
  },
  dotRow: {
    position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
    zIndex: 3, display: 'flex', gap: 6,
  },
  dot: {
    width: 7, height: 7, borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s',
  },
  topicBadge: {
    position: 'absolute', top: 16, left: 16, zIndex: 2,
    background: 'linear-gradient(135deg, rgba(196,122,138,0.88), rgba(107,130,160,0.88))',
    backdropFilter: 'blur(8px)', color: '#fff', fontWeight: 700,
    fontSize: 13, borderRadius: 24, padding: '6px 16px',
    boxShadow: '0 2px 12px rgba(107,130,160,0.25)', letterSpacing: 0.3,
    maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  imgCard: {
    flex: 1, borderRadius: 24, overflow: 'hidden',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,240,248,0.85) 100%)',
    border: '1.5px solid rgba(255,255,255,0.75)',
    boxShadow: '0 8px 48px rgba(107,130,160,0.15)',
    display: 'flex', alignItems: 'stretch', justifyContent: 'center',
  },
  img: {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
  },
  imgPlaceholder: {
    fontSize: 80, padding: 60,
  },
  infoPanel: {
    flex: '1 1 340px',
    display: 'flex', flexDirection: 'column',
  },
  card: {
    flex: 1,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,240,248,0.85) 100%)',
    border: '1.5px solid rgba(255,255,255,0.75)',
    borderRadius: 24, padding: '28px 24px',
    boxShadow: '0 8px 40px rgba(107,130,160,0.13)',
    display: 'flex', flexDirection: 'column', gap: 18,
  },
  artTitle: {
    fontSize: 24, fontWeight: 900, margin: 0,
    fontFamily: "'Jua', sans-serif",
    background: 'linear-gradient(135deg, #c47a8a 0%, #6B82A0 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text', lineHeight: 1.3,
  },
  creatorRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    textDecoration: 'none',
    background: 'rgba(107,130,160,0.06)',
    borderRadius: 14, padding: '12px 14px',
    border: '1px solid rgba(107,130,160,0.1)',
    transition: 'background 0.15s',
  },
  creatorAvatar: {
    width: 38, height: 38, borderRadius: '50%',
    background: 'linear-gradient(135deg, #c47a8a, #6B82A0)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  statsRow: {
    display: 'flex', gap: 10,
  },
  statBox: {
    flex: 1,
    background: 'rgba(107,130,160,0.06)',
    borderRadius: 12, padding: '12px 10px',
    border: '1px solid rgba(107,130,160,0.1)',
    textAlign: 'center' as const,
  },
  statLabel: {
    margin: '0 0 4px', fontSize: 10, fontWeight: 600,
    color: '#a09ab0', textTransform: 'uppercase' as const, letterSpacing: 0.5,
  },
  statValue: {
    margin: 0, fontSize: 14, fontWeight: 700, color: '#4a4a6a',
  },
  storyBox: {
    background: 'rgba(107,130,160,0.05)',
    borderRadius: 14, padding: '14px 16px',
    border: '1px solid rgba(107,130,160,0.08)',
  },
  storyLabel: {
    margin: '0 0 8px', fontSize: 10, fontWeight: 700,
    color: '#a09ab0', textTransform: 'uppercase' as const, letterSpacing: 1,
  },
  storyText: {
    margin: 0, fontSize: 13, color: '#6a6a8a', lineHeight: 1.7,
  },
  likeBtn: {
    width: '100%', padding: '14px',
    fontSize: 15, fontWeight: 700, color: '#fff',
    border: 'none', borderRadius: 14, cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(107,130,160,0.25)',
    transition: 'opacity 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  secondaryBtns: {
    display: 'flex', gap: 10,
  },
  shareBtn: {
    flex: 1, padding: '11px',
    fontSize: 13, fontWeight: 600, color: '#6B82A0',
    background: 'rgba(107,130,160,0.08)',
    border: '1.5px solid rgba(107,130,160,0.2)',
    borderRadius: 12, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: 'background 0.15s',
  },
  reportBtn: {
    padding: '11px 16px',
    fontSize: 13, fontWeight: 600, color: '#c47a8a',
    background: 'rgba(196,122,138,0.08)',
    border: '1.5px solid rgba(196,122,138,0.2)',
    borderRadius: 12, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: 'background 0.15s',
  },
  modalBackdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(50,40,70,0.35)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 24,
  },
  modalCard: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(245,240,248,0.95) 100%)',
    borderRadius: 24, padding: '32px 28px',
    width: '100%', maxWidth: 440,
    boxShadow: '0 20px 60px rgba(107,130,160,0.2)',
    border: '1.5px solid rgba(255,255,255,0.8)',
  },
  modalTitle: {
    margin: '0 0 8px', fontSize: 20, fontWeight: 900,
    fontFamily: "'Jua', sans-serif",
    background: 'linear-gradient(135deg, #c47a8a, #6B82A0)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  modalSub: { margin: '0 0 24px', fontSize: 13, color: '#a09ab0' },
  modalLabel: {
    display: 'block', fontSize: 12, fontWeight: 700, color: '#6B82A0',
    marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5,
  },
  modalInput: {
    width: '100%', padding: '11px 14px', fontSize: 14,
    border: '1.5px solid rgba(107,130,160,0.25)', borderRadius: 12,
    outline: 'none', background: 'rgba(255,255,255,0.8)',
    color: '#4a4a6a', boxSizing: 'border-box' as const, fontFamily: 'inherit',
  },
  modalSubmit: {
    flex: 2, padding: '12px', fontSize: 14, fontWeight: 700, color: '#fff',
    background: 'linear-gradient(135deg, #c47a8a, #e8a0b0)',
    border: 'none', borderRadius: 12, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(196,122,138,0.3)',
  },
  modalCancel: {
    flex: 1, padding: '12px', fontSize: 14, fontWeight: 600, color: '#8a7a9a',
    background: 'rgba(107,130,160,0.08)',
    border: '1.5px solid rgba(107,130,160,0.2)', borderRadius: 12, cursor: 'pointer',
  },
  backBtn: {},
}
