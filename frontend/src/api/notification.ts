import client from './client'
import type { NotificationResponse } from '../types'

export const getNotifications = async (): Promise<NotificationResponse[]> => {
  const response = await client.get<NotificationResponse[]>('/notifications')
  return response.data
}

export const markNotificationsAsRead = async (): Promise<void> => {
  await client.post('/notifications/read-all')
}
