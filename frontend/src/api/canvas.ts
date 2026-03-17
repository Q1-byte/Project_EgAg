import client from './client'

export const identifyCanvas = (canvasBase64: string) =>
  client.post<{ subject: string; reason: string }>('/canvas/identify', { canvasBase64 })

export const transformCanvas = (canvasBase64: string, style: string, subject?: string, reason?: string) =>
  client.post<{ imageUrl: string; prompt: string; style: string; story: string }>('/canvas/transform', {
    canvasBase64,
    style,
    subject,
    reason,
  })
