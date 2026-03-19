import client from './client'

export interface Package {
  id: string
  displayName: string
  tokenAmount: number
  price: number
  popular: boolean
  bestValue: boolean
}

export interface PaymentResponse {
  success: boolean
  message: string
  newTokenBalance?: number
  merchantUid?: string
  bankName?: string
  bankAccount?: string
  accountHolder?: string
}

export const getPackages = () =>
  client.get<Package[]>('/payments/packages').then(res => res.data)

export const completePortonePayment = (data: {
  impUid: string
  merchantUid: string
  packageId: string
}) => client.post<PaymentResponse>('/payments/portone/complete', data).then(res => res.data)

export const requestBankTransfer = (data: {
  packageId: string
  depositorName: string
  bankType: string
}) => client.post<PaymentResponse>('/payments/bank-transfer', data).then(res => res.data)

export const kakaoPayReady = (packageId: string) =>
  client.post<{ redirectUrl: string }>('/payments/kakaopay/ready', { packageId }).then(res => res.data)

export const tossPayConfirm = (data: {
  paymentKey: string
  orderId: string
  amount: number
  packageId: string
}) => client.post<PaymentResponse>('/payments/toss/confirm', data).then(res => res.data)
