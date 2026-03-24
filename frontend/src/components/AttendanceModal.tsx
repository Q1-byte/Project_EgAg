import { useState, useEffect } from 'react';
import { getTodayAttendance, checkInAttendance, getAttendanceHistory } from '../api/user';
import ChickStamp from './ChickStamp';
import { useAuthStore } from '../stores/useAuthStore';

interface AttendanceModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AttendanceModal({ onClose, onSuccess }: AttendanceModalProps) {
  const [attendedToday, setAttendedToday] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isStamping, setIsStamping] = useState(false);
  const { tokenBalance, setTokenBalance } = useAuthStore();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const [{ attended }, historyData] = await Promise.all([
        getTodayAttendance(),
        getAttendanceHistory()
      ]);
      setAttendedToday(attended);
      setHistory(historyData);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    }
  };

  const handleCheckIn = async () => {
    if (attendedToday || isStamping) return;
    
    setIsStamping(true);
    try {
      await checkInAttendance();
      setTimeout(() => {
        setAttendedToday(true);
        setIsStamping(false);
        setTokenBalance(tokenBalance + 1);
        if (onSuccess) onSuccess();
        fetchStatus();
      }, 1000);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || '출석 체크에 실패했어요.';
      alert(msg);
      setIsStamping(false);
    }
  };

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // 달력 날짜 생성
  const getCalendarDays = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    
    const days = [];
    // 이전 달 빈 칸
    for (let i = 0; i < startingDay; i++) {
        days.push(null);
    }
    // 이번 달 날짜
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }
    return days;
  };

  const calendarDays = getCalendarDays();
  const todayStr = formatDate(new Date());

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(20px)',
      zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, animation: 'fadeIn 0.3s ease-out'
    }}>
      <div className="attendance-modal" onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 500, background: '#fff', borderRadius: 48,
        padding: '40px 30px', position: 'relative', textAlign: 'center',
        boxShadow: '0 40px 100px rgba(107, 130, 160, 0.2)',
        border: '2px solid rgba(255, 255, 255, 0.8)',
        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.25)'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 24, right: 24, background: '#F5F7FA',
          border: 'none', width: 40, height: 40, borderRadius: 20,
          fontSize: 20, cursor: 'pointer', color: '#8a8aaa', transition: 'all 0.2s'
        }} className="hover:rotate-90">✕</button>

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 28, fontWeight: 950, color: '#1a1a2e', marginBottom: 8, letterSpacing: '-0.03em' }}>
            {month + 1}월의 대모험 도장! 🐥
          </h2>
          <p style={{ fontSize: 16, color: '#6B82A0', fontWeight: 600 }}>
            매일 도장을 찍어 달력을 병아리로 채워봐요! 🍭
          </p>
        </div>

        {/* 달력 판 */}
        <div style={{ 
          background: '#F8FAFC', padding: '24px 20px', borderRadius: 40, marginBottom: 32,
          border: '1px solid #EEF2F6'
        }}>
          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 16 }}>
            {['일','월','화','수','목','금','토'].map((d, i) => (
                <span key={d} style={{ fontSize: 13, fontWeight: 800, color: i === 0 ? '#FF85B3' : i === 6 ? '#6B82A0' : '#94A3B8' }}>{d}</span>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {calendarDays.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;
              
              const dStr = formatDate(date);
              const isChecked = history.includes(dStr);
              const isToday = dStr === todayStr;
              const isFuture = date > now && dStr !== todayStr;

              return (
                <div key={dStr} style={{ 
                  aspectRatio: '1/1', display: 'flex', flexDirection: 'column', 
                  alignItems: 'center', justifyContent: 'center', position: 'relative',
                  background: isToday ? 'rgba(255, 215, 0, 0.1)' : '#fff',
                  borderRadius: 18, border: isToday ? '2px solid #FFD700' : '1px solid #E2E8F0',
                  opacity: isFuture ? 0.3 : 1, transition: 'all 0.2s',
                  boxShadow: isChecked ? 'inset 0 0 10px rgba(0,0,0,0.02)' : 'none'
                }}>
                  <span style={{ 
                    position: 'absolute', top: 6, left: 8, fontSize: 10, fontWeight: 900,
                    color: isToday ? '#FF85B3' : '#94A3B8'
                  }}>
                    {date.getDate()}
                  </span>
                  
                  {isChecked || (isToday && attendedToday) ? (
                    <ChickStamp size={32} isHappy={true} withBackground={false} />
                  ) : isToday && !attendedToday ? (
                    <div style={{ transform: isStamping ? 'scale(1.2)' : 'none', transition: 'transform 0.3s' }}>
                       <ChickStamp size={28} isHappy={false} isGray={true} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* 하단 보상 안내 & 버튼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ 
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
                background: 'rgba(255, 133, 179, 0.05)', padding: '12px 20px', borderRadius: 20
            }}>
                <span style={{ fontSize: 20 }}>🍬</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#FF85B3' }}>
                    지금까지 <b>{history.length}개</b>의 도장을 모았어요!
                </span>
            </div>

            <button 
                onClick={handleCheckIn}
                disabled={attendedToday || isStamping}
                style={{
                    width: '100%', padding: '22px', borderRadius: 28, border: 'none',
                    background: attendedToday ? '#F1F5F9' : 'linear-gradient(135deg, #FFD6E8, #FF85B3)',
                    color: attendedToday ? '#94A3B8' : '#fff',
                    fontSize: 20, fontWeight: 950, cursor: attendedToday ? 'default' : 'pointer',
                    boxShadow: attendedToday ? 'none' : '0 15px 35px rgba(255, 133, 179, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
                }}
            >
                {isStamping ? (
                    <> <div className="stamp-anim"><ChickStamp size={30} isStamping={true} /></div> 도장 꾹!</>
                ) : attendedToday ? (
                    '오늘의 출석 완료! ✅'
                ) : (
                    <>오늘의 병아리 도장 찍기 🐥</>
                )}
            </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { 
          from { opacity: 0; transform: scale(0.9) translateY(40px); } 
          to { opacity: 1; transform: scale(1) translateY(0); } 
        }
        @keyframes stampPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.4); }
            100% { transform: scale(1); }
        }
        .stamp-anim { animation: stampPulse 0.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
