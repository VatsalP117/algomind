import { ImageResponse } from 'next/og'

export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default function OpenGraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    color: '#f8fafc',
                    padding: '56px',
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: 36,
                        fontWeight: 700,
                        opacity: 0.95,
                    }}
                >
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: '#38bdf8',
                        }}
                    />
                    Algomind
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div
                        style={{
                            fontSize: 64,
                            lineHeight: 1.12,
                            letterSpacing: -1.5,
                            fontWeight: 800,
                            maxWidth: 980,
                        }}
                    >
                        Stop forgetting algorithms you already solved
                    </div>
                    <div style={{ fontSize: 32, opacity: 0.88 }}>
                        Spaced repetition for coding interview prep
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        },
    )
}
