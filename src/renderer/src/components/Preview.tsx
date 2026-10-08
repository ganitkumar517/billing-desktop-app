import { useEffect, useState } from 'react'

type PreviewProps = {
  html: string
}

export function Preview({ html }: PreviewProps) {
  const [height, setHeight] = useState(1122)
  const [scale, setScale] = useState(0.72)
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null)

  useEffect(() => {
    if (!host) return
    const measure = () => {
      const sheet = frame?.contentDocument?.querySelector('.sheet')
      const contentHeight = sheet?.scrollHeight || 1122
      setHeight(contentHeight)
      setScale(Math.min((host.clientWidth - 64) / 794, 1))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [host, frame, html])

  return (
    <div ref={setHost} className="h-full overflow-auto bg-deep">
      <div className="px-8 pt-6 text-[11px] uppercase tracking-[0.18em] text-sage">Print proof</div>
      <div className="flex justify-center px-8 py-6" style={{ minHeight: height * scale + 48 }}>
        <div className="relative" style={{ width: 794 * scale, height: height * scale }}>
          <iframe
            ref={setFrame}
            title="Invoice proof"
            srcDoc={html}
            onLoad={(event) => {
              const sheet = event.currentTarget.contentDocument?.querySelector('.sheet')
              if (sheet) setHeight(sheet.scrollHeight)
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 794,
              height,
              border: 0,
              background: 'white',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              pointerEvents: 'none',
              boxShadow: '0 28px 70px rgba(0,0,0,0.38)'
            }}
          />
        </div>
      </div>
    </div>
  )
}
