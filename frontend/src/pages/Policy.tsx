import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLatestTerms, getLatestPrivacy, type PolicyResponse } from '../api/policy';

interface PolicyProps {
    type: 'TERMS' | 'PRIVACY';
}

const Policy: React.FC<PolicyProps> = ({ type }) => {
    const [policy, setPolicy] = useState<PolicyResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [showTopBtn, setShowTopBtn] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // 200px만 내려도 나타나도록 기준을 낮췄어요!
            if (window.scrollY > 50) {
                setShowTopBtn(true);
            } else {
                setShowTopBtn(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchPolicy = async () => {
            try {
                const response = type === 'TERMS' ? await getLatestTerms() : await getLatestPrivacy();
                setPolicy(response.data);
            } catch (error) {
                console.error("정책을 불러오는데 실패했습니다.", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPolicy();
    }, [type]);

    if (loading) return <div style={s.loading}>🐣 우주에서 가져오는 중...</div>;
    if (!policy) return <div style={s.loading}>🥚 텅 빈 우주예요!</div>;

    return (
        <div style={s.container}>
            <div style={s.card}>
                <button
                    onClick={() => navigate(-1)}
                    style={s.closeButton}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    ✕
                </button>

                {/* ⭐ Top 버튼: visibility를 추가해서 더 확실하게 제어합니다 */}
                <button
                    onClick={scrollToTop}
                    style={{
                        ...s.topButton,
                        opacity: showTopBtn ? 1 : 0,
                        visibility: showTopBtn ? 'visible' : 'hidden',
                        pointerEvents: showTopBtn ? 'auto' : 'none',
                        transform: showTopBtn ? 'scale(1)' : 'scale(0.5)', // 뿅! 나타나는 효과 극대화
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.backgroundColor = '#F5F3FF';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                    }}
                >
                    UP 🐣
                </button>

                <div style={s.header}>
                    <span style={s.icon}>{type === 'TERMS' ? '📜' : '🔒'}</span>
                    <h1 style={s.title}>{type === 'TERMS' ? '이용약관' : '개인정보처리방침'}</h1>
                    <div style={s.meta}>
                        <span>버전 {policy.version}</span>
                        <span style={s.dot}>•</span>
                        <span>시행일 {new Date(policy.effectiveDate).toLocaleDateString()}</span>
                    </div>
                </div>

                <div style={s.divider} />
                <div style={s.content}>{policy.content}</div>
                <div style={s.footer}>이그에그와 함께 즐거운 창작 시간 되세요! 🦄✨</div>
            </div>
        </div>
    );
};

const s: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FDECF2 0%, #E0E7FF 50%, #F5F3FF 100%)',
        padding: '60px 20px',
        display: 'flex',
        justifyContent: 'center',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        maxWidth: '800px',
        width: '100%',
        borderRadius: '40px',
        padding: '50px',
        boxShadow: '0 10px 25px rgba(165, 180, 252, 0.15)',
        border: '2px solid #FFFFFF',
        position: 'relative',
        // overflow: 'visible'를 명시적으로 주면 자식 버튼이 밖으로 나가도 잘 보여요!
        overflow: 'visible',
    },
    closeButton: {
        position: 'absolute', top: '25px', right: '25px',
        width: '40px', height: '40px', borderRadius: '50%',
        border: 'none', backgroundColor: 'transparent',
        fontSize: '20px', color: '#7C3AED', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s ease',
    },

    topButton: {
        position: 'fixed', // 브라우저 창 기준으로 고정
        bottom: '40px',
        // 화면 중앙에서 카드의 절반만큼 오른쪽으로 밀고, 여백을 더 줬어요
        right: '40px',
        width: '55px',
        height: '55px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        border: '2px solid #DDD6FE',
        color: '#7C3AED',
        fontSize: '13px',
        fontWeight: 800,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 20px rgba(139, 92, 246, 0.2)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        zIndex: 1000,
    },
    // ... 이하 스타일(header, icon, title, meta, divider, content, loading, footer)은 기존과 동일
    header: { textAlign: 'center', marginBottom: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' },
    icon: { fontSize: '64px', display: 'block', marginBottom: '10px', filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))' },
    title: { fontSize: '32px', fontWeight: 800, color: '#5B21B6', margin: '10px 0', letterSpacing: '-0.5px' },
    meta: { fontSize: '15px', color: '#7C3AED', display: 'flex', justifyContent: 'center', gap: '12px', fontWeight: 600, marginTop: '5px', opacity: 0.8 },
    divider: { height: '2px', background: 'linear-gradient(to right, transparent, #DDD6FE, transparent)', margin: '20px 0 40px 0' },
    content: { whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#4C1D95', fontSize: '16px' },
    loading: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#8B5CF6', backgroundColor: '#F5F3FF' },
    footer: { marginTop: '50px', textAlign: 'center', fontSize: '14px', color: '#8B5CF6', fontWeight: 700 }
};

export default Policy;