import { useState, useEffect } from 'react';
import { getTodayAttendance, checkInAttendance, getAttendanceHistory, getClaimedBonuses, claimStreakBonus } from '../api/user';
import ChickStamp from './ChickStamp';
import { useAuthStore } from '../stores/useAuthStore';
import { X, Zap, Ticket, CheckCircle, Star, Sparkles } from 'lucide-react';

export const getAttendDismissKey = (userId: string) => `attendance_modal_no_show_until_${userId}`;

interface AttendanceModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const MISSIONS = [
  { days: 3,  bonus: 1,  label: '3일 연속',  color: '#FFE566', tier: 1 },
  { days: 7,  bonus: 3,  label: '7일 연속',  color: '#FFD700', tier: 2 },
  { days: 15, bonus: 7,  label: '15일 연속', color: '#E6A800', tier: 3 },
];

export default function AttendanceModal({ onClose, onSuccess }: AttendanceModalProps) {
  const [attendedToday, setAttendedToday] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isStamping, setIsStamping] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const [claimedDays, setClaimedDays] = useState<number[]>([]);
  const [claimingDays, setClaimingDays] = useState<number | null>(null);
  const { tokenBalance, setTokenBalance, userId } = useAuthStore();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    try {
      const [{ attended }, historyData, claimed] = await Promise.all([
        getTodayAttendance(),
        getAttendanceHistory(),
        getClaimedBonuses(),
      ]);
      setAttendedToday(attended);
      setHistory(historyData);
      setClaimedDays(claimed);
    } catch (err) {
      console.error(err);
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
        setJustChecked(true);
        setTokenBalance(tokenBalance + 1);
        if (onSuccess) onSuccess();
        fetchStatus();
      }, 900);
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

  const getStreak = () => {
    let streak = 0;
    const today = new Date();
    const todayStr = formatDate(today);
    // 오늘 출석 안 했으면 어제부터 계산
    const startOffset = history.includes(todayStr) ? 0 : 1;
    for (let i = startOffset; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (history.includes(formatDate(d))) streak++;
      else break;
    }
    return streak;
  };

  const streak = getStreak();

  const getCalendarDays = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const calendarDays = getCalendarDays();
  const todayStr = formatDate(new Date());
  const thisMonthCount = history.filter(d => d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10, 8, 20, 0.55)',
      zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'fadeIn 0.2s ease-out',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 900,
        borderRadius: 36,
        display: 'flex', overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
        animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2)',
        position: 'relative',
      }}>

        {/* 닫기 */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 18, right: 18, zIndex: 10,
          background: 'rgba(255,255,255,0.15)', border: 'none',
          width: 34, height: 34, borderRadius: '50%',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
        >
          <X size={15} color="#fff" strokeWidth={2.5} />
        </button>

        {/* 왼쪽: 달력 패널 */}
        <div style={{
          flex: '0 0 auto', width: 420,
          background: 'linear-gradient(160deg, #0d0820 0%, #1a1040 40%, #0a0518 100%)',
          padding: '36px 28px 32px',
          display: 'flex', flexDirection: 'column', gap: 16,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* 우주 별빛 배경 */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
            {[
              { top: '8%',  left: '15%', size: 2,   opacity: 0.9, dur: 2.1 },
              { top: '14%', left: '72%', size: 1.5, opacity: 0.7, dur: 3.2 },
              { top: '22%', left: '40%', size: 1,   opacity: 0.5, dur: 2.8 },
              { top: '30%', left: '85%', size: 2.5, opacity: 0.8, dur: 1.9 },
              { top: '38%', left: '8%',  size: 1.5, opacity: 0.6, dur: 3.5 },
              { top: '50%', left: '60%', size: 1,   opacity: 0.5, dur: 2.4 },
              { top: '60%', left: '25%', size: 2,   opacity: 0.7, dur: 3.0 },
              { top: '70%', left: '90%', size: 1.5, opacity: 0.6, dur: 2.6 },
              { top: '78%', left: '50%', size: 1,   opacity: 0.4, dur: 3.8 },
              { top: '88%', left: '18%', size: 2,   opacity: 0.8, dur: 2.2 },
              { top: '92%', left: '78%', size: 1.5, opacity: 0.6, dur: 3.1 },
              { top: '5%',  left: '55%', size: 3,   opacity: 0.9, dur: 2.5 },
              { top: '45%', left: '35%', size: 2,   opacity: 0.5, dur: 4.0 },
              { top: '65%', left: '68%', size: 1.5, opacity: 0.7, dur: 2.9 },
            ].map((s, i) => (
              <div key={i} style={{
                position: 'absolute', top: s.top, left: s.left,
                width: s.size, height: s.size, borderRadius: '50%',
                background: '#fff', opacity: s.opacity,
                animation: `starTwinkle ${s.dur}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }} />
            ))}
            {/* 성운 글로우 */}
            <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,122,138,0.15) 0%, transparent 70%)' }} />
            <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,130,160,0.18) 0%, transparent 70%)' }} />
          </div>
          {/* 콘텐츠 (별빛 위) */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          {/* 헤더 */}
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.8)', letterSpacing: 3, textTransform: 'uppercase' }}>
              {year}
            </p>
            <h2 style={{ margin: '2px 0 0', fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: -0.5, display: 'flex', alignItems: 'center', gap: 8 }}>
              {month + 1}월 출석체크 <CheckCircle size={24} color="#FFD700" strokeWidth={2.8} />
            </h2>
          </div>

          {/* 이번달 카운터 */}
          <div style={{
            display: 'flex', gap: 10,
          }}>
            <div style={{
              flex: 1, padding: '10px 14px', borderRadius: 14,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 }}>이번달</p>
              <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 900, color: '#FFD700' }}>{thisMonthCount}<span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginLeft: 3 }}>일</span></p>
            </div>
            <div style={{
              flex: 1, padding: '10px 14px', borderRadius: 14,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 }}>연속</p>
              <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 900, color: '#ff6b9d' }}>{streak}<span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginLeft: 3 }}>일</span></p>
            </div>
          </div>

          {/* 달력 */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
              {['일','월','화','수','목','금','토'].map((d, i) => (
                <span key={d} style={{
                  fontSize: 12, fontWeight: 800, textAlign: 'center',
                  color: i === 0 ? '#ff8f8f' : i === 6 ? '#8faaff' : 'rgba(255,255,255,0.8)',
                }}>{d}</span>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
              {calendarDays.map((date, idx) => {
                if (!date) return <div key={`e-${idx}`} />;
                const dStr = formatDate(date);
                const isChecked = history.includes(dStr);
                const isToday = dStr === todayStr;
                const isFuture = date > now && !isToday;
                return (
                  <div key={dStr} style={{
                    aspectRatio: '1/1', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    borderRadius: 10,
                    background: isToday ? 'rgba(255,215,0,0.18)' : isChecked ? 'rgba(255,255,255,0.07)' : 'transparent',
                    border: isToday ? '1.5px solid rgba(255,215,0,0.6)' : '1px solid transparent',
                    opacity: isFuture ? 0.2 : 1,
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, lineHeight: 1,
                      color: isToday ? '#FFD700' : 'rgba(255,255,255,0.85)',
                    }}>{date.getDate()}</span>
                    {(isChecked || (isToday && attendedToday)) ? (
                      <ChickStamp size={26} isHappy={true} noFloat />
                    ) : isToday && !attendedToday ? (
                      <ChickStamp size={24} isHappy={false} isGray={true} noFloat />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 이번달 게이지 */}
          <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>이번달 출석</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#FFD700' }}>{thisMonthCount} / {new Date(year, month + 1, 0).getDate()}일</span>
            </div>
            {/* 게이지 트랙 */}
            <div style={{ position: 'relative', height: 60, display: 'flex', alignItems: 'center' }}>
              {/* 트랙 배경 — 점선 느낌 */}
              <div style={{
                position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)',
                height: 8, borderRadius: 99,
                background: 'rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
              }} />
              {/* 채워진 트랙 */}
              <div style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                height: 8, borderRadius: 99,
                width: `${(thisMonthCount / new Date(year, month + 1, 0).getDate()) * 100}%`,
                background: 'linear-gradient(90deg, #a78bfa, #60a5fa, #34d399, #fbbf24, #f97316, #ec4899)',
                boxShadow: '0 0 10px rgba(167,139,250,0.5)',
                transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                minWidth: thisMonthCount > 0 ? 16 : 0,
              }} />
              {/* 끝 깃발 */}
              <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-80%)', fontSize: 12 }}>🏁</div>
              {/* 병아리 */}
              <div style={{
                position: 'absolute',
                left: `${Math.min(Math.max((thisMonthCount / new Date(year, month + 1, 0).getDate()) * 100, 2), 94)}%`,
                top: '50%',
                transform: 'translate(-50%, -70%)',
                transition: 'left 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                animation: 'chickHop 0.6s ease-in-out infinite',
                pointerEvents: 'none',
              }}>
                <ChickStamp size={32} isHappy={attendedToday} />
              </div>
            </div>
          </div>
          </div>{/* 콘텐츠 끝 */}
        </div>

        {/* 오른쪽: 미션 + 버튼 */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(160deg, #130a2e 0%, #1e1245 50%, #0f0820 100%)',
          padding: '36px 32px 32px',
          display: 'flex', flexDirection: 'column', gap: 20,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* 별빛 배경 (오른쪽) */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
            {[
              { top: '10%', left: '20%', size: 1.5, opacity: 0.6, dur: 2.7 },
              { top: '25%', left: '75%', size: 2,   opacity: 0.8, dur: 3.3 },
              { top: '40%', left: '45%', size: 1,   opacity: 0.4, dur: 2.5 },
              { top: '55%', left: '10%', size: 2,   opacity: 0.7, dur: 3.8 },
              { top: '70%', left: '85%', size: 1.5, opacity: 0.5, dur: 2.1 },
              { top: '80%', left: '55%', size: 1,   opacity: 0.6, dur: 3.0 },
              { top: '90%', left: '30%', size: 2,   opacity: 0.7, dur: 2.4 },
            ].map((s, i) => (
              <div key={i} style={{
                position: 'absolute', top: s.top, left: s.left,
                width: s.size, height: s.size, borderRadius: '50%',
                background: '#fff', opacity: s.opacity,
                animation: `starTwinkle ${s.dur}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }} />
            ))}
            {/* 성운 글로우 */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,130,160,0.12) 0%, transparent 70%)' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,122,138,0.12) 0%, transparent 70%)' }} />
          </div>

          {/* 콘텐츠 */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20, flex: 1, paddingTop: 72 }}>

          {/* 미션 카드 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26, flex: 1 }}>
            {MISSIONS.map(m => {
              const done = streak >= m.days;
              const claimed = claimedDays.includes(m.days);
              const pct = Math.min(streak / m.days, 1) * 100;
              const isClaiming = claimingDays === m.days;

              const handleClaim = async () => {
                if (isClaiming || claimed) return;
                setClaimingDays(m.days);
                try {
                  const { bonus } = await claimStreakBonus(m.days);
                  setClaimedDays(prev => [...prev, m.days]);
                  setTokenBalance(tokenBalance + bonus);
                } catch (err: any) {
                  alert(err.response?.data?.error?.message || '수령에 실패했어요.');
                } finally {
                  setClaimingDays(null);
                }
              };

              return (
                <div key={m.days} style={{
                  padding: '14px 16px', borderRadius: 16,
                  background: done ? `${m.color}30` : `${m.color}10`,
                  border: `1.5px solid ${done ? m.color + '99' : m.color + '33'}`,
                  display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: m.color + '55',
                    border: `1px solid ${m.color}99`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {m.tier === 1 && <Star size={18} color={m.color} strokeWidth={2} />}
                    {m.tier === 2 && <Star size={18} color={m.color} fill={m.color} strokeWidth={0} />}
                    {m.tier === 3 && <Sparkles size={18} color={m.color} fill={m.color} strokeWidth={0} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{m.label}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 800, color: m.color,
                        background: m.color + '44', padding: '2px 10px', borderRadius: 20,
                        display: 'flex', alignItems: 'center', gap: 3,
                        border: `1px solid ${m.color}88`,
                      }}>
                        <Ticket size={10} /> +{m.bonus} 토큰
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99, width: `${pct}%`,
                        background: done ? m.color : `linear-gradient(90deg, ${m.color}88, ${m.color})`,
                        transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: done ? m.color : 'rgba(255,255,255,0.35)' }}>
                        {done ? (claimed ? '✅ 수령 완료' : '🎉 달성!') : `${streak} / ${m.days}일`}
                      </p>
                      {done && !claimed && (
                        <button onClick={handleClaim} disabled={isClaiming} style={{
                          padding: '4px 12px', borderRadius: 20, border: 'none',
                          background: m.color, color: '#1a1040',
                          fontSize: 11, fontWeight: 800, cursor: 'pointer',
                          opacity: isClaiming ? 0.6 : 1, transition: 'all 0.15s',
                        }}>
                          {isClaiming ? '...' : '받기'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 출석 버튼 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {justChecked && (
              <div style={{
                marginBottom: 12, padding: '10px 16px', borderRadius: 12,
                background: 'rgba(255,215,0,0.12)',
                border: '1.5px solid rgba(255,215,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
                animation: 'popIn 0.4s ease',
              }}>
                <span style={{ position: 'absolute', fontSize: 28, opacity: 0.25, left: 10, zIndex: 0 }}>🎉</span>
                <span style={{ position: 'absolute', fontSize: 28, opacity: 0.25, right: 10, zIndex: 0 }}>🎉</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#FFD700', position: 'relative', zIndex: 1 }}>
                  토큰 1개가 지급됐어요!
                </span>
              </div>
            )}
            <button
              onClick={handleCheckIn}
              disabled={attendedToday || isStamping}
              style={{
                width: '100%', padding: '18px',
                borderRadius: 18, border: 'none',
                background: attendedToday
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(255,215,0,0.12)',
                border: attendedToday ? 'none' : '1.5px solid rgba(255,215,0,0.4)',
                color: attendedToday ? 'rgba(255,255,255,0.3)' : '#FFD700',
                fontSize: 16, fontWeight: 800,
                cursor: attendedToday ? 'default' : 'pointer',
                boxShadow: attendedToday ? 'none' : '0 8px 28px rgba(255,215,0,0.15)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                letterSpacing: -0.3,
              }}
              onMouseEnter={e => { if (!attendedToday) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = '' }}
            >
              {isStamping ? (
                <><ChickStamp size={24} isStamping={true} /> 도장 꾹!</>
              ) : attendedToday ? (
                <><CheckCircle size={18} color="rgba(255,255,255,0.3)" strokeWidth={2.8} /> 오늘 출석 완료</>
              ) : (
                <><Zap size={18} fill="#FFD700" strokeWidth={0} /> 출석하고 토큰 받기</>
              )}
            </button>

            {/* 3일간 보지 않기 */}
            <button
              onClick={() => {
                localStorage.setItem(getAttendDismissKey(userId ?? 'guest'), String(Date.now() + 3 * 24 * 60 * 60 * 1000));
                onClose();
              }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 600,
                textDecoration: 'underline', textUnderlineOffset: 3,
                padding: '4px 0', transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,215,0,0.7)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
            >
              3일간 보지 않기
            </button>
          </div>
          </div>{/* 콘텐츠 끝 */}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.93) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes chickHop {
          0%, 100% { transform: translate(-50%, -70%); }
          40% { transform: translate(-50%, -90%); }
          60% { transform: translate(-50%, -68%); }
        }
      `}</style>
    </div>
  );
}
