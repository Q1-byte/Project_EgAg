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

export interface AdminPaymentRecord {
  id: string;
  userId: string;
  amount: number;
  status: string;      // 'paid', 'ready', 'failed' 등
  payMethod: string;   // 'tosspay', 'kakaopay' 등
  orderName: string;   // 'Basic' 등
  orderId: string;
  createdAt: string;
  userNickname?: string;
}

// ✅ 어드민 결제 내역 전체 조회 API 추가
export const getAdminPayments = () =>
    client.get<AdminPaymentRecord[]>('/admin/payment-list').then(res => res.data)

// ✅ 결제 취소 API 추가 (필요시)
export const cancelAdminPayment = (paymentId: string) =>
    client.post(`/admin/payments/${paymentId}/cancel`).then(res => res.data)