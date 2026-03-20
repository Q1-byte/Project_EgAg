import { useEffect, useState } from 'react'
import { getUserArtworks, getMe } from '../api/user'
import type { ArtworkResponse } from '../types'
import { Link } from 'react-router-dom'
import ArtworkCard from './ArtworkCard'
import { deleteArtwork } from '../api/artwork'

const Gallery = () => {
  const [artworks, setArtworks] = useState<ArtworkResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'private'>('all')

  useEffect(() => {
    const fetchGalleryData = async () => {
      try {
        const [_, artworkData] = await Promise.all([
          getMe(),
          getUserArtworks('me')
        ])
        setArtworks(artworkData)
      } catch (error) {
        console.error('Failed to fetch gallery data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchGalleryData()
  }, [])

  const filteredArtworks = artworks.filter(a => {
    if (activeTab === 'public') return a.isPublic
    if (activeTab === 'private') return !a.isPublic
    return true
  })

  const handleDelete = async (artworkId: string) => {
    if (!window.confirm('Are you sure you want to delete this artwork?')) return
    try {
      await deleteArtwork(artworkId)
      setArtworks(artworks.filter(a => a.id !== artworkId))
    } catch (error) {
      console.error('Failed to delete artwork:', error)
      alert('Failed to delete artwork.')
    }
  }

  if (loading) return <div className="loading-state">Loading your gallery...</div>

  return (
    <div className="layout-container gallery-page">
      <header className="section-header premium-hero" style={{ background: 'var(--gradient-candy)', border: 'none' }}>
        <h1 className="section-title">나의 캔버스 🎨</h1>
        <p className="section-subtitle" style={{ color: 'var(--text-h)', opacity: 0.8 }}>나만의 소중한 상상력으로 그린 그림들을 모아왔어요!</p>
        <div className="mt-8">
          <Link to="/profile/edit" className="secondary-button">프로필 꾸미기 ✨</Link>
        </div>
      </header>

      <div className="gallery-tabs">
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          모든 그림
        </button>
        <button
          className={`tab ${activeTab === 'public' ? 'active' : ''}`}
          onClick={() => setActiveTab('public')}
        >
          모두가 봐요 👀
        </button>
        <button
          className={`tab ${activeTab === 'private' ? 'active' : ''}`}
          onClick={() => setActiveTab('private')}
        >
          나만 볼래 🔒
        </button>
      </div>

      <div className="artwork-grid">
        <Link to="/canvas" className="create-new-card" style={{ background: 'var(--team-yellow)', border: '2px dashed var(--accent)', color: 'var(--text-h)', minHeight: '320px' }}>
          <span className="plus-icon" style={{ fontSize: '64px' }}>🐣</span>
          <span style={{ fontWeight: 800 }}>새로운 상상을 그려볼까요?</span>
          <p className="text-xs text-accent font-bold">하얀 캔버스가 기다리고 있어요!</p>
        </Link>

        {filteredArtworks.map((artwork) => (
          <div key={artwork.id} className="relative group">
            <ArtworkCard artwork={artwork} />
            <div className="artwork-actions glass-actions">
              <button
                onClick={() => handleDelete(artwork.id)}
                className="action-button-delete"
              >
                지우기
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="infinite-scroll-loader">
        {filteredArtworks.length > 0 ? (
          <p className="text-sm font-bold text-gray-300 mt-8 mb-4">내 소중한 그림들을 모두 모아봤어요! ✨</p>
        ) : activeTab !== 'all' && (
          <div className="text-center py-20 opacity-50">
            <div className="text-5xl mb-4">☁️</div>
            <p className="font-bold">여기는 아직 텅 비어있네요!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Gallery
