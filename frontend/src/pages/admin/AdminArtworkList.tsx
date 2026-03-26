import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, EyeOff, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { getArtworks, toggleArtworkVisibility, deleteAdminArtwork, type AdminArtworkResponse } from '../../api/adminApi';
import { resolveImageUrl } from '../../utils/imageUrl';

const PAGE_SIZE = 10;

const AdminArtworkList = () => {
    const [artworks, setArtworks] = useState<AdminArtworkResponse[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const fetchArtworks = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getArtworks(page, PAGE_SIZE);
            setArtworks(data.content);
            setTotal(data.totalElements);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    useEffect(() => { void fetchArtworks(); }, [fetchArtworks]);

    const handleSearch = () => {
        setKeyword(searchInput);
        setPage(0);
    };

    const handleToggleVisibility = async (id: string) => {
        try {
            await toggleArtworkVisibility(id);
            setArtworks(prev => prev.map(a => a.id === id ? { ...a, isVisible: !a.isVisible } : a));
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteAdminArtwork(id);
            setConfirmDelete(null);
            void fetchArtworks();
        } catch (e) {
            console.error(e);
        }
    };

    const filtered = artworks.filter(a =>
        !keyword || a.title?.includes(keyword) || a.nickname?.includes(keyword)
    );

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div>
            <style>{`
                .al-row { transition: background 0.15s; }
                .al-row:hover { background: #f8fafc !important; }
                .al-vis-btn:hover { opacity: 0.75; }
                .al-del-btn:hover { background: #fef2f2 !important; color: #ef4444 !important; }
                .al-page-btn:hover:not(:disabled) { background: #f1f5f9 !important; }
            `}</style>

            {/* 검색 바 */}
            <div style={s.toolbar}>
                <div style={s.searchWrap}>
                    <Search size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
                    <input
                        style={s.searchInput}
                        placeholder="제목 또는 작가 검색"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <button style={s.searchBtn} onClick={handleSearch}>검색</button>
                <span style={s.totalBadge}>총 {total.toLocaleString()}개</span>
            </div>

            {/* 테이블 */}
            <div style={{ ...s.tableWrap, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
                <table style={s.table}>
                    <thead>
                        <tr style={s.thead}>
                            {['썸네일', '제목', '작가', '등록일', '노출', '관리'].map(h => (
                                <th key={h} style={{ ...s.th, textAlign: h === '관리' || h === '노출' ? 'center' : 'left' as any }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && filtered.length === 0 ? (
                            <tr><td colSpan={6} style={s.loading}>작품이 없습니다</td></tr>
                        ) : filtered.map(art => (
                            <tr key={art.id} className="al-row" style={s.tr}>
                                <td style={s.td}>
                                    <div style={s.thumb}>
                                        {art.imageUrl
                                            ? <img src={resolveImageUrl(art.imageUrl)} alt={art.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <span style={{ fontSize: 20 }}>🎨</span>
                                        }
                                    </div>
                                </td>
                                <td style={s.td}>
                                    <span style={s.artTitle}>{art.title || '제목 없음'}</span>
                                </td>
                                <td style={s.td}>
                                    <span style={s.author}>{art.nickname}</span>
                                </td>
                                <td style={s.td}>
                                    <span style={s.date}>
                                        {new Date(art.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                    </span>
                                </td>
                                <td style={{ ...s.td, textAlign: 'center' }}>
                                    <button
                                        className="al-vis-btn"
                                        style={{ ...s.visBtn, color: art.isVisible ? '#10b981' : '#94a3b8' }}
                                        onClick={() => handleToggleVisibility(art.id)}
                                        title={art.isVisible ? '공개 중 (클릭 시 비공개)' : '비공개 (클릭 시 공개)'}
                                    >
                                        {art.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                                    </button>
                                </td>
                                <td style={{ ...s.td, textAlign: 'center' }}>
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <button
                                            className="al-del-btn"
                                            style={{ ...s.delBtn, ...(confirmDelete === art.id ? { borderColor: '#ef4444', color: '#ef4444' } : {}) }}
                                            onClick={() => setConfirmDelete(confirmDelete === art.id ? null : art.id)}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                        {confirmDelete === art.id && (
                                            <div style={s.confirmPop}>
                                                <button style={s.confirmBtn} onClick={() => handleDelete(art.id)}>삭제</button>
                                                <button style={s.cancelBtn} onClick={() => setConfirmDelete(null)}>취소</button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div style={s.pagination}>
                    <button className="al-page-btn" style={s.pageBtn} onClick={() => setPage(0)} disabled={page === 0} title="맨 앞으로">
                        <ChevronsLeft size={15} />
                    </button>
                    <button className="al-page-btn" style={s.pageBtn} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                        <ChevronLeft size={15} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i).slice(
                        Math.max(0, page - 2), Math.min(totalPages, page + 3)
                    ).map(i => (
                        <button
                            key={i}
                            className="al-page-btn"
                            style={{ ...s.pageBtn, ...(i === page ? s.pageActive : {}) }}
                            onClick={() => setPage(i)}
                        >{i + 1}</button>
                    ))}
                    <button className="al-page-btn" style={s.pageBtn} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
                        <ChevronRight size={15} />
                    </button>
                    <button className="al-page-btn" style={s.pageBtn} onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1} title="맨 뒤로">
                        <ChevronsRight size={15} />
                    </button>
                </div>
            )}
        </div>
    );
};

const s: Record<string, React.CSSProperties> = {
    toolbar: {
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
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
        background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    artTitle: { fontSize: 13, fontWeight: 700, color: '#1e293b' },
    author: { fontSize: 12, color: '#64748b', fontWeight: 500 },
    date: { fontSize: 12, color: '#94a3b8' },

    visBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: 4, borderRadius: 6, transition: 'opacity 0.15s',
    },
    delBtn: {
        background: 'none', border: '1px solid #e2e8f0', borderRadius: 8,
        color: '#94a3b8', cursor: 'pointer', padding: '5px 8px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
    },
    confirmPop: {
        position: 'absolute', top: '50%', right: 'calc(100% + 8px)',
        transform: 'translateY(-50%)',
        display: 'flex', gap: 4, alignItems: 'center',
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: 8, padding: '4px 6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        whiteSpace: 'nowrap', zIndex: 10,
    },
    confirmBtn: {
        padding: '4px 10px', background: '#ef4444', color: '#fff',
        border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
    },
    cancelBtn: {
        padding: '4px 10px', background: '#f1f5f9', color: '#64748b',
        border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
    },

    loading: { textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 13, fontWeight: 600 },

    pagination: {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: 6, marginTop: 20,
    },
    pageBtn: {
        width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0',
        background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
    },
    pageActive: {
        background: '#1e3a5f', color: '#fff', border: '1px solid #1e3a5f',
    },
};

export default AdminArtworkList;
