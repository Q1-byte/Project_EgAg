import client from './client'
import type { UserResponse, ArtworkResponse } from '../types'

export interface UserProfile {
  id: string
  email: string
  subEmail: string | null
  name: string
  nickname: string
  phone: string
  profileImageUrl: string | null
  tokenBalance: number
  followerCount: number
  followingCount: number
  provider: string
  createdAt: string
}

export interface ArtworkSummary {
  id: string
  title: string | null
  topic: string | null
  imageUrl: string | null
  userImageData: string | null
  status: string
  isPublic: boolean
  likeCount: number
  createdAt: string
}

export const getUserProfile = async (id: string): Promise<UserResponse> => {
  const response = await client.get<UserResponse>(`/users/${id}`)
  return response.data
}

export const getUserArtworks = async (id: string, onlyPublic: boolean = true): Promise<ArtworkResponse[]> => {
  const response = await client.get<ArtworkResponse[]>(`/users/${id}/artworks`, {
    params: { onlyPublic }
  })
  return response.data
}

export const getMe = async (): Promise<UserResponse> => {
  const response = await client.get<UserResponse>('/users/me')
  return response.data
}

export const updateMe = async (data: any) => {
  const response = await client.put('/users/me', data)
  return response.data
}

export const updateProfile = async (data: { nickname?: string, profileImageUrl?: string }): Promise<UserResponse> => {
  // Aliasing updateMe for C's EditProfile.tsx
  const response = await client.put<UserResponse>('/users/me', data)
  return response.data
}

export const uploadProfilePhoto = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await client.post('/users/me/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export const uploadAvatar = async (file: File): Promise<UserResponse> => {
  // Aliasing uploadProfilePhoto for C's EditProfile.tsx
  const formData = new FormData()
  formData.append('file', file)
  const response = await client.post<UserResponse>('/users/me/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export const toggleFollowUser = async (id: string): Promise<void> => {
  await client.post(`/users/${id}/follow`)
}

// Existing functions (modified or kept as is)
export const getMyProfile = () =>
  client.get<UserProfile>('/users/me').then(res => res.data)

export const updateMyProfile = (data: { name?: string; nickname?: string; phone?: string; email?: string }) =>
  client.put<UserProfile>('/users/me', data).then(res => res.data)

export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  client.put<{ message: string }>('/users/me/password', data).then(res => res.data)

export const completeOnboarding = (data: { name: string; phone: string; nickname: string; email?: string }) =>
  client.post<UserProfile>('/users/me/onboarding', data).then(res => res.data)

export const getMyArtworks = () =>
  client.get<ArtworkSummary[]>('/gallery/my').then(res => res.data)

export const saveArtworkToGallery = (imageUrl: string, userImageData: string, title: string, source: string) =>
  client.post<ArtworkSummary>('/artworks', { imageUrl, userImageData, title, source }).then(res => res.data)

export const toggleArtworkVisibility = (id: string) =>
  client.patch<ArtworkSummary>(`/artworks/${id}/visibility`).then(res => res.data)

export const deleteArtwork = (id: string) =>
  client.delete(`/artworks/${id}`)

export const getPublicArtworks = () =>
  client.get<ArtworkSummary[]>('/gallery/public').then(res => res.data)

export const checkNicknameAvailable = async (nickname: string): Promise<boolean> => {
  const response = await client.get('/users/check-nickname', { params: { nickname } })
  return response.data.available
}

// --- 출석체크 API ---
export const getTodayAttendance = async (): Promise<{ attended: boolean }> => {
  const response = await client.get('/attendance/today')
  return response.data
}

export const checkInAttendance = async (): Promise<{ message: string }> => {
  const response = await client.post('/attendance')
  return response.data
}

export const getAttendanceHistory = async (): Promise<string[]> => {
  const response = await client.get('/attendance/history')
  return response.data
}

export const getClaimedBonuses = async (): Promise<number[]> => {
  const response = await client.get('/attendance/claimed-bonuses')
  return response.data
}

export const claimStreakBonus = async (days: number): Promise<{ bonus: number; message: string }> => {
  const response = await client.post(`/attendance/claim-streak?days=${days}`)
  return response.data
}
