import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuthStore } from '../../stores/useAuthStore';

/**
 * 전용 관리자 레이아웃 컴포넌트
 * 사이드바와 메인 콘텐츠 영역의 전체 구조를 정의합니다.
 */
const AdminLayout = () => {
    const { isAuthenticated, role } = useAuthStore();

    // 관리자 권한 체크 (방어적 로직)
    const isAdmin = role === 'ADMIN' || String(role) === '100';

    if (!isAuthenticated || !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div style={s.layout}>
            {/* 1. 고정 사이드바 (Nav 전 전담) */}
            <AdminSidebar />

            {/* 2. 메인 콘텐츠 영역 (스크롤 가능) */}
            <main style={s.mainContent}>
                <div style={s.container}>
                    {/* 하위 라우트 컴포넌트들이 렌더링되는 지점 */}
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

// 🌌 스타일 디자인 (Premium Admin Frame)
const s: Record<string, React.CSSProperties> = {
    layout: { 
        display: 'flex', 
        minHeight: '100vh', 
        backgroundColor: '#F8FAFC',
        backgroundImage: `
            radial-gradient(at 0% 0%, rgba(124, 58, 237, 0.03) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.03) 0px, transparent 50%)
        `,
    },
    mainContent: {
        flex: 1,
        marginLeft: '260px', // 사이드바 너비
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
    },
    container: {
        flex: 1,
        padding: '0 20px 40px', // 좌우 20px, 하단 40px 여백
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box' as const,
    }
};

export default AdminLayout;