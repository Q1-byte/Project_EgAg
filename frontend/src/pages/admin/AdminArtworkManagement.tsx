import { useState, useEffect } from 'react';
import axios from 'axios';

// 신고 데이터 타입 정의
interface ReportedArtwork {
    id: number;
    title: string;
    authorNickname: string;
    reportCount: number;
    reason: string;
    imageUrl: string;
    isHidden: boolean;
}

const AdminArtworkManagement = () => {
    const [reports, setReports] = useState<ReportedArtwork[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1. 신고된 작품 목록 가져오기
    useEffect(() => {
        const fetchReports = async () => {
            try {
                // 백엔드 API 연결 (예시 경로)
                const res = await axios.get('/api/admin/reports');
                setReports(res.data);
            } catch (err) {
                console.error("신고 목록 로딩 실패", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReports();
    }, []);

    // 2. 작품 비공개/공개 전환 함수
    const toggleVisibility = async (artworkId: number, currentStatus: boolean) => {
        if (!confirm(currentStatus ? "이 작품을 다시 공개하시겠습니까?" : "이 작품을 비공개 처리하시겠습니까?")) return;

        try {
            await axios.patch(`/api/admin/artworks/${artworkId}/visibility`);
            setReports(reports.map(r => r.id === artworkId ? { ...r, isHidden: !currentStatus } : r));
        } catch (err) {
            alert("상태 변경에 실패했습니다.");
        }
    };

    return (
        <div style={s.container}>
            <header style={s.header}>
                <h1 style={s.title}>📢 신고된 작품 관리</h1>
                <p style={s.meta}>신고 횟수가 많은 순으로 정렬되어 있습니다. 🔥</p>
            </header>

            <div style={s.grid}>
                {isLoading ? (
                    <div style={s.emptyState}>로딩 중... 🔄</div>
                ) : reports.length === 0 ? (
                    <div style={s.emptyState}>신고된 작품이 없습니다. ✨</div>
                ) : reports.map((item) => (
                    <div key={item.id} style={{...s.card, opacity: item.isHidden ? 0.6 : 1}}>
                        <div style={s.imageWrapper}>
                            <img src={item.imageUrl} alt={item.title} style={s.image} />
                            {item.isHidden && <div style={s.hiddenBadge}>비공개 상태</div>}
                        </div>

                        <div style={s.info}>
                            <div style={s.badgeGroup}>
                                <span style={s.reportBadge}>신고 {item.reportCount}건</span>
                            </div>
                            <h3 style={s.artworkTitle}>{item.title}</h3>
                            <p style={s.author}>작가: {item.authorNickname}</p>
                            <p style={s.reason}>최근 신고 사유: {item.reason}</p>

                            <button
                                onClick={() => toggleVisibility(item.id, item.isHidden)}
                                style={{
                                    ...s.actionBtn,
                                    backgroundColor: item.isHidden ? '#10B981' : '#EF4444'
                                }}
                            >
                                {item.isHidden ? "다시 공개하기" : "비공개 처리"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 🌌 스타일 가이드 (Glassmorphism 강화)
const s: Record<string, React.CSSProperties> = {
    container: { padding: '40px' },
    header: { marginBottom: '40px' },
    title: { fontSize: '28px', fontWeight: 800, color: '#4C1D95' },
    meta: { color: '#7C3AED', fontWeight: 600, opacity: 0.8 },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },

    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: '30px',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        transition: 'all 0.3s ease'
    },

    imageWrapper: { position: 'relative', width: '100%', height: '200px', overflow: 'hidden' },
    image: { width: '100%', height: '100%', objectFit: 'cover' },
    hiddenBadge: {
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800
    },

    info: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
    badgeGroup: { marginBottom: '5px' },
    reportBadge: { background: '#FEE2E2', color: '#EF4444', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800 },
    artworkTitle: { fontSize: '18px', fontWeight: 800, color: '#4C1D95' },
    author: { fontSize: '14px', color: '#64748B' },
    reason: { fontSize: '13px', color: '#94A3B8', fontStyle: 'italic' },

    actionBtn: {
        marginTop: '10px', padding: '12px', border: 'none', borderRadius: '15px',
        color: '#fff', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s'
    },
    emptyState: { textAlign: 'center', padding: '60px', color: '#94A3B8', fontSize: '16px', gridColumn: '1 / -1' }
};

export default AdminArtworkManagement;