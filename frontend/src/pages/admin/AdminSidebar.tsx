import React from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

const AdminSidebar = () => {
    const location = useLocation();
    const { isAuthenticated, role, logout } = useAuthStore();

    // 관리자 권한 체크 (문자열 또는 숫자형 대응)
    const isAdmin = role === 'ADMIN' || String(role) === '100';

    if (!isAuthenticated || !isAdmin) {
        return <Navigate to="/" replace />;
    }

    const menuItems = [
        { path: '/admin/dashboard', name: '대시보드', icon: '📈' },
        { path: '/admin/users', name: '통합 유저 관리', icon: '👥' },
        { path: '/admin/payments', name: '결제 내역', icon: '💳' },
        { path: '/admin/images', name: '메인 이미지 관리', icon: '🖼️' },
        { path: '/admin/inquiries', name: '문의게시판', icon: '📬' },
    ];

    return (
        <div style={s.layout}>
            <aside style={s.sidebar}>
                <Link to="/" style={s.logoWrapper}>
                    <img
                        src="/Egag_logo-removebg.png"
                        alt="이그에그 로고"
                        style={s.logoImg}
                    />
                    <p style={s.subLogo}>ADMIN PANEL</p>
                </Link>

                <nav style={s.nav}>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    ...s.navLink,
                                    backgroundColor: isActive ? '#F3E8FF' : 'transparent',
                                    color: isActive ? '#7C3AED' : '#6B7280',
                                    fontWeight: isActive ? 800 : 500,
                                }}
                            >
                                <span style={s.iconWrapper}>{item.icon}</span>
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div style={s.footer}>
                    <Link to="/" style={s.homeBtn}>
                        🏠 사용자 홈으로
                    </Link>
                    <button onClick={logout} style={s.logoutBtn}>
                        🚪 로그아웃
                    </button>
                </div>
            </aside>

            <main style={s.mainContent}>
                <Outlet />
            </main>
        </div>
    );
};

// 🌌 스타일 정의 (기존 스타일 유지 및 최적화)
const s: Record<string, React.CSSProperties> = {
    layout: { display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' },
    sidebar: {
        width: '260px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        zIndex: 100
    },
    logoWrapper: {
        padding: '40px 20px 30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        transition: 'transform 0.2s',
    },
    logoImg: {
        width: '120px',
        height: 'auto',
        marginBottom: '8px',
        display: 'block'
    },
    subLogo: {
        fontSize: '11px',
        color: '#9CA3AF',
        fontWeight: 700,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        margin: 0
    },
    nav: {
        flex: 1,
        padding: '0 15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    navLink: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px 15px',
        borderRadius: '12px',
        textDecoration: 'none',
        fontSize: '15px',
        transition: 'all 0.2s',
        boxSizing: 'border-box'
    },
    iconWrapper: {
        marginRight: '12px',
        fontSize: '18px',
        display: 'inline-flex',
        width: '24px',
        justifyContent: 'center'
    },
    footer: {
        padding: '20px',
        borderTop: '1px solid #F3F4F6',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    homeBtn: {
        display: 'block',
        textAlign: 'center',
        padding: '12px',
        borderRadius: '12px',
        backgroundColor: '#F3F4F6',
        color: '#4B5563',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: 700,
        transition: '0.2s',
        border: '1px solid #E5E7EB'
    },
    logoutBtn: {
        width: '100%',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid #FCA5A5',
        color: '#EF4444',
        backgroundColor: 'transparent',
        fontWeight: 700,
        cursor: 'pointer',
        transition: '0.2s'
    },
    mainContent: {
        flex: 1,
        marginLeft: '260px',
        padding: '20px',
        minHeight: '100vh'
    }
};

export default AdminSidebar;