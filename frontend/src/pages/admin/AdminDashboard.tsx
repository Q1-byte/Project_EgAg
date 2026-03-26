import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Users, Palette, MessageCircle, DollarSign, TrendingUp, RefreshCw, Heart } from 'lucide-react';
import { getAdminDashboardStats, getAdminUserByDate, getAdminRevenueByDate, type WeeklyStat, type ArtworkStat } from '../../api/adminApi';
import { useAuthStore } from '../../stores/useAuthStore';
import { resolveImageUrl } from '../../utils/imageUrl';

const AdminDashboard = () => {
    const { accessToken } = useAuthStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0, activeArtworks: 0, pendingInquiries: 0, todaySales: 0,
        topArtworks: [] as ArtworkStat[]
    });
    const [userGrowthData, setUserGrowthData] = useState<WeeklyStat[]>([]);
    const [revenueData, setRevenueData] = useState<WeeklyStat[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        if (!accessToken) return;
        try {
            setLoading(true);
            const [statsData, userGrowth, revenue] = await Promise.all([
                getAdminDashboardStats(), getAdminUserByDate(), getAdminRevenueByDate()
            ]);
            setStats(statsData);
            setUserGrowthData(userGrowth || []);
            setRevenueData(revenue || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => { void fetchDashboardData(); }, [fetchDashboardData]);

    const statCards = [
        { title: '총 사용자',  value: (stats.totalUsers || 0).toLocaleString(),              icon: Users,          color: '#6366f1', light: '#eef2ff', path: '/admin/users' },
        { title: '활성 작품',  value: (stats.activeArtworks || 0).toLocaleString(),           icon: Palette,        color: '#8b5cf6', light: '#f5f3ff', path: '/admin/artwork-list' },
        { title: '대기 문의',  value: (stats.pendingInquiries || 0).toLocaleString(),         icon: MessageCircle,  color: '#ec4899', light: '#fdf2f8', path: '/admin/inquiries' },
        { title: '오늘 매출',  value: `₩${(stats.todaySales || 0).toLocaleString()}`,         icon: DollarSign,     color: '#10b981', light: '#f0fdf4', path: '/admin/payments' },
    ];

    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

    return (
        <div>
            <style>{`
                .dash-card { transition: transform 0.2s, box-shadow 0.2s; }
                .dash-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.09) !important; }
                .dash-refresh:hover { background: #f1f5f9 !important; }
                .dash-art-row:hover { background: #f8fafc; }
            `}</style>

            {/* 상단 헤더 */}
            <div style={s.topRow}>
                <div>
                    <p style={s.dateStr}>{dateStr}</p>
                    <p style={s.welcome}>오늘도 좋은 하루 보내세요</p>
                </div>
                <button className="dash-refresh" onClick={() => void fetchDashboardData()} style={s.refreshBtn} disabled={loading}>
                    <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    <span>{loading ? '동기화 중' : '새로고침'}</span>
                </button>
            </div>

            {/* 스탯 카드 */}
            <div style={s.grid}>
                {statCards.map(({ title, value, icon: Icon, color, light, path }, idx) => (
                    <div key={idx} className="dash-card" style={{ ...s.card, cursor: 'pointer' }} onClick={() => navigate(path)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ ...s.iconBox, background: light }}>
                                <Icon size={18} color={color} strokeWidth={2.5} />
                            </div>
                            <TrendingUp size={13} color="#22c55e" />
                        </div>
                        <div style={{ marginTop: 20 }}>
                            <p style={s.cardLabel}>{title}</p>
                            <p style={{ ...s.cardValue, color }}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 차트 섹션 */}
            <div style={s.chartGrid}>
                <div style={s.chartCard}>
                    <div style={s.chartHead}>
                        <div>
                            <p style={s.chartTitle}>사용자 증가 추이</p>
                            <p style={s.chartSub}>주간 신규 가입자 현황</p>
                        </div>
                        <div style={{ ...s.chartBadge, color: '#6366f1', background: '#eef2ff' }}>주간</div>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={userGrowthData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={8} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 12 }} />
                            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fill="url(#areaGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div style={s.chartCard}>
                    <div style={s.chartHead}>
                        <div>
                            <p style={s.chartTitle}>수익 추이</p>
                            <p style={s.chartSub}>일별 토큰 구매 트렌드</p>
                        </div>
                        <div style={{ ...s.chartBadge, color: '#8b5cf6', background: '#f5f3ff' }}>주간</div>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={revenueData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={8} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v/1000)}k` : String(v)} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: 12 }} formatter={(v) => [`₩${Number(v ?? 0).toLocaleString()}`, '매출']} />
                            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2.5}
                                dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 5, strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 인기 작품 TOP 5 */}
            <div style={{ ...s.chartCard, marginTop: 20 }}>
                <div style={{ ...s.chartHead, marginBottom: 8 }}>
                    <div>
                        <p style={s.chartTitle}>인기 작품 TOP 5</p>
                        <p style={s.chartSub}>좋아요 기준 실시간 순위</p>
                    </div>
                    <div style={{ ...s.chartBadge, color: '#ec4899', background: '#fdf2f8' }}>실시간</div>
                </div>

                {stats.topArtworks?.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                {['순위', '작품', '작가', '좋아요'].map(h => (
                                    <th key={h} style={s.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {stats.topArtworks.map((art, i) => (
                                <tr key={art.artworkId} className="dash-art-row" style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}>
                                    <td style={s.td}>
                                        <span style={{
                                            ...s.rank,
                                            background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : '#f1f5f9',
                                            color: i < 3 ? '#fff' : '#94a3b8',
                                        }}>{i + 1}</span>
                                    </td>
                                    <td style={s.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={s.thumb}>
                                                <img src={resolveImageUrl(art.imageUrl)} alt={art.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{art.title}</span>
                                        </div>
                                    </td>
                                    <td style={{ ...s.td, color: '#64748b', fontSize: 13 }}>{art.author}</td>
                                    <td style={s.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <Heart size={13} fill="#ec4899" color="#ec4899" />
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#ec4899' }}>{art.likeCount}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#cbd5e1', fontSize: 13, fontWeight: 600 }}>
                        데이터가 없습니다
                    </div>
                )}
            </div>
        </div>
    );
};

const s: Record<string, React.CSSProperties> = {
    topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 },
    dateStr: { margin: '0 0 4px', fontSize: 12, color: '#94a3b8', fontWeight: 500 },
    welcome: { margin: 0, fontSize: 15, color: '#1e293b', fontWeight: 700 },
    refreshBtn: {
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '9px 16px', background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: 10, color: '#374151', fontWeight: 600, fontSize: 12,
        cursor: 'pointer', transition: 'background 0.15s',
    },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 },
    card: {
        background: '#fff', padding: '22px 24px', borderRadius: 18,
        border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    },
    iconBox: {
        width: 42, height: 42, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    cardLabel: { margin: '0 0 4px', fontSize: 12, color: '#94a3b8', fontWeight: 600 },
    cardValue: { margin: 0, fontSize: 30, fontWeight: 900, letterSpacing: '-1px' },

    chartGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    chartCard: {
        background: '#fff', padding: '24px 24px 20px', borderRadius: 18,
        border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    },
    chartHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    chartTitle: { margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b' },
    chartSub: { margin: '3px 0 0', fontSize: 11, color: '#94a3b8' },
    chartBadge: {
        fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
        padding: '3px 10px', borderRadius: 20,
    },

    th: { padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'left' as const, letterSpacing: 0.3 },
    td: { padding: '14px 16px' },
    rank: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 24, height: 24, borderRadius: 8, fontSize: 11, fontWeight: 900,
    },
    thumb: { width: 40, height: 40, borderRadius: 10, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 },
};

export default AdminDashboard;
