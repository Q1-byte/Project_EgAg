import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { getArtwork, toggleLikeArtwork, reportArtwork } from '../api/artwork'
import { toggleFollowUser, getUserProfile } from '../api/user'
import { useAuthStore } from '../stores/useAuthStore'
import { UserPlus, UserCheck } from 'lucide-react'
import type { ArtworkResponse } from '../types'
import Header from '../components/Header'
import LikeButton from '../components/LikeButton'
import { Link2, Check, Flag } from 'lucide-react'

export default function ArtworkDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const stateTitle = (location.state as any)?.title as string | undefined
  const [artwork, setArtwork] = useState<ArtworkResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [slideIndex, setSlideIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const { userId: currentUserId } = useAuthStore()
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('부적절한 콘텐츠')
  const [reportDescription, setReportDescription] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    getArtwork(id)
      .then(data => {
        setArtwork(data)
        setIsLiked(data.isLiked || false)
        setIsFollowing(data.isFollowing || false)
        // 작가의 팔로워 수를 가져오기 위해 별도 호출 (데이터 정합성)
        getUserProfile(data.userId).then(u => setFollowerCount(u.followerCount))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleLike = async () => {
    if (!id || !artwork) return
    try {
      await toggleLikeArtwork(id)
      setIsLiked(!isLiked)
      setArtwork({ ...artwork, likeCount: isLiked ? (artwork.likeCount || 0) - 1 : (artwork.likeCount || 0) + 1 })
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const handleFollow = async () => {
    if (!artwork) return
    if (!currentUserId) {
      if (confirm('팔로우하려면 로그인이 필요합니다. 로그인 페이지로 이동할까요?')) {
        navigate('/login')
      }
      return
    }
    if (artwork.userId === currentUserId) return
    
    try {
      await toggleFollowUser(artwork.userId)
      setIsFollowing(!isFollowing)
      setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1)
    } catch (error) {
      console.error('Failed to toggle follow:', error)
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
        .detail-home-btn:hover { background: linear-gradient(135deg, rgba(107,130,160,0.28) 0%, rgba(245,240,248,0.95) 100%) !important; border-color: rgba(107,130,160,0.6) !important; color: #4a6a8a !important; }
        .detail-share-btn:hover { background: rgba(107,130,160,0.25) !important; border-color: rgba(107,130,160,0.6) !important; color: #4a6a8a !important; }
        .detail-report-btn:hover { background: rgba(196,122,138,0.25) !important; border-color: rgba(196,122,138,0.6) !important; color: #a85a6a !important; }
      `}</style>

      <div style={s.blobs}>
        <div style={{ ...s.blob, top: '-10%', left: '-8%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,150,180,0.2) 0%, transparent 65%)', animation: 'blob1 7s ease-in-out infinite' }} />
        <div style={{ ...s.blob, top: '20%', right: '-10%', width: 480, height: 480, background: 'radial-gradient(circle, rgba(107,130,160,0.16) 0%, transparent 65%)', animation: 'blob2 9s ease-in-out infinite' }} />
        <div style={{ ...s.blob, bottom: '5%', left: '20%', width: 420, height: 420, background: 'radial-gradient(circle, rgba(255,220,80,0.13) 0%, transparent 65%)', animation: 'blob3 11s ease-in-out infinite' }} />
      </div>

      <Header />

      <main style={s.main}>
        <div style={s.layout}>
          {/* 이미지 패널 */}
          <div style={s.imgPanel}>
            <div style={{ ...s.imgCard, position: 'relative' }}>
              {/* 동화 주제 뱃지 */}
              <div style={s.topicBadge}>{artwork.topic || 'hi!'}</div>

              {/* 슬라이드 */}
              <div style={s.slideWrap}>
                {/* 유저 그림 슬라이드 */}
                <div style={{ ...s.slidePanel, opacity: slideIndex === 0 ? 1 : 0, pointerEvents: slideIndex === 0 ? 'auto' : 'none' }}>
                  {artwork.userImageData ? (
                    <img src={artwork.userImageData} alt="user 그림" style={s.img} />
                  ) : (
                    <div style={s.imgPlaceholder}>✏️</div>
                  )}
                </div>
                {/* AI 그림 슬라이드 */}
                <div style={{ ...s.slidePanel, opacity: slideIndex === 1 ? 1 : 0, pointerEvents: slideIndex === 1 ? 'auto' : 'none' }}>
                  {artwork.imageUrl ? (
                    <img src={artwork.imageUrl} alt="AI 그림" style={s.img} />
                  ) : (
                    <div style={s.imgPlaceholder}>🤖</div>
                  )}
                </div>

                {/* 화살표 */}
                {slideIndex > 0 && (
                  <button style={{ ...s.slideArrow, left: 12 }} onClick={() => setSlideIndex(0)}>‹</button>
                )}
                {slideIndex < 1 && (
                  <button style={{ ...s.slideArrow, right: 12 }} onClick={() => setSlideIndex(1)}>›</button>
                )}

                {/* 라벨 */}
                <div style={s.slideLabel}>{slideIndex === 0 ? 'user 그림' : 'AI 그림'}</div>

                {/* 점 인디케이터 */}
                <div style={s.dotRow}>
                  {[0, 1].map(i => (
                    <div key={i} style={{ ...s.dot, background: slideIndex === i ? '#fff' : 'rgba(255,255,255,0.45)' }} onClick={() => setSlideIndex(i)} />
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => navigate('/explore')} style={s.galleryHomeBtn} className="detail-home-btn">
              갤러리 홈으로 돌아가기
            </button>
          </div>

          {/* 정보 패널 */}
          <div style={s.infoPanel}>
            {/* 메인 카드 */}
            <div style={s.card}>
              <h1 style={s.artTitle}>{artwork.title || stateTitle || 'hi!'}</h1>

              {/* 작가 정보 섹션 개선 */}
              <div style={s.creatorSection}>
                <Link to={`/user/${artwork.userId}`} style={s.creatorInfo}>
                  <div style={s.creatorAvatar}>
                    {artwork.userNickname ? artwork.userNickname[0].toUpperCase() : 'A'}
                  </div>
                  <div>
                    <p style={s.creatorLabel}>그린 사람</p>
                    <p style={s.creatorName}>{artwork.userNickname || '익명의 화가'}</p>
                    <p style={s.followerText}>팔로워 {followerCount}명</p>
                  </div>
                </Link>

                {/* 작가 본인이 아닐 때만 노출 (로그인 안 한 경우 포함) */}
                {artwork.userId !== currentUserId && (
                  <button 
                    onClick={handleFollow}
                    style={{
                      ...s.followBtn,
                      background: isFollowing ? 'rgba(107, 130, 160, 0.1)' : 'linear-gradient(135deg, #c47a8a, #6B82A0)',
                      color: isFollowing ? '#6B82A0' : '#fff',
                      border: isFollowing ? '1.5px solid rgba(107, 130, 160, 0.2)' : 'none',
                    }}
                  >
                    {isFollowing ? (
                      <><UserCheck size={14} style={{ marginRight: 4 }} />팔로잉</>
                    ) : (
                      <><UserPlus size={14} style={{ marginRight: 4 }} />팔로우</>
                    )}
                  </button>
                )}
              </div>

              {/* 통계 */}
              <div style={s.statsGrid}>
                <div style={s.statBox}>
                  <p style={s.statLabel}>그린 횟수</p>
                  <p style={s.statValue}>{artwork.turnCount}번</p>
                </div>
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

              {/* 버튼 */}
              <div style={{ width: '100%', display: 'flex' }}>
                <LikeButton 
                  isLiked={isLiked} 
                  likeCount={artwork.likeCount} 
                  onToggle={handleLike} 
                />
              </div>

              <div style={s.secondaryBtns}>
                <button onClick={handleShare} style={s.shareBtn} className="detail-share-btn">
                  {copied ? <Check size={14} strokeWidth={2.5} /> : <Link2 size={14} strokeWidth={2} />}
                  {copied ? '복사됨!' : '공유하기'}
                </button>
                <button onClick={() => setIsReportModalOpen(true)} style={s.reportBtn} className="detail-report-btn">
                  <Flag size={14} strokeWidth={2} /> 신고
                </button>
              </div>
            </div>

            {/* 이야기 카드 */}
            <div style={s.storyCard}>
              <p style={s.storyLabel}>그림 이야기</p>
              <p style={s.storyText}>
                {hasAI
                  ? `'${artwork.topic}'라는 주제로 AI와 함께 번갈아 그린 작품이에요. 붓 터치 하나하나에 담긴 상상력이 놀랍지 않나요?`
                  : `'${artwork.topic}'라는 주제로 탄생한 소중한 작품이에요. 정성스럽게 완성한 멋진 그림이에요!`
                }
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 신고 모달 */}
      {isReportModalOpen && (
        <div style={s.modalBackdrop} onClick={() => setIsReportModalOpen(false)}>
          <div style={s.modalCard} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>작품 신고하기</h2>
            <p style={s.modalSub}>어떤 문제가 있나요? 빠르게 확인해볼게요.</p>

            <form onSubmit={submitReport} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={s.modalLabel}>신고 이유</label>
                <select
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  style={s.modalInput}
                >
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
                  style={{ ...s.modalInput, minHeight: 100, resize: 'vertical' }}
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
    background: 'var(--mesh-candy)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  blobs: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(60px)',
  },
  main: {
    flex: 1,
    maxWidth: 1100,
    width: '100%',
    margin: '0 auto',
    padding: '120px 24px 80px',
    position: 'relative',
    zIndex: 1,
    animation: 'fadeUp 0.5s ease both',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.7)',
    border: '1.5px solid rgba(107,130,160,0.2)',
    borderRadius: 12,
    padding: '8px 18px',
    fontSize: 13,
    fontWeight: 600,
    color: '#6B82A0',
    cursor: 'pointer',
    marginBottom: 32,
    display: 'inline-block',
  },
  layout: {
    display: 'flex',
    gap: 32,
    alignItems: 'stretch',
    flexWrap: 'wrap' as const,
  },
  imgPanel: {
    flex: '1 1 420px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  slideWrap: {
    position: 'relative',
    width: '100%',
    minHeight: 360,
  },
  slidePanel: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    transition: 'opacity 0.35s ease',
    minHeight: 360,
  },
  slideArrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 3,
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(6px)',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    fontSize: 22,
    fontWeight: 700,
    color: '#6B82A0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 12px rgba(107,130,160,0.2)',
  },
  slideLabel: {
    position: 'absolute',
    bottom: 44,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 3,
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(6px)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 20,
    padding: '4px 14px',
    letterSpacing: 0.5,
    whiteSpace: 'nowrap',
  },
  dotRow: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 3,
    display: 'flex',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  topicBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 2,
    background: 'linear-gradient(135deg, rgba(196,122,138,0.88), rgba(107,130,160,0.88))',
    backdropFilter: 'blur(8px)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    borderRadius: 24,
    padding: '6px 16px',
    boxShadow: '0 2px 12px rgba(107,130,160,0.25)',
    letterSpacing: 0.3,
    maxWidth: '80%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  imgCard: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1.5px solid rgba(255,255,255,0.75)',
    boxShadow: '0 8px 48px rgba(107,130,160,0.15)',
    minHeight: 360,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  galleryHomeBtn: {
    width: '100%',
    padding: '13px',
    fontSize: 14,
    fontWeight: 700,
    color: '#6B82A0',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,240,248,0.85) 100%)',
    border: '1.5px solid rgba(107,130,160,0.2)',
    borderRadius: 20,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(107,130,160,0.1)',
    textAlign: 'center',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  imgPlaceholder: {
    fontSize: 80,
    padding: 60,
  },
  infoPanel: {
    flex: '1 1 320px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1.5px solid rgba(255,255,255,0.75)',
    borderRadius: 28,
    padding: '32px 28px',
    boxShadow: '0 8px 40px rgba(107,130,160,0.13)',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  topicPill: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, rgba(196,122,138,0.15), rgba(107,130,160,0.12))',
    border: '1px solid rgba(196,122,138,0.25)',
    borderRadius: 20,
    padding: '4px 14px',
    fontSize: 12,
    fontWeight: 700,
    color: '#c47a8a',
    alignSelf: 'flex-start',
  },
  artTitle: {
    fontSize: 26,
    fontWeight: 900,
    margin: 0,
    fontFamily: "'Jua', sans-serif",
    background: 'linear-gradient(135deg, #c47a8a 0%, #6B82A0 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: 1.3,
  },
  creatorSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    background: 'rgba(107, 130, 160, 0.05)',
    borderRadius: 20,
    padding: '14px 18px',
    border: '1px solid rgba(107, 130, 160, 0.1)',
  },
  creatorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    textDecoration: 'none',
  },
  creatorLabel: { margin: 0, fontSize: 10, color: '#a09ab0', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' },
  creatorName: { margin: '2px 0', fontSize: 15, fontWeight: 800, color: '#4a5a7a' },
  followerText: { margin: 0, fontSize: 11, color: '#a09ab0', fontWeight: 500 },
  followBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(107, 130, 160, 0.15)',
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #c47a8a, #6B82A0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  statBox: {
    background: 'rgba(107,130,160,0.06)',
    borderRadius: 14,
    padding: '12px 14px',
    border: '1px solid rgba(107,130,160,0.1)',
  },
  statLabel: {
    margin: '0 0 4px',
    fontSize: 11,
    fontWeight: 600,
    color: '#a09ab0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: '#4a4a6a',
  },
  likeBtn: {
    width: '100%',
    padding: '14px',
    fontSize: 15,
    fontWeight: 700,
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(107,130,160,0.25)',
    transition: 'opacity 0.15s',
  },
  secondaryBtns: {
    display: 'flex',
    gap: 10,
  },
  shareBtn: {
    flex: 1,
    padding: '11px',
    fontSize: 13,
    fontWeight: 600,
    color: '#6B82A0',
    background: 'rgba(107,130,160,0.08)',
    border: '1.5px solid rgba(107,130,160,0.2)',
    borderRadius: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reportBtn: {
    padding: '11px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: '#c47a8a',
    background: 'rgba(196,122,138,0.08)',
    border: '1.5px solid rgba(196,122,138,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    cursor: 'pointer',
  },
  storyCard: {
    background: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(10px)',
    border: '1.5px solid rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: '20px 24px',
    boxShadow: '0 4px 20px rgba(107,130,160,0.08)',
  },
  storyLabel: {
    margin: '0 0 10px',
    fontSize: 11,
    fontWeight: 700,
    color: '#a09ab0',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  storyText: {
    margin: 0,
    fontSize: 14,
    color: '#6a6a8a',
    lineHeight: 1.7,
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(50,40,70,0.35)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 24,
  },
  modalCard: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(245,240,248,0.95) 100%)',
    borderRadius: 28,
    padding: '36px 32px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 20px 60px rgba(107,130,160,0.2)',
    border: '1.5px solid rgba(255,255,255,0.8)',
  },
  modalTitle: {
    margin: '0 0 8px',
    fontSize: 22,
    fontWeight: 900,
    fontFamily: "'Jua', sans-serif",
    background: 'linear-gradient(135deg, #c47a8a, #6B82A0)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  modalSub: {
    margin: '0 0 24px',
    fontSize: 13,
    color: '#a09ab0',
  },
  modalLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 700,
    color: '#6B82A0',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    width: '100%',
    padding: '11px 14px',
    fontSize: 14,
    border: '1.5px solid rgba(107,130,160,0.25)',
    borderRadius: 12,
    outline: 'none',
    background: 'rgba(255,255,255,0.8)',
    color: '#4a4a6a',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  modalSubmit: {
    flex: 2,
    padding: '12px',
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    background: 'linear-gradient(135deg, #c47a8a, #e8a0b0)',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(196,122,138,0.3)',
  },
  modalCancel: {
    flex: 1,
    padding: '12px',
    fontSize: 14,
    fontWeight: 600,
    color: '#8a7a9a',
    background: 'rgba(107,130,160,0.08)',
    border: '1.5px solid rgba(107,130,160,0.2)',
    borderRadius: 14,
    cursor: 'pointer',
  },
}
