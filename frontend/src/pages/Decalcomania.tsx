import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stage, Layer, Line } from 'react-konva'
import type Konva from 'konva'
import { startSession, completeCanvas } from '../api/canvas'
import { useAuthStore } from '../stores/useAuthStore'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const STROKE_COLOR = '#1a1a1a'
const MIRROR_COLOR = '#3B82F6'
const STROKE_WIDTH = 3

const PALETTE = [
  '#1a1a1a', '#6B7280', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899',
  '#FFFFFF', '#D1D5DB', '#F9A8D4', '#FDE68A', '#BBF7D0', '#BFDBFE', '#0EA5E9', '#10B981', '#A16207',
]

interface Stroke { id: string; points: number[] }
type Phase = 'confirm' | 'drawing' | 'completing' | 'result' | 'coloring'

export default function Decalcomania() {
  const stageRef = useRef<Konva.Stage>(null)
  const colorCanvasRef = useRef<HTMLCanvasElement>(null)
  const navigate = useNavigate()
  const authNickname = useAuthStore(s => s.nickname)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const setTokenBalance = useAuthStore(s => s.setTokenBalance)

  const getInitialPhase = (): Phase => 'confirm'

  useEffect(() => {
    if (!isAuthenticated) navigate('/login')
  }, [])

  const [phase, setPhase] = useState<Phase>(getInitialPhase)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [topic, setTopic] = useState<string | null>(null)

  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentPoints, setCurrentPoints] = useState<number[]>([])
  const [isDrawing, setIsDrawing] = useState(false)

  const [mirroredStrokes, setMirroredStrokes] = useState<Stroke[]>([])
  const [aiGuess, setAiGuess] = useState<string | null>(null)

  const [selectedColor, setSelectedColor] = useState('#EF4444')
  const [colorTool, setColorTool] = useState<'bucket' | 'pen'>('bucket')
  const [penSize, setPenSize] = useState(6)
  const [isPenDrawing, setIsPenDrawing] = useState(false)
  const lastPenPos = useRef<{ x: number; y: number } | null>(null)
  const [customColors, setCustomColors] = useState<string[]>([])
  const colorPickerRef = useRef<HTMLInputElement>(null)

  // ─── 컬러 피커 확정 시 팔레트 추가 (DOM change = 피커 닫힐 때 1회) ──
  useEffect(() => {
    if (phase !== 'coloring') return
    const input = colorPickerRef.current
    if (!input) return
    const onCommit = () => {
      const hex = input.value
      setCustomColors(prev => prev.includes(hex) ? prev : [...prev, hex])
    }
    input.addEventListener('change', onCommit)
    return () => input.removeEventListener('change', onCommit)
  }, [phase])


  // ─── 색칠 캔버스 초기화: 모든 선을 검정으로 ────────────
  useEffect(() => {
    if (phase !== 'coloring' || !colorCanvasRef.current || !stageRef.current) return
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1 })
    const img = new Image()
    img.onload = () => {
      const canvas = colorCanvasRef.current!
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      const d = imageData.data
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] < 252 || d[i + 1] < 252 || d[i + 2] < 252) {
          d[i] = 26; d[i + 1] = 26; d[i + 2] = 26; d[i + 3] = 255
        } else {
          d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; d[i + 3] = 255
        }
      }
      ctx.putImageData(imageData, 0, 0)
    }
    img.src = dataUrl
  }, [phase])

  // ─── 로그인 후 확인 팝업에서 시작 ────────────────────
  const handleConfirmStart = async () => {
    try {
      const res = await startSession(authNickname ?? 'guest')
      setSessionId(res.id)
      setTopic(res.topic)
      setTokenBalance(Math.max(0, useAuthStore.getState().tokenBalance - 1))
      setPhase('drawing')
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code
      if (code === 'TOKEN_INSUFFICIENT') {
        alert('토큰이 부족합니다. 토큰을 충전해주세요.')
      } else {
        alert('서버 연결 실패. 서버가 실행 중인지 확인해주세요.')
      }
      navigate('/')
    }
  }

  // ─── 드로잉 이벤트 ───────────────────────────────────
  const handlePointerDown = () => {
    if (phase !== 'drawing') return
    const pos = stageRef.current?.getPointerPosition()
    if (!pos) return
    setIsDrawing(true)
    setCurrentPoints([pos.x, pos.y])
  }
  const handlePointerMove = () => {
    if (!isDrawing || phase !== 'drawing') return
    const pos = stageRef.current?.getPointerPosition()
    if (!pos) return
    setCurrentPoints(prev => [...prev, pos.x, pos.y])
  }
  const handlePointerUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    if (currentPoints.length >= 4)
      setStrokes(prev => [...prev, { id: `s-${Date.now()}`, points: currentPoints }])
    setCurrentPoints([])
  }

  // ─── 완성하기 ────────────────────────────────────────
  const handleComplete = async () => {
    if (strokes.length === 0 || !sessionId) return
    setPhase('completing')
    const mirrored: Stroke[] = strokes.map(s => ({
      id: `m-${s.id}`,
      points: mirrorPoints(s.points),
    }))
    setMirroredStrokes(mirrored)
    setTimeout(async () => {
      try {
        const dataURL = stageRef.current?.toDataURL({ pixelRatio: 1 }) ?? ''
        const base64 = dataURL.replace(/^data:image\/\w+;base64,/, '')
        const res = await completeCanvas(sessionId, base64)
        setAiGuess(res.guess)
      } catch {
        setAiGuess('멋진 데칼코마니 작품이에요! 🎨')
      }
      setPhase('result')
    }, 100)
  }

  const mirrorPoints = (points: number[]): number[] => {
    const out: number[] = []
    for (let i = 0; i + 1 < points.length; i += 2) {
      out.push(CANVAS_WIDTH - points[i], points[i + 1])
    }
    return out
  }

  // ─── 색칠하기 (flood fill) ───────────────────────────
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = colorCanvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: Math.floor((e.clientX - rect.left) * (canvas.width / rect.width)),
      y: Math.floor((e.clientY - rect.top) * (canvas.height / rect.height)),
    }
  }

  const handleColorMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (colorTool === 'bucket') {
      const { x, y } = getCanvasPos(e)
      floodFill(colorCanvasRef.current!, x, y, selectedColor)
    } else {
      setIsPenDrawing(true)
      const { x, y } = getCanvasPos(e)
      lastPenPos.current = { x, y }
    }
  }

  const handleColorMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (colorTool !== 'pen' || !isPenDrawing || !lastPenPos.current) return
    const canvas = colorCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const { x, y } = getCanvasPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPenPos.current.x, lastPenPos.current.y)
    ctx.lineTo(x, y)
    ctx.strokeStyle = selectedColor
    ctx.lineWidth = penSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPenPos.current = { x, y }
  }

  const handleColorMouseUp = () => {
    setIsPenDrawing(false)
    lastPenPos.current = null
  }

  const handleColorDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = colorCanvasRef.current
    if (!canvas) return
    const { x, y } = getCanvasPos(e)
    const ctx = canvas.getContext('2d')!
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data
    const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
    setSelectedColor(hex)
    setCustomColors(prev => prev.includes(hex) ? prev : [...prev, hex])
  }

  const floodFill = (canvas: HTMLCanvasElement, startX: number, startY: number, color: string) => {
    const ctx = canvas.getContext('2d')!
    const { width, height } = canvas
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    const tmp = document.createElement('canvas')
    tmp.width = tmp.height = 1
    const tc = tmp.getContext('2d')!
    tc.fillStyle = color
    tc.fillRect(0, 0, 1, 1)
    const [fr, fg, fb] = tc.getImageData(0, 0, 1, 1).data

    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return
    const si = (startY * width + startX) * 4
    const [tr, tg, tb] = [data[si], data[si + 1], data[si + 2]]

    if (tr < 80 && tg < 80 && tb < 80) return
    if (tr === fr && tg === fg && tb === fb) return

    const isDark = new Uint8Array(width * height)
    for (let idx = 0; idx < width * height; idx++) {
      const i = idx * 4
      if (data[i] < 80 && data[i + 1] < 80 && data[i + 2] < 80) isDark[idx] = 1
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
    const stack = [startY * width + startX]
    const filled: number[] = []

    while (stack.length) {
      const pos = stack.pop()!
      if (visited[pos]) continue
      if (!matches(pos)) continue
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
          (x > 0 && expanded[pos - 1]) ||
          (x < width - 1 && expanded[pos + 1]) ||
          (y > 0 && expanded[pos - width]) ||
          (y < height - 1 && expanded[pos + width])
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

  // ─── JPG 다운로드 ────────────────────────────────────
  const handleDownload = () => {
    const canvas = colorCanvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `decalco-${aiGuess ?? topic ?? 'art'}.jpg`
    link.href = canvas.toDataURL('image/jpeg', 0.95)
    link.click()
  }

  // ─── 다시 그리기 (세션 유지, 드로잉 화면으로) ────────
  const handleRedraw = () => {
    setStrokes([]); setCurrentPoints([]); setMirroredStrokes([]); setAiGuess(null)
    setPhase('drawing')
  }

  // ─── 처음부터 ────────────────────────────────────────
  const handleRestart = () => {
    setSessionId(null); setTopic(null)
    setStrokes([]); setCurrentPoints([]); setMirroredStrokes([]); setAiGuess(null)
    setPhase('confirm')
  }

  // ─── 토큰 소모 확인 화면 ─────────────────────────────
  if (phase === 'confirm') {
    return (
      <div style={styles.startBg}>
        <div style={styles.startHeader}>
          <span style={styles.logoMirror}>🪞</span>
          <span style={styles.logoText}>Decal<b>co</b></span>
        </div>
        <div style={{ ...styles.startCard, maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎟</div>
          <h1 style={{ ...styles.title, marginBottom: 12 }}>데칼코마니 시작하기</h1>
          <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.8, margin: '0 0 8px' }}>
            시작하기 버튼을 누르면 <strong>토큰 1개</strong>가 소모됩니다.
          </p>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 28px' }}>
            뒤로 가기를 눌러도 토큰은 복구되지 않습니다.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button style={styles.btnSecondary} onClick={() => navigate('/')}>
              취소
            </button>
            <button style={styles.btnPrimary} onClick={handleConfirmStart}>
              확인, 시작하기 →
            </button>
          </div>
        </div>
      </div>
    )
  }


  // ─── 색칠하기 화면 ────────────────────────────────────
  if (phase === 'coloring') {
    const customCols = Math.ceil(customColors.length / 2)
    const penMode = colorTool === 'pen'
    const toolBtnCount = penMode ? 5 : 2
    const SG = 8 // swatch gap
    // fixed px overhead (gaps + dividers) — not dependent on size
    const toolInnerFixed = penMode ? (5 * SG + 5) : SG   // inner gaps in toolRow
    const fixedTotal = toolInnerFixed + 8 * SG + (customCols > 0 ? customCols * SG : 0) + 18 + 48
    const totalCells = toolBtnCount + 9 + 1 + customCols
    const size = Math.max(14, Math.min(32, Math.floor((CANVAS_WIDTH - 40 - fixedTotal) / totalCells)))
    const iconSize = Math.max(10, Math.floor(size * 0.65))

    const swatchBtn = (c: string) => ({
      width: size, height: size, borderRadius: '50%', cursor: 'pointer',
      transition: 'transform 0.1s', flexShrink: 0,
      background: c,
      border: selectedColor === c ? '3px solid #1a1a1a' : '2px solid #E2E8F0',
      transform: selectedColor === c ? 'scale(1.2)' : 'scale(1)',
    } as React.CSSProperties)

    const dynBtn = (active: boolean, activeColor = '#3B82F6') => ({
      width: size, height: size, borderRadius: Math.max(6, Math.floor(size * 0.25)),
      cursor: 'pointer', fontSize: iconSize,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.1s', flexShrink: 0,
      background: active ? activeColor : '#F1F5F9',
      color: active ? '#fff' : '#475569',
      border: `2px solid ${active ? activeColor : '#E2E8F0'}`,
    } as React.CSSProperties)

    return (
      <div style={styles.screen}>
        <div style={styles.header}>
          <h2 style={styles.coloringTitle}>색칠하고 예쁘게 꾸며봐요! 🎨</h2>
        </div>

        {/* 도구 + 색상 팔레트 */}
        <div style={styles.palette}>
          <div style={styles.toolRow}>
            <button onClick={() => setColorTool('bucket')} style={dynBtn(colorTool === 'bucket')} title="채우기">🪣</button>
            <button onClick={() => setColorTool('pen')} style={dynBtn(colorTool === 'pen')} title="펜">✏️</button>
            {penMode && <>
              <div style={{ width: 1, height: size, background: '#E2E8F0', margin: '0 2px', flexShrink: 0 }} />
              {[3, 6, 12].map((sz, i) => (
                <button key={sz} onClick={() => setPenSize(sz)}
                  style={{ ...dynBtn(penSize === sz, '#8B5CF6'), fontWeight: 700 }}>
                  {(['S', 'M', 'L'] as const)[i]}
                </button>
              ))}
            </>}
          </div>

          <div style={{ width: 1, alignSelf: 'stretch', background: '#E2E8F0', margin: '0 4px' }} />

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(9, ${size}px)`, gap: SG }}>
            {PALETTE.map(c => (
              <button key={c} onClick={() => setSelectedColor(c)} style={swatchBtn(c)} />
            ))}
          </div>

          <div style={{ width: 1, alignSelf: 'stretch', background: '#E2E8F0', margin: '0 4px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: SG, flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => colorPickerRef.current?.click()}
                style={{
                  ...dynBtn(false),
                  background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                  border: '2px solid #E2E8F0',
                }}
                title="클릭: 색상 선택 / 캔버스 더블클릭: 해당 색상 스포이드"
              />
              <input
                ref={colorPickerRef}
                type="color"
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                onChange={e => setSelectedColor(e.target.value)}
              />
            </div>
            {customColors.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateRows: `repeat(2, ${size}px)`,
                gridAutoFlow: 'column',
                gridAutoColumns: `${size}px`,
                gap: SG,
              }}>
                {customColors.map(c => (
                  <button key={c} onClick={() => setSelectedColor(c)} style={swatchBtn(c)} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={styles.stageWrapper}>
          <canvas
            ref={colorCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              display: 'block',
              cursor: colorTool === 'pen' ? 'crosshair' : 'cell',
              borderRadius: 8,
            }}
            onMouseDown={handleColorMouseDown}
            onMouseMove={handleColorMouseMove}
            onMouseUp={handleColorMouseUp}
            onMouseLeave={handleColorMouseUp}
            onDoubleClick={handleColorDoubleClick}
          />
        </div>

        <div style={styles.btnRow}>
          <button style={styles.btnSecondary} onClick={() => setPhase('result')}>
            ← 돌아가기
          </button>
          <button style={{ ...styles.btnPrimary, background: '#10B981' }} onClick={handleDownload}>
            📥 JPG 다운로드
          </button>
          <button style={styles.btnSecondary} onClick={handleRestart}>
            처음부터
          </button>
        </div>
      </div>
    )
  }

  // ─── 그리기 / 완성 / 결과 화면 ───────────────────────
  const isCompleting = phase === 'completing'
  const isResult = phase === 'result'

  return (
    <div style={styles.screen}>
      <div style={styles.header}>
        <div>
          <div style={styles.topicBadge}>🎨 {topic}</div>
          {!isResult && !isCompleting && (
            <div style={styles.topicHint}>생각나지 않으면 이 키워드를 참고해보세요</div>
          )}
        </div>
        <div style={styles.hint}>
          {isResult ? '✅ 데칼코마니 완성!' : '절반만 그리면 미러가 나머지를 완성해요 🪞'}
        </div>
      </div>

      <div style={styles.stageWrapper}>
        <div style={styles.centerLine} />
        <Stage
          ref={stageRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{ background: '#fff', cursor: isResult || isCompleting ? 'default' : 'crosshair', borderRadius: 8 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <Layer>
            {strokes.map(s => (
              <Line key={s.id} points={s.points} stroke={STROKE_COLOR}
                strokeWidth={STROKE_WIDTH} lineCap="round" lineJoin="round" tension={0.4} />
            ))}
            {isDrawing && currentPoints.length >= 4 && (
              <Line points={currentPoints} stroke={STROKE_COLOR}
                strokeWidth={STROKE_WIDTH} lineCap="round" lineJoin="round" tension={0.4} />
            )}
            {mirroredStrokes.map(s => (
              <Line key={s.id} points={s.points} stroke={MIRROR_COLOR}
                strokeWidth={STROKE_WIDTH} lineCap="round" lineJoin="round" tension={0.4} />
            ))}
          </Layer>
        </Stage>
        {isCompleting && (
          <div style={styles.overlay}>
            <div style={styles.overlayText}>🪞 미러가 완성하는 중...</div>
          </div>
        )}
      </div>

      {isResult && aiGuess && (
        <div style={styles.guessBox}>
          <div style={styles.guessLabel}>🤖 미러의 추측</div>
          <div style={styles.guessText}>{aiGuess}</div>
          <div style={styles.btnRow}>
            <button style={{ ...styles.btnPrimary, background: '#F97316' }}
              onClick={() => setPhase('coloring')}>
              🎨 색칠하기
            </button>
            <button style={styles.btnSecondary} onClick={handleRedraw}>
              다시 그리기
            </button>
          </div>
        </div>
      )}

      {!isResult && !isCompleting && (
        <div style={styles.btnRow}>
          <button style={styles.btnSecondary}
            onClick={() => setStrokes(prev => prev.slice(0, -1))}
            disabled={strokes.length === 0}>
            ↩ 되돌리기
          </button>
          <button style={{ ...styles.btnPrimary, opacity: strokes.length === 0 ? 0.5 : 1 }}
            onClick={handleComplete} disabled={strokes.length === 0}>
            🪞 완성하기
          </button>
          <button style={styles.btnSecondary} onClick={handleRestart}>처음부터</button>
        </div>
      )}

      {!isResult && (
        <div style={styles.legend}>
          <span><span style={{ ...styles.dot, background: STROKE_COLOR }} /> 내가 그린 선</span>
          <span><span style={{ ...styles.dot, background: MIRROR_COLOR }} /> 미러 대칭 선</span>
        </div>
      )}
    </div>
  )
}

// ─── 스타일 ──────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  startBg: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    minHeight: '100vh', background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)',
    padding: '32px 16px 48px',
  },
  startHeader: {
    display: 'flex', alignItems: 'center', gap: 8,
    marginBottom: 32, alignSelf: 'flex-start', paddingLeft: 8,
  },
  logoMirror: { fontSize: 26 },
  logoText: { fontSize: 22, fontWeight: 700, color: '#1D4ED8', letterSpacing: -0.5 },
  startCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    background: '#fff', borderRadius: 24, padding: '44px 52px',
    boxShadow: '0 8px 32px rgba(59,130,246,0.10)', maxWidth: 500, width: '100%',
  },
  title: { fontSize: 26, fontWeight: 800, margin: '0 0 30px', color: '#0F172A', letterSpacing: 1.5 },
  subtitle: { fontSize: 15, color: '#475569', margin: '0 0 28px', textAlign: 'center', lineHeight: 1.75 },
  inputRow: { display: 'flex', gap: 10, marginBottom: 28, width: '100%' },
  input: {
    padding: '12px 16px', fontSize: 15, border: '2px solid #E2E8F0',
    borderRadius: 10, outline: 'none', flex: 1,
  },
  steps: {
    display: 'flex', flexDirection: 'column', gap: 10,
    background: '#F8FAFC', borderRadius: 14, padding: '18px 20px', width: '100%',
  },
  stepRow: { display: 'flex', alignItems: 'center', gap: 12 },
  stepIcon: { fontSize: 20, width: 28, textAlign: 'center' as const },
  stepText: { fontSize: 14, color: '#334155', lineHeight: 1.4 },
  screen: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    minHeight: '100vh', background: '#F8FAFC', padding: '24px 16px',
  },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: 12, width: '100%', maxWidth: CANVAS_WIDTH,
  },
  topicBadge: {
    background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 20,
    padding: '6px 16px', fontSize: 15, color: '#1D4ED8', fontWeight: 700,
  },
  topicHint: { fontSize: 11, color: '#93C5FD', marginTop: 4, paddingLeft: 4 },
  hint: { fontSize: 13, color: '#94A3B8', alignSelf: 'center' },
  stageWrapper: {
    position: 'relative', borderRadius: 8, overflow: 'hidden',
    boxShadow: '0 2px 16px rgba(0,0,0,0.10)', border: '2px solid #E2E8F0',
  },
  centerLine: {
    position: 'absolute', left: CANVAS_WIDTH / 2 - 0.5, top: 0,
    width: 1, height: CANVAS_HEIGHT,
    background: 'rgba(0,0,0,0.08)', zIndex: 1, pointerEvents: 'none',
  },
  overlay: {
    position: 'absolute', inset: 0, background: 'rgba(239,246,255,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  overlayText: {
    background: '#3B82F6', color: '#fff',
    padding: '12px 28px', borderRadius: 24, fontSize: 16, fontWeight: 600,
  },
  palette: {
    display: 'flex', flexDirection: 'row' as const, gap: 12,
    alignItems: 'center', marginBottom: 12,
    width: CANVAS_WIDTH, boxSizing: 'border-box' as const, padding: '10px 20px',
    background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0',
  },
  toolRow: {
    display: 'flex', flexDirection: 'row' as const, gap: 8, alignItems: 'center', flexShrink: 0,
  },
  toolBtn: {
    width: 60, height: 60, borderRadius: 12, cursor: 'pointer',
    fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.1s', flexShrink: 0,
  },
  guessBox: {
    marginTop: 24, background: '#fff', borderRadius: 16,
    padding: '28px 40px', textAlign: 'center',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)', maxWidth: 480, width: '100%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  guessLabel: { fontSize: 13, color: '#94A3B8', fontWeight: 600, letterSpacing: 1 },
  guessText: { fontSize: 20, fontWeight: 700, color: '#111', lineHeight: 1.5 },
  btnRow: { display: 'flex', gap: 12, marginTop: 16 },
  btnPrimary: {
    padding: '12px 28px', fontSize: 15, fontWeight: 600,
    background: '#3B82F6', color: '#fff',
    border: 'none', borderRadius: 10, cursor: 'pointer',
  },
  btnSecondary: {
    padding: '12px 20px', fontSize: 14, fontWeight: 500,
    background: '#F1F5F9', color: '#475569',
    border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer',
  },
  coloringTitle: {
    fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 40px',
    width: '100%', textAlign: 'center',
  },
  legend: {
    display: 'flex', gap: 20, marginTop: 10, fontSize: 13, color: '#94A3B8',
  },
  dot: {
    display: 'inline-block', width: 10, height: 10,
    borderRadius: '50%', marginRight: 5,
  },
}
