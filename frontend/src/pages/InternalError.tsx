import React, { useState, useEffect, useMemo } from 'react';

// ── 데이터 생성 로직 (컴포넌트 외부) ──
const generateErrorCodeStream = (count: number) => {
    const codes = ['0', '1', 'Error', '500', 'NullPointer', 'SyntaxError'];
    return [...Array(count)].map((_, i) => ({
        id: i,
        text: codes[Math.floor(Math.random() * codes.length)],
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        fontSize: `${12 + Math.random() * 20}px`,
        delay: `${Math.random() * 5}s`,
        duration: `${15 + Math.random() * 15}s`,
        opacity: 0.1 + Math.random() * 0.2,
    }));
};

const InternalError: React.FC = () => {
    const [shake, setShake] = useState(false);
    const [isHiding, setIsHiding] = useState(false);

    const errorCodeStream = useMemo(() => generateErrorCodeStream(15), []);

    useEffect(() => {
        const interval = setInterval(() => {
            setShake(true);
            setIsHiding(true);

            setTimeout(() => {
                setShake(false);
                setIsHiding(false);
            }, 1200);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const errorStyle = `
        @keyframes glitch {
            0% { transform: translate(0); }
            20% { transform: translate(-3px, 3px) skewX(5deg); }
            40% { transform: translate(-3px, -3px) skewX(-5deg); }
            60% { transform: translate(3px, 3px) skewX(5deg); }
            80% { transform: translate(3px, -3px) skewX(-5deg); }
            100% { transform: translate(0); }
        }
        @keyframes steamUp {
            0% { transform: translateY(0) scale(1); opacity: 0; }
            50% { opacity: 0.5; }
            100% { transform: translateY(-50px) scale(1.4); opacity: 0; }
        }
        @keyframes codeFlow {
            0% { transform: translateY(10vh); opacity: 0; }
            10% { opacity: var(--original-opacity); }
            90% { opacity: var(--original-opacity); }
            100% { transform: translateY(-100vh); opacity: 0; }
        }
        @keyframes sweatDrop {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0; }
            10%, 90% { opacity: 1; }
            50% { transform: translateY(15px) scale(1.2); }
        }
        @keyframes noise {
            0% { transform: translate(0,0) }
            10% { transform: translate(-5%,-5%) }
            20% { transform: translate(-10%,5%) }
            30% { transform: translate(5%,-10%) }
            40% { transform: translate(-5%,15%) }
            50% { transform: translate(-10%,5%) }
            60% { transform: translate(15%,0) }
            70% { transform: translate(0,10%) }
            80% { transform: translate(-15%,0) }
            90% { transform: translate(10%,5%) }
            100% { transform: translate(5%,0) }
        }
    `;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: '#1a1a1a',
            color: '#ffffff', // 👈 기본 텍스트 색상을 흰색으로 고정
            fontFamily: "'Pretendard', sans-serif", overflow: 'hidden', position: 'relative'
        }}>
            <style>{errorStyle}</style>

            {/* 노이즈 효과 */}
            <div style={{
                position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                opacity: 0.03, animation: 'noise 0.2s infinite', pointerEvents: 'none', zIndex: 0
            }} />

            {/* 배경 흐르는 코드 */}
            {errorCodeStream.map((code) => (
                <div key={`code-${code.id}`} style={{
                    position: 'absolute', top: code.top, left: code.left,
                    fontSize: code.fontSize, fontWeight: 700, color: '#a855f7',
                    '--original-opacity': code.opacity,
                    animation: `codeFlow ${code.duration} infinite linear ${code.delay}`,
                    zIndex: 1, userSelect: 'none'
                } as React.CSSProperties}>
                    {code.text}
                </div>
            ))}

            <div style={{ position: 'absolute', top: '25%', animation: 'steamUp 2s infinite', zIndex: 2 }}>💨</div>

            <h1 style={{
                fontSize: '110px', fontWeight: 900, color: '#ff4d4d', margin: 0,
                animation: shake ? 'glitch 0.3s infinite' : 'none',
                textShadow: '0 0 25px rgba(255, 77, 77, 0.5)',
                zIndex: 3, position: 'relative'
            }}>500</h1>

            <div style={{ margin: '20px 0', userSelect: 'none', position: 'relative', zIndex: 3 }}>
                <svg width="180" height="243" viewBox="0 0 200 270" style={{ filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.4))' }}>
                    <defs>
                        <clipPath id="body-clip"><rect x="0" y="133" width="200" height="200" /></clipPath>
                    </defs>
                    <ellipse cx="100" cy="173" rx="57" ry="73" fill="#FFD700" stroke="#000000" strokeWidth="1.5" clipPath="url(#body-clip)" />
                    <circle cx="80" cy="148" r="11" fill="white" stroke="#000" strokeWidth="1.5" />
                    <circle cx="80" cy="148" r="5" fill="#000" />
                    <circle cx="120" cy="148" r="11" fill="white" stroke="#000" strokeWidth="1.5" />
                    <circle cx="120" cy="148" r="5" fill="#000" />
                    <path d="M 93,161 L 107,161 L 100,172 Z" fill="#FFA500" stroke="#000" strokeWidth="1" />
                    <ellipse cx="64" cy="160" rx="8" ry="5.5" fill="#FFC0CB" />
                    <ellipse cx="136" cy="160" rx="8" ry="5.5" fill="#FFC0CB" />
                    <path d="M 30,187 L 48,170 L 65,187 L 83,170 L 100,187 L 117,170 L 135,187 L 152,170 L 170,187 C 175,222 170,255 100,258 C 30,255 25,222 30,187 Z" fill="#FFEDDC" stroke="#000" strokeWidth="1.8" />
                    <g style={{
                        transform: isHiding ? 'translateY(38px)' : 'translateY(0px)',
                        transition: 'transform 0.4s cubic-bezier(0.34, 1.3, 0.64, 1)',
                    }}>
                        <path d="M 30,148 L 48,131 L 65,148 L 83,131 L 100,148 L 117,131 L 135,148 L 152,131 L 170,148 C 165,102 150,72 100,68 C 50,72 35,102 30,148 Z" fill="#FFEDDC" stroke="#000" strokeWidth="1.8" />
                        <ellipse cx="76" cy="98" rx="9" ry="13" fill="#FFFFFF" opacity="0.4" transform="rotate(-25, 76, 98)" />
                    </g>
                </svg>

                {/* 땀방울 아이콘 (색상 대비 보강) */}
                <div style={{
                    position: 'absolute', top: '80px', left: '150px', fontSize: '35px',
                    animation: isHiding ? 'sweatDrop 1s ease-in-out' : 'none',
                    opacity: 0, zIndex: 4, pointerEvents: 'none', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))'
                }}>
                    💧
                </div>
            </div>

            {/* ── 텍스트 영역 가독성 보강 ── */}
            <h2 style={{
                fontSize: '26px',
                fontWeight: 800,
                marginBottom: '12px',
                zIndex: 3,
                position: 'relative',
                color: '#ffffff' // 👈 메인 제목은 선명한 흰색
            }}>
                삐약이가 숨어버렸어요!
            </h2>
            <p style={{
                color: '#cccccc', // 👈 본문은 부드러운 연회색으로 구분
                fontSize: '17px',
                textAlign: 'center',
                lineHeight: '1.7',
                maxWidth: '450px',
                margin: '0 auto',
                zIndex: 3,
                position: 'relative',
                fontWeight: 500
            }}>
                서버가 너무 뜨거워서 삐약이가 껍데기 속으로 도망갔나 봐요.<br />
                열기가 식을 때까지 잠시만 기다려주세요!
            </p>

            <button
                onClick={() => window.location.reload()}
                style={{
                    marginTop: '45px', padding: '16px 48px', background: '#ff4d4d', color: '#ffffff',
                    border: 'none', borderRadius: '35px', cursor: 'pointer', fontWeight: 800, fontSize: '17px',
                    boxShadow: '0 8px 25px rgba(255, 77, 77, 0.4)', transition: 'all 0.2s ease-in-out',
                    zIndex: 3, position: 'relative'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.background = '#ff6666';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = '#ff4d4d';
                }}
            >
                다시 불러오기 🐣
            </button>
        </div>
    );
};

export default InternalError;