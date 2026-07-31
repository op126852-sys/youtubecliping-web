// DEV-ONLY (see mockClient.ts): synthesizes tiny, genuinely playable/downloadable
// placeholder clips entirely in the browser (Canvas + MediaRecorder), so the
// demo mock has no dependency on real video files or a live backend.

const PALETTE = ['#2563eb', '#7c3aed', '#db2777', '#059669', '#d97706']

export function accentFor(index: number): string {
  return PALETTE[index % PALETTE.length]
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  return candidates.find((c) => MediaRecorder.isTypeSupported?.(c))
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  label: string,
  accent: string,
  p: number,
) {
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, '#0f172a')
  grad.addColorStop(1, accent)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  const x = w * 0.12 + p * w * 0.76
  const y = h / 2 + Math.sin(p * Math.PI * 4) * h * 0.18
  ctx.beginPath()
  ctx.arc(x, y, h * 0.08, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.font = `bold ${Math.round(h * 0.11)}px sans-serif`
  ctx.fillText(label, w / 2, h * 0.18)

  ctx.font = `${Math.round(h * 0.05)}px sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.fillText('Simulated clip — mock demo, no real video processed', w / 2, h - h * 0.08)
}

export function generateMockThumbnail(label: string, accent: string): string | undefined {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 180
  const ctx = canvas.getContext('2d')
  if (!ctx) return undefined
  drawFrame(ctx, canvas.width, canvas.height, label, accent, 0.35)
  return canvas.toDataURL('image/jpeg', 0.82)
}

/** Records a short animated canvas loop into a real webm Blob and returns an object URL for it. */
export function generateMockVideo(label: string, accent: string, durationMs = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 360
    const ctx = canvas.getContext('2d')
    const captureStream = canvas.captureStream?.bind(canvas)
    if (!ctx || typeof MediaRecorder === 'undefined' || !captureStream) {
      reject(new Error('Canvas video recording unavailable in this browser'))
      return
    }

    const mimeType = pickMimeType()
    const stream = captureStream(30)
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    const chunks: BlobPart[] = []
    let raf = 0

    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data)
    }
    recorder.onerror = (e) => {
      cancelAnimationFrame(raf)
      reject(e)
    }
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop())
      resolve(URL.createObjectURL(new Blob(chunks, { type: mimeType ?? 'video/webm' })))
    }

    const start = performance.now()
    const tick = (t: number) => {
      const elapsed = t - start
      drawFrame(ctx, canvas.width, canvas.height, label, accent, Math.min(1, elapsed / durationMs))
      if (elapsed < durationMs) {
        raf = requestAnimationFrame(tick)
      } else {
        recorder.stop()
      }
    }
    recorder.start()
    raf = requestAnimationFrame(tick)
  })
}
