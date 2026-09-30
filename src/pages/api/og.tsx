import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'

const SITE_URL = 'https://artifacts.nanpipat.top'

function loadFont(weight: 'regular' | 'bold'): Buffer {
  const file =
    weight === 'bold'
      ? 'IBMPlexSansThai-Bold.ttf'
      : 'IBMPlexSansThai-Regular.ttf'
  return fs.readFileSync(path.join(process.cwd(), 'src', 'og-fonts', file))
}

// satori has no emoji font — strip emoji from titles to avoid tofu boxes
function stripEmoji(text: string): string {
  return Array.from(text)
    .filter((ch) => {
      const cp = ch.codePointAt(0) ?? 0
      const isEmoji =
        (cp >= 0x1f000 && cp <= 0x1faff) ||
        (cp >= 0x2600 && cp <= 0x27bf) ||
        cp === 0xfe0f ||
        (cp >= 0x1f1e6 && cp <= 0x1f1ff) ||
        (cp >= 0x2190 && cp <= 0x21ff) ||
        (cp >= 0x2b00 && cp <= 0x2bff)
      return !isEmoji
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { title: rawTitle, tag, date } = req.query as {
    title?: string
    tag?: string
    date?: string
  }
  const title = stripEmoji(String(rawTitle ?? 'Artifacts')).slice(0, 120)
  const label = String(tag ?? 'ARTICLE').toUpperCase().slice(0, 20)
  const dateStr = String(date ?? '').slice(0, 10)

  const image = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #202023 0%, #17171c 70%, #1c2b29 100%)',
          fontFamily: '"Plex"',
        }}
      >
        {/* top brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: '#88ccca',
              display: 'flex',
            }}
          />
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '0.12em',
            }}
          >
            NANPIPAT
          </div>
          <div style={{ fontSize: 26, color: '#9b9a97' }}>/ Artifacts</div>
        </div>

        {/* title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '26px',
            maxWidth: 980,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#202023',
                background: '#88ccca',
                padding: '6px 18px',
                borderRadius: 999,
                letterSpacing: '0.14em',
              }}
            >
              {label}
            </div>
            {dateStr && (
              <div style={{ fontSize: 22, color: '#9b9a97', display: 'flex' }}>
                {dateStr}
              </div>
            )}
          </div>
          <div
            style={{
              fontSize: title.length > 60 ? 58 : 68,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.28,
              display: 'flex',
            }}
          >
            {title}
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #333338',
            paddingTop: 28,
          }}
        >
          <div style={{ fontSize: 24, color: '#c9c9c7', display: 'flex' }}>
            Nanpipat Klinpratoom — Lead Software Engineer &amp; DevOps
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#88ccca',
              fontWeight: 700,
              display: 'flex',
            }}
          >
            artifacts.nanpipat.top
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Plex', data: loadFont('bold'), weight: 700, style: 'normal' },
        { name: 'Plex', data: loadFont('regular'), weight: 400, style: 'normal' },
      ],
    }
  )

  const buffer = Buffer.from(await image.arrayBuffer())
  res.setHeader('Content-Type', 'image/png')
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400')
  res.status(200).send(buffer)
}
