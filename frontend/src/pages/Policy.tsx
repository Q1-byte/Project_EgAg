import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 📜 법적 데이터 통합 관리
const POLICY_DATA = {
    PRIVACY: {
        title: "개인정보처리방침",
        icon: "🔒",
        version: "v1.0.0",
        effectiveDate: "2026. 3. 18.",
        content: `이그에그(EggEgg)는 사용자의 개인정보를 소중히 다루며, 관련 법령을 준수합니다.

1. 수집하는 개인정보 항목
- 필수 항목: 이메일 주소, 닉네임, 비밀번호(직접 가입 시)
- 소셜 로그인 시: 프로필 이미지, 소셜 아이디 식별 정보
- 결제 시: 결제 수단 정보, 거래 기록

2. 개인정보 수집 및 이용 목적
- 회원 식별 및 가입 의사 확인
- AI 서비스 제공 및 결과물 저장 관리
- 토큰 결제 및 환불 처리
- 서비스 개정 사항 및 주요 공지사항 전달

3. 개인정보의 보유 및 이용 기간
- 회원의 개인정보는 회원 탈퇴 시까지 보유 및 이용하는 것을 원칙으로 합니다.
- 단, 관련 법령(전자상거래법 등)에 따라 보존이 필요한 경우 해당 기간(5년 등) 동안 보관합니다.

4. 개인정보의 제3자 제공
회사는 사용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 결제 처리를 위해 PG사(결제 대행사)에 필요한 정보를 제공하는 경우를 제외하고는 제3자에게 정보를 공유하지 않습니다.

5. 사용자 및 법정대리인의 권리
사용자는 언제든지 자신의 개인정보를 조회, 수정하거나 회원 탈퇴를 통해 동의 철회를 요청할 수 있습니다.`
    },
    TERMS: {
        title: "이용약관",
        icon: "📜",
        version: "v1.0.0",
        effectiveDate: "2026. 3. 18.",
        content: `제1조 (목적)
본 약관은 '이그에그(EggEgg)'(이하 '서비스')가 제공하는 AI 그림 생성 서비스 및 관련 제반 서비스의 이용과 관련하여 회원과 회사 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (토큰 정책)
1. 서비스 내 특정 기능(데칼코마니, EgAg 등) 이용 시 '토큰'이 소모됩니다.
2. 토큰 차감 기준:
   - 데칼코마니 AI 생성: 1회당 1개 소모
   - EgAg AI 스케치 분석: 서비스 정책에 따라 별도 공지
3. 구입한 토큰의 유효기간은 구매일로부터 1년이며, 유효기간 경과 시 자동 소멸됩니다.

제3조 (환불 정책)
1. 유료로 구매한 토큰은 구매 후 7일 이내에 사용 내역이 없는 경우 전액 환불이 가능합니다.
2. 일부를 사용한 토큰 묶음의 경우, 남은 잔액에서 결제 수수료를 제외한 금액을 환불합니다.
3. 이벤트로 지급된 무상 토큰은 환불 대상에서 제외됩니다.

제4조 (권리 귀속 및 저작권)
1. 회원이 서비스를 통해 생성한 이미지의 저작권은 원칙적으로 생성한 회원 본인에게 귀속됩니다.
2. 회원은 자신이 생성한 이미지를 상업적 목적으로 이용할 수 있습니다. 
3. 단, 회사는 서비스 홍보 및 AI 모델 학습을 위해 회원의 결과물을 익명화하여 활용할 수 있습니다.`
    }
} as const;

interface PolicyProps {
    type: 'TERMS' | 'PRIVACY';
}

const Policy: React.FC<PolicyProps> = ({ type }) => {
    const navigate = useNavigate();
    const [showTopBtn, setShowTopBtn] = useState(false);

    // ⭐ 핵심: props로 넘어온 type('TERMS' 또는 'PRIVACY')에 따라 데이터를 선택합니다.
    const data = POLICY_DATA[type];

    useEffect(() => {
        const handleScroll = () => {
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

    return (
        <div style={s.container}>
            <div style={s.card}>
                {/* 뒤로가기 버튼 */}
                <button
                    onClick={() => navigate(-1)}
                    style={s.closeButton}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    ✕
                </button>

                {/* Top 버튼 */}
                <button
                    onClick={scrollToTop}
                    style={{
                        ...s.topButton,
                        opacity: showTopBtn ? 1 : 0,
                        visibility: showTopBtn ? 'visible' : 'hidden',
                        pointerEvents: showTopBtn ? 'auto' : 'none',
                        transform: showTopBtn ? 'scale(1)' : 'scale(0.5)',
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

                {/* 헤더 부분 (아이콘, 제목, 버전 등이 type에 따라 자동 변경) */}
                <header style={s.header}>
                    <span style={s.icon}>{data.icon}</span>
                    <h1 style={s.title}>{data.title}</h1>
                    <div style={s.meta}>
                        <span>버전 {data.version}</span>
                        <span style={s.dot}>•</span>
                        <span>시행일 {data.effectiveDate}</span>
                    </div>
                </header>

                <div style={s.divider} />

                {/* 본문 내용 (type에 맞춰 출력) */}
                <div style={s.content}>{data.content}</div>

                <div style={s.footer}>이그에그와 함께 즐거운 창작 시간 되세요! 🦄✨</div>
            </div>
        </div>
    );
};

// --- 스타일 객체 (이전과 동일) ---
const s: Record<string, React.CSSProperties> = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #FDECF2 0%, #E0E7FF 50%, #F5F3FF 100%)', padding: '60px 20px', display: 'flex', justifyContent: 'center' },
    card: { backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', maxWidth: '800px', width: '100%', borderRadius: '40px', padding: '50px', boxShadow: '0 10px 25px rgba(165, 180, 252, 0.15)', border: '2px solid #FFFFFF', position: 'relative', overflow: 'visible' },
    closeButton: { position: 'absolute', top: '25px', right: '25px', width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', fontSize: '20px', color: '#7C3AED', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' },
    topButton: { position: 'fixed', bottom: '40px', right: '40px', width: '55px', height: '55px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '2px solid #DDD6FE', color: '#7C3AED', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(139, 92, 246, 0.2)', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', zIndex: 1000 },
    header: { textAlign: 'center', marginBottom: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' },
    icon: { fontSize: '64px', display: 'block', marginBottom: '10px', filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))' },
    title: { fontSize: '32px', fontWeight: 800, color: '#5B21B6', margin: '10px 0', letterSpacing: '-0.5px' },
    meta: { fontSize: '15px', color: '#7C3AED', display: 'flex', justifyContent: 'center', gap: '12px', fontWeight: 600, marginTop: '5px', opacity: 0.8 },
    dot: { color: '#DDD6FE' },
    divider: { height: '2px', background: 'linear-gradient(to right, transparent, #DDD6FE, transparent)', margin: '20px 0 40px 0' },
    content: { whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#4C1D95', fontSize: '16px', textAlign: 'left' },
    footer: { marginTop: '50px', textAlign: 'center', fontSize: '14px', color: '#8B5CF6', fontWeight: 700 }
};

export default Policy;