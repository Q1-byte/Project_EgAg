import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Image, Heart, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { MainBannerResponse, AdminArtworkResponse } from '../../api/adminApi';
import { resolveImageUrl } from '../../utils/imageUrl';
import { getAdminMainImages, getArtworks, assignMainImage, clearMainImageSlot } from '../../api/adminApi';

interface BannerSlot extends MainBannerResponse { isPlaceholder?: boolean; }

const ART_PAGE_SIZE = 21;

const AdminImageManagement = () => {
    const [slots, setSlots] = useState<BannerSlot[]>([]);
    const [artworks, setArtworks] = useState<AdminArtworkResponse[]>([]);
    const [artTotal, setArtTotal] = useState(0);
    const [artPage, setArtPage] = useState(0);
    const [artLoading, setArtLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const fetchBanners = useCallback(async () => {
        try {
            const bannerData = await getAdminMainImages();
            const minSlots = 10;
            const count = Math.max(minSlots, ...bannerData.map(b => b.slotNumber + 1));
            const updated: BannerSlot[] = Array.from({ length: count }, (_, i) => ({
                slotNumber: i, artworkId: '', artworkTitle: '', imageUrl: '', isPlaceholder: true
            }));
            bannerData.forEach(b => { if (b.slotNumber < count) updated[b.slotNumber] = { ...b, isPlaceholder: false }; });
            setSlots(updated);
        } catch (e) { console.error(e); }
    }, []);

    const fetchArtworks = useCallback(async (page: number) => {
        setArtLoading(true);
        try {
            const data = await getArtworks(page, ART_PAGE_SIZE);
            setArtworks(data.content || []);
            setArtTotal(data.totalElements || 0);
        } catch (e) { console.error(e); }
        finally { setArtLoading(false); }
    }, []);

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchBanners(), fetchArtworks(0)]);
            setIsLoading(false);
        };
        void init();
    }, [fetchBanners, fetchArtworks]);

    useEffect(() => {
        if (!isLoading) void fetchArtworks(artPage);
    }, [artPage, fetchArtworks, isLoading]);

    const handleAssign = async (artworkId: string) => {
        if (selectedSlot === null || assigning) return;
        try {
            setAssigning(true);
            await assignMainImage(artworkId, selectedSlot);
            await fetchBanners();
            setSuccessMsg(`슬롯 ${selectedSlot + 1} 반영 완료`);
            setTimeout(() => setSuccessMsg(null), 2500);
            setSelectedSlot(null);
        } catch { alert('할당 중 오류가 발생했습니다.'); }
        finally { setAssigning(false); }
    };

    const totalArtPages = Math.ceil(artTotal / ART_PAGE_SIZE);

    if (isLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>
            불러오는 중...
        </div>
    );

    return (
        <div>
            <style>{`
                @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                .slot-card { transition: all 0.2s ease; }
                .slot-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
                .clear-btn:hover { background: #fee2e2 !important; color: #ef4444 !important; }
                .art-card { transition: all 0.2s ease; }
                .art-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,0.1) !important; }
                .art-card:hover .art-overlay { opacity: 1 !important; }
                .bm-page-btn:hover:not(:disabled) { background: #f1f5f9 !important; }
            `}</style>

            {/* 성공 토스트 */}
            {successMsg && (
                <div style={s.toast}>{successMsg}</div>
            )}

            {/* Step 1 - 슬롯 선택 */}
            <div style={s.section}>
                <div style={s.sectionHead}>
                    <div>
                        <p style={s.step}>STEP 01</p>
                        <p style={s.sectionTitle}>편집할 슬롯 선택</p>
                    </div>
                    <button style={s.refreshBtn} onClick={() => void fetchBanners()}>
                        <RefreshCw size={13} />
                        <span>새로고침</span>
                    </button>
                </div>

                <div style={s.slotGrid}>
                    {slots.map(slot => {
                        const isSelected = selectedSlot === slot.slotNumber;
                        return (
                            <div key={slot.slotNumber} className="slot-card"
                                onClick={() => setSelectedSlot(isSelected ? null : slot.slotNumber)}
                                style={{
                                    ...s.slotCard,
                                    border: isSelected ? '2px solid #6366f1' : '1px solid #f1f5f9',
                                    boxShadow: isSelected ? '0 0 0 4px rgba(99,102,241,0.12)' : '0 2px 12px rgba(0,0,0,0.05)',
                                }}>
                                <div style={s.slotTop}>
                                    <span style={s.slotNum}>슬롯 {slot.slotNumber + 1}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {isSelected && <span style={s.editBadge}>편집 중</span>}
                                        {!isSelected && slot.artworkId && <span style={s.activeBadge}>노출 중</span>}
                                        {slot.artworkId && (
                                            <button
                                                className="clear-btn"
                                                style={s.clearBtn}
                                                title="슬롯 비우기"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    void clearMainImageSlot(slot.slotNumber).then(fetchBanners);
                                                }}>
                                                <X size={10} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div style={s.slotImg}>
                                    {slot.imageUrl
                                        ? <img src={resolveImageUrl(slot.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <div style={s.emptySlot}><Image size={20} color="#cbd5e1" /><span style={{ fontSize: 11, color: '#cbd5e1', marginTop: 6 }}>비어 있음</span></div>
                                    }
                                </div>
                                <p style={s.slotTitle}>{slot.artworkTitle || '등록된 작품 없음'}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step 2 - 작품 선택 */}
            <div style={s.section}>
                <div style={s.sectionHead}>
                    <div>
                        <p style={s.step}>STEP 02</p>
                        <p style={s.sectionTitle}>
                            {selectedSlot !== null ? `슬롯 ${selectedSlot + 1}에 반영할 작품 선택` : '슬롯을 먼저 선택하세요'}
                        </p>
                    </div>
                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>총 {artTotal}개 · 좋아요 순</span>
                </div>

                <div style={{ ...s.artGrid, opacity: (assigning || artLoading) ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    {artworks.map(art => (
                        <div key={art.id} className="art-card"
                            style={{ ...s.artCard, cursor: selectedSlot !== null ? 'pointer' : 'default' }}
                            onClick={() => selectedSlot !== null && void handleAssign(art.id)}>
                            <div style={s.artImgWrap}>
                                <img src={resolveImageUrl(art.imageUrl)} alt={art.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div className="art-overlay" style={s.artOverlay}>
                                    <span style={s.applyLabel}>
                                        {selectedSlot !== null ? `슬롯 ${selectedSlot + 1}에 반영` : '슬롯 먼저 선택'}
                                    </span>
                                </div>
                                <div style={s.likeBadge}>
                                    <Heart size={10} style={{ fill: '#fff', color: '#fff' }} />
                                    <span>{art.likeCount ?? 0}</span>
                                </div>
                            </div>
                            <div style={s.artInfo}>
                                <p style={s.artTitle}>{art.title || '제목 없음'}</p>
                                <p style={s.artNick}>@{art.nickname}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 페이지네이션 */}
                {totalArtPages > 1 && (
                    <div style={s.pagination}>
                        <button className="bm-page-btn" style={s.pageBtn}
                            onClick={() => setArtPage(p => Math.max(0, p - 1))}
                            disabled={artPage === 0}>
                            <ChevronLeft size={15} />
                        </button>
                        {Array.from({ length: totalArtPages }, (_, i) => i)
                            .slice(Math.max(0, artPage - 2), Math.min(totalArtPages, artPage + 3))
                            .map(i => (
                                <button key={i} className="bm-page-btn"
                                    style={{ ...s.pageBtn, ...(i === artPage ? s.pageActive : {}) }}
                                    onClick={() => setArtPage(i)}>
                                    {i + 1}
                                </button>
                            ))}
                        <button className="bm-page-btn" style={s.pageBtn}
                            onClick={() => setArtPage(p => Math.min(totalArtPages - 1, p + 1))}
                            disabled={artPage === totalArtPages - 1}>
                            <ChevronRight size={15} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const s: Record<string, React.CSSProperties> = {
    toast: {
        position: 'fixed', bottom: 32, right: 32, zIndex: 999,
        background: '#1e293b', color: '#fff', fontSize: 13, fontWeight: 700,
        padding: '12px 20px', borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    },
    section: {
        background: '#fff', borderRadius: 20, padding: '28px',
        border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        marginBottom: 20,
    },
    sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
    step: { margin: '0 0 4px', fontSize: 10, fontWeight: 900, color: '#6366f1', letterSpacing: 2 },
    sectionTitle: { margin: 0, fontSize: 16, fontWeight: 800, color: '#1e293b' },
    refreshBtn: {
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 10, fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer',
    },

    slotGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 },
    slotCard: {
        borderRadius: 16, padding: 16, cursor: 'pointer',
        background: '#fff', display: 'flex', flexDirection: 'column', gap: 10,
    },
    slotTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    slotNum: { fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5, flex: 1 },
    clearBtn: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 18, height: 18, borderRadius: 4, border: '1px solid #e2e8f0',
        background: '#f8fafc', color: '#94a3b8', cursor: 'pointer', padding: 0,
        transition: 'all 0.15s',
    },
    editBadge: {
        fontSize: 10, fontWeight: 800, color: '#fff',
        background: '#6366f1', padding: '2px 8px', borderRadius: 6,
    },
    activeBadge: {
        fontSize: 10, fontWeight: 800, color: '#10b981',
        background: '#f0fdf4', padding: '2px 8px', borderRadius: 6,
    },
    slotImg: {
        height: 200, borderRadius: 10, overflow: 'hidden',
        background: '#f8fafc', border: '1px solid #f1f5f9',
    },
    emptySlot: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    slotTitle: { margin: 0, fontSize: 12, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

    artGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 16 },
    artCard: {
        borderRadius: 14, overflow: 'hidden',
        background: '#fff', border: '1px solid #f1f5f9',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    artImgWrap: { height: 160, position: 'relative', overflow: 'hidden', background: '#f1f5f9' },
    artOverlay: {
        position: 'absolute', inset: 0,
        background: 'rgba(99,102,241,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0, transition: 'opacity 0.2s',
    },
    applyLabel: { color: '#fff', fontSize: 12, fontWeight: 800, textAlign: 'center', padding: '0 12px' },
    likeBadge: {
        position: 'absolute', bottom: 8, right: 8,
        display: 'flex', alignItems: 'center', gap: 3,
        background: 'rgba(0,0,0,0.55)', borderRadius: 20,
        padding: '3px 7px', fontSize: 10, fontWeight: 700, color: '#fff',
    },
    artInfo: { padding: '12px 14px' },
    artTitle: { margin: '0 0 3px', fontSize: 12, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    artNick: { margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 500 },

    pagination: {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        gap: 6, marginTop: 24,
    },
    pageBtn: {
        width: 34, height: 34, borderRadius: 8, border: '1px solid #e2e8f0',
        background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
    },
    pageActive: {
        background: '#6366f1', color: '#fff', border: '1px solid #6366f1',
    },
};

export default AdminImageManagement;
