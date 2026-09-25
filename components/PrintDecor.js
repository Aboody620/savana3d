// عناصر بصرية مرتبطة بالطباعة الثلاثية الأبعاد (طبقات، رأس الطابعة، الفلامنت)
// تُستخدم كخلفية/زخرفة في المتجر والصفحة الرئيسية — كلها SVG مضمّن بدون صور خارجية.

// نمط خلفية متكرر يحاكي طبقات الطباعة الأفقية
export function PrintLayerPattern({ className = "", opacity = 0.14 }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern id="print-layers" width="100%" height="14" patternUnits="userSpaceOnUse">
          <rect width="100%" height="7" fill="white" fillOpacity={opacity} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#print-layers)" />
    </svg>
  );
}

// شارة رأس الطابعة (nozzle) وهو يطبع كائن مكوّن من طبقات متراصة
export function NozzleBadge({ className = "" }) {
  return (
    <svg viewBox="0 0 120 130" className={className} aria-hidden="true">
      {/* الطبقات المطبوعة تحت الرأس */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={60 - (18 - i * 2)}
          y={104 - i * 11}
          width={(18 - i * 2) * 2}
          height="9"
          rx="2"
          className="fill-white/90 motion-safe:animate-layer-rise"
          style={{ animationDelay: `${i * 120}ms`, transformOrigin: "center" }}
        />
      ))}
      {/* رأس الطباعة (النازل) */}
      <g className="motion-safe:animate-nozzle-sway" style={{ transformOrigin: "60px 30px" }}>
        <rect x="46" y="10" width="28" height="14" rx="3" fill="#9C7A29" />
        <path d="M52 24 L68 24 L60 40 Z" fill="#9C7A29" />
        <line x1="60" y1="40" x2="60" y2="54" stroke="#9C7A29" strokeWidth="2" strokeDasharray="3 3" />
      </g>
    </svg>
  );
}

// شارة بكرة الفلامنت مع خيط متعرّج
export function FilamentBadge({ className = "" }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="48" r="34" fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="6" />
      <circle cx="60" cy="48" r="21" fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="4" />
      <circle cx="60" cy="48" r="6" fill="white" fillOpacity="0.9" />
      <path
        d="M32 74 C 44 84, 40 96, 52 106 S 70 118, 80 112"
        fill="none"
        stroke="#0F6E63"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
