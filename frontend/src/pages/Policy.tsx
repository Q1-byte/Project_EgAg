import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronUp } from 'lucide-react';

const POLICY_DATA = {
    PRIVACY: {
        title: "개인정보처리방침",
        version: "v1.0.0",
        effectiveDate: "2026. 3. 18.",
        sections: [
            {
                title: "1. 수집하는 개인정보 항목",
                items: [
                    "필수 항목: 이메일 주소, 닉네임, 비밀번호(직접 가입 시)",
                    "소셜 로그인 시: 프로필 이미지, 소셜 아이디 식별 정보",
                    "결제 시: 결제 수단 정보, 거래 기록",
                ]
            },
            {
                title: "2. 개인정보 수집 및 이용 목적",
                items: [
                    "회원 식별 및 가입 의사 확인",
                    "AI 서비스 제공 및 결과물 저장 관리",
                    "토큰 결제 및 환불 처리",
                    "서비스 개정 사항 및 주요 공지사항 전달",
                ]
            },
            {
                title: "3. 개인정보의 보유 및 이용 기간",
                items: [
                    "회원의 개인정보는 회원 탈퇴 시까지 보유 및 이용하는 것을 원칙으로 합니다.",
                    "단, 관련 법령(전자상거래법 등)에 따라 보존이 필요한 경우 해당 기간(5년 등) 동안 보관합니다.",
                ]
            },
            {
                title: "4. 개인정보의 제3자 제공",
                items: [
                    "회사는 사용자의 동의 없이 개인정보를 외부에 제공하지 않습니다.",
                    "결제 처리를 위해 PG사(결제 대행사)에 필요한 정보를 제공하는 경우를 제외하고는 제3자에게 정보를 공유하지 않습니다.",
                ]
            },
            {
                title: "5. 사용자 및 법정대리인의 권리",
                items: [
                    "사용자는 언제든지 자신의 개인정보를 조회, 수정하거나 회원 탈퇴를 통해 동의 철회를 요청할 수 있습니다.",
                ]
            },
        ]
    },
    TERMS: {
        title: "이용약관",
        version: "v1.0.0",
        effectiveDate: "2026. 3. 18.",
        sections: [
            {
                title: "제1조 (목적)",
                items: [
                    "본 약관은 '이그에그(EggEgg)'(이하 '서비스')가 제공하는 AI 그림 생성 서비스 및 관련 제반 서비스의 이용과 관련하여 회원과 회사 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.",
                ]
            },
            {
                title: "제2조 (토큰 정책)",
                items: [
                    "서비스 내 특정 기능(데칼코마니, EgAg 등) 이용 시 '토큰'이 소모됩니다.",
                    "토큰 차감 기준: 데칼코마니 AI 생성 1회당 1개 소모 / EgAg AI 스케치 분석: 서비스 정책에 따라 별도 공지",
                    "구입한 토큰의 유효기간은 구매일로부터 1년이며, 유효기간 경과 시 자동 소멸됩니다.",
                ]
            },
            {
                title: "제3조 (환불 정책)",
                items: [
                    "유료로 구매한 토큰은 구매 후 7일 이내에 사용 내역이 없는 경우 전액 환불이 가능합니다.",
                    "일부를 사용한 토큰 묶음의 경우, 남은 잔액에서 결제 수수료를 제외한 금액을 환불합니다.",
                    "이벤트로 지급된 무상 토큰은 환불 대상에서 제외됩니다.",
                ]
            },
            {
                title: "제4조 (권리 귀속 및 저작권)",
                items: [
                    "회원이 서비스를 통해 생성한 이미지의 저작권은 원칙적으로 생성한 회원 본인에게 귀속됩니다.",
                    "회원은 자신이 생성한 이미지를 상업적 목적으로 이용할 수 있습니다.",
                    "단, 회사는 서비스 홍보 및 AI 모델 학습을 위해 회원의 결과물을 익명화하여 활용할 수 있습니다.",
                ]
            },
        ]
    }
} as const;

interface PolicyProps {
    type: 'TERMS' | 'PRIVACY';
}

const Policy: React.FC<PolicyProps> = ({ type }) => {
    const navigate = useNavigate();
    const [showTop, setShowTop] = useState(false);
    const data = POLICY_DATA[type];

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 200);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div style={s.bg} className="policy-bg">
            <style>{`
                @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                .policy-back:hover { background: rgba(107,130,160,0.12) !important; }
                .policy-top:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(107,130,160,0.3) !important; }
                @media (max-width: 640px) {
                  .policy-bg { padding: 32px 0 60px !important; }
                  .policy-main { padding: 0 16px !important; }
                  .policy-card { padding: 24px 20px 32px !important; border-radius: 16px !important; }
                  .policy-title { font-size: 20px !important; }
                  .policy-section-title { font-size: 14px !important; }
                  .policy-list-item { font-size: 13px !important; }
                  .policy-top-btn { bottom: 20px !important; right: 16px !important; width: 38px !important; height: 38px !important; }
                }
                @media (min-width: 641px) and (max-width: 860px) {
                  .policy-bg { padding: 40px 24px 72px !important; }
                  .policy-card { padding: 28px 32px 36px !important; }
                }
            `}</style>

            <main style={s.main} className="policy-main">
                {/* 뒤로가기 */}
                <button className="policy-back" onClick={() => navigate(-1)} style={s.backBtn}>
                    <ArrowLeft size={15} strokeWidth={2.5} />
                    돌아가기
                </button>

                <div style={s.card} className="policy-card">
                    {/* 헤더 */}
                    <div style={s.header}>
                        <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 72, marginTop: 16, marginBottom: 20 }} />
                        <h1 style={s.title} className="policy-title">{data.title}</h1>
                        <p style={s.meta}>시행일 {data.effectiveDate}</p>
                    </div>

                    <div style={s.divider} />

                    {/* 섹션 */}
                    <div style={s.sections}>
                        {data.sections.map((section, i) => (
                            <div key={i} style={s.section}>
                                <h2 style={s.sectionTitle} className="policy-section-title">{section.title}</h2>
                                <ul style={s.list}>
                                    {section.items.map((item, j) => (
                                        <li key={j} style={s.listItem} className="policy-list-item">
                                            <span style={s.bullet} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div style={s.footer}>
                        이그에그와 함께 즐거운 창작 시간 되세요!
                    </div>
                </div>
            </main>

            {/* 위로가기 */}
            <button
                className="policy-top policy-top-btn"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{
                    ...s.topBtn,
                    opacity: showTop ? 1 : 0,
                    pointerEvents: showTop ? 'auto' : 'none',
                    transform: showTop ? 'translateY(0)' : 'translateY(10px)',
                }}
            >
                <ChevronUp size={20} color="#6B82A0" strokeWidth={2.5} />
            </button>
        </div>
    );
};

const s: Record<string, React.CSSProperties> = {
    bg: {
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f5f0f8 0%, #ede8f2 40%, #f0eee9 100%)',
        padding: '64px 20px 80px',
    },
    main: {
        maxWidth: 720, margin: '0 auto',
        animation: 'fadeUp 0.5s ease both',
    },
    backBtn: {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        marginBottom: 20, padding: '8px 16px',
        fontSize: 13, fontWeight: 600, color: '#6B82A0',
        background: 'rgba(107,130,160,0.07)',
        border: '1.5px solid rgba(107,130,160,0.18)',
        borderRadius: 100, cursor: 'pointer', transition: 'background 0.15s',
    },
    card: {
        background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,240,248,0.85) 100%)',
        border: '1.5px solid rgba(255,255,255,0.75)',
        borderRadius: 24, padding: '36px 48px 44px',
        boxShadow: '0 8px 40px rgba(107,130,160,0.13)',
        overflow: 'visible',
    },
    header: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', marginBottom: 32,
    },
    title: {
        fontSize: 28, fontWeight: 900, margin: '0 0 10px',
        background: 'linear-gradient(135deg, #c47a8a 0%, #6B82A0 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        letterSpacing: -0.5,
    },
    meta: {
        fontSize: 13, color: '#9ca3af', display: 'flex',
        alignItems: 'center', gap: 10, fontWeight: 500,
    },
    divider: {
        height: 1,
        background: 'linear-gradient(to right, transparent, rgba(107,130,160,0.2), transparent)',
        margin: '0 0 36px',
    },
    sections: {
        display: 'flex', flexDirection: 'column', gap: 28,
    },
    section: {
        display: 'flex', flexDirection: 'column', gap: 12,
    },
    sectionTitle: {
        fontSize: 15, fontWeight: 800, color: '#4a4a6a',
        margin: 0, letterSpacing: -0.3,
    },
    list: {
        listStyle: 'none', margin: 0, padding: 0,
        display: 'flex', flexDirection: 'column', gap: 8,
    },
    listItem: {
        display: 'flex', alignItems: 'flex-start', gap: 10,
        fontSize: 14, color: '#6a6a8a', lineHeight: 1.7,
    },
    bullet: {
        width: 5, height: 5, borderRadius: '50%',
        background: 'linear-gradient(135deg, #c47a8a, #6B82A0)',
        flexShrink: 0, marginTop: 8,
    },
    footer: {
        marginTop: 44, textAlign: 'center',
        fontSize: 13, color: '#a09ab0', fontWeight: 600,
        borderTop: '1px solid rgba(107,130,160,0.1)', paddingTop: 24,
    },
    topBtn: {
        position: 'fixed', bottom: 36, right: 36,
        width: 44, height: 44, borderRadius: '50%',
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(107,130,160,0.2)',
        boxShadow: '0 4px 16px rgba(107,130,160,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', zIndex: 100,
        transition: 'all 0.25s',
    },
};

export default Policy;
