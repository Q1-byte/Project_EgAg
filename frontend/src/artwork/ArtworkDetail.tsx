import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getArtwork, toggleLikeArtwork, reportArtwork } from '../api/artwork'
import type { ArtworkResponse } from '../types'

const ArtworkDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [artwork, setArtwork] = useState<ArtworkResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('부적절한 콘텐츠')
  const [reportDescription, setReportDescription] = useState('')

  useEffect(() => {
    const fetchArtwork = async () => {
      if (!id) return
      try {
        const data = await getArtwork(id)
        setArtwork(data)
      } catch (error) {
        console.error('Failed to fetch artwork detail:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchArtwork()
  }, [id])

  const [isAnimating, setIsAnimating] = useState(false)

  const handleLike = async () => {
    if (!id || !artwork) return
    try {
      setIsAnimating(true)
      await toggleLikeArtwork(id)
      setIsLiked(!isLiked)
      setArtwork({
        ...artwork,
        likeCount: isLiked ? artwork.likeCount - 1 : artwork.likeCount + 1
      })
      setTimeout(() => setIsAnimating(false), 500)
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const handleShare = async () => {
    console.log('Sharing artwork URL:', window.location.href)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(window.location.href)
        alert('주소가 복사되었어요! 친구에게 멋진 작품을 자랑해보세요! 🔗✨')
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = window.location.href
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        alert('주소가 복사되었어요! (호환 모드) 친구에게 멋진 작품을 자랑해보세요! 🔗✨')
      }
    } catch (err) {
      console.error('Failed to copy text: ', err)
      alert('주소 복사에 실패했어요. 주소창의 주소를 직접 복사해주세요. 😥')
    }
  }

  const handleReport = () => setIsReportModalOpen(true)

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    
    try {
      await reportArtwork(id, { 
        reason: reportReason, 
        description: reportDescription || '상세 내용 없음' 
      })
      alert('신고가 접수되었습니다. 소중한 의견 감사합니다.')
      setIsReportModalOpen(false)
      setReportDescription('')
    } catch (error: any) {
      console.error('Failed to report artwork:', error)
      alert(error.response?.data?.message || '신고 제출에 실패했습니다.')
    }
  }

  if (loading) return <div className="p-20 text-center">Loading artwork details...</div>
  if (!artwork) return <div className="p-20 text-center text-red-500 font-bold">Artwork not found!</div>

  return (
    <div className="layout-container detail-page-container">
      <Link to="/explore" className="secondary-button mb-8">
        ← 명예의 전당으로 돌아가기
      </Link>
      
      <div className="detail-layout">
        <section className="detail-image-panel">
          <div className="detail-image-wrapper">
            {artwork.imageUrl ? (
              <img 
                src={artwork.imageUrl} 
                alt={artwork.title || '제목 없음'} 
              />
            ) : (
              <div className="text-gray-400 flex flex-col items-center gap-4">
                <span className="text-6xl">🎨</span>
                <span className="font-bold">그림을 준비하고 있어요!</span>
              </div>
            )}
          </div>
        </section>
        
        <section className="detail-info-panel">
          <div className="info-card-premium">
            <span className="detail-topic-pill">{artwork.topic}</span>
            <h1 className="detail-title-premium">
              {artwork.title || '제목 없음'}
            </h1>
            
            <div className="detail-creator-row">
              <div className="creator-avatar-sm">
                {artwork.userNickname ? artwork.userNickname[0].toUpperCase() : 'A'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">그린 사람</span>
                <Link to={`/user/${artwork.userId}`} className="creator-name-link">
                  {artwork.userNickname || '익명의 꼬마 화가'}
                </Link>
              </div>
            </div>

            <div className="detail-stats-grid mb-8">
              <div className="detail-stat-box">
                <span className="stat-box-label">그린 횟수</span>
                <span className="stat-box-value">{artwork.turnCount}번</span>
              </div>
              <div className="detail-stat-box">
                <span className="stat-box-label">좋아요</span>
                <span className="stat-box-value">{artwork.likeCount}개</span>
              </div>
              <div className="detail-stat-box">
                <span className="stat-box-label">상태</span>
                <span className="detail-value">{artwork.status === 'DRAWING' ? '그리는 중' : '완성!'}</span>
              </div>
              <div className="detail-stat-box">
                <span className="stat-box-label">그린 날짜</span>
                <span className="text-sm font-bold text-gray-700">
                  {new Date(artwork.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="detail-actions-premium">
              <button 
                onClick={handleLike}
                className={`primary-button detail-primary-action ${isLiked ? 'active' : ''} ${isAnimating ? 'heart-pop' : ''}`}
                style={{ background: isLiked ? 'var(--gradient-pink)' : 'var(--gradient-blue)', color: isLiked ? 'var(--text-h)' : 'white' }}
              >
                {isLiked ? '❤️ 최고예요! (좋아요 완료)' : '❤️ 이 작품을 응원해줄래요'}
              </button>
              
              <div className="detail-secondary-actions">
                <button 
                  onClick={handleShare}
                  className="secondary-button justify-center"
                >
                  🔗 친구에게 자랑하기
                </button>
                <button 
                  onClick={handleReport}
                  className="secondary-button justify-center text-red-400 border-red-200 hover:bg-red-50"
                >
                  🚩 신고하기
                </button>
              </div>
            </div>
          </div>
          
          <div className="info-card-premium bg-gray-50 border-dashed">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">그림 이야기</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {artwork.strokeData && artwork.strokeData.some(s => s.isAI) 
                ? `이 작품은 '${artwork.topic}'(이)라는 주제로 AI와 함께 소통하며 완성되었어요. 붓 터치 하나하나에 담긴 상상력이 정말 놀랍지 않나요?`
                : `이 그림은 '${artwork.topic}'(이)라는 주제로 탄생한 소중한 작품이에요. 친구들이 함께 마음을 모아 붓을 들어 정성스럽게 완성했답니다!`}
            </p>
          </div>
        </section>
      </div>

      {isReportModalOpen && (
        <div className="report-modal-backdrop" onClick={() => setIsReportModalOpen(false)}>
          <div className="report-modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">🚩 작품 신고하기</h2>
            <p className="modal-subtitle">이 작품에 어떤 문제가 있나요? 알려주시면 빠르게 확인해볼게요!</p>
            
            <form onSubmit={submitReport}>
              <div className="form-group-premium">
                <label className="form-label-premium">신고 이유를 골라주세요</label>
                <select 
                  className="form-input-premium"
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                >
                  <option value="부적절한 콘텐츠">부적절한 콘텐츠 (선정성, 폭력성 등)</option>
                  <option value="저작권 침해">저작권 침해 의심</option>
                  <option value="스팸/광고">스팸 또는 부적절한 홍보</option>
                  <option value="기타">기타 (상세 내용에 적어주세요)</option>
                </select>
              </div>
              
              <div className="form-group-premium">
                <label className="form-label-premium">더 자세한 내용을 적어주세요 (선택)</label>
                <textarea 
                  className="form-input-premium min-h-[120px]"
                  value={reportDescription}
                  onChange={e => setReportDescription(e.target.value)}
                  placeholder="관리자가 확인할 수 있도록 구체적으로 알려주세요..."
                />
              </div>
              
              <div className="form-actions-premium" style={{ flexDirection: 'row', marginTop: '24px' }}>
                <button type="submit" className="primary-button flex-1" style={{ background: 'var(--gradient-pink)' }}>
                  신고 제출하기
                </button>
                <button 
                  type="button" 
                  className="secondary-button flex-1"
                  onClick={() => setIsReportModalOpen(false)}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArtworkDetail
