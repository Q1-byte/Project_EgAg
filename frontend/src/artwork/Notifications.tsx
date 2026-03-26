import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, UserPlus, Palette, ChevronUp, Trash2, MessageCircle } from 'lucide-react'
import { getNotifications, markNotificationsAsRead, deleteNotification, deleteAllNotifications } from '../api/notification'
import { getArtwork } from '../api/artwork'
import type { NotificationResponse } from '../types'
import Header from '../components/Header'

const TYPE_META: Record<string, { icon: React.ReactElement; color: string; bg: string; label: string }> = {
  LIKE:     { icon: <Heart size={16} strokeWidth={2.5} />,    color: '#c47a8a', bg: 'rgba(196,122,138,0.1)',  label: '좋아요' },
  FOLLOW:   { icon: <UserPlus size={16} strokeWidth={2.5} />, color: '#6B82A0', bg: 'rgba(107,130,160,0.1)', label: '팔로우' },
  FINISHED:      { icon: <Palette size={16} strokeWidth={2.5} />,       color: '#8a6ab0', bg: 'rgba(138,106,176,0.1)', label: '완성' },
  INQUIRY_REPLY: { icon: <MessageCircle size={16} strokeWidth={2.5} />, color: '#4a9a7a', bg: 'rgba(74,154,122,0.1)',  label: '문의 답변' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [selected, setSelected] = useState<NotificationResponse | null>(null)
  const [selectedArtImageUrl, setSelectedArtImageUrl] = useState<string | null>(null)
  const [showTop, setShowTop] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications()
        setNotifications(data)
        if (data.length > 0) await markNotificationsAsRead()
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
      }
    }
    fetchNotifications()
  }, [])

  const closeStory = () => {
    setSelected(null)
    setSelectedArtImageUrl(null)
  }

  const goToDetail = () => {
    if (!selected) return
    if (selected.type === 'FOLLOW') navigate(`/user/${selected.actorId}`)
    else if (selected.type === 'INQUIRY_REPLY') navigate('/contact')
    else if (selected.artworkId) navigate(`/artwork/${selected.artworkId}`)
    setSelected(null); setSelectedArtImageUrl(null)
  }

  const goToProfile = () => {
    if (selected?.actorId) { navigate(`/user/${selected.actorId}`); setSelected(null); setSelectedArtImageUrl(null) }
  }

  const avatarSrc = (url?: string | null) =>
    url ? (url.startsWith('/uploads') ? `http://localhost:8080${url}` : url) : null

  return (
    <div style={s.bg} className="notif-bg">
      <Header />

      {/* --- 전용 알림 스토리 모달 --- */}
      {selected && (
        <div className="modal-overlay" onClick={closeStory} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)',
          zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'fadeIn 0.3s ease-out'
        }}>
          <div className="story-modal" onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 500, background: '#fff', borderRadius: 48,
            padding: 40, position: 'relative', textAlign: 'center',
            boxShadow: '0 30px 70px rgba(255, 133, 179, 0.15)',
            border: '2px solid rgba(255, 255, 255, 0.8)',
            transform: 'scale(1)', animation: 'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)'
          }}>
            <button onClick={closeStory} style={{
              position: 'absolute', top: 24, right: 24, background: '#F5F7FA',
              border: 'none', width: 40, height: 40, borderRadius: 20,
              fontSize: 20, cursor: 'pointer', color: '#8a8aaa', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>✕</button>

            {/* 비주얼 섹션 */}
            <div style={{ position: 'relative', height: 240, marginBottom: 32, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {selected.type === 'LIKE' && (
                <>
                  <div style={{ 
                    width: 200, height: 200, borderRadius: 32, overflow: 'hidden', 
                    transform: 'rotate(-5deg)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    border: '8px solid white'
                  }}>
                    <img src={selected.artworkId ? `http://localhost:8080/api/artwork/${selected.artworkId}/image` : '/placeholder.png'} 
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ 
                    position: 'absolute', bottom: -10, right: 100, width: 80, height: 80, 
                    borderRadius: 30, overflow: 'hidden', border: '4px solid #fff',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.1)', transform: 'rotate(5deg)'
                  }}>
                    <img src={selected.actorProfileImage?.startsWith('/uploads') ? `http://localhost:8080${selected.actorProfileImage}` : (selected.actorProfileImage || '/default-avatar.png')} 
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ position: 'absolute', top: 20, right: 80, fontSize: 64, animation: 'float 3s infinite ease-in-out' }}>❤️</div>
                </>
              )}
              {selected.type === 'FOLLOW' && (
                <>
                  <div style={{ 
                    width: 160, height: 160, borderRadius: 60, overflow: 'hidden', 
                    boxShadow: '0 15px 40px rgba(165, 216, 255, 0.3)',
                    border: '6px solid #A5D8FF'
                  }}>
                    <img src={selected.actorProfileImage?.startsWith('/uploads') ? `http://localhost:8080${selected.actorProfileImage}` : (selected.actorProfileImage || '/default-avatar.png')} 
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ position: 'absolute', top: 0, left: 60, fontSize: 48, animation: 'float 4s infinite ease-in-out' }}>✨</div>
                  <div style={{ position: 'absolute', bottom: 20, right: 60, fontSize: 40, animation: 'float 3s infinite reverse ease-in-out' }}>🌟</div>
                </>
              )}
               {selected.type === 'FINISHED' && (
                <>
                  <div style={{ 
                    width: 220, height: 180, borderRadius: 24, overflow: 'hidden', 
                    boxShadow: '0 15px 40px rgba(0,0,0,0.1)', transform: 'rotate(-2deg)',
                    border: '8px solid white'
                  }}>
                    <img src={selected.artworkId ? `http://localhost:8080/api/artwork/${selected.artworkId}/image` : '/placeholder.png'} 
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 50 }}>🎨</div>
                </>
              )}
                  {/* TOKEN (기본값) */}
                  {selected.type === 'TOKEN' && (
                    <>
                      <div style={{ 
                        width: 160, height: 160, borderRadius: 40, background: 'rgba(255, 215, 0, 0.1)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80,
                        boxShadow: '0 15px 40px rgba(255, 215, 0, 0.2)', border: '4px dashed #FFD700'
                      }}>
                        🪙
                      </div>
                      <div style={{ position: 'absolute', top: 0, left: 60, fontSize: 40, animation: 'float 4s infinite ease-in-out' }}>✨</div>
                      <div style={{ position: 'absolute', bottom: 20, right: 60, fontSize: 40, animation: 'float 3s infinite reverse ease-in-out' }}>💎</div>
                    </>
                  )}
                  {/* INQUIRY_REPLY */}
                  {selected.type === 'INQUIRY_REPLY' && (
                    <>
                      <div style={{ 
                        width: 160, height: 160, borderRadius: 40, background: 'rgba(107, 130, 160, 0.1)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80,
                        boxShadow: '0 15px 40px rgba(107, 130, 160, 0.2)', border: '4px dashed #6B82A0'
                      }}>
                        ✉️
                      </div>
                      <div style={{ position: 'absolute', top: 0, left: 60, fontSize: 40, animation: 'float 4s infinite ease-in-out' }}>📝</div>
                      <div style={{ position: 'absolute', bottom: 20, right: 60, fontSize: 40, animation: 'float 3s infinite reverse ease-in-out' }}>✨</div>
                    </>
                  )}
            </div>

            {/* 메시지 섹션 */}
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1a1a2e', marginBottom: 16, wordBreak: 'keep-all' }}>
              {selected.type === 'LIKE' && `${selected.actorNickname} 친구가 이 그림을 아주 좋아한대요!`}
              {selected.type === 'FOLLOW' && `${selected.actorNickname} 친구랑 이제 단짝이 되었어요!`}
              {selected.type === 'FINISHED' && `와아! 내 그림이 드디어 완성됐어요!`}
              {selected.type === 'TOKEN' && `관리자님이 보낸 보너스 선물이 도착했어요!`}
              {selected.type === 'INQUIRY_REPLY' && `문의하신 내용에 답변이 도착했어요!`}
            </h2>
            <p style={{ fontSize: 16, color: '#6B82A0', fontWeight: 600, marginBottom: 32, lineHeight: 1.6 }}>
              {selected.type === 'LIKE' && '내가 정성껏 그린 그림이 친구의 마음을 따뜻하게 만들었나 봐요. ❤️'}
              {selected.type === 'FOLLOW' && '앞으로 서로의 멋진 그림들을 더 많이 구경할 수 있게 되었어요! ✨'}
              {selected.type === 'FINISHED' && '지금 바로 완성된 그림을 확인하러 가볼까요? 🎨'}
              {selected.type === 'TOKEN' && (
                <>
                  우리 커뮤니티를 빛내주셔서 감사합니다! ✨<br/>
                  보상 토큰: <strong>{selected.amount || 1}개</strong><br/>
                  사유: <span style={{ color: '#c47a8a' }}>{selected.reason || '관리자 보상'}</span>
                </>
              )}
              {selected.type === 'INQUIRY_REPLY' && (
                <>
                  문의하신 <span style={{ color: '#6B82A0' }}>"{selected.reason}"</span>에 대한<br/>
                  전문가 선생님의 답변이 등록되었습니다. 지금 바로 확인해보세요!
                </>
              )}
            </p>

            {/* 버튼 섹션 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(selected.type === 'LIKE' || selected.type === 'FINISHED') && (
                <button 
                  onClick={goToDetail}
                  style={{ 
                    background: 'linear-gradient(135deg, #FF85B3, #FF5C8D)', 
                    color: '#fff', border: 'none', padding: '16px', 
                    borderRadius: 24, fontSize: 16, fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(255, 92, 141, 0.25)' 
                  }}
                >
                  그림 구경하러 가기! 🖼️
                </button>
              )}
              {selected.type === 'TOKEN' && (
                <button 
                  onClick={() => navigate('/token-shop')}
                  style={{ 
                    background: 'linear-gradient(135deg, #FFD700, #DAA520)', 
                    color: '#fff', border: 'none', padding: '16px', 
                    borderRadius: 24, fontSize: 16, fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(218, 165, 32, 0.25)' 
                  }}
                >
                  토큰 상점 가기! 🪙
                </button>
              )}
              <button 
                onClick={goToProfile}
                style={{ 
                  background: '#F5F7FA', color: '#4A6A8A', border: 'none', 
                  padding: '16px', borderRadius: 24, fontSize: 16, 
                  fontWeight: 800, cursor: 'pointer' 
                }}
              >
                {selected.type === 'FOLLOW' ? '친구 프로필 보기 🐾' : '친구 소식 궁금해! 🐾'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 애니메이션 정의 */}
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleUp { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .notif-item:hover { border-color: rgba(196,122,138,0.3) !important; box-shadow: 0 6px 24px rgba(107,130,160,0.14) !important; transform: translateY(-1px); }
        .notif-back:hover { background: rgba(107,130,160,0.12) !important; }
        .notif-top:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(107,130,160,0.3) !important; }
        .notif-del:hover { color: #e05a6a !important; background: rgba(224,90,106,0.08) !important; }
        .notif-del-all:hover { color: #e05a6a !important; border-color: rgba(224,90,106,0.5) !important; }
        @media (max-width: 640px) {
          .notif-bg { padding: 80px 12px 60px !important; }
          .notif-card { padding: 24px 16px !important; }
          .notif-modal { padding: 24px 20px !important; max-width: calc(100vw - 32px) !important; }
        }
      `}</style>

      <main style={s.main}>
        <button className="notif-back" onClick={() => navigate(-1)} style={s.backBtn}>
          <ArrowLeft size={15} strokeWidth={2.5} />
          돌아가기
        </button>

        {/* 헤더 */}
        <div style={s.heroCard} className="notif-card">
          <p style={s.heroSub}>MY NOTIFICATIONS</p>
          <h1 style={s.heroTitle}>내 소식</h1>
          <p style={s.heroDesc}>
            {notifications.length > 0 ? `총 ${notifications.length}개의 알림이 있어요.` : '아직 도착한 소식이 없어요.'}
          </p>
        </div>

        {/* 전체 삭제 */}
        {notifications.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              className="notif-del-all"
              onClick={() => {
                if (!confirm('알림을 모두 삭제할까요?')) return
                deleteAllNotifications().then(() => setNotifications([]))
              }}
              style={s.delAllBtn}
            >
              <Trash2 size={13} strokeWidth={2} /> 전체 삭제
            </button>
          </div>
        )}

        {/* 알림 목록 */}
        {notifications.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🐣</div>
            <p style={{ margin: 0, fontSize: 15, color: '#9ca3af', fontWeight: 600 }}>아직 알림이 없어요</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifications.map((n, i) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.LIKE
              const src = avatarSrc(n.actorProfileImage)
              return (
                <div
                  key={n.id}
                  className="notif-item"
                  onClick={async () => {
                    setSelected(n)
                    setSelectedArtImageUrl(null)
                    if (n.artworkId) {
                      try {
                        const art = await getArtwork(n.artworkId)
                        setSelectedArtImageUrl(art.imageUrl)
                      } catch {}
                    }
                  }}
                  style={{
                    ...s.item,
                    opacity: n.isRead ? 0.72 : 1,
                    animation: `fadeUp ${0.3 + i * 0.04}s ease both`,
                  }}
                >
                  {/* 아바타 */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ ...s.avatar, background: meta.bg, color: meta.color }}>
                      {src
                        ? <img src={src} alt={n.actorNickname} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : <span style={{ fontSize: 16, fontWeight: 800 }}>{n.actorNickname.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    <div style={{ ...s.typeIcon, background: meta.bg, color: meta.color }}>{meta.icon}</div>
                  </div>

                  {/* 내용 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.itemMsg}>
                      <span style={s.actorName}>{n.actorNickname}</span>
                      {n.type === 'LIKE' && <> 님이 내 그림 <span style={s.artworkName}>"{n.artworkTitle}"</span>을 좋아해요</>}
                      {n.type === 'FOLLOW' && <> 님이 나를 팔로우하기 시작했어요</>}
                      {n.type === 'FINISHED' && <> 님과 함께 그린 <span style={s.artworkName}>"{n.artworkTitle}"</span>이 완성됐어요</>}
                    {n.type === 'INQUIRY_REPLY' && <> 문의 <span style={s.artworkName}>"{n.message}"</span>에 답변이 등록됐어요</>}
                    </p>
                    <p style={s.itemTime}>{timeAgo(n.createdAt)}</p>
                  </div>

                  {/* 뱃지 + 읽음 + 삭제 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{ ...s.badge, background: meta.bg, color: meta.color }}>{meta.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {!n.isRead && <div style={s.unreadDot} />}
                      <button
                        className="notif-del"
                        onClick={e => {
                          e.stopPropagation()
                          deleteNotification(n.id).then(() =>
                            setNotifications(prev => prev.filter(x => x.id !== n.id))
                          )
                        }}
                        style={s.delBtn}
                      >
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* 상세 모달 */}
      {selected && (() => {
        const meta = TYPE_META[selected.type] ?? TYPE_META.LIKE
        const src = avatarSrc(selected.actorProfileImage)
        const artSrc = selectedArtImageUrl
        return (
          <div style={s.overlay} onClick={() => { setSelected(null); setSelectedArtImageUrl(null); }}>
            <div style={s.modal} className="notif-modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <span style={{ ...s.badge, background: meta.bg, color: meta.color, fontSize: 12 }}>{meta.label}</span>
                <button onClick={() => { setSelected(null); setSelectedArtImageUrl(null); }} style={s.modalClose}>✕</button>
              </div>

              {/* 비주얼 */}
              <div style={s.visual}>
                {artSrc && (
                  <div style={s.artThumb}>
                    <img src={artSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ ...s.profileThumb, border: `3px solid ${meta.color}` }}>
                  {src
                    ? <img src={src} alt={selected.actorNickname} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 20, fontWeight: 800, color: meta.color }}>{selected.actorNickname.charAt(0).toUpperCase()}</span>
                  }
                </div>
              </div>

              {/* 메시지 */}
              <h3 style={s.modalTitle}>
                {selected.type === 'LIKE' && `${selected.actorNickname} 님이 내 그림을 좋아해요`}
                {selected.type === 'FOLLOW' && `${selected.actorNickname} 님이 팔로우했어요`}
                {selected.type === 'FINISHED' && `같이 그린 그림이 완성됐어요`}
                {selected.type === 'INQUIRY_REPLY' && `문의 답변이 도착했어요`}
              </h3>
              <p style={s.modalDesc}>
                {selected.type === 'LIKE' && '내 그림이 누군가의 마음을 따뜻하게 만들었어요.'}
                {selected.type === 'FOLLOW' && '서로의 그림을 더 자주 볼 수 있게 되었어요.'}
                {selected.type === 'FINISHED' && '지금 바로 완성된 그림을 확인해 보세요.'}
                {selected.type === 'INQUIRY_REPLY' && `"${selected.message}" 문의에 관리자가 답변을 남겼어요.`}
              </p>
              <p style={{ fontSize: 12, color: '#b0b8c8', marginBottom: 20 }}>{timeAgo(selected.createdAt)}</p>

              {/* 버튼 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(selected.type === 'LIKE' || selected.type === 'FINISHED') && (
                  <button onClick={goToDetail} style={s.modalPrimaryBtn}>그림 보러 가기</button>
                )}
                {selected.type === 'FOLLOW' && (
                  <button onClick={goToDetail} style={s.modalPrimaryBtn}>프로필 보러 가기</button>
                )}
                {selected.type === 'INQUIRY_REPLY' && (
                  <button onClick={() => { navigate('/contact'); setSelected(null); setSelectedArtImageUrl(null); }} style={s.modalPrimaryBtn}>문의 내역 확인하기</button>
                )}
                {selected.type !== 'INQUIRY_REPLY' && (
                  <button onClick={goToProfile} style={s.modalSecondaryBtn}>
                    {selected.actorNickname} 님 프로필
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* 위로가기 */}
      <button
        className="notif-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{ ...s.topBtn, opacity: showTop ? 1 : 0, pointerEvents: showTop ? 'auto' : 'none', transform: showTop ? 'translateY(0)' : 'translateY(10px)' }}
      >
        <ChevronUp size={20} color="#6B82A0" strokeWidth={2.5} />
      </button>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #f5f0f8 0%, #ede8f2 40%, #f0eee9 100%)',
    padding: '110px 20px 80px',
  },
  main: {
    maxWidth: 680, margin: '0 auto',
    animation: 'fadeUp 0.5s ease both',
  },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    marginBottom: 24, padding: '8px 16px',
    fontSize: 13, fontWeight: 600, color: '#6B82A0',
    background: 'rgba(107,130,160,0.07)',
    border: '1.5px solid rgba(107,130,160,0.18)',
    borderRadius: 100, cursor: 'pointer', transition: 'background 0.15s',
  },
  heroCard: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,240,248,0.85) 100%)',
    border: '1.5px solid rgba(255,255,255,0.75)',
    borderRadius: 24, padding: '32px 40px',
    boxShadow: '0 8px 40px rgba(107,130,160,0.13)',
    textAlign: 'center', marginBottom: 28,
  },
  heroSub: {
    fontSize: 11, fontWeight: 700, letterSpacing: 2,
    color: '#c47a8a', margin: '0 0 8px',
  },
  heroTitle: {
    fontSize: 28, fontWeight: 900, margin: '0 0 8px',
    background: 'linear-gradient(135deg, #c47a8a 0%, #6B82A0 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    letterSpacing: -0.5,
  },
  heroDesc: { fontSize: 13, color: '#9ca3af', margin: 0, fontWeight: 500 },
  empty: {
    textAlign: 'center', padding: '60px 20px',
    background: 'rgba(255,255,255,0.7)', borderRadius: 20,
    border: '1.5px dashed rgba(107,130,160,0.2)',
  },
  item: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: 'rgba(255,255,255,0.88)',
    border: '1.5px solid rgba(107,130,160,0.12)',
    borderRadius: 16, padding: '16px 18px',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  avatar: {
    width: 46, height: 46, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  typeIcon: {
    position: 'absolute', bottom: -2, right: -2,
    width: 20, height: 20, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid white',
  },
  itemMsg: { fontSize: 14, color: '#3d3d5c', margin: '0 0 4px', lineHeight: 1.5 },
  actorName: { fontWeight: 700 },
  artworkName: { fontWeight: 700, color: '#c47a8a' },
  itemTime: { fontSize: 12, color: '#9ca3af', margin: 0 },
  badge: {
    fontSize: 11, fontWeight: 700, padding: '3px 8px',
    borderRadius: 6, whiteSpace: 'nowrap' as const,
  },
  delAllBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '7px 14px', borderRadius: 8,
    background: 'none', border: '1.5px solid rgba(224,90,106,0.25)',
    color: '#c4b8c8', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s',
  },
  delBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 24, height: 24, borderRadius: '50%',
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#c4b8c8', transition: 'all 0.15s',
  },
  unreadDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#c47a8a', boxShadow: '0 0 6px rgba(196,122,138,0.5)',
  },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, padding: 24,
  },
  modal: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(245,240,248,0.95) 100%)',
    border: '1.5px solid rgba(255,255,255,0.8)',
    borderRadius: 24, padding: '32px 36px',
    width: '100%', maxWidth: 440,
    boxShadow: '0 20px 60px rgba(107,130,160,0.2)',
    animation: 'scaleUp 0.22s ease both',
    textAlign: 'center' as const,
  },
  modalClose: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 18, color: '#9ca3af', padding: 4, lineHeight: 1,
  },
  visual: {
    position: 'relative', display: 'flex', justifyContent: 'center',
    alignItems: 'center', height: 160, marginBottom: 24,
  },
  artThumb: {
    width: 160, height: 140, borderRadius: 16,
    overflow: 'hidden', border: '3px solid white',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  },
  profileThumb: {
    position: 'absolute', bottom: -4, right: 'calc(50% - 80px)',
    width: 52, height: 52, borderRadius: '50%',
    overflow: 'hidden', background: 'rgba(107,130,160,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  modalTitle: { fontSize: 18, fontWeight: 800, color: '#3d3d5c', margin: '0 0 8px' },
  modalDesc: { fontSize: 14, color: '#8a94a8', margin: '0 0 8px', lineHeight: 1.6 },
  modalPrimaryBtn: {
    width: '100%', padding: '13px',
    background: 'linear-gradient(135deg, #c47a8a 0%, #6B82A0 100%)',
    color: '#fff', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  modalSecondaryBtn: {
    width: '100%', padding: '11px',
    background: 'transparent', color: '#9ca3af',
    border: '1.5px solid rgba(107,130,160,0.18)', borderRadius: 10,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  topBtn: {
    position: 'fixed', bottom: 36, right: 36,
    width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
    border: '1.5px solid rgba(107,130,160,0.2)',
    boxShadow: '0 4px 16px rgba(107,130,160,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 100, transition: 'all 0.25s',
  },
}
