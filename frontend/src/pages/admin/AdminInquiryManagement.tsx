import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../stores/useAuthStore';

interface InquiryItem {
    id: string;
    email: string;
    category: string;
    title: string;
    content: string;
    status: string;
    reply: string | null;
    createdAt: string;
    repliedAt: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
    payment: '결제', account: '계정', bug: '버그', etc: '기타',
};

const AdminInquiryManagement = () => {
    const { accessToken } = useAuthStore();
    const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all');
    const [loading, setLoading] = useState(true);
    const [replyMap, setReplyMap] = useState<Record<string, string>>({});
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<string | null>(null);

    const headers = { Authorization: `Bearer ${accessToken}` };

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/admin/inquiries?status=${filter === 'all' ? 'all' : filter}`, { headers });
            setInquiries(res.data);
        } catch (e) {
            console.error('문의 목록 로딩 실패', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void fetchInquiries(); }, [filter]);

    const handleReply = async (id: string) => {
        const reply = replyMap[id]?.trim();
        if (!reply) return;
        setSubmitting(id);
        try {
            await axios.post(`/api/admin/inquiries/${id}/reply`, { reply }, { headers });
            setInquiries(prev => prev.map(i => i.id === id ? { ...i, status: 'replied', reply } : i));
            setReplyMap(prev => { const n = { ...prev }; delete n[id]; return n; });
            setExpandedId(null);
        } catch (e) {
            alert('답변 등록에 실패했습니다.');
        } finally {
            setSubmitting(null);
        }
    };

    const filtered = filter === 'all' ? inquiries : inquiries.filter(i => i.status === filter);

    return (
        <div style={s.container}>
            <header style={s.header}>
                <div>
                    <h1 style={s.title}>📬 문의게시판 관리</h1>
                    <p style={s.meta}>사용자들의 소중한 문의를 확인하고 정성껏 답변해 주세요. ✨</p>
                </div>
                <div style={s.countsCard}>
                    <div style={s.statItem}>
                        <span style={s.statLabel}>미응답</span>
                        <span style={{...s.statValue, color: '#F59E0B'}}>{inquiries.filter(i => i.status === 'pending').length}</span>
                    </div>
                    <div style={s.dividerVert} />
                    <div style={s.statItem}>
                        <span style={s.statLabel}>완료</span>
                        <span style={{...s.statValue, color: '#10B981'}}>{inquiries.filter(i => i.status === 'replied').length}</span>
                    </div>
                </div>
            </header>

            {/* 필터 탭 */}
            <div style={s.tabsWrapper}>
                <div style={s.tabs}>
                    {(['all', 'pending', 'replied'] as const).map(f => (
                        <button 
                            key={f} 
                            style={{ 
                                ...s.tab, 
                                backgroundColor: filter === f ? '#7C3AED' : 'rgba(255,255,255,0.5)',
                                color: filter === f ? '#fff' : '#6B7280',
                                border: filter === f ? '1px solid #7C3AED' : '1px solid rgba(229, 231, 235, 0.5)',
                            }} 
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? '전체 보기' : f === 'pending' ? '미응답 문의' : '답변 완료건'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={s.emptyState}>불러오는 중... 🔄</div>
            ) : filtered.length === 0 ? (
                <div style={s.emptyState}>표시할 문의가 없습니다. ✨</div>
            ) : (
                <div style={s.list}>
                    {filtered.map(item => (
                        <div key={item.id} style={{ ...s.card, borderLeft: `6px solid ${item.status === 'pending' ? '#F59E0B' : '#10B981'}` }}>
                            <div style={s.cardHeader} onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                                <div style={s.cardMeta}>
                                    <span style={s.categoryTag}>{CATEGORY_LABELS[item.category] || item.category}</span>
                                    <span style={s.cardTitle}>{item.title}</span>
                                </div>
                                <div style={s.cardRight}>
                                    <span style={s.cardEmail}>{item.email}</span>
                                    <span style={s.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</span>
                                    <span style={s.chevron}>{expandedId === item.id ? '▴' : '▾'}</span>
                                </div>
                            </div>

                            {expandedId === item.id && (
                                <div style={s.expanded}>
                                    <div style={s.divider} />
                                    <p style={s.contentText}>{item.content}</p>

                                    {item.status === 'replied' && item.reply ? (
                                        <div style={s.repliedBox}>
                                            <div style={s.replyHeader}>
                                                <span style={s.replyLabel}>✅ 관리자 답변 완료</span>
                                                <span style={s.replyDate}>{item.repliedAt ? new Date(item.repliedAt).toLocaleString() : ''}</span>
                                            </div>
                                            <p style={s.replyText}>{item.reply}</p>
                                        </div>
                                    ) : (
                                        <div style={s.replyForm}>
                                            <h4 style={s.formTitle}>답변 작성하기</h4>
                                            <textarea
                                                style={s.textarea}
                                                placeholder="사용자에게 전송될 답변 내용을 입력하세요..."
                                                value={replyMap[item.id] ?? ''}
                                                onChange={e => setReplyMap(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                rows={5}
                                            />
                                            <button
                                                style={{ ...s.submitBtn, opacity: submitting === item.id ? 0.6 : 1 }}
                                                onClick={() => void handleReply(item.id)}
                                                disabled={submitting === item.id || !replyMap[item.id]?.trim()}
                                            >
                                                {submitting === item.id ? '답변 발송 중...' : '이메일로 답변 발송하기'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// 🌌 스타일 디자인 (Glassmorphism & Unified Admin Layout)
const s: Record<string, React.CSSProperties> = {
    container: { padding: '40px 10px', maxWidth: '1000px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
    title: { fontSize: '28px', fontWeight: 900, color: '#4C1D95', margin: '0 0 8px' },
    meta: { fontSize: '15px', color: '#7C3AED', fontWeight: 600, opacity: 0.8, margin: 0 },
    
    countsCard: { 
        display: 'flex', alignItems: 'center', gap: '20px', 
        backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)',
        padding: '15px 25px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
    },
    statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    statLabel: { fontSize: '11px', fontWeight: 800, color: '#9CA3AF', marginBottom: '2px' },
    statValue: { fontSize: '18px', fontWeight: 900 },
    dividerVert: { width: '1px', height: '24px', backgroundColor: 'rgba(229, 231, 235, 0.8)' },

    tabsWrapper: { marginBottom: '30px' },
    tabs: { display: 'flex', gap: '10px' },
    tab: { padding: '10px 22px', borderRadius: '15px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, transition: 'all 0.2s' },

    list: { display: 'flex', flexDirection: 'column', gap: '18px' },
    card: { 
        backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)',
        borderRadius: '25px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.05)', transition: 'all 0.3s'
    },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 28px', cursor: 'pointer' },
    cardMeta: { display: 'flex', alignItems: 'center', gap: '15px', flex: 1, minWidth: 0 },
    categoryTag: { backgroundColor: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', fontSize: '11px', fontWeight: 800, padding: '5px 12px', borderRadius: '8px' },
    cardTitle: { fontSize: '16px', fontWeight: 800, color: '#1F2937', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
    cardRight: { display: 'flex', alignItems: 'center', gap: '15px' },
    cardEmail: { fontSize: '13px', color: '#9CA3AF' },
    cardDate: { fontSize: '13px', color: '#9CA3AF' },
    chevron: { color: '#9CA3AF', fontSize: '14px' },

    divider: { height: '1px', backgroundColor: 'rgba(229, 231, 235, 0.4)', margin: '0 28px' },
    expanded: { padding: '0 28px 25px' },
    contentText: { fontSize: '15px', color: '#4B5563', lineHeight: 1.7, margin: '25px 0', padding: '20px', backgroundColor: 'rgba(124, 58, 237, 0.03)', borderRadius: '20px', whiteSpace: 'pre-wrap' as const },

    repliedBox: { backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(16, 185, 129, 0.1)' },
    replyHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
    replyLabel: { fontSize: '12px', fontWeight: 900, color: '#10B981' },
    replyDate: { fontSize: '12px', color: '#10B981', opacity: 0.7 },
    replyText: { fontSize: '15px', color: '#1F2937', margin: 0, lineHeight: 1.6 },

    replyForm: { display: 'flex', flexDirection: 'column', gap: '15px' },
    formTitle: { fontSize: '16px', fontWeight: 800, color: '#1F2937', margin: 0 },
    textarea: { 
        width: '100%', padding: '18px', borderRadius: '18px', border: '1px solid rgba(209, 213, 219, 0.5)', 
        fontSize: '15px', outline: 'none', resize: 'vertical' as const, backgroundColor: '#fff', fontFamily: 'inherit'
    },
    submitBtn: { 
        alignSelf: 'flex-end', padding: '14px 30px', background: '#7C3AED', color: '#fff', border: 'none', 
        borderRadius: '15px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.2)' 
    },

    emptyState: { textAlign: 'center', padding: '100px 0', color: '#9CA3AF', fontSize: '18px', fontWeight: 600 }
};

export default AdminInquiryManagement;
