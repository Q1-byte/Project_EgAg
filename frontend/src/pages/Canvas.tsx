import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stage, Layer, Line, Rect, Image as KonvaImage } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { identifyCanvas, transformCanvas } from '../api/canvas'
import { useAuthStore } from '../stores/useAuthStore'

const COLORS = [
  '#1a1a2e', '#e63946', '#f4a261', '#f9c74f',
  '#43aa8b', '#4361ee', '#9b5de5', '#f72585', '#ffffff',
]
const WIDTHS = [3, 6, 12, 20]

const BucketIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 11V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h7" />
    <path d="M12 12H4" />
    <path d="M12 8H4" />
    <circle cx="19.5" cy="19.5" r="2.5" />
    <path d="M19.5 17v-5" />
  </svg>
)
const STYLES = [
  { key: 'cartoon', label: '카툰' },
  { key: 'fairytale', label: '동화' },
  { key: 'pixar_3d', label: '마법 3D' },
]

type Phase = 'drawing' | 'identifying' | 'guess' | 'style' | 'transforming' | 'result'

interface Stroke {
  id: string
  points: number[]
  color: string
  strokeWidth: number
}
interface HistoryEntry { strokes: Stroke[]; fill: HTMLImageElement | null }

const EraserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20H7L3 16l10-10 7 7-2.5 2.5" />
    <path d="M6.0001 17.0001 10 13" />
  </svg>
)

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6" />
    <path d="M3 13C5 7 10 4 16 5.5a9 9 0 0 1 5 7.5" />
  </svg>
)

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7v6h-6" />
    <path d="M21 13C19 7 14 4 8 5.5a9 9 0 0 0-5 7.5" />
  </svg>
)

export default function Canvas() {
  const navigate = useNavigate()
  const setTokenBalance = useAuthStore(s => s.setTokenBalance)
  const stageRef = useRef<any>(null)
  const stageContainerRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)

  const [stageSize, setStageSize] = useState({ width: 800, height: 600 })
  const [phase, setPhase] = useState<Phase>('drawing')
  const [history, setHistory] = useState<HistoryEntry[]>([{ strokes: [], fill: null }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const strokes = history[historyIndex].strokes
  const fillImageEl = history[historyIndex].fill
  const [currentPoints, setCurrentPoints] = useState<number[]>([])
  const [color, setColor] = useState('#1a1a2e')
  const [strokeWidth, setStrokeWidth] = useState(6)
  const [isEraser, setIsEraser] = useState(false)

  const [isBucket, setIsBucket] = useState(false)

  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const [canvasBase64, setCanvasBase64] = useState('')
  const [guess, setGuess] = useState<{ subject: string; reason: string } | null>(null)
  const [confirmedSubject, setConfirmedSubject] = useState('')
  const [confirmedReason, setConfirmedReason] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [result, setResult] = useState<{ imageUrl: string; style: string; story: string } | null>(null)

  // 캔버스 컨테이너 크기 추적
  useEffect(() => {
    const el = stageContainerRef.current
    if (!el) return
    const update = () => setStageSize({ width: el.clientWidth, height: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handlePointerDown = useCallback((e: KonvaEventObject<PointerEvent>) => {
    isDrawing.current = true
    const pos = e.target.getStage()!.getPointerPosition()!
    setCurrentPoints([pos.x, pos.y])
  }, [])

  const handlePointerMove = useCallback((e: KonvaEventObject<PointerEvent>) => {
    if (!isDrawing.current) return
    const pos = e.target.getStage()!.getPointerPosition()!
    setCurrentPoints((prev) => [...prev, pos.x, pos.y])
  }, [])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current || currentPoints.length < 4) {
      isDrawing.current = false
      setCurrentPoints([])
      return
    }
    isDrawing.current = false
    const newStroke: Stroke = {
      id: crypto.randomUUID(),
      points: currentPoints,
      color: isEraser ? '#ffffff' : color,
      strokeWidth: isEraser ? 28 : strokeWidth,
    }
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1)
      const cur = prev[historyIndex]
      return [...newHistory, { strokes: [...cur.strokes, newStroke], fill: cur.fill }]
    })
    setHistoryIndex((i) => i + 1)
    setCurrentPoints([])
  }, [currentPoints, color, strokeWidth, isEraser, historyIndex])

  const handleDone = async () => {
    if (!stageRef.current || strokes.length === 0) return
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1, mimeType: 'image/png' })
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
      if (res.data.tokenBalance !== undefined) {
        setTokenBalance(res.data.tokenBalance)
      }
      setPhase('result')
    } catch {
      alert('변환 실패 — 잠시 후 다시 시도하세요')
      setPhase('style')
    }
  }

  // 캔버스 밖에서 마우스를 놓아도 드로잉 종료
  useEffect(() => {
    const onWindowPointerUp = () => {
      if (isDrawing.current) handlePointerUp()
    }
    window.addEventListener('pointerup', onWindowPointerUp)
    return () => window.removeEventListener('pointerup', onWindowPointerUp)
  }, [handlePointerUp])

  const handleUndo = () => {
    if (historyIndex > 0) setHistoryIndex((i) => i - 1)
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) setHistoryIndex((i) => i + 1)
  }

  const floodFill = (canvas: HTMLCanvasElement, sx: number, sy: number, fillColor: string) => {
    const ctx = canvas.getContext('2d')!
    const { width, height } = canvas
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    const tmp = document.createElement('canvas')
    tmp.width = tmp.height = 1
    const tc = tmp.getContext('2d')!
    tc.fillStyle = fillColor
    tc.fillRect(0, 0, 1, 1)
    const [fr, fg, fb] = tc.getImageData(0, 0, 1, 1).data

    if (sx < 0 || sx >= width || sy < 0 || sy >= height) return
    const si = (sy * width + sx) * 4
    const [tr, tg, tb] = [data[si], data[si + 1], data[si + 2]]
    if (tr === fr && tg === fg && tb === fb) return

    const isDark = new Uint8Array(width * height)
    for (let i = 0; i < width * height; i++) {
      const p = i * 4
      if (data[p] < 80 && data[p + 1] < 80 && data[p + 2] < 80) isDark[i] = 1
    }
    const GAP = 2
    const dilated = new Uint8Array(width * height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!isDark[y * width + x]) continue
        for (let dy = -GAP; dy <= GAP; dy++) {
          for (let dx = -GAP; dx <= GAP; dx++) {
            if (dx * dx + dy * dy > GAP * GAP) continue
            const ny = y + dy, nx = x + dx
            if (ny >= 0 && ny < height && nx >= 0 && nx < width)
              dilated[ny * width + nx] = 1
          }
        }
      }
    }

    const matches = (pos: number) =>
      !dilated[pos] &&
      Math.abs(data[pos * 4] - tr) < 40 &&
      Math.abs(data[pos * 4 + 1] - tg) < 40 &&
      Math.abs(data[pos * 4 + 2] - tb) < 40

    const visited = new Uint8Array(width * height)
    const stack = [sy * width + sx]
    const filled: number[] = []
    while (stack.length) {
      const pos = stack.pop()!
      if (visited[pos] || !matches(pos)) continue
      visited[pos] = 1
      filled.push(pos)
      const x = pos % width, y = Math.floor(pos / width)
      if (x > 0) stack.push(pos - 1)
      if (x < width - 1) stack.push(pos + 1)
      if (y > 0) stack.push(pos - width)
      if (y < height - 1) stack.push(pos + width)
    }

    const expanded = new Uint8Array(width * height)
    for (const pos of filled) expanded[pos] = 1
    for (let step = 0; step < GAP; step++) {
      const next: number[] = []
      for (let pos = 0; pos < width * height; pos++) {
        if (expanded[pos] || isDark[pos]) continue
        const x = pos % width, y = Math.floor(pos / width)
        if (
          (x > 0 && expanded[pos - 1]) || (x < width - 1 && expanded[pos + 1]) ||
          (y > 0 && expanded[pos - width]) || (y < height - 1 && expanded[pos + width])
        ) next.push(pos)
      }
      for (const p of next) expanded[p] = 1
    }

    for (let pos = 0; pos < width * height; pos++) {
      if (expanded[pos] && !isDark[pos]) {
        const i = pos * 4
        data[i] = fr; data[i + 1] = fg; data[i + 2] = fb; data[i + 3] = 255
      }
    }
    ctx.putImageData(imageData, 0, 0)
  }

  const handleBucketClick = useCallback((_e: KonvaEventObject<PointerEvent>) => {
    if (!isBucket || !stageRef.current) return
    const stage = stageRef.current
    const pos = stage.getPointerPosition()
    if (!pos) return

    const dataUrl = stage.toDataURL({ pixelRatio: 1, mimeType: 'image/png' })
    const img = new Image()
    img.onload = () => {
      const offscreen = document.createElement('canvas')
      offscreen.width = stageSize.width
      offscreen.height = stageSize.height
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

      const resultImg = new Image()
      resultImg.onload = () => {
        setHistory((prev) => {
          const next = prev.slice(0, historyIndex + 1)
          const cur = prev[historyIndex]
          return [...next, { strokes: cur.strokes, fill: resultImg }]
        })
        setHistoryIndex((i) => i + 1)
      }
      resultImg.src = offscreen.toDataURL()
    }
    img.src = dataUrl
  }, [isBucket, color, stageSize, historyIndex])

  const handleReset = () => {
    setHistory([{ strokes: [], fill: null }])
    setHistoryIndex(0)
    setCurrentPoints([])
    setPhase('drawing')
    setGuess(null)
    setConfirmedSubject('')
    setResult(null)
    setIsEraser(false)
    setIsBucket(false)
  }

  const canDraw = phase === 'drawing'
  const activeTool = isBucket ? 'bucket' : isEraser ? 'eraser' : 'pen'

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .cv-logo { height: 100px; }
        .cv-color-wrap { gap: 9px; }
        .cv-color-btn { width: 26px; height: 26px; }
        .cv-picker { width: 26px; height: 26px; }
        .cv-picker-inner { width: 26px; height: 26px; }
        .cv-hint { display: inline; }

        .btn-glow {
          transition: box-shadow 0.2s, transform 0.15s, filter 0.2s;
        }
        .btn-glow:hover {
          box-shadow: 0 0 18px 4px rgba(124,58,237,0.35), 0 0 6px 1px rgba(236,72,153,0.25);
          filter: brightness(1.06);
          transform: scale(1.02);
        }
        .btn-glow:active {
          transform: scale(0.97);
          filter: brightness(0.97);
        }
        .btn-glow-soft {
          transition: box-shadow 0.2s, transform 0.15s;
        }
        .btn-glow-soft:hover {
          box-shadow: 0 0 12px 3px rgba(124,58,237,0.18);
          transform: scale(1.02);
        }
        .btn-glow-soft:active {
          transform: scale(0.97);
        }

        @media (max-width: 600px) {
          .cv-logo { height: 56px !important; }
          .cv-color-wrap { gap: 5px !important; }
          .cv-color-btn { width: 22px !important; height: 22px !important; }
          .cv-picker { width: 22px !important; height: 22px !important; }
          .cv-picker-inner { width: 22px !important; height: 22px !important; }
          .cv-hint { display: none !important; }
        }
      `}</style>
    <div style={{
      height: '100vh',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #fdf0ff 0%, #e8f4ff 50%, #fff0f8 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Segoe UI', sans-serif",
      position: 'relative',
    }}>

      {/* 캔버스 영역 — 전체 채움 */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* 툴바 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 20px',
          background: 'linear-gradient(135deg, #fdf0ff 0%, #e8f4ff 50%, #fff0f8 100%)',
          borderBottom: '1.5px solid rgba(221,214,254,0.5)',
          flexWrap: 'wrap',
          flexShrink: 0,
        }}>

          {/* 로고 + 홈 버튼 */}
          <img
            src="/Egag_logo-removebg.png"
            alt="EgAg"
            className="cv-logo"
            style={{ height: 100, cursor: 'pointer', marginRight: 4 }}
            onClick={() => setShowExitConfirm(true)}
          />

          <div style={{ width: 1, height: 28, background: '#ddd6fe', margin: '0 4px' }} />

          {/* 색상 팔레트 */}
          <div className="cv-color-wrap" style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            {COLORS.map((c) => (
              <button
                key={c}
                className="cv-color-btn"
                onClick={() => { setColor(c); setIsEraser(false) }}
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: c, padding: 0, cursor: 'pointer',
                  border: !isEraser && color === c ? '3px solid #7c3aed' : '2px solid #e9d5ff',
                  boxSizing: 'border-box',
                  boxShadow: !isEraser && color === c
                    ? '0 0 0 2px white, 0 0 0 4px #7c3aed'
                    : c === '#ffffff' ? 'inset 0 0 0 1px #ddd6fe' : 'none',
                  transform: !isEraser && color === c ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 0.15s',
                }}
              />
            ))}

            {/* 커스텀 색상 피커 */}
            <label className="cv-picker" style={{ position: 'relative', width: 26, height: 26, cursor: 'pointer', flexShrink: 0 }} title="색상 직접 선택">
              <div className="cv-picker-inner" style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                border: '2px solid #e9d5ff', boxSizing: 'border-box',
                boxShadow: !isEraser && !COLORS.includes(color) ? '0 0 0 2px white, 0 0 0 4px #7c3aed' : 'none',
                transform: !isEraser && !COLORS.includes(color) ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.15s',
              }} />
              <input
                type="color"
                value={color}
                onChange={(e) => { setColor(e.target.value); setIsEraser(false) }}
                style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
              />
            </label>
          </div>

          <div style={{ width: 1, height: 28, background: '#ddd6fe', margin: '0 4px' }} />

          {/* 굵기 */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => { setStrokeWidth(w); setIsEraser(false) }}
                style={{
                  width: 36, height: 36, borderRadius: 10, padding: 0,
                  border: !isEraser && strokeWidth === w ? '2px solid #7c3aed' : '1.5px solid #ddd6fe',
                  background: !isEraser && strokeWidth === w ? '#f5f3ff' : 'white',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <div style={{
                  width: Math.min(w + 6, 22),
                  height: Math.min(w, 14),
                  borderRadius: 99,
                  background: !isEraser && strokeWidth === w ? '#7c3aed' : '#c4b5fd',
                }} />
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 28, background: '#ddd6fe', margin: '0 4px' }} />

          {/* 지우개 */}
          <button
            onClick={() => { setIsEraser((v) => !v); setIsBucket(false) }}
            style={{
              width: 38, height: 38, borderRadius: 10, padding: 0,
              border: activeTool === 'eraser' ? '2px solid #7c3aed' : '1.5px solid #ddd6fe',
              background: activeTool === 'eraser' ? '#f5f3ff' : 'white',
              cursor: 'pointer', color: activeTool === 'eraser' ? '#7c3aed' : '#a78bfa',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="지우개"
          >
            <EraserIcon />
          </button>

          {/* 페인트통 */}
          <button
            onClick={() => { setIsBucket((v) => !v); setIsEraser(false) }}
            style={{
              width: 38, height: 38, borderRadius: 10, padding: 0,
              border: activeTool === 'bucket' ? '2px solid #7c3aed' : '1.5px solid #ddd6fe',
              background: activeTool === 'bucket' ? '#f5f3ff' : 'white',
              cursor: 'pointer', color: activeTool === 'bucket' ? '#7c3aed' : '#a78bfa',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="페인트통 (채우기)"
          >
            <BucketIcon />
          </button>

          <div style={{ width: 1, height: 28, background: '#ddd6fe', margin: '0 4px' }} />

          {/* 뒤로/앞으로 */}
          {[
            { label: '뒤로', icon: <UndoIcon />, onClick: handleUndo, disabled: historyIndex === 0 },
            { label: '앞으로', icon: <RedoIcon />, onClick: handleRedo, disabled: historyIndex === history.length - 1 },
          ].map(({ label, icon, onClick, disabled }) => (
            <button
              key={label}
              onClick={onClick}
              disabled={disabled}
              title={label}
              style={{
                width: 38, height: 38, borderRadius: 10, padding: 0, border: '1.5px solid #ddd6fe',
                background: 'white', cursor: disabled ? 'default' : 'pointer',
                color: disabled ? '#ddd6fe' : '#a78bfa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {icon}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {/* 힌트 텍스트 */}
          {canDraw && (
            <span className="cv-hint" style={{ fontSize: 13, color: '#a78bfa', fontWeight: 500, marginRight: 8 }}>
              {strokes.length === 0 ? '마음껏 그려봐!' : '다 그렸으면 완료 버튼을 눌러봐!'}
            </span>
          )}

          {/* 전체 지우기 */}
          <button
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              border: '1.5px solid #e9d5ff', background: 'white',
              fontSize: 13, cursor: 'pointer', color: '#7c3aed', fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <TrashIcon /> 전체 지우기
          </button>

          {/* 완료 버튼 */}
          <button
            className={canDraw && strokes.length > 0 ? 'btn-glow' : ''}
            onClick={handleDone}
            disabled={!canDraw || strokes.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', borderRadius: 12, border: 'none',
              fontSize: 14, fontWeight: 700, cursor: canDraw && strokes.length > 0 ? 'pointer' : 'default',
              background: canDraw && strokes.length > 0
                ? 'linear-gradient(135deg, #7c3aed, #ec4899)'
                : '#e9d5ff',
              color: canDraw && strokes.length > 0 ? 'white' : '#c4b5fd',
              boxShadow: canDraw && strokes.length > 0 ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            <CheckIcon /> 완료
          </button>
        </div>

        {/* Stage 컨테이너 — 남은 공간 전부 채움 */}
        <div
          ref={stageContainerRef}
          style={{ flex: 1, overflow: 'hidden' }}
        >
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            style={{
              display: 'block',
              cursor: canDraw ? (activeTool === 'eraser' ? 'cell' : activeTool === 'bucket' ? 'copy' : 'crosshair') : 'default',
              touchAction: 'none',
            }}
            onPointerDown={canDraw ? (isBucket ? handleBucketClick : handlePointerDown) : undefined}
            onPointerMove={canDraw && !isBucket ? handlePointerMove : undefined}
            onPointerUp={canDraw && !isBucket ? handlePointerUp : undefined}
          >
            <Layer>
              <Rect x={0} y={0} width={stageSize.width} height={stageSize.height} fill="white" />
              {fillImageEl && (
                <KonvaImage image={fillImageEl} x={0} y={0} width={stageSize.width} height={stageSize.height} />
              )}
              {strokes.map((s) => (
                <Line
                  key={s.id}
                  points={s.points}
                  stroke={s.color}
                  strokeWidth={s.strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.4}
                />
              ))}
              {currentPoints.length > 0 && (
                <Line
                  points={currentPoints}
                  stroke={isEraser ? '#ffffff' : color}
                  strokeWidth={isEraser ? 28 : strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.4}
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* ── 나가기 확인 ── */}
      {showExitConfirm && (
        <Overlay>
          <div style={{
            background: 'white', borderRadius: 28, padding: '16px 40px',
            width: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            boxShadow: '0 24px 64px rgba(124,58,237,0.25)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #fdf2f8, #f5f3ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#1e1b4b' }}>홈으로 나갈까요?</p>
              <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                지금까지 그린 그림이 사라져요.<br />정말 나가시겠어요?
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="btn-glow-soft"
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 14,
                  border: '1.5px solid #ddd6fe', background: 'white',
                  color: '#7c3aed', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                계속 그릴게요
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-glow"
                style={{
                  flex: 1, padding: '13px 0', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                }}
              >
                나갈게요
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── 오버레이들 ── */}
      {phase === 'identifying' && (
        <Overlay>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16, animation: 'spin 1.5s linear infinite' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0 }}>뭘 그렸는지 보는 중...</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 6 }}>잠깐만 기다려줘!</p>
          </div>
        </Overlay>
      )}

      {phase === 'guess' && guess && (
        <Overlay>
          <div style={{
            background: 'white', borderRadius: 28, padding: 36,
            width: 400, display: 'flex', flexDirection: 'column', gap: 20,
            boxShadow: '0 24px 64px rgba(124,58,237,0.25)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #f5f3ff, #fdf2f8)',
                borderRadius: 16, padding: '6px 16px', marginBottom: 12,
                fontSize: 12, fontWeight: 700, color: '#7c3aed', letterSpacing: 0.5,
              }}>
                AI의 추측
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 36, fontWeight: 900, color: '#1e1b4b', letterSpacing: '-1px' }}>
                {guess.subject}
              </p>
              {guess.reason && (
                <div style={{
                  background: 'linear-gradient(135deg, #faf5ff, #f0f9ff)',
                  borderRadius: 14, padding: '12px 16px',
                  fontSize: 14, color: '#4c1d95', lineHeight: 1.7,
                  border: '1px solid #ddd6fe',
                }}>
                  {guess.reason}
                </div>
              )}
            </div>

            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, textAlign: 'center', color: '#374151' }}>
              정답인가요?
            </p>

            {!showCustomInput ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleConfirm(guess.subject, guess.reason)}
                  className="btn-glow"
                  style={{
                    flex: 1, padding: '13px 0', borderRadius: 14, border: 'none',
                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                    color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                  }}
                >
                  맞아요!
                </button>
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="btn-glow-soft"
                  style={{
                    flex: 1, padding: '13px 0', borderRadius: 14,
                    border: '1.5px solid #ddd6fe', background: 'white',
                    color: '#7c3aed', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  아니에요
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280', textAlign: 'center' }}>뭘 그리셨나요?</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="예: 해마, 고슴도치..."
                    style={{
                      flex: 1, padding: '11px 14px', borderRadius: 12,
                      border: '1.5px solid #ddd6fe', fontSize: 14,
                      outline: 'none', color: '#1e1b4b',
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && customSubject.trim() && handleConfirm(customSubject.trim())}
                    autoFocus
                  />
                  <button
                    onClick={() => customSubject.trim() && handleConfirm(customSubject.trim())}
                    style={{
                      padding: '11px 18px', borderRadius: 12, border: 'none',
                      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                      color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    확인
                  </button>
                </div>
              </div>
            )}
          </div>
        </Overlay>
      )}

      {phase === 'style' && (
        <Overlay>
          <div style={{
            background: 'white', borderRadius: 28, padding: 36,
            width: 420, display: 'flex', flexDirection: 'column', gap: 20,
            boxShadow: '0 24px 64px rgba(124,58,237,0.25)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: '#a78bfa', fontWeight: 600 }}>어떤 스타일로 바꿔줄까?</p>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1e1b4b' }}>{confirmedSubject}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {STYLES.map((s, i) => {
                const gradients = [
                  'linear-gradient(135deg, #f472b6, #fb923c)',
                  'linear-gradient(135deg, #34d399, #60a5fa)',
                  'linear-gradient(135deg, #a78bfa, #60a5fa)',
                ]
                return (
                  <button
                    key={s.key}
                    onClick={() => handleStyleSelect(s.key)}
                    style={{
                      padding: '20px 0', borderRadius: 16, border: 'none',
                      background: gradients[i], color: 'white',
                      fontSize: 15, fontWeight: 700, cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'
                    }}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>
        </Overlay>
      )}

      {phase === 'transforming' && (
        <Overlay>
          <style>{`
            @keyframes starLight {
              0%   { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -220; }
            }
            @keyframes starPulse {
              0%, 100% { opacity: 0.25; }
              50%       { opacity: 0.6; }
            }
          `}</style>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 24, position: 'relative', width: 100, height: 100, margin: '0 auto 24px' }}>
              <svg width="100" height="100" viewBox="0 0 60 60" fill="none">
                <path
                  d="M30,4 L36.5,21.1 L54.7,22 L40.5,33.4 L45.3,51 L30,41 L14.7,51 L19.5,33.4 L5.3,22 L23.5,21.1 Z"
                  stroke="#c4b5fd"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  style={{ animation: 'starPulse 2s ease-in-out infinite' }}
                />
                <path
                  d="M30,4 L36.5,21.1 L54.7,22 L40.5,33.4 L45.3,51 L30,41 L14.7,51 L19.5,33.4 L5.3,22 L23.5,21.1 Z"
                  stroke="url(#starGradient)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeDasharray="40 180"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  style={{
                    animation: 'starLight 1.6s linear infinite',
                    filter: 'drop-shadow(0 0 4px #a78bfa) drop-shadow(0 0 8px #ec4899)',
                  }}
                />
                <defs>
                  <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>AI가 그림 그리는 중...</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>10~20초 정도 걸려요</p>
          </div>
        </Overlay>
      )}

      {phase === 'result' && result && (
        <Overlay>
          <div style={{
            background: 'white', borderRadius: 28, padding: 28,
            maxWidth: 1200, width: '95%',
            display: 'flex', flexDirection: 'column', gap: 16,
            boxShadow: '0 24px 64px rgba(124,58,237,0.25)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>변환 완료</p>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e1b4b' }}>{result.style}</h3>
              </div>
              <button
                onClick={handleReset}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: '1.5px solid #ddd6fe',
                  background: 'white', cursor: 'pointer', color: '#a78bfa',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {/* 내가 그린 그림 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#a78bfa', letterSpacing: 0.5, textAlign: 'center' }}>
                  내가 그린 그림
                </p>
                <div style={{ height: 340, borderRadius: 16, overflow: 'hidden', border: '1.5px solid #ddd6fe', background: '#fff' }}>
                  <img
                    src={`data:image/png;base64,${canvasBase64}`}
                    alt="내가 그린 그림"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </div>
                <a
                  href={`data:image/png;base64,${canvasBase64}`}
                  download="my-drawing.png"
                  style={{
                    display: 'block', textAlign: 'center', padding: '9px 0',
                    borderRadius: 10, border: '1.5px solid #ddd6fe', background: 'white',
                    fontSize: 13, fontWeight: 600, color: '#7c3aed', cursor: 'pointer',
                    textDecoration: 'none', transition: 'box-shadow 0.2s, transform 0.15s',
                  }}
                  className="btn-glow-soft"
                >
                  내 그림 저장
                </a>
              </div>

              {/* AI가 그린 그림 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#a78bfa', letterSpacing: 0.5, textAlign: 'center' }}>
                  AI가 그린 그림
                </p>
                <div style={{ height: 340, borderRadius: 16, overflow: 'hidden' }}>
                  <img
                    src={result.imageUrl}
                    alt="AI 변환 결과"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <a
                  href={result.imageUrl}
                  download="ai-drawing.png"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'block', textAlign: 'center', padding: '9px 0',
                    borderRadius: 10, border: '1.5px solid #ddd6fe', background: 'white',
                    fontSize: 13, fontWeight: 600, color: '#7c3aed', cursor: 'pointer',
                    textDecoration: 'none', transition: 'box-shadow 0.2s, transform 0.15s',
                  }}
                  className="btn-glow-soft"
                >
                  AI 그림 저장
                </a>
              </div>

              {/* AI가 써준 동화 */}
              {result.story && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#a78bfa', letterSpacing: 0.5, textAlign: 'center' }}>
                    AI가 써준 동화
                  </p>
                  <div style={{
                    height: 340, overflowY: 'auto',
                    background: 'linear-gradient(135deg, #faf5ff, #f0f9ff)',
                    borderRadius: 16, padding: '20px 22px',
                    border: '1px solid #ddd6fe',
                    boxSizing: 'border-box',
                  }}>
                    <p style={{ margin: 0, fontSize: 16, color: '#4c1d95', lineHeight: 1.9 }}>
                      {result.story}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleReset}
                className="btn-glow-soft"
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 14,
                  border: '1.5px solid #ddd6fe', background: 'white',
                  color: '#7c3aed', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                다시 그리기
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn-glow"
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                  color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                }}
              >
                홈으로
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
    </div>
  )
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(30, 27, 75, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200,
    }}>
      {children}
    </div>
  )
}
