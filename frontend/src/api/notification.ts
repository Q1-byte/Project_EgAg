import client from './client'
import type { NotificationResponse } from '../types'

export const getNotifications = async (): Promise<NotificationResponse[]> => {
  const response = await client.get<NotificationResponse[]>('/notifications')
  return response.data
}

export const markNotificationsAsRead = async (): Promise<void> => {
  await client.post('/notifications/read-all')
}

export const getUnreadCount = async (): Promise<number> => {
  const response = await client.get<number>('/notifications/unread-count')
  return response.data
}

export const deleteNotification = async (id: string): Promise<void> => {
  await client.delete(`/notifications/${id}`)
}

export const deleteAllNotifications = async (): Promise<void> => {
  await client.delete('/notifications')
}
