import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stage, Layer, Line, Rect, Image as KonvaImage, Group } from 'react-konva'
import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { startSession, identifyCanvas, transformCanvas } from '../api/canvas'
import { useAuthStore } from '../stores/useAuthStore'
import { Palette, FlipHorizontal2 } from 'lucide-react'

// ─── 색상 / 굵기 ──────────────────────────────────────────
const COLORS = [
  '#1a1a2e', '#e63946', '#f4a261', '#f9c74f',
  '#43aa8b', '#4361ee', '#9b5de5', '#f72585', '#ffffff',
]
const WIDTHS = [3, 6, 12, 20]
const STYLES = [
  { key: 'cartoon', label: '카툰' },
  { key: 'fairytale', label: '동화' },
  { key: 'pixar_3d', label: '마법 3D' },
]

type Phase = 'confirm' | 'drawing' | 'completing' | 'identifying' | 'guess' | 'style' | 'transforming' | 'result'
interface Stroke { id: string; points: number[]; color: string; width: number }
interface HistoryEntry { strokes: Stroke[]; fill: HTMLImageElement | null }

// ─── SVG 아이콘 ───────────────────────────────────────────
const BucketIcon = () => (
  <svg width="17" height="ㅁ17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 11V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h7" />
    <path d="M12 12H4" /><path d="M12 8H4" />
    <circle cx="19.5" cy="19.5" r="2.5" /><path d="M19.5 17v-5" />
  </svg>
)
const EraserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20H7L3 16l10-10 7 7-2.5 2.5" /><path d="M6.0001 17.0001 10 13" />
  </svg>
)
const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6" /><path d="M3 13C5 7 10 4 16 5.5a9 9 0 0 1 5 7.5" />
  </svg>
)
const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7v6h-6" /><path d="M21 13C19 7 14 4 8 5.5a9 9 0 0 0-5 7.5" />
  </svg>
)
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
)

export default function Decalcomania() {
  const navigate = useNavigate()
  const stageRef = useRef<Konva.Stage>(null)
  const stageContainerRef = useRef<HTMLDivElement>(null)
  const isDrawingRef = useRef(false)
  const setTokenBalance = useAuthStore(s => s.setTokenBalance)
  const authNickname = useAuthStore(s => s.nickname)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  useEffect(() => { if (!isAuthenticated) navigate('/login') }, [])

  const [phase, setPhase] = useState<Phase>('confirm')
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [topic, setTopic] = useState<string | null>(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // ─── 드로잉 상태 ──────────────────────────────────────
  const [history, setHistory] = useState<HistoryEntry[]>([{ strokes: [], fill: null }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const strokes = history[historyIndex].strokes
  const fillImageEl = history[historyIndex].fill
  const [currentPoints, setCurrentPoints] = useState<number[]>([])
  const [mirroredStrokes, setMirroredStrokes] = useState<Stroke[]>([])
  const [color, setColor] = useState('#1a1a2e')
  const [strokeWidth, setStrokeWidth] = useState(6)
  const [isEraser, setIsEraser] = useState(false)
  const [isBucket, setIsBucket] = useState(false)

  // ─── AI 플로우 상태 ───────────────────────────────────
  const [canvasBase64, setCanvasBase64] = useState('')
  const [guess, setGuess] = useState<{ subject: string; reason: string } | null>(null)
  const [confirmedSubject, setConfirmedSubject] = useState('')
  const [confirmedReason, setConfirmedReason] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [result, setResult] = useState<{ imageUrl: string; style: string; story: string } | null>(null)

  // ─── 반응형 캔버스 ────────────────────────────────────
  useEffect(() => {
    const el = stageContainerRef.current
    if (!el) return
    const update = () => setStageSize({ width: el.clientWidth, height: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [phase])

  // ─── 자동 세션 시작 ───────────────────────────────────
  useEffect(() => { if (isAuthenticated) handleConfirmStart() }, [isAuthenticated])

  const handleConfirmStart = async () => {
    try {
      const res = await startSession(authNickname ?? 'guest')
      setTopic(res.topic)
      setTokenBalance(Math.max(0, useAuthStore.getState().tokenBalance - 1))
      setPhase('drawing')
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code
      if (code === 'TOKEN_INSUFFICIENT') alert('토큰이 부족합니다.')
      else alert('서버 연결 실패.')
      navigate('/')
    }
  }

  // ─── 드로잉 이벤트 ───────────────────────────────────
  const half = stageSize.width / 2

  const handlePointerDown = useCallback((e: KonvaEventObject<PointerEvent>) => {
    const pos = e.target.getStage()!.getPointerPosition()!
    if (pos.x > half) return  // 오른쪽 절반은 미러 전용
    isDrawingRef.current = true
    setCurrentPoints([pos.x, pos.y])
  }, [half])

  const handlePointerMove = useCallback((e: KonvaEventObject<PointerEvent>) => {
    if (!isDrawingRef.current) return
    const pos = e.target.getStage()!.getPointerPosition()!
    const clampedX = Math.min(pos.x, half)  // 중앙선 넘지 않도록 클램프
    setCurrentPoints(prev => [...prev, clampedX, pos.y])
  }, [half])

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current || currentPoints.length < 4) {
      isDrawingRef.current = false; setCurrentPoints([]); return
    }
    isDrawingRef.current = false
    const newStroke: Stroke = {
      id: crypto.randomUUID(), points: currentPoints,
      color: isEraser ? '#ffffff' : color,
      width: isEraser ? 28 : strokeWidth,
    }
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1)
      const cur = prev[historyIndex]
      return [...next, { strokes: [...cur.strokes, newStroke], fill: cur.fill }]
    })
    setHistoryIndex(i => i + 1)
    setCurrentPoints([])
  }, [currentPoints, color, strokeWidth, isEraser, historyIndex])

  // 캔버스 밖에서 마우스를 놓아도 드로잉 종료
  useEffect(() => {
    const onWindowPointerUp = () => {
      if (isDrawingRef.current) handlePointerUp()
    }
    window.addEventListener('pointerup', onWindowPointerUp)
    return () => window.removeEventListener('pointerup', onWindowPointerUp)
  }, [handlePointerUp])

  const handleUndo = () => { if (historyIndex > 0) setHistoryIndex(i => i - 1) }
  const handleRedo = () => { if (historyIndex < history.length - 1) setHistoryIndex(i => i + 1) }

  // ─── 완성하기 → 미러 적용 후 AI 분석 ─────────────────
  const handleDone = async () => {
    if (!stageRef.current || strokes.length === 0) return
    setPhase('completing')

    // 미러 스트로크 적용
    const mirrored: Stroke[] = strokes.map(s => ({
      id: `m-${s.id}`,
      points: mirrorPoints(s.points),
      color: s.color,
      width: s.width,
    }))
    setMirroredStrokes(mirrored)

    // 미러가 렌더링된 후 캡처
    setTimeout(async () => {
      const dataUrl = stageRef.current?.toDataURL({ pixelRatio: 1, mimeType: 'image/png' }) ?? ''
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
      setCanvasBase64(base64)
      setPhase('identifying')
      try {
        const res = await identifyCanvas(base64)
        setGuess({ subject: res.data.subject, reason: res.data.reason })
        setShowCustomInput(false)
        setCustomSubject('')
        setPhase('guess')
      } catch {
        alert('분석 실패 — 잠시 후 다시 시도하세요')
        setPhase('drawing')
      }
    }, 120)
  }

  const mirrorPoints = (points: number[]): number[] => {
    const out: number[] = []
    for (let i = 0; i + 1 < points.length; i += 2)
      out.push(stageSize.width - points[i], points[i + 1])
    return out
  }

  const handleConfirm = (subject: string, reason?: string) => {
    setConfirmedSubject(subject)
    setConfirmedReason(reason ?? '')
    setPhase('style')
  }

  const handleStyleSelect = async (style: string) => {
    setPhase('transforming')
    try {
      const res = await transformCanvas(canvasBase64, style, confirmedSubject, confirmedReason)
      setResult({ imageUrl: res.data.imageUrl, style: res.data.style, story: res.data.story })
      if (res.data.tokenBalance !== undefined) setTokenBalance(res.data.tokenBalance)
      setPhase('result')
    } catch {
      alert('변환 실패 — 잠시 후 다시 시도하세요')
      setPhase('style')
    }
  }

  const floodFill = (canvas: HTMLCanvasElement, sx: number, sy: number, fillColor: string) => {
    const ctx = canvas.getContext('2d')!
    const { width, height } = canvas
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const tmp = document.createElement('canvas'); tmp.width = tmp.height = 1
    const tc = tmp.getContext('2d')!; tc.fillStyle = fillColor; tc.fillRect(0, 0, 1, 1)
    const [fr, fg, fb] = tc.getImageData(0, 0, 1, 1).data
    if (sx < 0 || sx >= width || sy < 0 || sy >= height) return
    const si = (sy * width + sx) * 4
    const [tr, tg, tb] = [data[si], data[si + 1], data[si + 2]]
    if (tr === fr && tg === fg && tb === fb) return
    const isDark = new Uint8Array(width * height)
    for (let i = 0; i < width * height; i++) { const p = i * 4; if (data[p] < 80 && data[p + 1] < 80 && data[p + 2] < 80) isDark[i] = 1 }
    const GAP = 2; const dilated = new Uint8Array(width * height)
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (!isDark[y * width + x]) continue
      for (let dy = -GAP; dy <= GAP; dy++) for (let dx = -GAP; dx <= GAP; dx++) {
        if (dx * dx + dy * dy > GAP * GAP) continue
        const ny = y + dy, nx = x + dx
        if (ny >= 0 && ny < height && nx >= 0 && nx < width) dilated[ny * width + nx] = 1
      }
    }
    const matches = (pos: number) => !dilated[pos] && Math.abs(data[pos*4]-tr)<40 && Math.abs(data[pos*4+1]-tg)<40 && Math.abs(data[pos*4+2]-tb)<40
    const visited = new Uint8Array(width * height); const stack = [sy * width + sx]; const filled: number[] = []
    while (stack.length) { const pos = stack.pop()!; if (visited[pos] || !matches(pos)) continue; visited[pos] = 1; filled.push(pos); const x = pos % width, y = Math.floor(pos / width); if (x > 0) stack.push(pos-1); if (x < width-1) stack.push(pos+1); if (y > 0) stack.push(pos-width); if (y < height-1) stack.push(pos+width) }
    const expanded = new Uint8Array(width * height); for (const pos of filled) expanded[pos] = 1
    for (let step = 0; step < GAP; step++) { const next: number[] = []; for (let pos = 0; pos < width*height; pos++) { if (expanded[pos] || isDark[pos]) continue; const x = pos%width, y = Math.floor(pos/width); if ((x>0&&expanded[pos-1])||(x<width-1&&expanded[pos+1])||(y>0&&expanded[pos-width])||(y<height-1&&expanded[pos+width])) next.push(pos) }; for (const p of next) expanded[p]=1 }
    for (let pos = 0; pos < width*height; pos++) { if (expanded[pos] && !isDark[pos]) { const i=pos*4; data[i]=fr; data[i+1]=fg; data[i+2]=fb; data[i+3]=255 } }
    ctx.putImageData(imageData, 0, 0)
  }

  const handleBucketClick = useCallback((_e: KonvaEventObject<PointerEvent>) => {
    if (!isBucket || !stageRef.current) return
    const pos = stageRef.current.getPointerPosition()
    if (!pos || pos.x > half) return  // 오른쪽 절반은 채우기 불가
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1, mimeType: 'image/png' })
    const img = new Image()
    img.onload = () => {
      const offscreen = document.createElement('canvas')
      offscreen.width = stageSize.width; offscreen.height = stageSize.height
      const ctx = offscreen.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      // 경계 1px 검은 테두리로 막아서 플러드필 누출 방지
      const { width: w, height: h } = offscreen
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, w, 1); ctx.fillRect(0, h - 1, w, 1)
      ctx.fillRect(0, 0, 1, h); ctx.fillRect(w - 1, 0, 1, h)
      floodFill(offscreen, Math.floor(pos.x), Math.floor(pos.y), color)
      // 테두리 제거
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, 1); ctx.fillRect(0, h - 1, w, 1)
      ctx.fillRect(0, 0, 1, h); ctx.fillRect(w - 1, 0, 1, h)
      const result = new Image()
      result.onload = () => {
        setHistory(prev => {
          const next = prev.slice(0, historyIndex + 1)
          const cur = prev[historyIndex]
          return [...next, { strokes: cur.strokes, fill: result }]
        })
        setHistoryIndex(i => i + 1)
      }
      result.src = offscreen.toDataURL()
    }
    img.src = dataUrl
  }, [isBucket, color, stageSize, historyIndex])

  const handleReset = () => {
    setHistory([{ strokes: [], fill: null }]); setHistoryIndex(0); setCurrentPoints([])
    setMirroredStrokes([]); setGuess(null); setConfirmedSubject('')
    setResult(null); setIsEraser(false); setIsBucket(false); setPhase('drawing')
  }

  const canDraw = phase === 'drawing'
  const activeTool = isBucket ? 'bucket' : isEraser ? 'eraser' : 'pen'

  // ─── 로딩 화면 ────────────────────────────────────────
  if (phase === 'confirm') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(135deg, #eff8ff 0%, #dbeafe 50%, #eff8ff 100%)' }}>
        <img src="/Egag_logo-removebg.png" alt="EgAg" style={{ height: 100, marginBottom: 16 }} />
        <p style={{ fontSize: 16, color: '#7dd3fc', fontWeight: 600 }}>준비 중...</p>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .cv-logo { height: 100px; }
        .cv-color-btn { width: 26px; height: 26px; }
        .cv-picker { width: 26px; height: 26px; }
        .cv-picker-inner { width: 26px; height: 26px; }
        .cv-hint { display: inline; }
        .deco-glow { transition: box-shadow 0.2s, transform 0.15s, filter 0.2s; }
        .deco-glow:hover { box-shadow: 0 0 18px 4px rgba(14,165,233,0.35), 0 0 6px 1px rgba(56,189,248,0.25); filter: brightness(1.06); transform: scale(1.02); }
        .deco-glow:active { transform: scale(0.97); filter: brightness(0.97); }
        .deco-soft { transition: box-shadow 0.2s, transform 0.15s; }
        .deco-soft:hover { box-shadow: 0 0 12px 3px rgba(14,165,233,0.18); transform: scale(1.02); }
        .deco-soft:active { transform: scale(0.97); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes mirrorPulse { 0%,100%{opacity:0.25} 50%{opacity:0.7} }
        @keyframes mirrorSpin { from{stroke-dashoffset:0} to{stroke-dashoffset:-220} }
        @media (max-width: 600px) {
          .cv-logo { height: 56px !important; }
          .cv-color-btn { width: 22px !important; height: 22px !important; }
          .cv-picker { width: 22px !important; height: 22px !important; }
          .cv-picker-inner { width: 22px !important; height: 22px !important; }
          .cv-hint { display: none !important; }
        }
      `}</style>

      <div style={{ height: '100vh', overflow: 'hidden', background: 'linear-gradient(135deg, #eff8ff 0%, #dbeafe 50%, #eff8ff 100%)', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif", position: 'relative' }}>

        {/* ── 툴바 ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 20px', background: 'linear-gradient(135deg, #eff8ff 0%, #dbeafe 50%, #eff8ff 100%)', borderBottom: '1.5px solid rgba(147,197,253,0.6)', flexWrap: 'wrap', flexShrink: 0 }}>

          {/* 로고 */}
          <img src="/Egag_logo-removebg.png" alt="EgAg" className="cv-logo" style={{ height: 100, cursor: 'pointer', marginRight: 4 }} onClick={() => setShowExitConfirm(true)} />
          <div style={div} />

          {/* 색상 팔레트 */}
          <div className="cv-color-wrap" style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            {COLORS.map(c => (
              <button key={c} className="cv-color-btn" onClick={() => { setColor(c); setIsEraser(false) }}
                style={{
                  width: 26, height: 26, borderRadius: '50%', background: c, padding: 0, cursor: 'pointer',
                  border: !isEraser && color === c ? '3px solid #0ea5e9' : '2px solid rgba(186,230,255,0.5)',
                  boxSizing: 'border-box',
                  boxShadow: !isEraser && color === c ? '0 0 0 2px white, 0 0 0 4px #0ea5e9' : c === '#ffffff' ? 'inset 0 0 0 1px rgba(186,230,255,0.6)' : 'none',
                  transform: !isEraser && color === c ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 0.15s',
                }} />
            ))}
            <label className="cv-picker" style={{ position: 'relative', width: 26, height: 26, cursor: 'pointer', flexShrink: 0 }}>
              <div className="cv-picker-inner" style={{ width: 26, height: 26, borderRadius: '50%', background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)', border: '2px solid rgba(186,230,255,0.5)', boxSizing: 'border-box', boxShadow: !isEraser && !COLORS.includes(color) ? '0 0 0 2px white, 0 0 0 4px #0ea5e9' : 'none', transform: !isEraser && !COLORS.includes(color) ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.15s' }} />
              <input type="color" value={color} onChange={e => { setColor(e.target.value); setIsEraser(false) }} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
            </label>
          </div>

          <div style={div} />

          {/* 굵기 */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {WIDTHS.map(w => (
              <button key={w} onClick={() => { setStrokeWidth(w); setIsEraser(false) }}
                style={{ width: 36, height: 36, borderRadius: 10, padding: 0, border: !isEraser && strokeWidth === w ? '2px solid #0ea5e9' : '1.5px solid rgba(186,230,255,0.5)', background: !isEraser && strokeWidth === w ? '#e0f2fe' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: Math.min(w + 6, 22), height: Math.min(w, 14), borderRadius: 99, background: !isEraser && strokeWidth === w ? '#0ea5e9' : '#7dd3fc' }} />
              </button>
            ))}
          </div>

          <div style={div} />

          {/* 지우개 */}
          <button onClick={() => { setIsEraser(v => !v); setIsBucket(false) }}
            style={{ width: 38, height: 38, borderRadius: 10, padding: 0, border: activeTool === 'eraser' ? '2px solid #0ea5e9' : '1.5px solid rgba(186,230,255,0.5)', background: activeTool === 'eraser' ? '#e0f2fe' : 'white', cursor: 'pointer', color: activeTool === 'eraser' ? '#0ea5e9' : '#7dd3fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="지우개">
            <EraserIcon />
          </button>

          {/* 페인트통 */}
          <button onClick={() => { setIsBucket(v => !v); setIsEraser(false) }}
            style={{ width: 38, height: 38, borderRadius: 10, padding: 0, border: activeTool === 'bucket' ? '2px solid #0ea5e9' : '1.5px solid rgba(186,230,255,0.5)', background: activeTool === 'bucket' ? '#e0f2fe' : 'white', cursor: 'pointer', color: activeTool === 'bucket' ? '#0ea5e9' : '#7dd3fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="페인트통 (채우기)">
            <BucketIcon />
          </button>

          <div style={div} />

          {/* 뒤로/앞으로 */}
          {[
            { label: '뒤로', icon: <UndoIcon />, onClick: handleUndo, disabled: historyIndex === 0 },
            { label: '앞으로', icon: <RedoIcon />, onClick: handleRedo, disabled: historyIndex === history.length - 1 },
          ].map(({ label, icon, onClick, disabled }) => (
            <button key={label} onClick={onClick} disabled={disabled} title={label}
              style={{ width: 38, height: 38, borderRadius: 10, padding: 0, border: '1.5px solid rgba(186,230,255,0.5)', background: 'white', cursor: disabled ? 'default' : 'pointer', color: disabled ? 'rgba(186,230,255,0.5)' : '#7dd3fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {/* 토픽 + 힌트 */}
          {topic && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '1px solid rgba(186,230,255,0.7)', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: '#0369a1', fontWeight: 700, flexShrink: 0 }}>
              <Palette size={13} />{topic}
            </div>
          )}
          {canDraw && (
            <span className="cv-hint" style={{ fontSize: 13, color: '#7dd3fc', fontWeight: 500, marginRight: 4, flexShrink: 0 }}>
              <FlipHorizontal2 size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />절반만 그려봐!
            </span>
          )}

          {/* 전체 지우기 */}
          <button onClick={handleReset}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1.5px solid rgba(186,230,255,0.5)', background: 'white', fontSize: 13, cursor: 'pointer', color: '#0ea5e9', fontWeight: 600, flexShrink: 0 }}>
            <TrashIcon /> 전체 지우기
          </button>

          {/* 완성 버튼 */}
          <button className={canDraw && strokes.length > 0 ? 'deco-glow' : ''} onClick={handleDone} disabled={!canDraw || strokes.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 700, cursor: canDraw && strokes.length > 0 ? 'pointer' : 'default', background: canDraw && strokes.length > 0 ? 'linear-gradient(135deg, #0ea5e9, #38bdf8)' : '#bae6fd', color: canDraw && strokes.length > 0 ? 'white' : '#7dd3fc', boxShadow: canDraw && strokes.length > 0 ? '0 4px 12px rgba(14,165,233,0.35)' : 'none', transition: 'all 0.2s', flexShrink: 0 }}>
            <CheckIcon /> 완성
          </button>
        </div>

        {/* ── 캔버스 ── */}
        <div ref={stageContainerRef} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* 오른쪽 절반 클릭/커서 차단 오버레이 */}
          {canDraw && (
            <div style={{ position: 'absolute', top: 0, left: '50%', width: '50%', height: '100%', cursor: 'not-allowed', zIndex: 10, pointerEvents: 'auto' }} />
          )}
          <Stage ref={stageRef} width={stageSize.width} height={stageSize.height}
            style={{ display: 'block', cursor: canDraw ? (activeTool === 'bucket' ? 'copy' : isEraser ? 'cell' : 'crosshair') : 'default', touchAction: 'none' }}
            onPointerDown={canDraw ? (isBucket ? handleBucketClick : handlePointerDown) : undefined}
            onPointerMove={canDraw ? handlePointerMove : undefined}
            onPointerUp={canDraw ? handlePointerUp : undefined}>
            <Layer>
              <Rect x={0} y={0} width={stageSize.width} height={stageSize.height} fill="white" />
              {fillImageEl && <KonvaImage image={fillImageEl} x={0} y={0} width={stageSize.width} height={stageSize.height} />}
              {/* 페인트 통 채우기 미러 (완성 이후) */}
              {fillImageEl && mirroredStrokes.length > 0 && (
                <Group clipX={stageSize.width / 2} clipY={0} clipWidth={stageSize.width / 2} clipHeight={stageSize.height}>
                  <KonvaImage image={fillImageEl} x={stageSize.width} y={0} scaleX={-1} width={stageSize.width} height={stageSize.height} />
                </Group>
              )}
              {/* 오른쪽 미러 전용 영역 */}
              <Rect x={stageSize.width / 2} y={0} width={stageSize.width / 2} height={stageSize.height} fill="rgba(186,230,255,0.18)" />
              {/* 중앙선 */}
              <Rect x={stageSize.width / 2 - 0.5} y={0} width={1.5} height={stageSize.height} fill="rgba(14,165,233,0.4)" />
              {strokes.map(st => <Line key={st.id} points={st.points} stroke={st.color} strokeWidth={st.width} lineCap="round" lineJoin="round" tension={0.4} />)}
              {isDrawingRef.current && currentPoints.length >= 4 && (
                <Line points={currentPoints} stroke={isEraser ? '#ffffff' : color} strokeWidth={isEraser ? 28 : strokeWidth} lineCap="round" lineJoin="round" tension={0.4} />
              )}
              {mirroredStrokes.map(st => <Line key={st.id} points={st.points} stroke={st.color} strokeWidth={st.width} lineCap="round" lineJoin="round" tension={0.4} />)}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* ── 나가기 확인 ── */}
      {showExitConfirm && (
        <Overlay>
          <div style={{ background: 'white', borderRadius: 28, padding: '20px 40px', width: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, boxShadow: '0 24px 64px rgba(14,165,233,0.25)', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0c4a6e' }}>홈으로 나갈까요?</p>
              <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>지금까지 그린 그림이 사라져요.<br />정말 나가시겠어요?</p>
            </div>
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button onClick={() => setShowExitConfirm(false)} className="deco-soft"
                style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: '1.5px solid #bae6fd', background: 'white', color: '#0ea5e9', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                계속 그릴게요
              </button>
              <button onClick={() => navigate('/')} className="deco-glow"
                style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(14,165,233,0.3)' }}>
                나갈게요
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── 완성 중 (미러 적용) ── */}
      {phase === 'completing' && (
        <Overlay>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, margin: '0 auto 20px' }}>
              <svg width="80" height="80" viewBox="0 0 60 60" fill="none">
                <path d="M4,30 Q15,10 30,30 Q45,50 56,30" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'mirrorPulse 1.8s ease-in-out infinite' }} />
                <path d="M56,30 Q45,10 30,30 Q15,50 4,30" stroke="url(#dg2)" strokeWidth="3" strokeLinecap="round" strokeDasharray="35 80" style={{ animation: 'mirrorSpin 1.8s linear infinite', filter: 'drop-shadow(0 0 5px #38bdf8)' }} />
                <line x1="30" y1="5" x2="30" y2="55" stroke="rgba(125,211,252,0.3)" strokeWidth="1" strokeDasharray="3 4" />
                <defs><linearGradient id="dg2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#818cf8" /></linearGradient></defs>
              </svg>
            </div>
            <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>미러가 완성하는 중...</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>잠깐만 기다려줘!</p>
          </div>
        </Overlay>
      )}

      {/* ── AI 분석 중 ── */}
      {phase === 'identifying' && (
        <Overlay>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16, animation: 'spin 1.5s linear infinite' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0 }}>뭘 그렸는지 보는 중...</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 6 }}>잠깐만 기다려줘!</p>
          </div>
        </Overlay>
      )}

      {/* ── AI 추측 ── */}
      {phase === 'guess' && guess && (
        <Overlay>
          <div style={{ background: 'white', borderRadius: 28, padding: 36, width: 400, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 24px 64px rgba(14,165,233,0.25)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: 16, padding: '6px 16px', marginBottom: 12, fontSize: 12, fontWeight: 700, color: '#0369a1', letterSpacing: 0.5 }}>
                AI의 추측
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 36, fontWeight: 900, color: '#0c4a6e', letterSpacing: '-1px' }}>{guess.subject}</p>
              {guess.reason && (
                <div style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: 14, padding: '12px 16px', fontSize: 14, color: '#0369a1', lineHeight: 1.7, border: '1px solid rgba(186,230,255,0.7)' }}>
                  {guess.reason}
                </div>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, textAlign: 'center', color: '#374151' }}>정답인가요?</p>
            {!showCustomInput ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => handleConfirm(guess.subject, guess.reason)} className="deco-glow"
                  style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(14,165,233,0.3)' }}>
                  맞아요!
                </button>
                <button onClick={() => setShowCustomInput(true)} className="deco-soft"
                  style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: '1.5px solid #bae6fd', background: 'white', color: '#0ea5e9', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                  아니에요
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280', textAlign: 'center' }}>뭘 그리셨나요?</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={customSubject} onChange={e => setCustomSubject(e.target.value)} placeholder="예: 해마, 고슴도치..."
                    style={{ flex: 1, padding: '11px 14px', borderRadius: 12, border: '1.5px solid #bae6fd', fontSize: 14, outline: 'none', color: '#0c4a6e' }}
                    onKeyDown={e => e.key === 'Enter' && customSubject.trim() && handleConfirm(customSubject.trim())} autoFocus />
                  <button onClick={() => customSubject.trim() && handleConfirm(customSubject.trim())}
                    style={{ padding: '11px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    확인
                  </button>
                </div>
              </div>
            )}
          </div>
        </Overlay>
      )}

      {/* ── 스타일 선택 ── */}
      {phase === 'style' && (
        <Overlay>
          <div style={{ background: 'white', borderRadius: 28, padding: 36, width: 420, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 24px 64px rgba(14,165,233,0.25)' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: '#7dd3fc', fontWeight: 600 }}>어떤 스타일로 바꿔줄까?</p>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0c4a6e' }}>{confirmedSubject}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {STYLES.map((st, i) => {
                const gradients = ['linear-gradient(135deg, #f472b6, #fb923c)', 'linear-gradient(135deg, #34d399, #60a5fa)', 'linear-gradient(135deg, #38bdf8, #818cf8)']
                return (
                  <button key={st.key} onClick={() => handleStyleSelect(st.key)}
                    style={{ padding: '20px 0', borderRadius: 16, border: 'none', background: gradients[i], color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.1)', transition: 'transform 0.15s, box-shadow 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)' }}>
                    {st.label}
                  </button>
                )
              })}
            </div>
          </div>
        </Overlay>
      )}

      {/* ── AI 변환 중 ── */}
      {phase === 'transforming' && (
        <Overlay>
          <style>{`
            @keyframes starLight { 0%{stroke-dashoffset:0} 100%{stroke-dashoffset:-220} }
            @keyframes starPulse { 0%,100%{opacity:0.25} 50%{opacity:0.6} }
          `}</style>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 100, height: 100, margin: '0 auto 24px' }}>
              <svg width="100" height="100" viewBox="0 0 60 60" fill="none">
                <path d="M30,4 L36.5,21.1 L54.7,22 L40.5,33.4 L45.3,51 L30,41 L14.7,51 L19.5,33.4 L5.3,22 L23.5,21.1 Z" stroke="#7dd3fc" strokeWidth="2" strokeLinejoin="round" style={{ animation: 'starPulse 2s ease-in-out infinite' }} />
                <path d="M30,4 L36.5,21.1 L54.7,22 L40.5,33.4 L45.3,51 L30,41 L14.7,51 L19.5,33.4 L5.3,22 L23.5,21.1 Z" stroke="url(#sg)" strokeWidth="2.5" strokeLinejoin="round" strokeDasharray="40 180" strokeLinecap="round" style={{ animation: 'starLight 1.6s linear infinite', filter: 'drop-shadow(0 0 4px #38bdf8) drop-shadow(0 0 8px #0ea5e9)' }} />
                <defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0ea5e9" /><stop offset="100%" stopColor="#38bdf8" /></linearGradient></defs>
              </svg>
            </div>
            <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>AI가 그림 그리는 중...</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>10~20초 정도 걸려요</p>
          </div>
        </Overlay>
      )}

      {/* ── 결과 ── */}
      {phase === 'result' && result && (
        <Overlay>
          <div style={{ background: 'white', borderRadius: 28, padding: 28, maxWidth: 1200, width: '95%', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 24px 64px rgba(14,165,233,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#7dd3fc', fontWeight: 600 }}>변환 완료</p>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0c4a6e' }}>{result.style}</h3>
              </div>
              <button onClick={handleReset}
                style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid rgba(186,230,255,0.5)', background: 'white', cursor: 'pointer', color: '#7dd3fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {/* 내가 그린 그림 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#7dd3fc', letterSpacing: 0.5, textAlign: 'center' }}>내가 그린 그림</p>
                <div style={{ height: 340, borderRadius: 16, overflow: 'hidden', border: '1.5px solid rgba(186,230,255,0.5)', background: '#fff' }}>
                  <img src={`data:image/png;base64,${canvasBase64}`} alt="내가 그린 그림" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                </div>
                <a href={`data:image/png;base64,${canvasBase64}`} download="my-drawing.png" className="deco-soft"
                  style={{ display: 'block', textAlign: 'center', padding: '9px 0', borderRadius: 10, border: '1.5px solid rgba(186,230,255,0.5)', background: 'white', fontSize: 13, fontWeight: 600, color: '#0ea5e9', cursor: 'pointer', textDecoration: 'none', transition: 'box-shadow 0.2s, transform 0.15s' }}>
                  내 그림 저장
                </a>
              </div>

              {/* AI 그림 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#7dd3fc', letterSpacing: 0.5, textAlign: 'center' }}>AI가 그린 그림</p>
                <div style={{ height: 340, borderRadius: 16, overflow: 'hidden' }}>
                  <img src={result.imageUrl} alt="AI 변환 결과" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <a href={result.imageUrl} download="ai-drawing.png" target="_blank" rel="noreferrer" className="deco-soft"
                  style={{ display: 'block', textAlign: 'center', padding: '9px 0', borderRadius: 10, border: '1.5px solid rgba(186,230,255,0.5)', background: 'white', fontSize: 13, fontWeight: 600, color: '#0ea5e9', cursor: 'pointer', textDecoration: 'none', transition: 'box-shadow 0.2s, transform 0.15s' }}>
                  AI 그림 저장
                </a>
              </div>

              {/* 동화 */}
              {result.story && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#7dd3fc', letterSpacing: 0.5, textAlign: 'center' }}>AI가 써준 동화</p>
                  <div style={{ height: 340, overflowY: 'auto', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: 16, padding: '20px 22px', border: '1px solid rgba(186,230,255,0.5)', boxSizing: 'border-box' }}>
                    <p style={{ margin: 0, fontSize: 16, color: '#0369a1', lineHeight: 1.9 }}>{result.story}</p>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleReset} className="deco-soft"
                style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: '1.5px solid rgba(186,230,255,0.5)', background: 'white', color: '#0ea5e9', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                다시 그리기
              </button>
              <button onClick={() => navigate('/')} className="deco-glow"
                style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(14,165,233,0.3)' }}>
                홈으로
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  )
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      {children}
    </div>
  )
}

const div: React.CSSProperties = { width: 1, height: 28, background: 'rgba(186,230,255,0.5)', margin: '0 4px', flexShrink: 0 }
