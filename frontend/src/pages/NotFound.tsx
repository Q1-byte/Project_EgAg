import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ── 데이터 생성 로직 (컴포넌트 외부) ──

// 1. 배경 별 데이터 생성
const generateStars = (count: number) => {
    return [...Array(count)].map((_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${2 + Math.random() * 2}px`,
        delay: `${Math.random() * 3}s`,
        speed: 0.5 + Math.random(), // 패럴랙스 속도
    }));
};

// 2. [추가] 떠다니는 물음표 데이터 생성
const generateQuestionMarks = (count: number) => {
    return [...Array(count)].map((_, i) => ({
        id: i,
        top: `${10 + Math.random() * 80}%`, // 너무 가장자리에 안 생기도록
        left: `${10 + Math.random() * 80}%`,
        fontSize: `${20 + Math.random() * 30}px`, // 크기 다양화
        delay: `${Math.random() * 5}s`, // 애니메이션 시작 지연
        duration: `${10 + Math.random() * 10}s`, // 유영 속도 (길수록 느림)
        opacity: 0.2 + Math.random() * 0.5, // 투명도 다양화
    }));
};

const STAR_DATA = generateStars(15); // 별 개수 약간 늘림
const QUESTION_MARK_DATA = generateQuestionMarks(8); // 물음표 8개 생성

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [eyePos, setEyePos] = useState({ px: 0, py: 0 });
    const [eyeClosed, setEyeClosed] = useState(false);

    const L = { x: 80, y: 148 };
    const R = { x: 120, y: 148 };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // 배경/물음표 패럴랙스용
            setMousePos({
                x: (e.clientX / window.innerWidth - 0.5) * 20,
                y: (e.clientY / window.innerHeight - 0.5) * 20,
            });

            // 병아리 시선 추적용
            const moveX = (e.clientX / window.innerWidth - 0.5) * 5;
            const moveY = (e.clientY / window.innerHeight - 0.5) * 5;
            setEyePos({ px: moveX, py: moveY });
        };

        const blinkInterval = setInterval(() => {
            setEyeClosed(true);
            setTimeout(() => setEyeClosed(false), 150);
        }, 4000);

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(blinkInterval);
        };
    }, []);

    const spaceStyle = `
        @keyframes spaceBackground {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes twinkleGlow {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes shootingStar {
            0% { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 0; }
            10% { opacity: 1; }
            30% { transform: translateX(-400px) translateY(400px) rotate(-45deg); opacity: 0; }
            100% { opacity: 0; }
        }
        @keyframes chickSwim {
            0%, 100% { transform: translate(0, 0) rotate(-5deg); filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.3)); }
            25% { transform: translate(15vw, -10vh) rotate(10deg) scale(1.05); }
            50% { transform: translate(-5vw, 15vh) rotate(-8deg) scale(0.95); }
            75% { transform: translate(-15vw, -5vh) rotate(15deg) scale(1.1); }
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.03); opacity: 0.95; }
        }
        /* [추가] 물음표 유영 애니메이션 */
        @keyframes questionFloat {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(10px, -15px) rotate(5deg); }
            50% { transform: translate(-10px, 10px) rotate(-5deg); }
            75% { transform: translate(15px, 5px) rotate(3deg); }
        }
    `;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: 'radial-gradient(circle at center, #2d1a3e 0%, #1a1428 50%, #0a0e17 100%)',
            backgroundSize: '200% 200%', animation: 'spaceBackground 20s ease infinite',
            color: '#ffffff', textAlign: 'center', padding: '20px',
            fontFamily: "'Pretendard', sans-serif",
            position: 'relative', overflow: 'hidden',
        }}>
            <style>{spaceStyle}</style>

            {/* 배경 별들 */}
            {STAR_DATA.map((star) => (
                <div key={`star-${star.id}`} style={{
                    position: 'absolute', top: star.top, left: star.left, width: star.size, height: star.size,
                    backgroundColor: '#fff', borderRadius: '50%', animation: `twinkleGlow 3s infinite ${star.delay}`,
                    transform: `translate(${mousePos.x * star.speed}px, ${mousePos.y * star.speed}px)`,
                    transition: 'transform 0.1s ease-out', zIndex: 1,
                }} />
            ))}

            {/* [추가] 떠다니는 물음표들 */}
            {QUESTION_MARK_DATA.map((q) => (
                <div key={`q-${q.id}`} style={{
                    position: 'absolute', top: q.top, left: q.left,
                    fontSize: q.fontSize, fontWeight: 700, color: '#a855f7', // 404와 같은 보라색 계열
                    opacity: q.opacity,
                    animation: `questionFloat ${q.duration} infinite ease-in-out ${q.delay}`,
                    // 마우스 움직임에 따라 약간씩 반응 (패럴랙스)
                    transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px)`,
                    transition: 'transform 0.1s ease-out',
                    zIndex: 2, // 별보다 위, 병아리보다 아래
                    userSelect: 'none',
                }}>
                    ?
                </div>
            ))}

            <div style={{ position: 'absolute', top: '15%', left: '95%', width: '100px', height: '2px', background: 'linear-gradient(to right, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0))', animation: 'shootingStar 8s infinite 2s', opacity: 0, zIndex: 1 }} />

            {/* 병아리 본체 */}
            <div style={{
                position: 'absolute', top: '32%', left: '50%',
                transform: 'translate(-50%, -50%)',
                animation: 'chickSwim 18s infinite ease-in-out',
                zIndex: 5, willChange: 'transform'
            }}>
                <svg width="180" height="243" viewBox="0 0 200 270" style={{ userSelect: 'none' }}>
                    <defs>
                        <clipPath id="body-clip"><rect x="0" y="133" width="200" height="200" /></clipPath>
                    </defs>
                    <ellipse cx="100" cy="173" rx="57" ry="73" fill="#FFD700" stroke="#000000" strokeWidth="1.5" clipPath="url(#body-clip)" />
                    <circle cx={L.x} cy={L.y} r="11" fill="white" stroke="#000000" strokeWidth="1.5"
                            style={{ transformBox: 'fill-box', transformOrigin: 'center',
                                transform: eyeClosed ? 'scaleY(0.07)' : 'scaleY(1)', transition: 'transform 0.09s ease' }} />
                    <circle cx={R.x} cy={R.y} r="11" fill="white" stroke="#000000" strokeWidth="1.5"
                            style={{ transformBox: 'fill-box', transformOrigin: 'center',
                                transform: eyeClosed ? 'scaleY(0.07)' : 'scaleY(1)', transition: 'transform 0.09s ease' }} />

                    {!eyeClosed && (
                        <>
                            <circle cx={L.x + eyePos.px} cy={L.y + eyePos.py} r="6.5" fill="#0a0400" />
                            <circle cx={L.x + eyePos.px + 2.5} cy={L.y + eyePos.py - 2.5} r="2" fill="white" opacity="0.9" />
                            <circle cx={R.x + eyePos.px} cy={R.y + eyePos.py} r="6.5" fill="#0a0400" />
                            <circle cx={R.x + eyePos.px + 2.5} cy={R.y + eyePos.py - 2.5} r="2" fill="white" opacity="0.9" />
                        </>
                    )}
                    <path d="M 93,161 L 107,161 L 100,172 Z" fill="#FFA500" stroke="#000000" strokeWidth="1" />
                    <ellipse cx="64" cy="160" rx="8" ry="5.5" fill="#FFC0CB" />
                    <ellipse cx="136" cy="160" rx="8" ry="5.5" fill="#FFC0CB" />
                    <path d="M 30,187 L 48,170 L 65,187 L 83,170 L 100,187 L 117,170 L 135,187 L 152,170 L 170,187 C 175,222 170,255 100,258 C 30,255 25,222 30,187 Z" fill="#FFEDDC" stroke="#000000" strokeWidth="1.8" />
                    <g>
                        <path d="M 30,148 L 48,131 L 65,148 L 83,131 L 100,148 L 117,131 L 135,148 L 152,131 L 170,148 C 165,102 150,72 100,68 C 50,72 35,102 30,148 Z" fill="#FFEDDC" stroke="#000000" strokeWidth="1.8" />
                        <ellipse cx="76" cy="98" rx="9" ry="13" fill="#FFFFFF" opacity="0.4" transform="rotate(-25, 76, 98)" />
                    </g>
                </svg>
            </div>

            {/* 텍스트 및 버튼 섹션 */}
            <div style={{ zIndex: 10, animation: 'pulse 4s infinite ease-in-out' }}>
                <h1 style={{
                    fontSize: 'clamp(100px, 18vw, 150px)', fontWeight: 900, margin: 0, lineHeight: 1,
                    color: '#a855f7', letterSpacing: '-2px',
                    textShadow: '0 0 30px rgba(168, 85, 247, 0.8), 0 0 60px rgba(168, 85, 247, 0.4), 0 0 5px #fff',
                }}>404</h1>
                <h2 style={{ fontSize: '26px', fontWeight: 700, margin: '20px 0 10px', color: '#ececec' }}>블랙홀에 빠진 병아리? 🥺</h2>
                <p style={{ fontSize: '16px', color: '#b0a6c0', lineHeight: '1.7', maxWidth: '450px', margin: '0 auto' }}>삐약이가 길을 잃었어요! 안전한 기지로 복귀시켜 줄까요?</p>
                <button onClick={() => navigate('/')} style={{ marginTop: '50px', padding: '15px 40px', fontSize: '18px', fontWeight: 800, backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer' }}>지구(홈)로 돌아가기 🚀</button>
            </div>
        </div>
    );
};

export default NotFound;