import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Phone, MessageSquare } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

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
    { id: 11, category: "토큰", question: "무료 토큰은 어떻게 받나요?", answer: "매일 출석 체크를 하면 토큰 1개가 지급됩니다. 연속 출석 시 추가 보너스 토큰도 받을 수 있어요." },
    { id: 12, category: "토큰", question: "토큰 유효기간이 있나요?", answer: "유료로 구매한 토큰은 구매일로부터 1년간 유효합니다. 출석 등으로 지급된 무료 토큰은 별도 공지가 없는 한 만료되지 않습니다." },
    { id: 13, category: "결제", question: "토큰 환불은 어떻게 하나요?", answer: "구매 후 7일 이내, 사용 내역이 없는 경우 전액 환불이 가능합니다. 일부 사용한 경우 잔여 토큰에서 결제 수수료를 제외하고 환불됩니다." },
    { id: 14, category: "갤러리", question: "작품을 삭제하면 복구할 수 있나요?", answer: "삭제된 작품은 복구가 불가능합니다. 삭제 전 반드시 다운로드하여 보관해 주세요." },
    { id: 15, category: "갤러리", question: "다른 사람의 작품에 좋아요를 누를 수 있나요?", answer: "갤러리에서 마음에 드는 작품에 응원하기(좋아요)를 누를 수 있습니다. 로그인이 필요합니다." },
    { id: 16, category: "계정", question: "소셜 로그인과 일반 로그인을 동시에 사용할 수 있나요?", answer: "동일한 이메일로 가입된 경우 계정이 연동되어 있을 수 있습니다. 로그인 방식이 다를 경우 별도 계정으로 처리되니 주의해 주세요." },
    { id: 17, category: "계정", question: "닉네임을 변경하고 싶어요.", answer: "마이페이지 > 프로필 편집에서 닉네임을 변경할 수 있습니다." },
    { id: 18, category: "버그", question: "그림이 저장되지 않아요.", answer: "저장 중 오류가 발생했을 가능성이 있습니다. 네트워크 연결을 확인하고 다시 시도해 주세요. 반복적으로 발생하면 문의해 주세요." },
    { id: 19, category: "버그", question: "앱이 느리거나 자꾸 멈춰요.", answer: "브라우저 캐시를 지우거나 다른 브라우저로 접속해 보세요. Chrome 최신 버전 사용을 권장합니다." },
    { id: 20, category: "신고", question: "다른 사용자로부터 불쾌한 행동을 당했어요.", answer: "해당 사용자의 프로필 또는 작품에서 신고하기를 이용해 주세요. 관리자가 검토 후 제재 조치를 취하겠습니다." },
] as const;

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
    "토큰":  { bg: '#fef9c3', color: '#a16207' },
    "결제":  { bg: '#fce7f3', color: '#9d174d' },
    "갤러리":{ bg: '#dbeafe', color: '#1e40af' },
    "버그":  { bg: '#fee2e2', color: '#991b1b' },
    "계정":  { bg: '#d1fae5', color: '#065f46' },
    "신고":  { bg: '#ede9fe', color: '#5b21b6' },
};

export const Inquiry = () => {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const [formData, setFormData] = useState({ category: '토큰 / 결제', title: '', content: '' });
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [openId, setOpenId] = useState<number | null>(null);
    const [faqLimit, setFaqLimit] = useState(10);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 300);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);


    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f && f.size > 5 * 1024 * 1024) {
            alert("파일 크기는 5MB를 초과할 수 없습니다.");
            e.target.value = "";
            return;
        }
        if (f) setFile(f);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const data = new FormData();
        data.append('inquiry', new Blob([JSON.stringify(formData)], { type: 'application/json' }));
        if (file) data.append('file', file);
        try {
            await axios.post('/api/inquiries', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert("문의가 접수되었습니다.\n빠른 시일 내에 확인 후 처리해 드리겠습니다.");
            setFormData(prev => ({ ...prev, title: '', content: '' }));
            setFile(null);
            setShowForm(false);
        } catch (error) {
            const err = error as AxiosError<string>;
            alert(err.response?.data || "접수 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={s.bg} className="inq-bg">
            <style>{`
                @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
                .inq-back:hover { background: rgba(107,130,160,0.12) !important; }
                .inq-faq:hover { background: rgba(107,130,160,0.04) !important; }
                .inq-more:hover { background: rgba(107,130,160,0.06) !important; border-color: rgba(107,130,160,0.35) !important; }
                .inq-contact-card:hover { border-color: rgba(196,122,138,0.4) !important; box-shadow: 0 8px 32px rgba(107,130,160,0.16) !important; transform: translateY(-2px); }
                .inq-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
                .inq-top:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(107,130,160,0.3) !important; }
                @media (max-width: 640px) {
                  .inq-bg { padding: 80px 12px 60px !important; }
                  .inq-hero { padding: 28px 20px !important; }
                  .inq-contact-row { flex-direction: column !important; }
                  .inq-modal { min-width: unset !important; max-width: calc(100vw - 32px) !important; padding: 24px 20px !important; }
                  .inq-faq-item { padding: 14px 16px !important; }
                }
                @media (min-width: 641px) and (max-width: 860px) {
                  .inq-modal { min-width: unset !important; max-width: 480px !important; }
                }
            `}</style>

            <main style={s.main}>
                <button className="inq-back" onClick={() => navigate(-1)} style={s.backBtn}>
                    <ArrowLeft size={15} strokeWidth={2.5} />
                    돌아가기
                </button>

                {/* 헤더 */}
                <div style={s.heroCard} className="inq-hero">
                    <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 60, marginBottom: 12 }} />
                    <h1 style={s.heroTitle}>무엇을 도와드릴까요?</h1>
                    <p style={s.heroSub}>자주 묻는 질문을 먼저 확인해 보세요.</p>
                </div>

                {/* FAQ */}
                <section style={s.section}>
                    <h2 style={s.sectionLabel}>자주 묻는 질문</h2>
                    <div style={s.faqList}>
                        {faqData.slice(0, faqLimit).map((faq) => {
                            const badge = CATEGORY_COLORS[faq.category] ?? { bg: '#f3f4f6', color: '#374151' };
                            const isOpen = openId === faq.id;
                            return (
                                <div key={faq.id} style={s.faqItem} className="inq-faq-item">
                                    <button
                                        className="inq-faq"
                                        onClick={() => setOpenId(isOpen ? null : faq.id)}
                                        style={s.faqQ}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                            <span style={{ ...s.badge, background: badge.bg, color: badge.color }}>{faq.category}</span>
                                            <span style={s.faqQText}>{faq.question}</span>
                                        </div>
                                        {isOpen
                                            ? <ChevronUp size={16} color="#6B82A0" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                                            : <ChevronDown size={16} color="#6B82A0" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                                        }
                                    </button>
                                    {isOpen && (
                                        <div style={s.faqA}>
                                            <span style={s.faqALabel}>A</span>
                                            <p style={s.faqAText}>{faq.answer}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {faqLimit < faqData.length && (
                        <button className="inq-more" onClick={() => setFaqLimit(f => f + 5)} style={s.moreBtn}>
                            더보기 ({faqData.length - faqLimit}개 남음)
                            <ChevronDown size={15} strokeWidth={2.5} />
                        </button>
                    )}
                </section>

                <div style={s.divider} />

                {/* 문의하기 */}
                <section style={s.section}>
                    <h2 style={s.sectionLabel}>직접 문의하기</h2>
                    <p style={s.contactDesc}>FAQ에서 원하는 답변을 찾지 못하셨나요? 직접 문의를 남겨주세요.</p>
                    <p style={s.contactHours}>운영시간 · 평일 10:00 ~ 18:00 &nbsp;|&nbsp; 점심 12:00 ~ 13:00 &nbsp;|&nbsp; 주말 · 공휴일 휴무</p>

                    <div style={s.contactCards} className="inq-contact-row">
                        <button className="inq-contact-card" onClick={() => setShowFormModal(true)} style={s.contactCard}>
                            <MessageSquare size={28} color="#c47a8a" strokeWidth={1.8} />
                            <div>
                                <div style={s.contactCardTitle}>1:1 문의 작성</div>
                                <div style={s.contactCardSub}>평균 답변 1 ~ 10분</div>
                            </div>
                        </button>
                        <button className="inq-contact-card" onClick={() => setShowPhoneModal(true)} style={s.contactCard}>
                            <Phone size={28} color="#6B82A0" strokeWidth={1.8} />
                            <div>
                                <div style={s.contactCardTitle}>전화 상담</div>
                                <div style={s.contactCardSub}>평균 대기 5 ~ 15분</div>
                            </div>
                        </button>
                    </div>
                </section>

                <div style={s.footer}>이그에그와 함께 즐거운 창작 시간 되세요!</div>
            </main>

            {/* 1:1 문의 모달 */}
            {showFormModal && (
                <div style={s.modalOverlay} onClick={() => setShowFormModal(false)}>
                    <div style={{ ...s.modalBox, minWidth: 480, maxWidth: 560, padding: '36px 40px 32px' }} className="inq-modal" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 24 }}>
                            <h3 style={s.modalTitle}>1:1 문의 접수</h3>
                            <button onClick={() => setShowFormModal(false)} style={s.formClose}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                            <div style={s.formGroup}>
                                <label style={s.label}>문의 유형</label>
                                <select style={s.select} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                    <option>토큰 / 결제</option>
                                    <option>AI 생성 오류</option>
                                    <option>계정 / 로그인</option>
                                    <option>기능 제안</option>
                                    <option>신고</option>
                                    <option>기타</option>
                                </select>
                            </div>
                            <div style={s.formGroup}>
                                <label style={s.label}>제목</label>
                                <input type="text" style={s.input} placeholder="제목을 입력해주세요." value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                            </div>
                            <div style={s.formGroup}>
                                <label style={s.label}>상세 내용</label>
                                <textarea style={s.textarea} placeholder="내용을 상세히 입력해주세요." value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required />
                            </div>
                            <div style={s.fileBox}>
                                <input type="file" onChange={handleFileChange} accept="image/*" />
                                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>최대 5MB · JPG / PNG / GIF</p>
                            </div>
                            <button type="submit" disabled={isLoading} className="inq-submit" style={s.submitBtn}>
                                {isLoading ? "전송 중..." : "문의 접수하기"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 전화 상담 모달 */}
            {showPhoneModal && (
                <div style={s.modalOverlay} onClick={() => setShowPhoneModal(false)}>
                    <div style={s.modalBox} className="inq-modal" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 }}>
                            <h3 style={{ ...s.modalTitle, margin: 0 }}>전화 상담</h3>
                            <button onClick={() => setShowPhoneModal(false)} style={s.formClose}>✕</button>
                        </div>
                        <div style={s.modalIcon}><Phone size={32} color="#6B82A0" strokeWidth={1.8} /></div>
                        <p style={s.modalPhone}>02-1234-5678</p>
                        <div style={s.modalInfoList}>
                            <div style={s.modalInfoRow}><span style={s.modalInfoLabel}>운영시간</span><span>평일 10:00 ~ 18:00</span></div>
                            <div style={s.modalInfoRow}><span style={s.modalInfoLabel}>점심시간</span><span>12:00 ~ 13:00</span></div>
                            <div style={s.modalInfoRow}><span style={s.modalInfoLabel}>휴무</span><span>주말 · 공휴일</span></div>
                        </div>
                        <p style={s.modalTip}>
                            대기 없이 빠른 답변을 원하신다면{' '}
                            <span style={{ color: '#c47a8a', fontWeight: 700, cursor: 'pointer' }} onClick={() => { setShowPhoneModal(false); setShowFormModal(true); }}>1:1 문의 작성</span>을 이용해 보세요.
                        </p>
                        <button
                            onClick={() => window.location.href = 'tel:0212345678'}
                            style={s.modalCallBtn}
                        >
                            <Phone size={15} strokeWidth={2.5} /> 전화 걸기
                        </button>
                    </div>
                </div>
            )}

            <button
                className="inq-top"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{ ...s.topBtn, opacity: showTop ? 1 : 0, pointerEvents: showTop ? 'auto' : 'none', transform: showTop ? 'translateY(0)' : 'translateY(10px)' }}
            >
                <ChevronUp size={20} color="#6B82A0" strokeWidth={2.5} />
            </button>
        </div>
    );
};

const s: Record<string, React.CSSProperties> = {
    bg: {
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f5f0f8 0%, #ede8f2 40%, #f0eee9 100%)',
        padding: '64px 20px 80px',
    },
    main: {
        maxWidth: 760, margin: '0 auto',
        animation: 'fadeUp 0.5s ease both',
    },
    backBtn: {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        marginBottom: 24, padding: '8px 16px',
        fontSize: 13, fontWeight: 600, color: '#6B82A0',
        background: 'rgba(107,130,160,0.07)',
        border: '1.5px solid rgba(107,130,160,0.18)',
        borderRadius: 100, cursor: 'pointer', transition: 'background 0.15s',
    },
    heroCard: {
        background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(245,240,248,0.85) 100%)',
        border: '1.5px solid rgba(255,255,255,0.75)',
        borderRadius: 24, padding: '40px 48px',
        boxShadow: '0 8px 40px rgba(107,130,160,0.13)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', marginBottom: 36,
    },
    heroTitle: {
        fontSize: 28, fontWeight: 900, margin: '0 0 8px',
        background: 'linear-gradient(135deg, #c47a8a 0%, #6B82A0 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        letterSpacing: -0.5,
    },
    heroSub: { fontSize: 14, color: '#9ca3af', margin: 0, fontWeight: 500 },
    section: { marginBottom: 40 },
    sectionLabel: {
        fontSize: 13, fontWeight: 700, color: '#6B82A0',
        textTransform: 'uppercase', letterSpacing: 1.2,
        margin: '0 0 16px',
    },
    faqList: { display: 'flex', flexDirection: 'column', gap: 8 },
    moreBtn: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        width: '100%', marginTop: 12, padding: '12px',
        background: 'transparent', border: '1.5px solid rgba(107,130,160,0.2)',
        borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#6B82A0',
        cursor: 'pointer', transition: 'all 0.15s',
    },
    faqItem: {
        background: 'rgba(255,255,255,0.88)',
        border: '1.5px solid rgba(107,130,160,0.13)',
        borderRadius: 14, overflow: 'hidden',
    },
    faqQ: {
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, padding: '16px 20px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        transition: 'background 0.15s', textAlign: 'left',
    },
    faqQText: { fontSize: 14, fontWeight: 600, color: '#3d3d5c', lineHeight: 1.4 },
    badge: {
        fontSize: 11, fontWeight: 700, padding: '3px 8px',
        borderRadius: 6, flexShrink: 0, whiteSpace: 'nowrap' as const,
    },
    faqA: {
        display: 'flex', gap: 12, padding: '14px 20px 16px',
        background: 'rgba(107,130,160,0.04)',
        borderTop: '1px solid rgba(107,130,160,0.1)',
        animation: 'slideDown 0.2s ease both',
    },
    faqALabel: {
        fontSize: 13, fontWeight: 900, color: '#c47a8a',
        flexShrink: 0, marginTop: 1,
    },
    faqAText: { fontSize: 14, color: '#6a6a8a', lineHeight: 1.7, margin: 0 },
    divider: {
        height: 1,
        background: 'linear-gradient(to right, transparent, rgba(107,130,160,0.2), transparent)',
        margin: '0 0 36px',
    },
    contactDesc: { fontSize: 14, color: '#8a94a8', margin: '0 0 6px', fontWeight: 500 },
    contactHours: { fontSize: 12, color: '#8a94a8', margin: '0 0 20px', fontWeight: 500 },
    contactCards: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    contactCard: {
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '24px 28px',
        background: 'rgba(255,255,255,0.88)',
        border: '1.5px solid rgba(107,130,160,0.15)',
        borderRadius: 16, cursor: 'pointer',
        transition: 'all 0.2s', textAlign: 'left' as const,
    },
    contactCardTitle: { fontSize: 15, fontWeight: 700, color: '#3d3d5c', marginBottom: 4 },
    contactCardSub: { fontSize: 13, color: '#9ca3af', fontWeight: 500 },
    formCard: {
        background: 'rgba(255,255,255,0.92)',
        border: '1.5px solid rgba(107,130,160,0.15)',
        borderRadius: 20, padding: '32px 36px',
        animation: 'slideDown 0.25s ease both',
    },
    formTitle: { fontSize: 17, fontWeight: 800, color: '#4a4a6a', margin: 0 },
    formClose: {
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 18, color: '#9ca3af', padding: 4, lineHeight: 1,
    },
    gridRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 4 },
    formGroup: { marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 },
    label: { fontSize: 13, fontWeight: 700, color: '#4a4a6a' },
    input: {
        padding: '11px 14px', borderRadius: 10,
        border: '1.5px solid rgba(107,130,160,0.2)',
        fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.6)',
        color: '#3d3d5c',
    },
    select: {
        padding: '11px 36px 11px 14px', borderRadius: 10,
        border: '1.5px solid rgba(107,130,160,0.2)',
        fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.6)',
        color: '#3d3d5c', width: '100%', cursor: 'pointer',
        appearance: 'none' as const,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B82A0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
    },
    textarea: {
        padding: '11px 14px', borderRadius: 10,
        border: '1.5px solid rgba(107,130,160,0.2)',
        fontSize: 14, minHeight: 130, resize: 'vertical' as const,
        outline: 'none', background: 'rgba(255,255,255,0.6)', color: '#3d3d5c',
    },
    fileBox: {
        border: '1.5px dashed rgba(107,130,160,0.25)',
        padding: '20px 16px', borderRadius: 10, textAlign: 'center' as const,
        marginBottom: 20,
    },
    submitBtn: {
        width: '100%', padding: '13px',
        background: 'linear-gradient(135deg, #c47a8a 0%, #6B82A0 100%)',
        color: '#fff', border: 'none', borderRadius: 10,
        fontSize: 15, fontWeight: 700, cursor: 'pointer',
        transition: 'all 0.2s',
    },
    footer: {
        marginTop: 48, textAlign: 'center' as const,
        fontSize: 13, color: '#a09ab0', fontWeight: 600,
        borderTop: '1px solid rgba(107,130,160,0.1)', paddingTop: 24,
    },
    topBtn: {
        position: 'fixed', bottom: 36, right: 36,
        width: 44, height: 44, borderRadius: '50%',
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(107,130,160,0.2)',
        boxShadow: '0 4px 16px rgba(107,130,160,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', zIndex: 100,
        transition: 'all 0.25s',
    },
    modalOverlay: {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
    },
    modalBox: {
        background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(245,240,248,0.95) 100%)',
        border: '1.5px solid rgba(255,255,255,0.8)',
        borderRadius: 24, padding: '40px 44px 32px',
        boxShadow: '0 20px 60px rgba(107,130,160,0.2)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        minWidth: 300,
        animation: 'fadeUp 0.25s ease both',
    },
    modalIcon: {
        width: 64, height: 64, borderRadius: '50%',
        background: 'rgba(107,130,160,0.08)',
        border: '1.5px solid rgba(107,130,160,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    modalTitle: { fontSize: 17, fontWeight: 800, color: '#4a4a6a', margin: '0 0 6px' },
    modalPhone: {
        fontSize: 26, fontWeight: 900, letterSpacing: -0.5,
        background: 'linear-gradient(135deg, #c47a8a 0%, #6B82A0 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        margin: '0 0 20px',
    },
    modalInfoList: {
        width: '100%', display: 'flex', flexDirection: 'column', gap: 8,
        background: 'rgba(107,130,160,0.05)', borderRadius: 12,
        padding: '14px 18px', marginBottom: 24,
    },
    modalInfoRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6a6a8a' },
    modalInfoLabel: { fontWeight: 700, color: '#4a4a6a' },
    modalCallBtn: {
        width: '100%', padding: '12px',
        background: 'linear-gradient(135deg, #c47a8a 0%, #6B82A0 100%)',
        color: '#fff', border: 'none', borderRadius: 10,
        fontSize: 14, fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        marginBottom: 10,
    },
    modalWaitRow: {
        width: '100%', display: 'flex', alignItems: 'center',
        gap: 12, marginBottom: 14,
    },
    modalWaitItem: {
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        background: 'rgba(107,130,160,0.05)', borderRadius: 10, padding: '12px 8px',
    },
    modalWaitLabel: { fontSize: 11, color: '#9ca3af', fontWeight: 600 },
    modalWaitValue: { fontSize: 15, fontWeight: 800, color: '#6B82A0' },
    modalWaitDivider: { width: 1, height: 36, background: 'rgba(107,130,160,0.15)', flexShrink: 0 },
    modalTip: {
        fontSize: 13, color: '#9ca3af', lineHeight: 1.7,
        textAlign: 'center' as const, margin: '0 0 16px',
        background: 'rgba(107,130,160,0.05)', borderRadius: 10,
        padding: '10px 14px',
    },
    modalCloseBtn: {
        width: '100%', padding: '10px',
        background: 'transparent', color: '#9ca3af',
        border: '1.5px solid rgba(107,130,160,0.18)', borderRadius: 10,
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
    },
};

export default Inquiry;
