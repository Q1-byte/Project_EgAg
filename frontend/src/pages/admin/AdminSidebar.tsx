import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

/**
 * 관리자 전용 사이드바 컴포넌트
 */
const AdminSidebar = () => {
    const location = useLocation();
    const { logout, nickname } = useAuthStore();

    const menuItems = [
        { path: '/admin/dashboard', name: '대시보드', icon: '📈' },
        { path: '/admin/users', name: '통합 유저 관리', icon: '👥' },
        { path: '/admin/payments', name: '결제 내역', icon: '💳' },
        { path: '/admin/images', name: '메인 이미지 관리', icon: '🖼️' },
        { path: '/admin/inquiries', name: '문의게시판', icon: '📬' },
        { path: '/admin/artworks', name: '신고 작품 관리', icon: '🚫' },
    ];

    return (
        <aside style={s.sidebar}>
            <Link to="/" style={s.logoWrapper}>
                <img
                    src="/Egag_logo-removebg.png"
                    alt="이그에그 로고"
                    style={s.logoImg}
                />
                <p style={s.subLogo}>ADMIN PANEL</p>
            </Link>

            <div style={s.userInfo}>
                <div style={s.avatar}>{nickname?.charAt(0) || 'A'}</div>
                <div style={s.userText}>
                    <p style={s.userNickname}>{nickname}</p>
                    <p style={s.userRole}>System Admin</p>
                </div>
            </div>

            <nav style={s.nav}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                ...s.navLink,
                                backgroundColor: isActive ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
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
    );
};

// 🌌 스타일 정의 (유리 질감 및 프리미엄 디자인)
const s: Record<string, React.CSSProperties> = {
    sidebar: {
        width: '260px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(15px)',
        borderRight: '1px solid rgba(229, 231, 235, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 100,
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.02)'
    },
    logoWrapper: {
        padding: '40px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
    },
    logoImg: {
        width: '110px',
        height: 'auto',
        marginBottom: '8px',
        display: 'block'
    },
    subLogo: {
        fontSize: '10px',
        color: '#7C3AED',
        fontWeight: 800,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        margin: 0,
        opacity: 0.8
    },
    userInfo: {
        padding: '20px',
        margin: '0 15px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'rgba(124, 58, 237, 0.05)',
        borderRadius: '20px',
    },
    avatar: {
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        backgroundColor: '#7C3AED',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: '18px'
    },
    userText: {
        display: 'flex',
        flexDirection: 'column',
    },
    userNickname: {
        margin: 0,
        fontSize: '14px',
        fontWeight: 700,
        color: '#1F2937'
    },
    userRole: {
        margin: 0,
        fontSize: '11px',
        color: '#9CA3AF',
        fontWeight: 600
    },
    nav: {
        flex: 1,
        padding: '0 15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    navLink: {
        display: 'flex',
        alignItems: 'center',
        padding: '14px 18px',
        borderRadius: '16px',
        textDecoration: 'none',
        fontSize: '15px',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box'
    },
    iconWrapper: {
        marginRight: '14px',
        fontSize: '20px',
        display: 'inline-flex',
        width: '24px',
        justifyContent: 'center'
    },
    footer: {
        padding: '24px',
        borderTop: '1px solid rgba(243, 244, 246, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '10px'
    },
    homeBtn: {
        display: 'block',
        textAlign: 'center',
        padding: '14px',
        borderRadius: '14px',
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
        padding: '14px',
        borderRadius: '14px',
        border: '1px solid #FEE2E2',
        color: '#EF4444',
        backgroundColor: 'rgba(254, 226, 226, 0.1)',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s'
    }
};

export default AdminSidebar;