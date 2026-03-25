import React, { useState, useEffect } from 'react';
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

    useEffect(() => { fetchInquiries(); }, [filter]);

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
                    <h1 style={s.title}>문의게시판 관리</h1>
                    <p style={s.meta}>접수된 문의를 확인하고 답변할 수 있습니다.</p>
                </div>
                <div style={s.counts}>
                    <span style={s.pendingBadge}>{inquiries.filter(i => i.status === 'pending').length} 미응답</span>
                    <span style={s.repliedBadge}>{inquiries.filter(i => i.status === 'replied').length} 답변완료</span>
                </div>
            </header>

            {/* 필터 탭 */}
            <div style={s.tabs}>
                {(['all', 'pending', 'replied'] as const).map(f => (
                    <button key={f} style={{ ...s.tab, ...(filter === f ? s.tabActive : {}) }} onClick={() => setFilter(f)}>
                        {f === 'all' ? '전체' : f === 'pending' ? '미응답' : '답변완료'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={s.empty}>불러오는 중...</div>
            ) : filtered.length === 0 ? (
                <div style={s.empty}>문의가 없습니다.</div>
            ) : (
                <div style={s.list}>
                    {filtered.map(item => (
                        <div key={item.id} style={{ ...s.card, borderLeft: `4px solid ${item.status === 'pending' ? '#F59E0B' : '#10B981'}` }}>
                            {/* 문의 헤더 */}
                            <div style={s.cardHeader} onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                                <div style={s.cardMeta}>
                                    <span style={{ ...s.statusDot, background: item.status === 'pending' ? '#F59E0B' : '#10B981' }} />
                                    <span style={s.categoryTag}>{CATEGORY_LABELS[item.category] ?? item.category}</span>
                                    <span style={s.cardTitle}>{item.title}</span>
                                </div>
                                <div style={s.cardRight}>
                                    <span style={s.cardEmail}>{item.email}</span>
                                    <span style={s.cardDate}>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</span>
                                    <span style={s.chevron}>{expandedId === item.id ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {/* 확장 영역 */}
                            {expandedId === item.id && (
                                <div style={s.expanded}>
                                    <p style={s.contentText}>{item.content}</p>

                                    {item.status === 'replied' && item.reply ? (
                                        <div style={s.replyBox}>
                                            <span style={s.replyLabel}>답변 완료</span>
                                            <p style={s.replyText}>{item.reply}</p>
                                            <span style={s.replyDate}>{item.repliedAt ? new Date(item.repliedAt).toLocaleString('ko-KR') : ''}</span>
                                        </div>
                                    ) : (
                                        <div style={s.replyForm}>
                                            <textarea
                                                style={s.textarea}
                                                placeholder="이메일로 발송할 답변 내용을 입력하세요..."
                                                value={replyMap[item.id] ?? ''}
                                                onChange={e => setReplyMap(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                rows={4}
                                            />
                                            <button
                                                style={{ ...s.submitBtn, opacity: submitting === item.id ? 0.6 : 1 }}
                                                onClick={() => handleReply(item.id)}
                                                disabled={submitting === item.id || !replyMap[item.id]?.trim()}
                                            >
                                                {submitting === item.id ? '처리 중...' : '답변하기'}
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

const s: Record<string, React.CSSProperties> = {
    container: { padding: '40px', maxWidth: '900px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' },
    title: { fontSize: '26px', fontWeight: 800, color: '#5B21B6', margin: '0 0 6px' },
    meta: { fontSize: '14px', color: '#7C3AED', opacity: 0.75, margin: 0 },
    counts: { display: 'flex', gap: '10px', alignItems: 'center' },
    pendingBadge: { background: '#FEF3C7', color: '#D97706', fontWeight: 700, fontSize: '13px', padding: '6px 14px', borderRadius: '20px', border: '1px solid #FDE68A' },
    repliedBadge: { background: '#D1FAE5', color: '#059669', fontWeight: 700, fontSize: '13px', padding: '6px 14px', borderRadius: '20px', border: '1px solid #A7F3D0' },

    tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
    tab: { padding: '8px 20px', borderRadius: '20px', border: '1.5px solid #E5E7EB', background: '#fff', color: '#6B7280', fontWeight: 600, fontSize: '13px', cursor: 'pointer' },
    tabActive: { background: '#7C3AED', color: '#fff', border: '1.5px solid #7C3AED' },

    empty: { textAlign: 'center', padding: '60px', color: '#9CA3AF', fontSize: '15px' },
    list: { display: 'flex', flexDirection: 'column', gap: '12px' },

    card: { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer' },
    cardMeta: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 },
    statusDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
    categoryTag: { background: '#EDE9FE', color: '#6D28D9', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' },
    cardTitle: { fontSize: '14px', fontWeight: 600, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    cardRight: { display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 },
    cardEmail: { fontSize: '12px', color: '#9CA3AF' },
    cardDate: { fontSize: '12px', color: '#9CA3AF' },
    chevron: { fontSize: '11px', color: '#9CA3AF' },

    expanded: { padding: '0 20px 20px', borderTop: '1px solid #F3F4F6' },
    contentText: { fontSize: '14px', color: '#374151', lineHeight: 1.7, margin: '16px 0', padding: '14px', background: '#F9FAFB', borderRadius: '8px' },

    replyBox: { background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '14px 16px' },
    replyLabel: { fontSize: '11px', fontWeight: 800, color: '#059669', letterSpacing: '0.5px' },
    replyText: { fontSize: '14px', color: '#1F2937', margin: '8px 0 4px', lineHeight: 1.6 },
    replyDate: { fontSize: '11px', color: '#6EE7B7' },

    replyForm: { display: 'flex', flexDirection: 'column', gap: '10px' },
    textarea: { width: '100%', padding: '12px', fontSize: '14px', border: '1.5px solid #E5E7EB', borderRadius: '10px', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    submitBtn: { alignSelf: 'flex-end', padding: '10px 24px', background: 'linear-gradient(135deg,#7C3AED,#6366F1)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' },
};

export default AdminInquiryManagement;
