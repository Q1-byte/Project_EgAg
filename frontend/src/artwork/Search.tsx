import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { search } from '../api/search'
import type { SearchResponse } from '../types'
import ArtworkCard from './ArtworkCard'

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('query') || ''
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState(query)

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults(null)
        return
      }
      setLoading(true)
      try {
        const data = await search(query)
        setResults(data)
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setLoading(false)
      }
    }
    performSearch()
  }, [query])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams({ query: searchInput })
  }

  return (
    <div className="layout-container search-page">
      <header className="section-header premium-hero" style={{ background: 'var(--gradient-candy)', border: 'none', padding: '60px 40px' }}>
        <h1 className="section-title" style={{ fontSize: '42px' }}>친구 & 작품 찾기 🔍</h1>
        <p className="section-subtitle" style={{ color: 'var(--text-h)', opacity: 0.7 }}>친구들의 이름이나 예쁜 그림 제목을 검색해 보세요!</p>
        
        <form onSubmit={handleSearchSubmit} className="search-form-large">
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="제목이나 작성자 닉네임을 입력하세요..."
            className="search-input-large glass-input"
          />
          <button type="submit" className="primary-button search-button">검색하기</button>
        </form>
      </header>

      {loading && (
        <div className="loading-state">
          <div className="pulse-loader"></div>
          <p>열심히 찾고 있어요... 🍬</p>
        </div>
      )}

      {results && (
        <div className="search-results">
          <section className="results-section">
            <h2 className="results-title">그림 작품 ({results.artworks.length})</h2>
            <div className="artwork-grid">
              {results.artworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
              {results.artworks.length === 0 && (
                <p className="no-results">"{query}"에 대한 그림을 찾지 못했어요. ☁️</p>
              )}
            </div>
          </section>

          <section className="results-section mt-12">
            <h2 className="results-title">사용자 ({results.users.length})</h2>
            <div className="user-list">
              {results.users.map((user) => (
                <Link key={user.id} to={`/user/${user.id}`} className="user-search-item">
                  <div className="user-avatar-small">
                    {user.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt={user.nickname} />
                    ) : (
                      <div className="avatar-placeholder-xs">{user.nickname[0].toUpperCase()}</div>
                    )}
                  </div>
                  <div className="user-info-small">
                    <span className="user-nickname-small">{user.nickname}</span>
                    <span className="user-stats-small">팔로워 {user.followerCount}명</span>
                  </div>
                </Link>
              ))}
              {results.users.length === 0 && (
                <p className="no-results">"{query}" 사용자를 찾지 못했어요. ☁️</p>
              )}
            </div>
          </section>
          
          <div className="infinite-scroll-loader">
             <p className="text-sm font-bold text-gray-300 mt-8 mb-4">전부 다 찾아봤어요! ✨</p>
          </div>
        </div>
      )}

      {!query && !loading && (
        <div className="search-placeholder">
          <div className="placeholder-icon">🔍</div>
          <p>검색어를 입력해서 친구들을 찾아보세요!</p>
        </div>
      )}
    </div>
  )
}

export default Search
