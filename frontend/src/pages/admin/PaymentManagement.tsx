import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import type { AdminPaymentRecord } from '../../api/payment';
import { getAdminPayments } from '../../api/payment';

const PaymentManagement = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const role = useAuthStore((state) => state.role);
    const accessToken = useAuthStore((state) => state.accessToken);

    const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPayments = useCallback(async () => {
        if (!accessToken) return;
        try {
            setLoading(true);
            const data = await getAdminPayments();
            
            let incomingData: AdminPaymentRecord[] = [];
            if (Array.isArray(data)) {
                incomingData = data;
            } else if (data && typeof data === 'object') {
                const record = data as { content?: AdminPaymentRecord[]; data?: AdminPaymentRecord[] };
                incomingData = record.content || record.data || [];
            }
            setPayments(incomingData);
        } catch (err) {
            console.error("결제 내역 로딩 실패:", err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        const isAdmin = role === 'ADMIN' || String(role) === '100';
        if (isAuthenticated && isAdmin && accessToken) {
            void fetchPayments();
        }
    }, [isAuthenticated, role, accessToken, fetchPayments]);

    const getStatusInfo = (status: string) => {
        const s = String(status).toLowerCase();
        if (s === 'paid' || s === 'success') return { label: '결제 완료', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
        if (s === 'cancelled' || s === 'cancel' || s === 'fail') return { label: '취소/실패', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' };
        return { label: s.toUpperCase(), color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
    };

    if (!isAuthenticated || (role !== 'ADMIN' && String(role) !== '100')) {
        return <Navigate to="/" replace />;
    }

    const totalVolume = payments.reduce((acc, curr) => acc + (curr.status === 'paid' ? curr.amount : 0), 0);

    return (
        <div style={s.container}>
            <header style={s.header}>
                <div>
                    <h1 style={s.title}>💳 결제 내역 관리</h1>
                    <p style={s.meta}>사용자들의 모든 토큰 결제 및 충전 이력을 투명하게 관리합니다. ✨</p>
                </div>
                <div style={s.statsCard}>
                    <span style={s.statsLabel}>누적 완료 액수</span>
                    <span style={s.statsValue}>₩ {totalVolume.toLocaleString()}</span>
                </div>
            </header>

            <div style={s.tableCard}>
                <div style={s.cardHeader}>
                    <h3 style={s.cardTitle}>📋 전체 결제 이력 ({payments.length}건)</h3>
                </div>
                <div style={s.tableWrapper}>
                    <table style={s.table}>
                        <thead>
                            <tr style={s.tr}>
                                <th style={s.th}>결제 일시</th>
                                <th style={s.th}>구매자</th>
                                <th style={s.th}>상품명</th>
                                <th style={s.th}>금액</th>
                                <th style={s.th}>결제 수단</th>
                                <th style={{...s.th, textAlign: 'center'}}>상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={s.emptyTd}>결제 데이터를 불러오는 중입니다... 🔄</td></tr>
                            ) : payments.length > 0 ? (
                                payments.map(p => {
                                    const { label, color, bg } = getStatusInfo(p.status);
                                    return (
                                        <tr key={p.id} style={s.tr}>
                                            <td style={s.td}>{new Date(p.createdAt).toLocaleString()}</td>
                                            <td style={{...s.td, fontWeight: 700}}>
                                                <div style={s.userCell}>
                                                    <span>{p.userNickname || 'Unknown'}</span>
                                                    <span style={s.userIdText}>{p.userId?.slice(0, 8)}...</span>
                                                </div>
                                            </td>
                                            <td style={s.td}>{p.orderName}</td>
                                            <td style={{...s.td, color: '#7C3AED', fontWeight: 900}}>
                                                ₩ {p.amount.toLocaleString()}
                                            </td>
                                            <td style={s.td}>
                                                <span style={s.methodBadge}>{p.payMethod || '카드'}</span>
                                            </td>
                                            <td style={{...s.td, textAlign: 'center'}}>
                                                <span style={{...s.statusBadge, color, backgroundColor: bg}}>
                                                    {label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={6} style={s.emptyTd}>결제 내역이 존재하지 않습니다. ✨</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// 🌌 스타일 시스템 (Glassmorphism & Balanced Admin Design)
const s: Record<string, React.CSSProperties> = {
    container: { padding: '40px 10px', maxWidth: '1200px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
    title: { fontSize: '28px', fontWeight: 900, color: '#4C1D95', margin: '0 0 8px' },
    meta: { fontSize: '15px', color: '#7C3AED', fontWeight: 600, opacity: 0.8, margin: 0 },
    
    statsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)',
        padding: '15px 25px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
    },
    statsLabel: { fontSize: '12px', fontWeight: 800, color: '#9CA3AF', marginBottom: '2px' },
    statsValue: { fontSize: '20px', fontWeight: 900, color: '#10B981' },

    tableCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)',
        borderRadius: '30px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.05)'
    },
    cardHeader: { padding: '25px 30px', borderBottom: '1px solid rgba(229, 231, 235, 0.4)' },
    cardTitle: { fontSize: '18px', fontWeight: 800, color: '#1F2937', margin: 0 },

    tableWrapper: { width: '100%', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
    th: { backgroundColor: 'rgba(249, 250, 251, 0.5)', padding: '18px 25px', textAlign: 'left', color: '#6B7280', fontWeight: 800, borderBottom: '1px solid rgba(229, 231, 235, 0.5)' },
    td: { padding: '18px 25px', borderBottom: '1px solid rgba(243, 244, 246, 0.5)', color: '#374151' },
    tr: { transition: 'background 0.2s' },
    
    userCell: { display: 'flex', flexDirection: 'column', gap: '2px' },
    userIdText: { fontSize: '11px', color: '#9CA3AF', fontWeight: 500 },
    methodBadge: { backgroundColor: 'rgba(229, 231, 235, 0.3)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#4B5563' },
    statusBadge: { padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, display: 'inline-block', minWidth: '80px' },

    emptyTd: { textAlign: 'center', padding: '100px', color: '#9CA3AF', fontSize: '16px', fontWeight: 600 }
};

export default PaymentManagement;