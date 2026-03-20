import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
// ✅ TS1484 해결: type-only import 사용
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

            console.log("💰 관리자 결제 내역 데이터:", data);

            // ✅ ESLint any 에러 해결: 알 수 없는 데이터 구조를 안전하게 타입 가드
            let incomingData: AdminPaymentRecord[] = [];

            if (Array.isArray(data)) {
                incomingData = data;
            } else if (data && typeof data === 'object') {
                // 데이터가 객체 안에 감싸져 있는 경우 안전하게 접근
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
            // ✅ "Promise ignored" 에러 해결: void 연산자로 명시적 처리
            void fetchPayments();
        }
    }, [isAuthenticated, role, accessToken, fetchPayments]);

    const getStatusStyle = (status: string) => {
        const s = String(status).toLowerCase();
        if (s === 'paid' || s === 'success') return { backgroundColor: '#10B981', color: '#fff' };
        if (s === 'cancelled' || s === 'cancel' || s === 'fail') return { backgroundColor: '#EF4444', color: '#fff' };
        return { backgroundColor: '#F59E0B', color: '#fff' };
    };

    if (!isAuthenticated || (role !== 'ADMIN' && String(role) !== '100')) {
        return <Navigate to="/" replace />;
    }

    return (
        <div style={s.container}>
            <header style={s.header}>
                <h1 style={s.title}>💳 결제 내역 관리</h1>
                <p style={s.meta}>서비스 내 모든 결제 이력을 확인합니다.</p>
            </header>

            <div style={s.tableSection}>
                <div style={s.tableWrapper}>
                    <table style={s.table}>
                        <thead>
                        <tr style={s.tr}>
                            <th style={s.th}>결제 일시</th>
                            <th style={s.th}>구매자 (ID)</th>
                            <th style={s.th}>상품명</th>
                            <th style={s.th}>금액</th>
                            <th style={s.th}>결제 수단</th>
                            <th style={s.th}>상태</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={s.emptyTd}>데이터 로딩 중... 🔄</td></tr>
                        ) : payments.length > 0 ? (
                            payments.map(p => (
                                <tr key={p.id} style={s.tr}>
                                    <td style={s.td}>{new Date(p.createdAt).toLocaleString()}</td>
                                    <td style={{...s.td, fontWeight: 700}}>
                                        {p.userNickname || `ID: ${p.userId?.slice(0, 8) ?? 'Unknown'}`}
                                    </td>
                                    <td style={s.td}>{p.orderName}</td>
                                    <td style={{...s.td, color: '#4F46E5', fontWeight: 800}}>
                                        ₩ {p.amount.toLocaleString()}
                                    </td>
                                    <td style={s.td}>{p.payMethod}</td>
                                    <td style={s.td}>
                                            <span style={{...s.badge, ...getStatusStyle(p.status)}}>
                                                {p.status === 'paid' ? '결제완료' : p.status.toUpperCase()}
                                            </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={6} style={s.emptyTd}>결제 내역이 없습니다.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const s: Record<string, React.CSSProperties> = {
    container: { padding: '40px', maxWidth: '1200px', margin: '0 auto' },
    header: { marginBottom: '30px' },
    title: { fontSize: '28px', fontWeight: 800, color: '#1E1B4B' },
    meta: { color: '#6366F1', fontWeight: 600, fontSize: '14px' },
    tableSection: { marginTop: '20px' },
    tableWrapper: { backgroundColor: '#FFFFFF', borderRadius: '25px', overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
    th: { backgroundColor: '#F9FAFB', padding: '15px', textAlign: 'left', color: '#4B5563', borderBottom: '2px solid #F3F4F6' },
    td: { padding: '15px', borderBottom: '1px solid #F3F4F6', color: '#1F2937' },
    tr: { transition: 'background 0.2s' },
    badge: { padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 },
    emptyTd: { textAlign: 'center', padding: '50px', color: '#9CA3AF' }
};

export default PaymentManagement;