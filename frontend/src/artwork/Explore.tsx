import { useEffect, useState, useRef } from 'react'
import { exploreArtworks } from '../api/artwork'
import type { ArtworkResponse } from '../types'
import { Link } from 'react-router-dom'
import ArtworkCard from './ArtworkCard'

const Explore = () => {
  const [artworks, setArtworks] = useState<ArtworkResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const observerTarget = useRef(null)

  const fetchArtworks = async (isFirstLoad = false) => {
    if (loading || (!hasMore && !isFirstLoad)) return
    
    setLoading(true)
    try {
      const data = await exploreArtworks('latest', isFirstLoad ? undefined : cursor)
      
      if (data.length === 0) {
        setHasMore(false)
      } else {
        setArtworks(prev => isFirstLoad ? data : [...prev, ...data])
        setCursor(data[data.length - 1].id)
        if (data.length < 10) setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to fetch artworks:', error)
    } finally {
      setLoading(false)
      setIsInitialLoading(false)
    }
  }

  useEffect(() => {
    fetchArtworks(true)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchArtworks()
        }
      },
      { threshold: 1.0 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [cursor, hasMore, loading])

  return (
    <div className="layout-container explore-page">
      <header className="section-header premium-hero" style={{ background: 'var(--gradient-candy)', border: 'none' }}>
        <h1 className="section-title">작품 둘러보기 🎨</h1>
        <p className="section-subtitle" style={{ color: 'var(--text-h)', opacity: 0.8 }}>전 세계 친구들이 그린 멋진 그림들을 만나보세요!</p>
      </header>
      
      {isInitialLoading ? (
        <div className="loading-state">
          <div className="pulse-loader"></div>
          <p>첫 그림들을 가져오고 있어요... 🍭</p>
        </div>
      ) : artworks.length === 0 ? (
        <div className="empty-state text-center p-20 bg-white rounded-3xl shadow-sm">
          <div className="text-6xl mb-6">☁️</div>
          <p className="text-xl font-bold text-gray-400">아직 등록된 작품이 없어요...</p>
          <Link to="/canvas" className="primary-button mt-8">
            첫 번째 그림 그리기! 🖌️
          </Link>
        </div>
      ) : (
        <>
          <div className="artwork-grid">
            {artworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
          
          <div ref={observerTarget} className="infinite-scroll-loader">
            {loading && hasMore && (
              <>
                <div className="pulse-loader" style={{ width: '40px', height: '40px' }}></div>
                <p className="text-xs font-bold text-accent">친구들의 그림을 더 찾고 있어요...</p>
              </>
            )}
            {!hasMore && artworks.length > 0 && (
              <p className="text-sm font-bold text-gray-300 mt-8 mb-4">✨ 모든 그림을 다 봤어요! ✨</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Explore
