import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    LineChart, Line
} from 'recharts';

interface PendingInquiry {
    id: string;
    email: string;
    category: string;
    title: string;
    content: string;
    createdAt: string;
}

// 📈 대시보드 데이터 타입
interface DashboardStats {
    totalUsers: number;
    todayNewUsers: number;
    totalSales: number;
    todaySales: number;
    suspendedUsers: number;
    activeUsers: number;
}

const CATEGORY_LABELS: Record<string, string> = {
    payment: '결제', account: '계정', bug: '버그', etc: '기타',
};

interface CategoryStat { name: string; count: number; }
interface DateStat { date: string; count: number; }

const AdminDashboard = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const role = useAuthStore((state) => state.role);
    const nickname = useAuthStore((state) => state.nickname);
    const accessToken = useAuthStore((state) => state.accessToken);
    const navigate = useNavigate();

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [pendingInquiries, setPendingInquiries] = useState<PendingInquiry[]>([]);
    const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
    const [artworkByDate, setArtworkByDate] = useState<DateStat[]>([]);
    const [replyMap, setReplyMap] = useState<Record<string, string>>({});
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<string | null>(null);

    // 🔄 통계 데이터 가져오기
    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const token = useAuthStore.getState().accessToken;

            const res = await axios.get('/api/admin/dashboard/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (err) {
            console.error("통계 데이터 로딩 실패:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPendingInquiries = useCallback(async () => {
        try {
            const res = await axios.get('/api/admin/inquiries/pending?limit=3', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setPendingInquiries(res.data);
        } catch (e) {
            console.error('문의 로딩 실패', e);
        }
    }, [accessToken]);

    const handleReply = async (id: string) => {
        const reply = replyMap[id]?.trim();
        if (!reply) return;
        setSubmitting(id);
        try {
            await axios.post(`/api/admin/inquiries/${id}/reply`, { reply }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setPendingInquiries(prev => prev.filter(i => i.id !== id));
            setReplyMap(prev => { const n = { ...prev }; delete n[id]; return n; });
            setExpandedId(null);
        } catch {
            alert('답변 등록에 실패했습니다.');
        } finally {
            setSubmitting(null);
        }
    };

    const fetchChartData = useCallback(async () => {
        const headers = { Authorization: `Bearer ${accessToken}` };
        try {
            const [catRes, dateRes] = await Promise.all([
                axios.get('/api/admin/stats/inquiry-categories', { headers }),
                axios.get('/api/admin/stats/artwork-by-date', { headers }),
            ]);
            const catData: CategoryStat[] = Object.entries(catRes.data as Record<string, number>).map(
                ([key, count]) => ({ name: CATEGORY_LABELS[key] ?? key, count })
            );
            setCategoryStats(catData);
            setArtworkByDate(dateRes.data);
        } catch (e) {
            console.error('차트 데이터 로딩 실패', e);
        }
    }, [accessToken]);

    useEffect(() => {
        if (isAuthenticated && (role === 'ADMIN' || String(role) === '100')) {
            void fetchStats();
            void fetchPendingInquiries();
            void fetchChartData();
        }
    }, [isAuthenticated, role, fetchStats, fetchPendingInquiries, fetchChartData]);

    if (!isAuthenticated || (role !== 'ADMIN' && String(role) !== '100')) {
        return <Navigate to="/" replace />;
    }

    return (
        <div style={s.container}>
            <header style={s.header}>
                <h1 style={s.title}>📊 서비스 대시보드</h1>
                <p style={s.meta}>환영합니다, <strong>{nickname}</strong> 관리자님! 오늘의 현황입니다. 🐣</p>
            </header>

            {loading ? (
                <div style={s.emptyState}>데이터를 불러오는 중입니다... 🔄</div>
            ) : stats ? (
                <div style={s.grid}>
                    {/* 카드 1: 유저 현황 */}
                    <div style={s.statCard}>
                        <div style={s.iconBg}>👥</div>
                        <div style={s.statInfo}>
                            <h3 style={s.cardLabel}>전체 유저</h3>
                            <div style={s.cardValue}>{stats.totalUsers.toLocaleString()} 명</div>
                            <p style={s.cardSub}>오늘 신규: <span style={{color: '#10B981', fontWeight: 800}}>+{stats.todayNewUsers}</span></p>
                        </div>
                    </div>

                    {/* 카드 2: 매출 현황 */}
                    <div style={{...s.statCard, borderBottom: '4px solid #7C3AED'}}>
                        <div style={{...s.iconBg, backgroundColor: 'rgba(124, 58, 237, 0.1)'}}>💰</div>
                        <div style={s.statInfo}>
                            <h3 style={s.cardLabel}>누적 매출</h3>
                            <div style={{...s.cardValue, color: '#7C3AED'}}>₩ {stats.totalSales.toLocaleString()}</div>
                            <p style={s.cardSub}>오늘 매출: <span style={{fontWeight: 800}}>₩ {stats.todaySales.toLocaleString()}</span></p>
                        </div>
                    </div>

                    {/* 카드 3: 활성 상태 */}
                    <div style={{...s.statCard, borderBottom: '4px solid #10B981'}}>
                        <div style={{...s.iconBg, backgroundColor: 'rgba(16, 185, 129, 0.1)'}}>✅</div>
                        <div style={s.statInfo}>
                            <h3 style={s.cardLabel}>활성 유저</h3>
                            <div style={{...s.cardValue, color: '#10B981'}}>{stats.activeUsers.toLocaleString()} 명</div>
                            <p style={s.cardSub}>서비스 정상 이용 중</p>
                        </div>
                    </div>

                    {/* 카드 4: 정지 상태 */}
                    <div style={{...s.statCard, borderBottom: '4px solid #EF4444'}}>
                        <div style={{...s.iconBg, backgroundColor: 'rgba(239, 68, 68, 0.1)'}}>🚫</div>
                        <div style={s.statInfo}>
                            <h3 style={s.cardLabel}>정지 유저</h3>
                            <div style={{...s.cardValue, color: '#EF4444'}}>{stats.suspendedUsers.toLocaleString()} 명</div>
                            <p style={s.cardSub}>운영 정책 위반</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={s.emptyState}>통계 데이터를 표시할 수 없습니다. 😥</div>
            )}

            {/* 📊 차트 섹션 */}
            <div style={s.chartGrid}>
                <div style={s.chartCard}>
                    <h3 style={s.chartTitle}>📂 문의 카테고리별 접수 현황</h3>
                    <div style={s.divider} />
                    {categoryStats.length === 0 ? (
                        <div style={s.chartEmpty}>데이터 없음</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={categoryStats} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229, 231, 235, 0.5)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#6B7280', fontWeight: 600 }} />
                                <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                                <Tooltip cursor={{fill: 'rgba(124, 58, 237, 0.05)'}} contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} />
                                <Bar dataKey="count" fill="#7C3AED" radius={[8, 8, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div style={s.chartCard}>
                    <h3 style={s.chartTitle}>🎨 날짜별 이미지 생성 추이 (최근 14일)</h3>
                    <div style={s.divider} />
                    {artworkByDate.length === 0 ? (
                        <div style={s.chartEmpty}>데이터 없음</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={artworkByDate} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229, 231, 235, 0.5)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(d) => d.slice(5)} />
                                <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                                <Tooltip contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} />
                                <Line type="monotone" dataKey="count" stroke="#7C3AED" strokeWidth={4} dot={{ r: 4, fill: '#fff', stroke: '#7C3AED', strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div style={s.bottomContent}>
                {/* 📬 응답 대기 문의 */}
                <div style={s.inquirySection}>
                    <div style={s.sectionHeader}>
                        <h3 style={s.sectionSubTitle}>📬 미처리 문의 (최근 3건)</h3>
                        <button style={s.textBtn} onClick={() => navigate('/admin/inquiries')}>전체보기 →</button>
                    </div>

                    {pendingInquiries.length === 0 ? (
                        <div style={s.inquiryEmpty}>모든 문의가 처리되었습니다. ✨</div>
                    ) : (
                        <div style={s.inquiryList}>
                            {pendingInquiries.map(item => (
                                <div key={item.id} style={s.inquiryItem}>
                                    <div style={s.inquiryMain} onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                                        <div style={s.inquiryInfo}>
                                            <span style={s.categoryTag}>{CATEGORY_LABELS[item.category] || item.category}</span>
                                            <span style={s.inquiryTitle}>{item.title}</span>
                                        </div>
                                        <div style={s.inquiryMetaInfo}>
                                            <span style={s.inquiryDate}>{new Date(item.createdAt).toLocaleDateString()}</span>
                                            <span style={s.arrow}>{expandedId === item.id ? '▴' : '▾'}</span>
                                        </div>
                                    </div>
                                    {expandedId === item.id && (
                                        <div style={s.inquiryExpand}>
                                            <p style={s.inquiryText}>{item.content}</p>
                                            <div style={s.replyBox}>
                                                <textarea
                                                    style={s.textarea}
                                                    placeholder="답변을 입력해 주세요..."
                                                    value={replyMap[item.id] ?? ''}
                                                    onChange={e => setReplyMap(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                />
                                                <button 
                                                    style={{...s.replyBtn, opacity: submitting === item.id ? 0.6 : 1}} 
                                                    onClick={() => handleReply(item.id)}
                                                    disabled={submitting === item.id}
                                                >
                                                    {submitting === item.id ? '전송 중' : '답변 전송'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 🚀 빠른 관리 */}
                <div style={s.quickSection}>
                    <h3 style={s.sectionSubTitle}>🚀 빠른 관리</h3>
                    <div style={s.quickGrid}>
                        <button style={s.quickBtn} onClick={() => navigate('/admin/users')}>
                            <span>👥</span> 유저 관리
                        </button>
                        <button style={s.quickBtn} onClick={() => navigate('/admin/artworks')}>
                            <span>🚫</span> 신고 관리
                        </button>
                        <button style={s.quickBtn} onClick={() => navigate('/admin/payments')}>
                            <span>💳</span> 결제 확인
                        </button>
                        <button style={s.quickBtn} onClick={() => navigate('/admin/images')}>
                            <span>🖼️</span> 메인 관리
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 🌌 스타일 시스템 (Glassmorphism & Standardized Admin Design)
const s: Record<string, React.CSSProperties> = {
    container: { padding: '40px 10px', maxWidth: '1200px', margin: '0 auto' },
    header: { marginBottom: '40px' },
    title: { fontSize: '32px', fontWeight: 900, color: '#4C1D95' },
    meta: { color: '#7C3AED', fontSize: '16px', fontWeight: 600, opacity: 0.8 },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '25px', marginBottom: '40px' },
    
    statCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: '30px',
        padding: '25px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.05)',
        transition: 'transform 0.2s'
    },
    iconBg: {
        width: '60px', height: '60px', borderRadius: '18px', backgroundColor: 'rgba(124, 58, 237, 0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
    },
    statInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
    cardLabel: { fontSize: '14px', fontWeight: 700, color: '#6B7280' },
    cardValue: { fontSize: '24px', fontWeight: 900, color: '#1F2937' },
    cardSub: { fontSize: '13px', color: '#9CA3AF' },

    chartGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '40px' },
    chartCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: '30px',
        padding: '30px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.05)'
    },
    chartTitle: { fontSize: '18px', fontWeight: 800, color: '#4C1D95', marginBottom: '15px' },
    divider: { height: '1px', backgroundColor: 'rgba(229, 231, 235, 0.5)', marginBottom: '20px' },
    chartEmpty: { textAlign: 'center', padding: '100px 0', color: '#9CA3AF', fontWeight: 600 },

    bottomContent: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' },
    inquirySection: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: '30px',
        padding: '30px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.05)'
    },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    sectionSubTitle: { fontSize: '20px', fontWeight: 800, color: '#4C1D95', margin: 0 },
    textBtn: { border: 'none', background: 'none', color: '#7C3AED', fontWeight: 700, cursor: 'pointer', fontSize: '14px' },
    
    inquiryEmpty: { textAlign: 'center', padding: '60px 0', color: '#9CA3AF', fontWeight: 600 },
    inquiryList: { display: 'flex', flexDirection: 'column', gap: '15px' },
    inquiryItem: { borderRadius: '20px', border: '1px solid rgba(229, 231, 235, 0.5)', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.4)' },
    inquiryMain: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' },
    inquiryInfo: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 },
    categoryTag: { background: '#EDE9FE', color: '#7C3AED', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px' },
    inquiryTitle: { fontSize: '14px', fontWeight: 700, color: '#1F2937', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
    inquiryMetaInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
    inquiryDate: { fontSize: '12px', color: '#9CA3AF' },
    arrow: { color: '#9CA3AF', fontSize: '12px' },
    
    inquiryExpand: { padding: '20px', borderTop: '1px solid rgba(229, 231, 235, 0.3)', backgroundColor: 'rgba(255,255,255,0.2)' },
    inquiryText: { fontSize: '14px', color: '#4B5563', lineHeight: 1.6, margin: '0 0 20px', whiteSpace: 'pre-wrap' as const },
    replyBox: { display: 'flex', flexDirection: 'column', gap: '10px' },
    textarea: { 
        width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid rgba(209, 213, 219, 0.5)', 
        fontSize: '14px', outline: 'none', resize: 'vertical' as const, minHeight: '80px', fontFamily: 'inherit'
    },
    replyBtn: { alignSelf: 'flex-end', padding: '10px 25px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' },

    quickSection: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: '30px',
        padding: '30px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.05)'
    },
    quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' },
    quickBtn: { 
        padding: '20px', borderRadius: '20px', border: 'none', backgroundColor: 'rgba(124, 58, 237, 0.05)', 
        color: '#4C1D95', fontWeight: 800, cursor: 'pointer', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', gap: '10px', transition: 'all 0.2s', fontSize: '14px'
    },

    emptyState: { textAlign: 'center', padding: '100px 0', color: '#9CA3AF', fontSize: '18px', fontWeight: 600 }
};

export default AdminDashboard;