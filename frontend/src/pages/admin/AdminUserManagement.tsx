import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

interface UserInfo {
    id: string;
    nickname: string;
    email: string;
    tokenBalance: number;
    isSuspended: boolean;
    role: string;
    createdAt: string;
}

interface TokenLog {
    id: number;
    targetNickname: string;
    amount: number;
    reason: string;
    createdAt: string;
    adminNickname: string;
}

const AdminUserManagement = () => {
    const { isAuthenticated, role, accessToken } = useAuthStore();

    const [searchKeyword, setSearchKeyword] = useState('');
    const [filterSearchTerm, setFilterSearchTerm] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'USER' | 'ADMIN' | 'SUSPENDED'>('ALL');

    const [user, setUser] = useState<UserInfo | null>(null);
    const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
    const [tokenAmount, setTokenAmount] = useState(1);
    const [reason, setReason] = useState('결제 오류 보상');
    const [logs, setLogs] = useState<TokenLog[]>([]);
    const [loading, setLoading] = useState(true);

    const getAuthHeader = useCallback(() => ({
        headers: { Authorization: `Bearer ${accessToken}` }
    }), [accessToken]);

    // ✅ fetchData를 async/await 규칙에 맞게 수정
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [logsRes, usersRes] = await Promise.all([
                axios.get('/api/admin/tokens/logs', getAuthHeader()),
                axios.get('/api/admin/users/all', getAuthHeader())
            ]);
            setLogs(logsRes.data);
            setAllUsers(usersRes.data);
        } catch {
            // ✅ 'err'를 사용하지 않을 때는 아예 생략하거나 _ 처리하여 ESLint 해결
            console.error("데이터 로딩 중 서버 에러 발생");
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    useEffect(() => {
        if (isAuthenticated && (role === 'ADMIN' || String(role) === '100') && accessToken) {
            // ✅ Promise returned from fetchData is ignored 해결: .catch() 추가 또는 void 연산자
            void fetchData();
        }
    }, [isAuthenticated, role, accessToken, fetchData]);

    const filteredUsers = useMemo(() => {
        return allUsers.filter(u => {
            const matchesFilter =
                filter === 'ALL' ||
                (filter === 'ADMIN' && u.role === 'ADMIN') ||
                (filter === 'USER' && u.role === 'USER') ||
                (filter === 'SUSPENDED' && u.isSuspended);

            const matchesSearch =
                u.nickname.toLowerCase().includes(filterSearchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(filterSearchTerm.toLowerCase());

            return matchesFilter && matchesSearch;
        });
    }, [allUsers, filter, filterSearchTerm]);

    if (!isAuthenticated || (role !== 'ADMIN' && String(role) !== '100')) {
        return <Navigate to="/" replace />;
    }

    const handleSearch = async () => {
        if (!searchKeyword.trim()) return;
        try {
            const res = await axios.get(`/api/admin/users`, {
                params: { nickname: searchKeyword },
                ...getAuthHeader()
            });
            setUser(res.data);
        } catch {
            alert("유저를 찾을 수 없습니다.");
            setUser(null);
        }
    };

    const handleGiveToken = async () => {
        if (!user) return;
        if (!confirm(`${user.nickname}님에게 ${tokenAmount} 토큰을 지급하시겠습니까?`)) return;
        try {
            await axios.post('/api/admin/tokens/manual', {
                userId: user.id, amount: tokenAmount, reason: reason
            }, getAuthHeader());
            alert("지급 완료!");
            setUser({ ...user, tokenBalance: user.tokenBalance + tokenAmount });
            // ✅ Missing await 해결
            await fetchData();
        } catch {
            alert("지급 실패");
        }
    };

    const handleToggleSuspension = async (targetUser: UserInfo) => {
        const action = targetUser.isSuspended ? "해제" : "정지";
        if (!confirm(`정말로 ${targetUser.nickname}님을 ${action}하시겠습니까?`)) return;
        try {
            await axios.patch(`/api/admin/users/${targetUser.id}/status`, {}, getAuthHeader());
            alert(`성공적으로 ${action}되었습니다.`);
            if (user && user.id === targetUser.id) {
                setUser({ ...user, isSuspended: !user.isSuspended });
            }
            // ✅ Missing await 해결
            await fetchData();
        } catch {
            alert("상태 변경 실패");
        }
    };

    return (
        <div style={s.container}>
            <header style={s.header}>
                <h1 style={s.title}>👥 전체 유저 관리</h1>
                <p style={s.meta}>유저 검색, 정지 처리 및 토큰 지급을 통합 관리합니다.</p>
            </header>

            {/* 1️⃣ 상단 유저 상세 검색 섹션 */}
            <div style={s.searchSection}>
                <input
                    type="text"
                    placeholder="닉네임으로 유저 상세 검색 (토큰 지급용)"
                    style={s.searchInput}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch} style={s.searchBtn}>검색</button>
            </div>

            {/* 유저 카드 (토큰 지급 영역) */}
            {user && (
                <div style={s.userCard}>
                    <div style={s.userHeader}>
                        <h2 style={s.nickname}>{user.nickname} <span style={s.emailSpan}>({user.email})</span></h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <span style={{ ...s.statusBadge, backgroundColor: user.isSuspended ? '#EF4444' : '#10B981' }}>
                                {user.isSuspended ? "정지됨" : "정상"}
                            </span>
                            <button onClick={() => handleToggleSuspension(user)} style={{ ...s.suspendBtn, backgroundColor: user.isSuspended ? '#6366F1' : '#F43F5E' }}>
                                {user.isSuspended ? "🔓 정지 해제" : "🚫 계정 정지"}
                            </button>
                        </div>
                    </div>
                    <div style={s.divider} />
                    <div style={s.actionSection}>
                        <h3 style={s.sectionSubTitle}>💰 수동 토큰 지급</h3>
                        <div style={{display: 'flex', gap: '15px'}}>
                            <input type="number" style={s.input} value={tokenAmount} onChange={(e) => setTokenAmount(Number(e.target.value))} />
                            <select style={s.input} value={reason} onChange={(e) => setReason(e.target.value)}>
                                <option>결제 오류 보상</option><option>이벤트 당첨</option><option>시스템 장애 보상</option><option>기타</option>
                            </select>
                            <button onClick={handleGiveToken} style={s.inlineSubmitBtn}>지급하기</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2️⃣ 리스트 필터링 섹션 (새로 추가) */}
            <div style={s.filterWrapper}>
                <div style={s.filterBar}>
                    {(['ALL', 'USER', 'ADMIN', 'SUSPENDED'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                ...s.filterBtn,
                                backgroundColor: filter === f ? '#7C3AED' : '#fff',
                                color: filter === f ? '#fff' : '#6B7280',
                                border: filter === f ? '1px solid #7C3AED' : '1px solid #E5E7EB',
                            }}
                        >
                            {f === 'ALL' ? '전체' : f === 'USER' ? '일반' : f === 'ADMIN' ? '관리자' : '정지'}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="목록 내 결과 검색..."
                    style={s.filterInput}
                    value={filterSearchTerm}
                    onChange={(e) => setFilterSearchTerm(e.target.value)}
                />
            </div>

            {/* 📋 전체 유저 리스트 테이블 */}
            <div style={s.logSection}>
                <h3 style={s.sectionSubTitle}>📋 유저 목록 ({filteredUsers.length}명)</h3>
                <div style={s.tableWrapper}>
                    <table style={s.table}>
                        <thead>
                        <tr style={s.tr}>
                            <th style={s.th}>가입일</th>
                            <th style={s.th}>닉네임</th>
                            <th style={s.th}>이메일</th>
                            <th style={s.th}>상태</th>
                            <th style={s.th}>관리</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={s.emptyTd}>로딩 중...</td></tr>
                        ) : filteredUsers.map(u => (
                            <tr key={u.id} style={s.tr}>
                                <td style={s.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td style={{...s.td, fontWeight: 700}}>{u.nickname}</td>
                                <td style={s.td}>{u.email}</td>
                                <td style={s.td}>
                                    <span style={{ color: u.isSuspended ? '#EF4444' : '#10B981', fontWeight: 800 }}>
                                        {u.isSuspended ? '정지' : '정상'}
                                    </span>
                                </td>
                                <td style={s.td}>
                                    <button onClick={() => handleToggleSuspension(u)} style={{ ...s.tableActionBtn, backgroundColor: u.isSuspended ? '#10B981' : '#EF4444' }}>
                                        {u.isSuspended ? '해제' : '정지'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 📝 토큰 지급 이력 테이블 */}
            <div style={{...s.logSection, marginTop: '40px'}}>
                <h3 style={s.sectionSubTitle}>📝 최근 토큰 지급 이력</h3>
                <div style={s.tableWrapper}>
                    <table style={s.table}>
                        <thead>
                        <tr style={s.tr}>
                            <th style={s.th}>일시</th>
                            <th style={s.th}>대상</th>
                            <th style={s.th}>수량</th>
                            <th style={s.th}>사유</th>
                            <th style={s.th}>관리자</th>
                        </tr>
                        </thead>
                        <tbody>
                        {logs.map(log => (
                            <tr key={log.id} style={s.tr}>
                                <td style={s.td}>{new Date(log.createdAt).toLocaleString()}</td>
                                <td style={{...s.td, fontWeight: 600}}>{log.targetNickname}</td>
                                <td style={{...s.td, color: '#6366F1', fontWeight: 800}}>+{log.amount}</td>
                                <td style={s.td}>{log.reason}</td>
                                <td style={s.td}>{log.adminNickname}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const s: Record<string, React.CSSProperties> = {
    container: { padding: '40px', maxWidth: '1100px', margin: '0 auto' },
    header: { marginBottom: '30px' },
    title: { fontSize: '26px', fontWeight: 900, color: '#4C1D95' },
    meta: { color: '#6B7280', fontSize: '14px' },
    searchSection: { display: 'flex', gap: '10px', marginBottom: '25px' },
    searchInput: { flex: 1, padding: '12px 20px', borderRadius: '12px', border: '1px solid #DDD6FE', outline: 'none' },
    searchBtn: { padding: '0 25px', borderRadius: '12px', border: 'none', background: '#7C3AED', color: '#fff', fontWeight: 700, cursor: 'pointer' },

    filterWrapper: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '10px' },
    filterBar: { display: 'flex', gap: '5px' },
    filterBtn: { padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', transition: '0.2s', fontWeight: 600 },
    filterInput: { padding: '8px 15px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '13px', width: '200px', outline: 'none' },

    userCard: { backgroundColor: '#fff', borderRadius: '20px', padding: '25px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', marginBottom: '30px' },
    userHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    nickname: { fontSize: '20px', fontWeight: 800, color: '#1F2937' },
    emailSpan: { fontSize: '14px', fontWeight: 400, color: '#9CA3AF', marginLeft: '5px' },
    statusBadge: { padding: '4px 10px', borderRadius: '6px', color: '#fff', fontSize: '11px', fontWeight: 700 },
    suspendBtn: { padding: '6px 14px', borderRadius: '8px', border: 'none', color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer' },
    divider: { height: '1px', backgroundColor: '#F3F4F6', margin: '20px 0' },
    actionSection: { display: 'flex', flexDirection: 'column', gap: '10px' },
    sectionSubTitle: { fontSize: '17px', fontWeight: 800, color: '#1F2937', marginBottom: '10px' },
    input: { padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' },
    inlineSubmitBtn: { padding: '0 20px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' },
    logSection: { marginTop: '10px' },
    tableWrapper: { backgroundColor: '#fff', borderRadius: '15px', overflow: 'hidden', border: '1px solid #E5E7EB' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: { backgroundColor: '#F9FAFB', padding: '15px', textAlign: 'left', color: '#6B7280', borderBottom: '1px solid #E5E7EB' },
    td: { padding: '15px', borderBottom: '1px solid #F3F4F6', color: '#374151' },
    tr: { transition: 'background 0.2s' },
    tableActionBtn: { padding: '4px 10px', borderRadius: '6px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' },
    emptyTd: { textAlign: 'center', padding: '50px', color: '#9CA3AF' }
};

export default AdminUserManagement;