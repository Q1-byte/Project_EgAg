import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const DEFAULT_SLOTS = 10;
const MAX_SLOTS = 15;

interface ArtworkItem {
    id: string;
    imageUrl: string;
    title?: string;
    userNickname?: string;
}

const AdminImageManagement = () => {
    const [slotCount, setSlotCount] = useState<number>(() => {
        const saved = localStorage.getItem('admin_main_slot_count');
        return saved ? Number(saved) : DEFAULT_SLOTS;
    });

    const [images, setImages] = useState<(string | null)[]>(() => {
        try {
            const saved = localStorage.getItem('admin_main_images');
            return saved ? JSON.parse(saved) : Array(DEFAULT_SLOTS).fill(null);
        } catch {
            return Array(DEFAULT_SLOTS).fill(null);
        }
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [targetIndex, setTargetIndex] = useState<number | null>(null);

    // 유저 그림 모달
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<number | null>(null);
    const [artworks, setArtworks] = useState<ArtworkItem[]>([]);
    const [pickerLoading, setPickerLoading] = useState(false);

    useEffect(() => {
        localStorage.setItem('admin_main_images', JSON.stringify(images));
    }, [images]);

    useEffect(() => {
        localStorage.setItem('admin_main_slot_count', String(slotCount));
    }, [slotCount]);

    const handleAddSlot = () => {
        if (slotCount >= MAX_SLOTS) return;
        setSlotCount(c => c + 1);
        setImages(prev => [...prev, null]);
    };

    const handleRegisterClick = (index: number) => {
        setTargetIndex(index);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || targetIndex === null) return;
        const reader = new FileReader();
        reader.onload = () => {
            setImages(prev => {
                const updated = [...prev];
                updated[targetIndex] = reader.result as string;
                return updated;
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleDelete = (index: number) => {
        if (!window.confirm(`슬롯 ${index + 1}번 이미지를 삭제할까요?`)) return;
        setImages(prev => {
            const updated = [...prev];
            updated[index] = null;
            return updated;
        });
    };

    const handleOpenPicker = async (index: number) => {
        setPickerTarget(index);
        setPickerOpen(true);
        if (artworks.length > 0) return;
        setPickerLoading(true);
        try {
            const res = await axios.get('/api/artworks/explore', { params: { sort: 'latest', limit: 50 } });
            setArtworks(res.data.filter((a: ArtworkItem) => a.imageUrl));
        } catch {
            alert('유저 그림을 불러오는데 실패했습니다.');
        } finally {
            setPickerLoading(false);
        }
    };

    const handlePickArtwork = (imageUrl: string) => {
        if (pickerTarget === null) return;
        setImages(prev => {
            const updated = [...prev];
            updated[pickerTarget] = imageUrl;
            return updated;
        });
        setPickerOpen(false);
        setPickerTarget(null);
    };

    const registeredCount = images.slice(0, slotCount).filter(Boolean).length;

    return (
        <div style={s.container}>
            <header style={s.header}>
                <div>
                    <h1 style={s.title}>🖼️ 메인 이미지 관리</h1>
                    <p style={s.meta}>홈 화면 캐러셀에 노출될 이미지를 관리하고 슬롯을 조정합니다. ✨</p>
                </div>
                <div style={s.countBadge}>
                    <div style={s.badgeInner}>
                        <span style={s.countNum}>{registeredCount}</span>
                        <span style={s.countLabel}>/ {MAX_SLOTS}</span>
                    </div>
                    <span style={s.badgeText}>슬롯 채워짐</span>
                </div>
            </header>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            <div style={s.grid}>
                {images.slice(0, slotCount).map((img, i) => (
                    <div key={i} style={s.card}>
                        <div style={s.slotIndicator}>{i + 1}</div>

                        {/* 이미지 미리보기 영역 */}
                        <div style={s.imageArea}>
                            {img ? (
                                <img src={img} alt={`슬롯 ${i + 1}`} style={s.image} />
                            ) : (
                                <div style={s.placeholder}>
                                   <div style={s.placeholderIcon}>🖼️</div>
                                   <span style={s.placeholderText}>이미지를 선택해 주세요</span>
                                </div>
                            )}
                        </div>

                        {/* 버튼 영역 */}
                        <div style={s.btnContent}>
                             <div style={s.btnGroup}>
                                <button style={s.btnRegister} onClick={() => handleRegisterClick(i)}>
                                    {img ? '이미지 교체' : '새 이미지 등록'}
                                </button>
                                {img && (
                                    <button style={s.btnDelete} onClick={() => handleDelete(i)}>
                                        삭제
                                    </button>
                                )}
                            </div>
                            <button style={s.btnPicker} onClick={() => void handleOpenPicker(i)}>
                                🎨 유저 갤러리에서 선택
                            </button>
                        </div>
                    </div>
                ))}

                {/* 추가 버튼 슬롯 (한계를 넘지 않았을 때만) */}
                {slotCount < MAX_SLOTS && (
                    <button style={s.addSlotCard} onClick={handleAddSlot}>
                        <div style={s.addIcon}>+</div>
                        <span style={s.addLabel}>새 슬롯 추가하기</span>
                        <span style={s.addSubLabel}>{slotCount} / {MAX_SLOTS}</span>
                    </button>
                )}
            </div>

            {/* 유저 그림 선택 모달 */}
            {pickerOpen && (
                <div style={s.modalOverlay} onClick={() => setPickerOpen(false)}>
                    <div style={s.modalBox} onClick={e => e.stopPropagation()}>
                        <div style={s.modalHeader}>
                            <h3 style={s.modalTitle}>🎨 유저 작품 갤러리</h3>
                            <button style={s.modalClose} onClick={() => setPickerOpen(false)}>✕</button>
                        </div>
                        {pickerLoading ? (
                            <div style={s.modalEmpty}>작품을 불러오는 중... 🔄</div>
                        ) : artworks.length === 0 ? (
                            <div style={s.modalEmpty}>갤러리에 저장된 작품이 없습니다. ✨</div>
                        ) : (
                            <div style={s.artworkGrid}>
                                {artworks.map(art => (
                                    <div key={art.id} style={s.artworkThumb} onClick={() => handlePickArtwork(art.imageUrl)}>
                                        <div style={s.thumbWrapper}>
                                            <img src={art.imageUrl} alt={art.title ?? ''} style={s.thumbImg} />
                                            <div style={s.thumbOverlay}>선택하기</div>
                                        </div>
                                        <div style={s.thumbInfo}>
                                            <span style={s.thumbTitle}>{art.title || '제목 없음'}</span>
                                            <span style={s.thumbNick}>@{art.userNickname || '익명 작가'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// 🌌 스타일 시스템 (Glassmorphism & High-Density Card Layout)
const s: Record<string, React.CSSProperties> = {
    container: { padding: '40px 10px', maxWidth: '1400px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
    title: { fontSize: '28px', fontWeight: 900, color: '#4C1D95', margin: '0 0 8px' },
    meta: { fontSize: '15px', color: '#7C3AED', fontWeight: 600, opacity: 0.8, margin: 0 },
    
    countBadge: { 
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)',
        padding: '12px 24px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
    },
    badgeInner: { display: 'flex', alignItems: 'baseline', gap: '6px' },
    countNum: { fontSize: '24px', fontWeight: 900, color: '#7C3AED' },
    countLabel: { fontSize: '14px', fontWeight: 700, color: '#9CA3AF' },
    badgeText: { fontSize: '11px', color: '#9CA3AF', fontWeight: 800 },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },

    card: { 
        backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)',
        borderRadius: '25px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.05)', display: 'flex', flexDirection: 'column', position: 'relative' 
    },
    slotIndicator: { 
        position: 'absolute', top: '12px', left: '12px', zIndex: 2,
        backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '10px', fontWeight: 900,
        padding: '3px 8px', borderRadius: '10px', backdropFilter: 'blur(4px)'
    },
    imageArea: { width: '100%', aspectRatio: '4/3', backgroundColor: 'rgba(124, 58, 237, 0.03)', overflow: 'hidden' },
    image: { width: '100%', height: '100%', objectFit: 'cover' },
    placeholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' },
    placeholderIcon: { fontSize: '30px', opacity: 0.3 },
    placeholderText: { fontSize: '12px', color: '#9CA3AF', fontWeight: 600 },

    btnContent: { padding: '15px' },
    btnGroup: { display: 'flex', gap: '8px', marginBottom: '10px' },
    btnRegister: { 
        flex: 1, padding: '10px', borderRadius: '12px', border: 'none', 
        backgroundColor: '#7C3AED', color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer' 
    },
    btnDelete: { padding: '10px 15px', borderRadius: '12px', border: '1px solid #FEE2E2', backgroundColor: '#fff', color: '#EF4444', fontSize: '13px', fontWeight: 800, cursor: 'pointer' },
    btnPicker: { 
        width: '100%', padding: '10px', borderRadius: '12px', border: 'none', 
        backgroundColor: 'rgba(124, 58, 237, 0.05)', color: '#7C3AED', fontSize: '12px', fontWeight: 800, cursor: 'pointer' 
    },

    addSlotCard: {
        border: '2px dashed rgba(124, 58, 237, 0.3)', backgroundColor: 'transparent',
        borderRadius: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.2s', minHeight: '260px', padding: '20px'
    },
    addIcon: { fontSize: '40px', color: '#7C3AED', marginBottom: '10px', fontWeight: 300 },
    addLabel: { fontSize: '15px', fontWeight: 800, color: '#4C1D95', marginBottom: '4px' },
    addSubLabel: { fontSize: '12px', color: '#9CA3AF', fontWeight: 700 },

    modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
    modalBox: { 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '35px', width: '900px', maxWidth: '95vw',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    modalHeader: { padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(229, 231, 235, 0.5)' },
    modalTitle: { fontSize: '22px', fontWeight: 900, color: '#4C1D95', margin: 0 },
    modalClose: { border: 'none', background: 'none', fontSize: '24px', color: '#9CA3AF', cursor: 'pointer' },
    modalEmpty: { padding: '100px', textAlign: 'center', color: '#9CA3AF', fontSize: '18px', fontWeight: 600 },
    
    artworkGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', padding: '40px', overflowY: 'auto' },
    artworkThumb: { cursor: 'pointer', transition: 'transform 0.2s' },
    thumbWrapper: { position: 'relative', borderRadius: '18px', overflow: 'hidden', aspectRatio: '1', marginBottom: '8px' },
    thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
    thumbOverlay: { 
        position: 'absolute', inset: 0, backgroundColor: 'rgba(124, 58, 237, 0.6)', 
        color: '#fff', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', 
        opacity: 0, transition: 'opacity 0.2s'
    },
    thumbInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
    thumbTitle: { fontSize: '14px', fontWeight: 800, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    thumbNick: { fontSize: '12px', color: '#9CA3AF', fontWeight: 600 }
};

export default AdminImageManagement;
