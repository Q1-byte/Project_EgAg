import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom'; // 뒤로가기 추가
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

// FAQ 데이터
const faqData = [
    { id: 1, category: "토큰", question: "토큰은 어떻게 사용되나요?", answer: "토큰은 그림 생성 시 1회당 1개씩 소모됩니다. 현재 보유 중인 토큰은 마이페이지나 홈 화면 상단에서 확인하실 수 있습니다." },
    { id: 2, category: "토큰", question: "그림 도중 나가면 토큰은 환불되나요?", answer: "그림 생성이 시작된 후 페이지를 이탈하면 토큰이 소모됩니다. 네트워크 오류 등으로 중단된 경우 고객센터로 문의 부탁드립니다." },
    { id: 3, category: "토큰", question: "서버 오류로 그림이 중단되면 토큰은?", answer: "서버 측 오류가 확인될 경우, 내부 로그 확인 후 소모된 토큰을 즉시 복구해 드립니다." },
    { id: 4, category: "결제", question: "결제했는데 토큰이 안 들어왔어요.", answer: "결제 대행사와 연동 과정에서 지연이 발생할 수 있습니다. 5분 뒤에도 반영되지 않는다면 결제 영수증을 첨부하여 문의해 주세요." },
    { id: 5, category: "결제", question: "카카오페이 / 토스페이로 결제 가능한가요?", answer: "현재 카카오페이, 토스페이, 신용카드 결제를 모두 지원하고 있습니다." },
    { id: 6, category: "갤러리", question: "완성된 그림은 어디서 다운받나요?", answer: "갤러리 메뉴에서 본인의 작품을 클릭한 후, 하단의 '다운로드' 버튼을 누르면 기기에 저장됩니다." },
    { id: 7, category: "갤러리", question: "내 작품을 다른 사람이 볼 수 있나요?", answer: "기본적으로 작품은 '공개' 상태입니다. 비공개를 원하실 경우 작품 상세 설정에서 변경 가능합니다." },
    { id: 8, category: "버그", question: "AI가 이상한 그림을 그려요.", answer: "AI 모델의 특성상 의도와 다른 결과가 나올 수 있습니다. 스케치를 조금 더 구체적으로 그리거나 가이드를 참고해 보세요." },
    { id: 9, category: "계정", question: "회원 탈퇴 후 작품은 어떻게 되나요?", answer: "탈퇴 시 모든 개인정보와 작품 데이터는 즉시 삭제되며 복구가 불가능하니 주의해 주세요." },
    { id: 10, category: "신고", question: "작품을 신고하고 싶어요.", answer: "부적절한 작품 하단의 '신고하기' 버튼을 누르시면 관리자 검토 후 조치가 취해집니다." },
] as const;

export const Inquiry = () => {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const userId = useAuthStore((state) => state.userId);

    const [formData, setFormData] = useState({
        category: '결제 문제',
        title: '',
        content: '',
        email: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [openId, setOpenId] = useState<number | null>(null);

    // ⭐ 1. Top 버튼 표시 상태 추가
    const [showTopBtn, setShowTopBtn] = useState(false);

    // ⭐ 2. 스크롤 감지 및 Top 버튼 제어
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 400) { // 400px 이상 내리면 표시
                setShowTopBtn(true);
            } else {
                setShowTopBtn(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // ⭐ 3. 위로 가기 함수
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        if (isAuthenticated && userId) {
            setFormData(prev => ({ ...prev, email: userId }));
        }
    }, [isAuthenticated, userId]);

    const toggleFaq = (id: number) => {
        setOpenId(openId === id ? null : id);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
            alert("파일 크기는 5MB를 초과할 수 없습니다.");
            e.target.value = "";
            return;
        }
        if (selectedFile) setFile(selectedFile);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const data = new FormData();
        const inquiryBlob = new Blob([JSON.stringify(formData)], { type: 'application/json' });
        data.append('inquiry', inquiryBlob);
        if (file) data.append('file', file);

        try {
            await axios.post('/api/inquiries', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert("문의가 접수되었습니다. 메일을 확인해주세요!");
            setFormData(prev => ({ ...prev, title: '', content: '' }));
            setFile(null);
        } catch (error) {
            const err = error as AxiosError<string>;
            alert(err.response?.data || "접수 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={s.container}>
            <div style={s.card}>
                {/* 닫기 버튼 */}
                <button
                    onClick={() => navigate(-1)}
                    style={s.closeButton}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F3FF')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    ✕
                </button>

                {/* ⭐ 4. Top 버튼 구현 (삼항 연산자로 조건부 렌더링) */}
                <button
                    onClick={scrollToTop}
                    style={{
                        ...s.topButton,
                        opacity: showTopBtn ? 1 : 0,
                        pointerEvents: showTopBtn ? 'auto' : 'none'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.backgroundColor = '#F5F3FF';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                    }}
                >
                    UP 🐣
                </button>

                <header style={s.header}>
                    <span style={s.icon}>🐣</span>
                    <h1 style={s.title}>문의하기</h1>
                    <p style={s.meta}>궁금한 점이나 불편한 사항을 알려주세요!</p>
                </header>

                <div style={s.divider} />

                {/* 1:1 문의 섹션 */}
                <section style={{ marginBottom: '60px' }}>
                    <h2 style={s.sectionTitle}>📧 1:1 문의 접수</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={s.gridGroup}>
                            <div style={s.formGroup}>
                                <label style={s.label}>문의 유형</label>
                                <select
                                    style={s.input}
                                    value={formData.category}
                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                >
                                    <option>결제 문제</option>
                                    <option>버그 신고</option>
                                    <option>기능 제안</option>
                                    <option>기타</option>
                                </select>
                            </div>
                            <div style={s.formGroup}>
                                <label style={s.label}>답변 받을 이메일</label>
                                <input
                                    type="email"
                                    style={s.input}
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div style={s.formGroup}>
                            <label style={s.label}>제목</label>
                            <input
                                type="text"
                                style={s.input}
                                placeholder="제목을 입력해주세요."
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                required
                            />
                        </div>

                        <div style={s.formGroup}>
                            <label style={s.label}>상세 내용</label>
                            <textarea
                                style={s.textarea}
                                placeholder="내용을 상세히 입력해주세요."
                                value={formData.content}
                                onChange={(e) => setFormData({...formData, content: e.target.value})}
                                required
                            ></textarea>
                        </div>

                        <div style={s.fileUpload}>
                            <input type="file" onChange={handleFileChange} accept="image/*" />
                            <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>최대 5MB, JPG · PNG · GIF</p>
                        </div>

                        <button type="submit" disabled={isLoading} style={s.submitBtn}>
                            {isLoading ? "전송 중..." : "문의 접수하기"}
                        </button>
                    </form>
                </section>

                <div style={s.divider} />

                {/* FAQ 섹션 */}
                <section>
                    <h2 style={s.sectionTitle}>❓ 자주 묻는 질문 (FAQ)</h2>
                    <div style={s.faqSection}>
                        {faqData.map((faq) => (
                            <div key={faq.id} style={s.faqItem}>
                                <div style={s.faqQuestion} onClick={() => toggleFaq(faq.id)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={s.categoryBadge}>{faq.category}</span>
                                        <span>{faq.question}</span>
                                    </div>
                                    <span style={{
                                        transform: openId === faq.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s',
                                        color: '#7C3AED'
                                    }}>▼</span>
                                </div>
                                <div style={{
                                    maxHeight: openId === faq.id ? '500px' : '0',
                                    overflow: 'hidden',
                                    transition: 'max-height 0.3s ease-in-out',
                                }}>
                                    <div style={s.faqAnswer}>
                                        <strong style={{ color: '#7C3AED', display: 'block', marginBottom: '4px' }}>A.</strong>
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

// 🌌 스타일 업데이트
const s: Record<string, React.CSSProperties> = {
    // ... 이전 스타일 유지
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #FDECF2 0%, #E0E7FF 50%, #F5F3FF 100%)', padding: '60px 20px', display: 'flex', justifyContent: 'center' },
    card: { backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', maxWidth: '850px', width: '100%', borderRadius: '40px', padding: '60px 50px', boxShadow: '0 10px 25px rgba(165, 180, 252, 0.15)', border: '2px solid #FFFFFF', position: 'relative' },
    closeButton: { position: 'absolute', top: '30px', right: '30px', width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', fontSize: '20px', color: '#7C3AED', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' },

    // ⭐ 추가된 Top 버튼 스타일
    topButton: {
        position: 'fixed',
        bottom: '20px',    // 하단 여백은 안정감 있게 유지
        right: '-75px',     // ⭐ 우측 여백을 10px로 더 바짝 밀착!

        width: '55px',
        height: '55px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        border: '2px solid #DDD6FE',
        color: '#7C3AED',
        fontSize: '13px',
        fontWeight: 800,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 20px rgba(139, 92, 246, 0.2)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        zIndex: 1000,
    },

    header: { textAlign: 'center', marginBottom: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' },
    icon: { fontSize: '64px', marginBottom: '10px', filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))' },
    title: { fontSize: '32px', fontWeight: 800, color: '#5B21B6', margin: '10px 0' },
    meta: { fontSize: '15px', color: '#7C3AED', fontWeight: 600, opacity: 0.8 },
    divider: { height: '2px', background: 'linear-gradient(to right, transparent, #DDD6FE, transparent)', margin: '40px 0' },
    sectionTitle: { fontSize: '22px', fontWeight: 800, color: '#5B21B6', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' },
    gridGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
    formGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: 700, color: '#4C1D95', paddingLeft: '4px' },
    input: { padding: '14px 16px', borderRadius: '15px', border: '1px solid #DDD6FE', fontSize: '15px', outline: 'none', backgroundColor: 'rgba(255,255,255,0.5)' },
    textarea: { padding: '14px 16px', borderRadius: '15px', border: '1px solid #DDD6FE', fontSize: '15px', minHeight: '150px', resize: 'vertical', outline: 'none', backgroundColor: 'rgba(255,255,255,0.5)' },
    fileUpload: { border: '2px dashed #DDD6FE', padding: '30px', borderRadius: '20px', textAlign: 'center', marginBottom: '30px' },
    submitBtn: { width: '100%', padding: '16px', background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', color: '#fff', border: 'none', borderRadius: '15px', fontSize: '17px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' },
    faqSection: { display: 'flex', flexDirection: 'column', gap: '15px' },
    faqItem: { background: 'rgba(255, 255, 255, 0.5)', borderRadius: '18px', overflow: 'hidden', border: '1px solid #DDD6FE' },
    faqQuestion: { padding: '20px 25px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, color: '#4C1D95' },
    faqAnswer: { padding: '20px 25px', color: '#4C1D95', fontSize: '15px', lineHeight: 1.7, background: 'rgba(245, 243, 255, 0.5)' },
    categoryBadge: { fontSize: '12px', fontWeight: 800, background: '#F5F3FF', color: '#7C3AED', padding: '4px 10px', borderRadius: '8px', border: '1px solid #DDD6FE' }
};

export default Inquiry;