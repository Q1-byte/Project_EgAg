interface ChickStampProps {
  size?: number;
  isHappy?: boolean;
  isStamping?: boolean;
  isGray?: boolean;
  withBackground?: boolean;
  bgColor?: string;
  noFloat?: boolean;
}

const ChickStamp = ({
  size = 64,
  isHappy = true,
  isStamping = false,
  isGray = false,
  withBackground = false,
  bgColor = '#FFD700',
  noFloat = false,
}: ChickStampProps) => {
  const px = 0;
  const py = 0;
  const L = { x: 83, y: 151 };
  const R = { x: 117, y: 151 };
  const eyeClosed = !isHappy;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      userSelect: 'none',
      filter: isGray ? 'grayscale(100%) opacity(0.5)' : 'none',
      transform: isStamping ? 'scale(0.8) translateY(10px)' : 'scale(1)',
      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      position: 'relative',
      width: size,
      height: size
    }}>
      <style>{`
        @keyframes chicFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-2px)} }
        .chic-stamp-svg { animation: ${isStamping || noFloat ? 'none' : 'chicFloat 3s ease-in-out infinite'}; }
      `}</style>

      {/* --- 도장 배경 원형 (withBackground일 때) --- */}
      {withBackground && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          borderRadius: '50%',
          opacity: 0.15,
          border: `2px dashed ${bgColor}`
        }} />
      )}

      <svg width={size} height={size * 1.35} viewBox="0 0 200 270" className="chic-stamp-svg"
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))', position: 'relative', zIndex: 1 }}>
        <defs>
          <clipPath id="body-clip-stamp">
            <rect x="0" y="97" width="200" height="200" />
          </clipPath>
        </defs>

        {/* --- 병아리 몸통 (조금 더 진한 노란색/골드) --- */}
        <ellipse cx="100" cy="173" rx="57" ry="73" fill="#FFD700" stroke="#E6C200" strokeWidth="2" clipPath="url(#body-clip-stamp)" />

        {/* --- 눈 흰자 --- */}
        <circle cx={L.x} cy={L.y} r="11" fill="white" stroke="#000000" strokeWidth="1.5"
          style={{ transformBox: 'fill-box', transformOrigin: 'center',
            transform: eyeClosed ? 'scaleY(0.07)' : 'scaleY(1)',
            transition: 'transform 0.09s ease' }} />
        <circle cx={R.x} cy={R.y} r="11" fill="white" stroke="#000000" strokeWidth="1.5"
          style={{ transformBox: 'fill-box', transformOrigin: 'center',
            transform: eyeClosed ? 'scaleY(0.07)' : 'scaleY(1)',
            transition: 'transform 0.09s ease' }} />

        {/* --- 동공 --- */}
        {!eyeClosed && (
          <>
            <circle cx={L.x + px} cy={L.y + py} r="6.5" fill="#0a0400" />
            <circle cx={R.x + px} cy={R.y + py} r="6.5" fill="#0a0400" />
          </>
        )}
        
        {/* --- 웃는 눈 --- */}
        {isHappy && (
            <g transform="translate(0, -2)">
                <path d="M 75,152 Q 83,145 91,152" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
                <path d="M 109,152 Q 117,145 125,152" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            </g>
        )}

        {/* --- 부리 --- */}
        <path d="M 93,161 L 107,161 L 100,172 Z" fill="#FFA500" stroke="#CC8400" strokeWidth="1.5" strokeLinejoin="round" />

        {/* --- 볼터치 --- */}
        <ellipse cx="64" cy="160" rx="8" ry="5.5" fill="#FFC0CB" opacity="0.8" />
        <ellipse cx="136" cy="160" rx="8" ry="5.5" fill="#FFC0CB" opacity="0.8" />

        {/* --- 달걀 하단 (흰색이 아닌 연한 크림색 + 명확한 테두리) --- */}
        <path d="M 30,187 L 48,170 L 65,187 L 83,170 L 100,187 L 117,170 L 135,187 L 152,170 L 170,187
                 C 175,222 170,255 100,258
                 C 30,255 25,222 30,187 Z"
          fill="#FFF9F0" stroke="#E0C9B0" strokeWidth="2.5" strokeLinejoin="miter" />
      </svg>
    </div>
  );
};

export default ChickStamp;
