function NotFoundIllustration() {
    return (
        <svg
            className="nf-illustration"
            viewBox="0 0 400 320"
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <linearGradient id="nf-planet-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" className="nf-stop-start" />
                    <stop offset="100%" className="nf-stop-end" />
                </linearGradient>

                <clipPath id="nf-planet-clip">
                    <circle cx="200" cy="170" r="72" />
                </clipPath>
            </defs>

            {/* Stars: small dots */}
            <circle className="nf-star" cx="40" cy="140" r="1.6" style={{ animationDelay: "0s" }} />
            <circle className="nf-star" cx="110" cy="40" r="1.2" style={{ animationDelay: "0.8s" }} />
            <circle className="nf-star" cx="150" cy="285" r="1.4" style={{ animationDelay: "1.6s" }} />
            <circle className="nf-star" cx="262" cy="30" r="1.2" style={{ animationDelay: "0.4s" }} />
            <circle className="nf-star" cx="372" cy="128" r="1.8" style={{ animationDelay: "1.2s" }} />
            <circle className="nf-star" cx="30" cy="262" r="1.2" style={{ animationDelay: "2s" }} />
            <circle className="nf-star" cx="292" cy="302" r="1.6" style={{ animationDelay: "0.6s" }} />
            <circle className="nf-star" cx="362" cy="205" r="1.2" style={{ animationDelay: "1.4s" }} />
            <circle className="nf-star" cx="68" cy="205" r="1.4" style={{ animationDelay: "2.4s" }} />

            {/* Stars: four-point sparkles */}
            <path className="nf-star" d="M70 61 Q70 70 79 70 Q70 70 70 79 Q70 70 61 70 Q70 70 70 61 Z" style={{ animationDelay: "0.2s" }} />
            <path className="nf-star" d="M338 243 Q338 250 345 250 Q338 250 338 257 Q338 250 331 250 Q338 250 338 243 Z" style={{ animationDelay: "1s" }} />
            <path className="nf-star" d="M330 52 Q330 58 336 58 Q330 58 330 64 Q330 58 324 58 Q330 58 330 52 Z" style={{ animationDelay: "1.8s" }} />

            <g className="nf-float">
                {/* Orbit path + satellite */}
                <circle className="nf-orbit-path" cx="200" cy="170" r="138" />

                <g className="nf-orbit">
                    <rect className="nf-satellite-panel" x="172" y="29" width="16" height="6" rx="1" />
                    <rect className="nf-satellite-body" x="191" y="25" width="18" height="14" rx="3" />
                    <rect className="nf-satellite-panel" x="212" y="29" width="16" height="6" rx="1" />
                    <line className="nf-satellite-antenna" x1="200" y1="25" x2="200" y2="18" />
                </g>

                {/* Ring, back half (drawn before the planet) */}
                <g transform="rotate(-14 200 170)">
                    <path className="nf-ring" d="M318 170 A118 26 0 0 0 82 170" />
                </g>

                {/* Planet */}
                <circle cx="200" cy="170" r="72" fill="url(#nf-planet-gradient)" />

                <g clipPath="url(#nf-planet-clip)">
                    <path className="nf-band" d="M120 150 Q200 128 280 150" />
                    <path className="nf-band" d="M120 186 Q200 166 280 186" />
                    <circle className="nf-shadow" cx="230" cy="198" r="72" />
                    <circle className="nf-crater" cx="176" cy="142" r="10" />
                    <circle className="nf-crater" cx="232" cy="140" r="5" />
                    <circle className="nf-crater" cx="248" cy="172" r="8" />
                    <circle className="nf-crater" cx="214" cy="192" r="7" />
                    <circle className="nf-crater" cx="180" cy="196" r="5" />
                </g>

                {/* Ring, front half (drawn after the planet) */}
                <g transform="rotate(-14 200 170)">
                    <path className="nf-ring" d="M318 170 A118 26 0 0 1 82 170" />
                </g>
            </g>
        </svg>
    )
}

export default NotFoundIllustration;