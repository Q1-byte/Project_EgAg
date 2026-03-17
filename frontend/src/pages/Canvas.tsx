import { useState, useRef, useCallback } from 'react'
import { Stage, Layer, Line, Rect } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { identifyCanvas, transformCanvas } from '../api/canvas'

const COLORS = [
  '#1a1a2e', '#e63946', '#f4a261', '#f9c74f',
  '#43aa8b', '#4361ee', '#9b5de5', '#f72585', '#ffffff',
]
const WIDTHS = [3, 6, 12, 20]
const STYLES = [
  { key: 'watercolor', label: '수채화' },
  { key: 'cartoon', label: '카툰' },
  { key: 'oil_painting', label: '유화' },
  { key: 'pencil_sketch', label: '스케치' },
]

type Phase = 'drawing' | 'identifying' | 'guess' | 'style' | 'transforming' | 'result'

interface Stroke {
  id: string
  points: number[]
  color: string
  strokeWidth: number
}

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
  const stageRef = useRef<any>(null)
  const isDrawing = useRef(false)

  const [phase, setPhase] = useState<Phase>('drawing')
  const [history, setHistory] = useState<Stroke[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const strokes = history[historyIndex]
  const [currentPoints, setCurrentPoints] = useState<number[]>([])
  const [color, setColor] = useState('#1a1a2e')
  const [strokeWidth, setStrokeWidth] = useState(6)
  const [isEraser, setIsEraser] = useState(false)

  const [canvasBase64, setCanvasBase64] = useState('')
  const [guess, setGuess] = useState<{ subject: string; reason: string } | null>(null)
  const [confirmedSubject, setConfirmedSubject] = useState('')
  const [confirmedReason, setConfirmedReason] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [result, setResult] = useState<{ imageUrl: string; style: string; story: string } | null>(null)

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
      return [...newHistory, [...prev[historyIndex], newStroke]]
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
      setPhase('result')
    } catch {
      alert('변환 실패 — 잠시 후 다시 시도하세요')
      setPhase('style')
    }
  }

  const handleUndo = () => {
    if (historyIndex > 0) setHistoryIndex((i) => i - 1)
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) setHistoryIndex((i) => i + 1)
  }

  const handleReset = () => {
    setHistory([[]])
    setHistoryIndex(0)
    setCurrentPoints([])
    setPhase('drawing')
    setGuess(null)
    setConfirmedSubject('')
    setResult(null)
    setIsEraser(false)
  }

  const canDraw = phase === 'drawing'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fdf0ff 0%, #e8f4ff 50%, #fff0f8 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '28px 16px',
      fontFamily: "'Segoe UI', sans-serif",
    }}>

      {/* 헤더 */}
      <div style={{ width: 820, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#4c1d95', letterSpacing: '-0.5px' }}>
            EgAg
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: '#a78bfa', fontWeight: 500 }}>
            그려봐, AI가 맞혀볼게!
          </p>
        </div>
        <button
          onClick={handleReset}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10,
            border: '1.5px solid #e9d5ff', background: 'white',
            fontSize: 13, cursor: 'pointer', color: '#7c3aed', fontWeight: 600,
          }}
        >
          <TrashIcon /> 전체 지우기
        </button>
      </div>

      {/* 메인 캔버스 카드 */}
      <div style={{
        background: 'white',
        borderRadius: 24,
        boxShadow: '0 8px 40px rgba(124,58,237,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        border: '2px solid #f3e8ff',
      }}>

        {/* 툴바 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 20px',
          background: 'linear-gradient(90deg, #faf5ff, #f0f9ff)',
          borderBottom: '1.5px solid #f3e8ff',
          flexWrap: 'wrap',
        }}>

          {/* 색상 팔레트 */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {COLORS.map((c) => (
              <button
                key={c}
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
            onClick={() => setIsEraser((v) => !v)}
            style={{
              width: 38, height: 38, borderRadius: 10, padding: 0,
              border: isEraser ? '2px solid #7c3aed' : '1.5px solid #ddd6fe',
              background: isEraser ? '#f5f3ff' : 'white',
              cursor: 'pointer', color: isEraser ? '#7c3aed' : '#a78bfa',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="지우개"
          >
            <EraserIcon />
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

          {/* 완료 버튼 */}
          <button
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
            }}
          >
            <CheckIcon /> 완료
          </button>
        </div>

        {/* 캔버스 */}
        <Stage
          ref={stageRef}
          width={820}
          height={540}
          style={{
            display: 'block',
            cursor: canDraw ? (isEraser ? 'cell' : 'crosshair') : 'default',
            touchAction: 'none',
          }}
          onPointerDown={canDraw ? handlePointerDown : undefined}
          onPointerMove={canDraw ? handlePointerMove : undefined}
          onPointerUp={canDraw ? handlePointerUp : undefined}
        >
          <Layer>
            <Rect x={0} y={0} width={820} height={540} fill="white" />
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

      <p style={{ marginTop: 14, color: '#a78bfa', fontSize: 13, fontWeight: 500 }}>
        {canDraw && strokes.length === 0 && '마음껏 그려봐! 다 그리면 완료 버튼을 눌러줘'}
        {canDraw && strokes.length > 0 && '다 그렸으면 완료 버튼을 눌러봐!'}
      </p>

      {/* ── 오버레이들 ── */}
      {/* 식별 로딩 */}
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

      {/* AI 추측 모달 */}
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

      {/* 스타일 선택 */}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {STYLES.map((s, i) => {
                const gradients = [
                  'linear-gradient(135deg, #a78bfa, #60a5fa)',
                  'linear-gradient(135deg, #f472b6, #fb923c)',
                  'linear-gradient(135deg, #34d399, #60a5fa)',
                  'linear-gradient(135deg, #94a3b8, #475569)',
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

      {/* 변환 로딩 */}
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
                {/* 흐린 별 (기본 외곽선) */}
                <path
                  d="M30,4 L36.5,21.1 L54.7,22 L40.5,33.4 L45.3,51 L30,41 L14.7,51 L19.5,33.4 L5.3,22 L23.5,21.1 Z"
                  stroke="#c4b5fd"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  style={{ animation: 'starPulse 2s ease-in-out infinite' }}
                />
                {/* 빛이 따라가는 선 */}
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

      {/* 결과 모달 */}
      {phase === 'result' && result && (
        <Overlay>
          <div style={{
            background: 'white', borderRadius: 28, padding: 28,
            maxWidth: 880, width: '95%',
            display: 'flex', flexDirection: 'column', gap: 16,
            boxShadow: '0 24px 64px rgba(124,58,237,0.25)',
          }}>
            {/* 헤더 */}
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

            {/* 이미지 + 스토리 가로 배치 */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>
              <img
                src={result.imageUrl}
                alt="AI 변환 결과"
                style={{ width: '50%', borderRadius: 16, display: 'block', objectFit: 'cover' }}
              />
              {result.story && (
                <div style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #faf5ff, #f0f9ff)',
                  borderRadius: 16, padding: '20px 22px',
                  border: '1px solid #ddd6fe',
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: 0.5 }}>
                    AI가 써준 동화
                  </p>
                  <p style={{ margin: 0, fontSize: 14, color: '#4c1d95', lineHeight: 1.9 }}>
                    {result.story}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              style={{
                padding: '12px 0', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
              }}
            >
              다시 그리기
            </button>
          </div>
        </Overlay>
      )}
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
      zIndex: 100,
    }}>
      {children}
    </div>
  )
}
