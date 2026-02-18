'use client'

export function ForgettingCurveChart() {
    return (
        <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-4 text-sm font-medium text-muted-foreground">
                Memory retention over time (without review)
            </p>
            <svg viewBox="0 0 400 240" className="w-full" aria-label="Ebbinghaus forgetting curve">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                    <g key={y}>
                        <line
                            x1="40" y1={200 - y * 1.6}
                            x2="380" y2={200 - y * 1.6}
                            className="stroke-border"
                            strokeWidth="1"
                        />
                        <text
                            x="32" y={204 - y * 1.6}
                            textAnchor="end"
                            fontSize="10"
                            className="fill-muted-foreground"
                        >
                            {y}%
                        </text>
                    </g>
                ))}
                {/* X axis labels */}
                {['0', '1h', '1d', '1w', '1m'].map((label, i) => (
                    <text
                        key={label}
                        x={40 + i * 85}
                        y="220"
                        textAnchor="middle"
                        fontSize="10"
                        className="fill-muted-foreground"
                    >
                        {label}
                    </text>
                ))}
                {/* Forgetting curve path */}
                <path
                    d="M 40 40 C 80 60, 100 100, 125 130 S 200 165, 250 172 S 330 178, 380 182"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
                {/* Area fill */}
                <path
                    d="M 40 40 C 80 60, 100 100, 125 130 S 200 165, 250 172 S 330 178, 380 182 L 380 200 L 40 200 Z"
                    fill="#f97316"
                    fillOpacity="0.12"
                />
                {/* Data points */}
                {[
                    { cx: 40, cy: 40 },
                    { cx: 125, cy: 130 },
                    { cx: 210, cy: 162 },
                    { cx: 295, cy: 174 },
                    { cx: 380, cy: 182 },
                ].map(({ cx, cy }, i) => (
                    <circle key={i} cx={cx} cy={cy} r="4" fill="#f97316" />
                ))}
                <text
                    x="60" y="35"
                    fontSize="11"
                    fontWeight="500"
                    className="fill-foreground"
                >
                    100%
                </text>
            </svg>
        </div>
    )
}
