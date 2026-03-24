import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// ── 데이터 생성 로직 (생략 없음) ──
const generateStars = (count: number) => {
    return [...Array(count)].map((_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 3}px`,
        delay: `${Math.random() * 5}s`,
        speed: 0.3 + Math.random() * 0.7,
    }));
};

const generateQuestionMarks = (count: number) => {
    return [...Array(count)].map((_, i) => ({
        id: i,
        top: `${Math.random() * 80 + 10}%`,
        left: `${Math.random() * 80 + 10}%`,
        fontSize: `${20 + Math.random() * 40}px`,
        delay: `${Math.random() * 5}s`,
        duration: `${12 + Math.random() * 10}s`,
        opacity: 0.1 + Math.random() * 0.3,
    }));
};

const NotFound: React.FC = () => {
    const navigate = useNavigate();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0, rawX: 0, rawY: 0 });
    const [eyePos, setEyePos] = useState({ px: 0, py: 0 });
    const [eyeClosed, setEyeClosed] = useState(false);

    const STAR_DATA = useMemo(() => generateStars(40), []);
    const QUESTION_MARK_DATA = useMemo(() => generateQuestionMarks(10), []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // 패럴랙스 효과 (배경)
            const x = (e.clientX / window.innerWidth - 0.5);
            const y = (e.clientY / window.innerHeight - 0.5);
            setMousePos({ x: x * 30, y: y * 30, rawX: e.clientX, rawY: e.clientY });

            // 🛠️ 시선 추적 (더 기민하게 조정)
            setEyePos({ px: x * 10, py: y * 10 });
        };

        const blinkInterval = setInterval(() => {
            setEyeClosed(true);
            setTimeout(() => setEyeClosed(false), 150);
        }, 4500);

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(blinkInterval);
        };
    }, []);

    const spaceStyle = `
        @keyframes drift {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(15px, -20px) rotate(5deg); }
        }
        @keyframes neonPulse {
            0%, 100% { text-shadow: 0 0 20px rgba(168, 85, 247, 0.6), 0 0 40px rgba(168, 85, 247, 0.3), 0 0 5px #fff; }
            50% { text-shadow: 0 0 40px rgba(168, 85, 247, 0.9), 0 0 70px rgba(168, 85, 247, 0.5), 0 0 10px #fff; }
        }
        @keyframes chickSwim {
            0%, 100% { transform: translateY(0px) rotate(-5deg); }
            50% { transform: translateY(-15px) rotate(10deg); }
        }
    `;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: '#0a0514', // 깊은 우주색
            color: '#ffffff', textAlign: 'center', padding: '20px',
            fontFamily: "'Pretendard', sans-serif", position: 'relative', overflow: 'hidden',
        }}>
            <style>{spaceStyle}</style>

            {/* 🛠️ 효과 1: 배경 은하수 안개 (기본 은은한 빛) */}
            <div style={{
                position: 'absolute', width: '80vw', height: '80vh',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
                left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                filter: 'blur(100px)', zIndex: 0
            }} />

            {/* 🛠️ 효과 2: [수정] 강력해진 마우스 위치 조명 (블랙홀 탐사) */}
            <div style={{
                position: 'absolute',
                width: '600px', // 크기 확대 (500 -> 600)
                height: '600px',
                // [핵심] 투명도 대폭 상승 (0.03 -> 0.08) 및 그라데이션 경계 강화
                background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 40%, transparent 80%)',
                left: mousePos.rawX - 300, top: mousePos.rawY - 300,
                pointerEvents: 'none',
                zIndex: 10, // 병아리와 텍스트 위로 올림 (더 확실한 조명 효과)
                filter: 'blur(50px)', // 더 몽환적인 네온광
            }} />

            {/* 별들 (패럴랙스) */}
            {STAR_DATA.map((star) => (
                <div key={star.id} style={{
                    position: 'absolute', top: star.top, left: star.left, width: star.size, height: star.size,
                    backgroundColor: '#fff', borderRadius: '50%', opacity: 0.6,
                    transform: `translate(${mousePos.x * star.speed}px, ${mousePos.y * star.speed}px)`,
                    transition: 'transform 0.1s ease-out', zIndex: 1,
                }} />
            ))}

            {/* 물음표들 (유영) */}
            {QUESTION_MARK_DATA.map((q) => (
                <div key={q.id} style={{
                    position: 'absolute', top: q.top, left: q.left,
                    fontSize: q.fontSize, fontWeight: 700, color: '#a855f7',
                    opacity: q.opacity, zIndex: 2, userSelect: 'none',
                    animation: `drift ${q.duration} infinite ease-in-out ${q.delay}`,
                    transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`,
                }}>?</div>
            ))}

            {/* 메인 콘텐츠 영역 (zIndex: 5) */}
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                zIndex: 5, // 마우스 조명(10)보다 아래에 배치해서 조명이 겹치게 함
                position: 'relative', width: '100%',
                // 🛠️ 마우스 이동에 따라 콘텐츠 전체가 약간씩 기울어지는 효과 (Framer 스타일)
                transform: `rotateX(${-mousePos.y * 0.2}deg) rotateY(${mousePos.x * 0.2}deg)`,
                transition: 'transform 0.2s ease-out'
            }}>

                {/* 404 큰 글씨 (병아리 뒤에 배치) */}
                <h1 style={{
                    fontSize: 'clamp(100px, 20vw, 180px)', fontWeight: 950, margin: 0,
                    color: '#a855f7', letterSpacing: '-4px', lineHeight: 0.9,
                    animation: 'neonPulse 3s infinite ease-in-out',
                    zIndex: 5, position: 'relative'
                }}>404</h1>

                {/* 병아리 */}
                <div style={{
                    marginTop: '-50px',
                    marginBottom: '20px',
                    animation: 'chickSwim 8s infinite ease-in-out',
                    zIndex: 15, position: 'relative'
                }}>
                    <svg width="180" height="243" viewBox="0 0 200 270" style={{ filter: 'drop-shadow(0 0 25px rgba(255, 215, 0, 0.3))' }}>
                        <defs><clipPath id="body-clip"><rect x="0" y="133" width="200" height="200" /></clipPath></defs>
                        <ellipse cx="100" cy="173" rx="57" ry="73" fill="#FFD700" stroke="#000" strokeWidth="1.5" clipPath="url(#body-clip)" />
                        <circle cx="80" cy="148" r="11" fill="white" stroke="#000" strokeWidth="1.5" style={{ transform: eyeClosed ? 'scaleY(0.1)' : 'none', transformOrigin: 'center', transition: 'transform 0.1s' }} />
                        <circle cx="120" cy="148" r="11" fill="white" stroke="#000" strokeWidth="1.5" style={{ transform: eyeClosed ? 'scaleY(0.1)' : 'none', transformOrigin: 'center', transition: 'transform 0.1s' }} />
                        {!eyeClosed && (
                            <>
                                <circle cx={80 + eyePos.px} cy={148 + eyePos.py} r="6" fill="#000" />
                                <circle cx={120 + eyePos.px} cy={148 + eyePos.py} r="6" fill="#000" />
                            </>
                        )}
                        <path d="M 93,161 L 107,161 L 100,172 Z" fill="#FFA500" stroke="#000" />
                        <ellipse cx="64" cy="160" rx="8" ry="5.5" fill="#FFC0CB" />
                        <ellipse cx="136" cy="160" rx="8" ry="5.5" fill="#FFC0CB" />
                        <path d="M 30,187 L 48,170 L 65,187 L 83,170 L 100,187 L 117,170 L 135,187 L 152,170 L 170,187 C 175,222 170,255 100,258 C 30,255 25,222 30,187 Z" fill="#FFEDDC" stroke="#000" />
                        <path d="M 30,148 L 48,131 L 65,148 L 83,131 L 100,148 L 117,131 L 135,148 L 152,131 L 170,148 C 165,102 150,72 100,68 C 50,72 35,102 30,148 Z" fill="#FFEDDC" stroke="#000" />
                    </svg>
                </div>

                {/* 텍스트 문구 */}
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: '10px 0' }}>우주 미아가 된 삐약이</h2>
                <p style={{ fontSize: '17px', color: '#ccc', maxWidth: '450px', margin: '0 auto', lineHeight: '1.6' }}>
                    이곳은 아무것도 없는 무(無)의 공간이에요.<br />삐약이와 함께 안전한 기지로 복귀할까요?
                </p>

                {/* 버튼 */}
                <button
                    onClick={() => navigate('/')}
                    style={{
                        marginTop: '45px', padding: '16px 55px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        color: '#fff', border: 'none', borderRadius: '40px', cursor: 'pointer',
                        fontWeight: 800, fontSize: '18px',
                        boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    지구로 복귀하기 🚀
                </button>
            </div>
        </div>
    );
};

export default NotFound;