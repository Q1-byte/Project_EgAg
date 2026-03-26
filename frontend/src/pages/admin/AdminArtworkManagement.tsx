import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ShieldAlert, X, EyeOff } from 'lucide-react';
import { getAdminReportedArtworks, toggleArtworkVisibility, resolveReport } from '../../api/adminApi';
import { resolveImageUrl } from '../../utils/imageUrl';

interface ReportedArtwork {
    id: string;
    artworkId: string;
    artworkTitle: string;
    artworkImageUrl: string;
    authorNickname: string;
    reporterNickname: string;
    reason: string;
    description: string;
    status: string;
    createdAt: string;
}

const PAGE_SIZE = 10;

const REASON_LABEL: Record<string, string> = {
    spam: '스팸',
    inappropriate: '부적절한 콘텐츠',
    copyright: '저작권 침해',
    other: '기타',
};

const AdminArtworkManagement = () => {
    const [reports, setReports] = useState<ReportedArtwork[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchInput, setSearchInput] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selected, setSelected] = useState<ReportedArtwork | null>(null);
    const [toggling, setToggling] = useState(false);
    const [resolving, setResolving] = useState(false);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAdminReportedArtworks(page, PAGE_SIZE, statusFilter, searchKeyword);
            setReports(data.content || []);
            setTotal(data.totalElements || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, searchKeyword]);

    useEffect(() => { void fetchReports(); }, [fetchReports]);
    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [page]);

    const handleSearch = () => { setSearchKeyword(searchInput); setPage(0); };
    const handleFilterChange = (val: string) => { setStatusFilter(val); setPage(0); };

    const handleToggle = async (artworkId: string) => {
        if (toggling) return;
        setToggling(true);
        try {
            await toggleArtworkVisibility(artworkId);
            setSelected(null);
            void fetchReports();
        } catch {
            alert('상태 변경에 실패했습니다.');
        } finally {
            setToggling(false);
        }
    };

    const handleResolve = async (reportId: string) => {
        if (resolving) return;
        setResolving(true);
        try {
            await resolveReport(reportId);
            setSelected(null);
            void fetchReports();
        } catch {
            alert('처리에 실패했습니다.');
        } finally {
            setResolving(false);
        }
    };

    return (
        <div>
            <style>{`
                .ar-row { transition: background 0.15s; cursor: pointer; }
                .ar-row:hover { background: #f8fafc !important; }
                .ar-page-btn:hover:not(:disabled) { background: #f1f5f9 !important; }
                .ar-filter-btn:hover { background: #f1f5f9 !important; }
                @keyframes arModalIn { from{opacity:0;transform:translateY(12px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
            `}</style>

            {/* 툴바 */}
            <div style={s.toolbar}>
                <div style={s.searchWrap}>
                    <Search size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
                    <input
                        style={s.searchInput}
                        placeholder="작품명 또는 작가 검색"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <button style={s.searchBtn} onClick={handleSearch}>검색</button>
                <div style={s.filterGroup}>
                    {([
                        { label: '전체', value: 'all' },
                        { label: '미처리', value: 'pending' },
                        { label: '처리완료', value: 'resolved' },
                    ]).map(f => (
                        <button
                            key={f.value}
                            className="ar-filter-btn"
                            style={{ ...s.filterBtn, ...(statusFilter === f.value ? s.filterActive : {}) }}
                            onClick={() => handleFilterChange(f.value)}
                        >{f.label}</button>
                    ))}
                </div>
                <span style={s.totalBadge}>총 {total.toLocaleString()}건</span>
            </div>

            {/* 테이블 */}
            <div style={{ ...s.tableWrap, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                <table style={s.table}>
                    <thead>
                        <tr style={s.thead}>
                            {['작품', '작가', '신고자', '신고 사유', '신고일', '상태'].map(h => (
                                <th key={h} style={{ ...s.th, textAlign: h === '상태' ? 'center' : 'left' as React.CSSProperties['textAlign'] }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && reports.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={s.empty}>
                                    <ShieldAlert size={28} color="#cbd5e1" style={{ marginBottom: 8 }} />
                                    <div>신고 내역이 없습니다</div>
                                </td>
                            </tr>
                        ) : reports.map(r => (
                            <tr key={r.id} className="ar-row" style={s.tr} onClick={() => setSelected(r)}>
                                <td style={s.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={s.thumb}>
                                            {r.artworkImageUrl
                                                ? <img src={resolveImageUrl(r.artworkImageUrl)} alt={r.artworkTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : <span style={{ fontSize: 18 }}>🎨</span>
                                            }
                                        </div>
                                        <span style={s.artTitle}>{r.artworkTitle}</span>
                                    </div>
                                </td>
                                <td style={s.td}><span style={s.author}>{r.authorNickname}</span></td>
                                <td style={s.td}><span style={s.author}>{r.reporterNickname}</span></td>
                                <td style={s.td}>
                                    <span style={s.reasonBadge}>{REASON_LABEL[r.reason] ?? r.reason}</span>
                                </td>
                                <td style={s.td}>
                                    <span style={s.date}>
                                        {new Date(r.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                    </span>
                                </td>
                                <td style={{ ...s.td, textAlign: 'center' }}>
                                    <span style={{ ...s.statusBadge, ...(r.status === 'resolved' ? s.statusDone : s.statusPending) }}>
                                        {r.status === 'resolved' ? '처리완료' : '미처리'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div style={s.pagination}>
                    <button className="ar-page-btn" style={s.pageBtn} onClick={() => setPage(0)} disabled={page === 0}>
                        <ChevronsLeft size={15} />
                    </button>
                    <button className="ar-page-btn" style={s.pageBtn} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                        <ChevronLeft size={15} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i)
                        .slice(Math.max(0, page - 2), Math.min(totalPages, page + 3))
                        .map(i => (
                            <button
                                key={i}
                                className="ar-page-btn"
                                style={{ ...s.pageBtn, ...(i === page ? s.pageActive : {}) }}
                                onClick={() => setPage(i)}
                            >{i + 1}</button>
                        ))
                    }
                    <button className="ar-page-btn" style={s.pageBtn} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                        <ChevronRight size={15} />
                    </button>
                    <button className="ar-page-btn" style={s.pageBtn} onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>
                        <ChevronsRight size={15} />
                    </button>
                </div>
            )}

            {/* 상세 모달 */}
            {selected && createPortal(
                <div
                    onClick={() => setSelected(null)}
                    style={s.overlay}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={s.modal}
                    >
                        {/* 모달 헤더 */}
                        <div style={s.modalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <ShieldAlert size={18} color="#b45309" />
                                <span style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>신고 상세</span>
                            </div>
                            <button style={s.closeBtn} onClick={() => setSelected(null)}>
                                <X size={15} />
                            </button>
                        </div>

                        {/* 작품 이미지 */}
                        <div style={{ borderRadius: 12, overflow: 'hidden', background: '#f8fafc', height: 200, marginBottom: 16 }}>
                            <img src={resolveImageUrl(selected.artworkImageUrl)} alt={selected.artworkTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        {/* 정보 그리드 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                            {[
                                { label: '작품명', value: selected.artworkTitle },
                                { label: '작가', value: selected.authorNickname },
                                { label: '신고자', value: selected.reporterNickname },
                                { label: '신고 사유', value: REASON_LABEL[selected.reason] ?? selected.reason },
                            ].map(({ label, value }) => (
                                <div key={label} style={s.infoBox}>
                                    <p style={s.infoLabel}>{label.toUpperCase()}</p>
                                    <p style={s.infoValue}>{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* 신고 내용 */}
                        {selected.description && (
                            <div style={{ ...s.contentBox, marginBottom: 16 }}>
                                <p style={s.contentLabel}>신고 내용</p>
                                <p style={s.contentText}>{selected.description}</p>
                            </div>
                        )}

                        <div style={s.divider} />

                        {/* 상태 + 액션 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                            <span style={{ ...s.statusBadge, ...(selected.status === 'resolved' ? s.statusDone : s.statusPending) }}>
                                {selected.status === 'resolved' ? '처리완료' : '미처리'}
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={() => void handleToggle(selected.artworkId)}
                                    disabled={toggling}
                                    style={{ ...s.toggleBtn, background: '#475569', opacity: toggling ? 0.6 : 1 }}
                                >
                                    <EyeOff size={13} />
                                    {toggling ? '처리 중...' : '노출 숨기기'}
                                </button>
                                {selected.status !== 'resolved' && (
                                    <button
                                        onClick={() => void handleResolve(selected.id)}
                                        disabled={resolving}
                                        style={{ ...s.toggleBtn, background: '#1e3a5f', opacity: resolving ? 0.6 : 1 }}
                                    >
                                        {resolving ? '처리 중...' : '✓ 처리완료'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const s: Record<string, React.CSSProperties> = {
    toolbar: {
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap',
    },
    searchWrap: {
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
        padding: '8px 14px', flex: 1, maxWidth: 360,
    },
    searchInput: {
        border: 'none', outline: 'none', fontSize: 13, color: '#374151',
        background: 'transparent', width: '100%',
    },
    searchBtn: {
        padding: '8px 18px', background: '#1e3a5f', color: '#fff',
        border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
    },
    filterGroup: { display: 'flex', gap: 6 },
    filterBtn: {
        padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
        background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    },
    filterActive: {
        background: '#1e3a5f', color: '#fff', borderColor: '#1e3a5f',
    },
    totalBadge: {
        marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#94a3b8',
    },

    tableWrap: {
        background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    thead: { borderBottom: '1px solid #f1f5f9', background: '#f8fafc' },
    th: { padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.3 },
    tr: { borderBottom: '1px solid #f8fafc' },
    td: { padding: '12px 16px', verticalAlign: 'middle' },
    thumb: {
        width: 44, height: 44, borderRadius: 10, overflow: 'hidden',
        background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    artTitle: { fontSize: 13, fontWeight: 700, color: '#1e293b' },
    author: { fontSize: 12, color: '#64748b', fontWeight: 500 },
    date: { fontSize: 12, color: '#94a3b8' },
    reasonBadge: {
        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
        background: 'rgba(245,158,11,0.1)', color: '#b45309',
    },
    statusBadge: {
        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
        display: 'inline-block',
    },
    statusPending: { background: 'rgba(245,158,11,0.1)', color: '#b45309' },
    statusDone: { background: 'rgba(34,197,94,0.1)', color: '#15803d' },

    empty: { textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13, fontWeight: 600 },

    pagination: {
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 20,
    },
    pageBtn: {
        width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0',
        background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
    },
    pageActive: { background: '#1e3a5f', color: '#fff', border: '1px solid #1e3a5f' },

    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(15,32,56,0.35)',
        backdropFilter: 'blur(4px)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    },
    modal: {
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520,
        padding: '28px 32px', boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        animation: 'arModalIn 0.22s ease', maxHeight: '85vh', overflowY: 'auto',
    },
    modalHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
    },
    closeBtn: {
        background: 'none', border: '1px solid #e2e8f0', borderRadius: 8,
        color: '#94a3b8', cursor: 'pointer', padding: '5px 7px', display: 'inline-flex', alignItems: 'center',
    },
    infoBox: { background: '#f8fafc', borderRadius: 10, padding: '10px 14px' },
    infoLabel: { margin: '0 0 2px', fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: 1 },
    infoValue: { margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b' },
    contentBox: { background: '#f8fafc', borderRadius: 12, padding: '14px 16px' },
    contentLabel: { margin: '0 0 8px', fontSize: 10, fontWeight: 900, color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase' },
    contentText: { margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' },
    divider: { height: 1, background: '#f1f5f9', margin: '16px 0' },
    toggleBtn: {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 18px', border: 'none', borderRadius: 10,
        background: '#1e3a5f', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
    },
};

export default AdminArtworkManagement;
