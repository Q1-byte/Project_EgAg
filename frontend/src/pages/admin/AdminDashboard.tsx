import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

// 📈 대시보드 데이터 타입
interface DashboardStats {
    totalUsers: number;
    todayNewUsers: number;
    totalSales: number;
    todaySales: number;
    suspendedUsers: number;
    activeUsers: number;
}

const AdminDashboard = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const role = useAuthStore((state) => state.role);
    const nickname = useAuthStore((state) => state.nickname);

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    // 🔄 통계 데이터 가져오기
    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const token = useAuthStore.getState().accessToken; // 👈 스토어에서 직접 토큰 가져오기

            const res = await axios.get('/api/admin/dashboard/stats', {
                headers: {
                    Authorization: `Bearer ${token}` // 👈 헤더에 토큰 실어주기
                }
            });
            setStats(res.data);
        } catch (err) {
            console.error("통계 데이터 로딩 실패:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && role === 'ADMIN') {
            fetchStats();
        }
    }, [isAuthenticated, role, fetchStats]);

    if (!isAuthenticated || role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    return (
        <div style={s.container}>
            <header style={s.header}>
                <h1 style={s.title}>📊 서비스 대시보드</h1>
                <p style={s.meta}>환영합니다, <strong>{nickname}</strong> 관리자님! 오늘의 현황입니다. 🐣</p>
            </header>

            {loading ? (
                <div style={s.emptyState}>데이터를 불러오는 중입니다... 🔄</div>
            ) : stats ? (
                <div style={s.grid}>
                    {/* 카드 1: 유저 현황 */}
                    <div style={s.card}>
                        <h3 style={s.cardLabel}>👥 전체 유저</h3>
                        <div style={s.cardValue}>{stats.totalUsers.toLocaleString()} 명</div>
                        <p style={s.cardSub}>오늘 신규: <span style={{color: '#10B981'}}>+{stats.todayNewUsers}</span></p>
                    </div>

                    {/* 카드 2: 매출 현황 */}
                    <div style={{...s.card, borderLeft: '6px solid #8B5CF6'}}>
                        <h3 style={s.cardLabel}>💰 누적 매출</h3>
                        <div style={{...s.cardValue, color: '#7C3AED'}}>₩ {stats.totalSales.toLocaleString()}</div>
                        <p style={s.cardSub}>오늘 매출: <span style={{fontWeight: 700}}>₩ {stats.todaySales.toLocaleString()}</span></p>
                    </div>

                    {/* 카드 3: 활성 상태 */}
                    <div style={s.card}>
                        <h3 style={s.cardLabel}>✅ 활성 유저</h3>
                        <div style={{...s.cardValue, color: '#10B981'}}>{stats.activeUsers.toLocaleString()} 명</div>
                        <p style={s.cardSub}>서비스 이용 중인 유저</p>
                    </div>

                    {/* 카드 4: 정지 상태 */}
                    <div style={{...s.card, borderLeft: '6px solid #EF4444'}}>
                        <h3 style={s.cardLabel}>🚫 정지 유저</h3>
                        <div style={{...s.cardValue, color: '#EF4444'}}>{stats.suspendedUsers.toLocaleString()} 명</div>
                        <p style={s.cardSub}>운영 정책 위반 등의 사유</p>
                    </div>
                </div>
            ) : (
                <div style={s.emptyState}>통계 데이터를 표시할 수 없습니다. 😥</div>
            )}

            {/* 💡 바로가기 섹션 */}
            <div style={s.quickMenu}>
                <h3 style={s.sectionSubTitle}>🚀 빠른 관리 메뉴</h3>
                <div style={{display: 'flex', gap: '15px'}}>
                    <button style={s.menuBtn} onClick={() => window.location.href='/admin/users'}>통합 관리하기</button>
                    <button style={s.menuBtn} onClick={() => window.location.href='/admin/payments'}>결제 내역보기</button>
                </div>
            </div>
        </div>
    );
};

// 🌌 스타일 디자인
const s: Record<string, React.CSSProperties> = {
    container: { padding: '40px', maxWidth: '1100px', margin: '0 auto' },
    header: { marginBottom: '40px' },
    title: { fontSize: '32px', fontWeight: 800, color: '#4C1D95' },
    meta: { color: '#6D28D9', fontSize: '16px', opacity: 0.9 },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '25px',
        marginBottom: '50px'
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '30px',
        borderRadius: '25px',
        boxShadow: '0 10px 20px rgba(139, 92, 246, 0.1)',
        borderLeft: '6px solid #10B981', // 기본 초록색 포인트
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    },
    cardLabel: { fontSize: '15px', fontWeight: 700, color: '#6B7280', marginBottom: '10px' },
    cardValue: { fontSize: '28px', fontWeight: 900, color: '#1F2937', marginBottom: '8px' },
    cardSub: { fontSize: '14px', color: '#9CA3AF' },
    quickMenu: { marginTop: '20px' },
    sectionSubTitle: { fontSize: '20px', fontWeight: 800, color: '#5B21B6', marginBottom: '20px' },
    menuBtn: {
        padding: '15px 25px',
        borderRadius: '15px',
        border: 'none',
        background: '#fff',
        color: '#7C3AED',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
        transition: 'all 0.2s'
    },
    emptyState: { textAlign: 'center', padding: '100px', color: '#94A3B8', fontSize: '18px' }
};

export default AdminDashboard;