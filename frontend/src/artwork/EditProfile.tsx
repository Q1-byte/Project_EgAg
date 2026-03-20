import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyProfile, updateMyProfile, uploadAvatar } from '../api/user'

const EditProfile = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nickname, setNickname] = useState('')
  const [subEmail, setSubEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getMyProfile()
        setNickname(user.nickname)
        setSubEmail(user.subEmail || '')
        setPhone(user.phone || '')
        setProfileImageUrl(user.profileImageUrl || '')
      } catch (err) {
        console.error('Failed to fetch user:', err)
        setError('Failed to load user info.')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateMyProfile({ nickname, email: subEmail, phone, profileImageUrl: profileImageUrl || undefined } as any)
      window.alert('정보가 성공적으로 수정되었습니다! ✨')
      navigate('/mypage')
    } catch (err: any) {
      console.error('Update failed:', err)
      setError(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const AVATAR_PRESETS = [
    { name: '꼬마 토끼 🐰', url: 'https://img.icons8.com/plasticine/200/rabbit.png' },
    { name: '멋진 사자 🦁', url: 'https://img.icons8.com/plasticine/200/lion.png' },
    { name: '행복한 판다 🐼', url: 'https://img.icons8.com/plasticine/200/panda.png' },
    { name: '꿈꾸는 여우 🦊', url: 'https://img.icons8.com/plasticine/200/fox.png' },
    { name: '영리한 부엉이 🦉', url: 'https://img.icons8.com/plasticine/200/owl.png' },
    { name: '노란 병아리 🐥', url: '/chick.png' },
  ]

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setSaving(true)
    setError('')
    try {
      const response = await uploadAvatar(file)
      setProfileImageUrl(response.profileImageUrl || '')
    } catch (err: any) {
      console.error('Upload failed:', err)
      setError(err.response?.data?.message || '사진 올리기에 실패했어요. 😢')
    } finally {
      setSaving(false)
    }
  }

  const [showUrlInput, setShowUrlInput] = useState(false)

  if (loading) return <div className="loading-state">Loading...</div>

  return (
    <div className="layout-container edit-profile-page">
      <div className="premium-form-card">
        <header className="text-center mb-12">
          <h1 className="detail-title-premium">내 모습 바꾸기 ✨</h1>
          <p className="section-subtitle">친구들에게 보여줄 예쁜 닉네임과 사진을 골라보세요!</p>
        </header>

        <form onSubmit={handleSubmit} className="premium-form">
          {error && <div className="error-message mb-6">{error}</div>}
          
          <div className="text-center mb-8">
            <div className="avatar-edit-container inline-block">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Preview" className="avatar-preview-lg" />
              ) : (
                <div className="avatar-preview-lg">{nickname ? nickname[0].toUpperCase() : 'U'}</div>
              )}
            </div>
            <p className="form-label-premium mt-4">지금 내 모습이에요</p>
          </div>

          <div className="mb-10">
            <label className="form-label-premium text-center block mb-8">나를 닮은 캐릭터 친구를 골라보세요!</label>
            
            <div className="avatar-buddy-grid">
              {AVATAR_PRESETS.map((buddy) => (
                <div 
                  key={buddy.url}
                  className={`avatar-buddy-item ${profileImageUrl === buddy.url ? 'selected' : ''}`}
                  onClick={() => setProfileImageUrl(buddy.url)}
                >
                  <img src={buddy.url} alt={buddy.name} className="avatar-buddy-img" />
                  <span className="buddy-name">{buddy.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group-premium">
            <label className="form-label-premium" htmlFor="nickname">멋진 닉네임</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              className="form-input-premium"
              placeholder="친구들이 부를 이름..."
            />
          </div>

          <div className="form-group-premium">
            <label className="form-label-premium" htmlFor="email">나의 이메일</label>
            <input
              id="email"
              type="email"
              value={subEmail}
              onChange={(e) => setSubEmail(e.target.value)}
              className="form-input-premium"
              placeholder="이메일을 입력해주세요 (선택)"
            />
          </div>

          <div className="form-group-premium">
            <label className="form-label-premium" htmlFor="phone">연락처</label>
            <input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input-premium"
              placeholder="전화번호를 입력해주세요 (선택)"
            />
          </div>

          <div className="mb-8 text-center">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
            />
            
            <div className="upload-area-premium" onClick={() => fileInputRef.current?.click()}>
              <div className="upload-icon-box">☁️</div>
              <p className="upload-text-main">내 사진 직접 올리기</p>
              <p className="upload-text-sub">클릭해서 갤러리의 사진을 불러오세요!</p>
            </div>

            <button 
              type="button" 
              className="text-button-link mt-4"
              onClick={() => setShowUrlInput(!showUrlInput)}
            >
              {showUrlInput ? '사진 올리기로 돌아갈래요' : '이미지 주소를 직접 넣고 싶어요 (고급 설정)'}
            </button>
            
            {showUrlInput && (
              <div className="form-group-premium mt-6">
                <label className="form-label-premium" htmlFor="profileImage">이미지 주소 (URL)</label>
                <input
                  id="profileImage"
                  type="text"
                  value={profileImageUrl}
                  onChange={(e) => setProfileImageUrl(e.target.value)}
                  placeholder="예시: https://images.unsplash.com/..."
                  className="form-input-premium"
                />
              </div>
            )}
          </div>

          <div className="form-actions-premium">
            <button 
              type="submit" 
              className="primary-button detail-primary-action" 
              disabled={saving}
            >
              {saving ? '정보를 저장하고 있어요...' : '좋아, 이걸로 할래! ✨'}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/mypage')}
              className="secondary-button"
              disabled={saving}
            >
              다음에 할래요
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProfile
