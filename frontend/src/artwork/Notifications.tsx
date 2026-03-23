import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markNotificationsAsRead } from '../api/notification'
import type { NotificationResponse } from '../types'
import Header from '../components/Header'

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [selectedNotification, setSelectedNotification] = useState<NotificationResponse | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
      if (data.length > 0) {
        await markNotificationsAsRead()
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  const handleNotificationClick = (n: NotificationResponse) => {
    setSelectedNotification(n)
  }

  const closeStory = () => {
    setSelectedNotification(null)
  }

  const goToDetail = () => {
    if (!selectedNotification) return
    const n = selectedNotification
    if (n.type === 'FOLLOW') {
      navigate(`/user/${n.actorId}`)
    } else if (n.artworkId) {
      navigate(`/artwork/${n.artworkId}`)
    }
    closeStory()
  }

  const goToProfile = () => {
    if (selectedNotification?.actorId) {
      navigate(`/user/${selectedNotification.actorId}`)
      closeStory()
    }
  }

  return (
    <div className="notifications-page" style={{ 
      minHeight: '100vh', 
      background: 'var(--mesh-candy)', 
      paddingTop: 120,
      paddingBottom: 60
    }}>
      <Header />
      
      <div className="layout-container" style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px' }}>
        <header style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ 
            fontSize: 'clamp(28px, 5vw, 36px)', 
            fontWeight: 900, 
            color: '#1a1a2e', 
            marginBottom: 12,
            letterSpacing: -1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
          }}>
            내 소식 <span style={{ fontSize: '0.8em' }}>💌</span>
          </h1>
          <p style={{ 
            fontSize: 17, 
            color: '#6B82A0', 
            fontWeight: 600,
            opacity: 0.9 
          }}>
            친구들이 보낸 소식을 확인해볼까? ✨
          </p>
        </header>

        <div className="notification-list" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {notifications.length === 0 ? (
            <div className="empty-notifications" style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: 'rgba(255, 255, 255, 0.45)',
              borderRadius: 40,
              backdropFilter: 'blur(12px)',
              border: '2.5px dashed rgba(255, 255, 255, 0.7)',
              color: '#8a8aaa',
              fontSize: 18,
              fontWeight: 700
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🐣</div>
              아직 도착한 소식이 없어요!
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notification-item ${n.isRead ? 'read' : 'unread'}`}
                onClick={() => handleNotificationClick(n)}
                style={{ position: 'relative' }}
              >
                <div className="actor-avatar">
                  {n.actorProfileImage ? (
                    <img 
                      src={n.actorProfileImage.startsWith('/uploads') ? `http://localhost:8080${n.actorProfileImage}` : n.actorProfileImage} 
                      alt={n.actorNickname} 
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {n.actorNickname.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="notification-content" style={{ flex: 1 }}>
                  <div className="notification-msg">
                    <span className="actor-name">{n.actorNickname}</span>
                    {n.type === 'LIKE' && (
                       <>님이 내 그림 <span className="artwork-name">"{n.artworkTitle}"</span>을 좋아해요! ❤️</>
                    )}
                    {n.type === 'FOLLOW' && (
                       <>님이 나를 팔로우하기 시작했어요! ✨</>
                    )}
                    {n.type === 'FINISHED' && (
                       <>님과 함께 그린 그림 <span className="artwork-name">"{n.artworkTitle}"</span>이 완성됐어요! 🎨</>
                    )}
                  </div>
                  <div className="notification-time">
                    {new Date(n.createdAt).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                <button 
                  className="notification-action-btn"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 16,
                    border: 'none',
                    background: 'linear-gradient(135deg, #FFD6E8, #FF85B3)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  이야기 보기! 📖
                </button>

                {!n.isRead && (
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#ff5c8d',
                    boxShadow: '0 0 10px rgba(255,92,141,0.5)'
                  }} />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- 전용 알림 스토리 모달 --- */}
      {selectedNotification && (
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
              {selectedNotification.type === 'LIKE' && (
                <>
                  <div style={{ 
                    width: 200, height: 200, borderRadius: 32, overflow: 'hidden', 
                    transform: 'rotate(-5deg)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    border: '8px solid white'
                  }}>
                    <img src={selectedNotification.artworkId ? `http://localhost:8080/api/artwork/${selectedNotification.artworkId}/image` : '/placeholder.png'} 
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ 
                    position: 'absolute', bottom: -10, right: 100, width: 80, height: 80, 
                    borderRadius: 30, overflow: 'hidden', border: '4px solid #fff',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.1)', transform: 'rotate(5deg)'
                  }}>
                    <img src={selectedNotification.actorProfileImage?.startsWith('/uploads') ? `http://localhost:8080${selectedNotification.actorProfileImage}` : (selectedNotification.actorProfileImage || '/default-avatar.png')} 
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ position: 'absolute', top: 20, right: 80, fontSize: 64, animation: 'float 3s infinite ease-in-out' }}>❤️</div>
                </>
              )}
              {selectedNotification.type === 'FOLLOW' && (
                <>
                  <div style={{ 
                    width: 160, height: 160, borderRadius: 60, overflow: 'hidden', 
                    boxShadow: '0 15px 40px rgba(165, 216, 255, 0.3)',
                    border: '6px solid #A5D8FF'
                  }}>
                    <img src={selectedNotification.actorProfileImage?.startsWith('/uploads') ? `http://localhost:8080${selectedNotification.actorProfileImage}` : (selectedNotification.actorProfileImage || '/default-avatar.png')} 
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ position: 'absolute', top: 0, left: 60, fontSize: 48, animation: 'float 4s infinite ease-in-out' }}>✨</div>
                  <div style={{ position: 'absolute', bottom: 20, right: 60, fontSize: 40, animation: 'float 3s infinite reverse ease-in-out' }}>🌟</div>
                </>
              )}
               {selectedNotification.type === 'FINISHED' && (
                <>
                  <div style={{ 
                    width: 220, height: 180, borderRadius: 24, overflow: 'hidden', 
                    boxShadow: '0 15px 40px rgba(0,0,0,0.1)', transform: 'rotate(-2deg)',
                    border: '8px solid white'
                  }}>
                    <img src={selectedNotification.artworkId ? `http://localhost:8080/api/artwork/${selectedNotification.artworkId}/image` : '/placeholder.png'} 
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 50 }}>🎨</div>
                </>
              )}
            </div>

            {/* 메시지 섹션 */}
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1a1a2e', marginBottom: 16, wordBreak: 'keep-all' }}>
              {selectedNotification.type === 'LIKE' && `${selectedNotification.actorNickname} 친구가 이 그림을 아주 좋아한대요!`}
              {selectedNotification.type === 'FOLLOW' && `${selectedNotification.actorNickname} 친구랑 이제 단짝이 되었어요!`}
              {selectedNotification.type === 'FINISHED' && `와아! 우리 같이 그린 그림이 드디어 완성됐어요!`}
            </h2>
            <p style={{ fontSize: 16, color: '#6B82A0', fontWeight: 600, marginBottom: 32, lineHeight: 1.6 }}>
              {selectedNotification.type === 'LIKE' && '내가 정성껏 그린 그림이 친구의 마음을 따뜻하게 만들었나 봐요. ❤️'}
              {selectedNotification.type === 'FOLLOW' && '앞으로 서로의 멋진 그림들을 더 많이 구경할 수 있게 되었어요! ✨'}
              {selectedNotification.type === 'FINISHED' && '지금 바로 완성된 그림을 확인하러 가볼까요? 🎨'}
            </p>

            {/* 버튼 섹션 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(selectedNotification.type === 'LIKE' || selectedNotification.type === 'FINISHED') && (
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
              <button 
                onClick={goToProfile}
                style={{ 
                  background: '#F5F7FA', color: '#4A6A8A', border: 'none', 
                  padding: '16px', borderRadius: 24, fontSize: 16, 
                  fontWeight: 800, cursor: 'pointer' 
                }}
              >
                {selectedNotification.type === 'FOLLOW' ? '친구 프로필 보기 🐾' : '친구 소식 궁금해! 🐾'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 애니메이션 정의 */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes float { 
          0%, 100% { transform: translateY(0) rotate(0); } 
          50% { transform: translateY(-15px) rotate(5deg); } 
        }
      `}</style>
    </div>
  )
}
