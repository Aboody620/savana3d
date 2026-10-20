// رسمة الواجهة: مزهرية تنطبع طبقة طبقة على سطح الطابعة.
// الطبقات تنبني مرة وحدة عند فتح الصفحة، والجزء الباقي يظهر كمخطط للنموذج.
// تحترم إعداد "تقليل الحركة" (globals.css).

const LAYERS = 30;
const PRINTED = 23; // الطبقات المطبوعة — الباقي مخطط بانتظار الطباعة
const LAYER_H = 8;
const WIDTH = 320;
const BED_Y = 300;

// عرض المزهرية عند الارتفاع t (0 أسفل → 1 أعلى)
function profile(t) {
  const belly = Math.exp(-((t - 0.34) ** 2) / 0.05);
  const neck = Math.exp(-((t - 0.82) ** 2) / 0.012);
  const lip = t > 0.93 ? (t - 0.93) * 260 : 0;
  return 74 + 104 * belly - 26 * neck + lip;
}

export default function PrintingVase({ className = "" }) {
  const layers = Array.from({ length: LAYERS }, (_, i) => {
    const t = i / (LAYERS - 1);
    const w = profile(t);
    return { i, w, x: (WIDTH - w) / 2, y: BED_Y - (i + 1) * LAYER_H };
  });
  const top = layers[PRINTED - 1];
  const nozzleY = top.y - 6;
  const ghost = layers.slice(PRINTED);
  const outline =
    `M ${ghost[0].x} ${ghost[0].y + LAYER_H} ` +
    ghost.map((l) => `L ${l.x} ${l.y}`).join(" ") +
    ` L ${ghost.at(-1).x + ghost.at(-1).w} ${ghost.at(-1).y} ` +
    [...ghost].reverse().map((l) => `L ${l.x + l.w} ${l.y + LAYER_H}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} 340`}
      className={className}
      role="img"
      aria-label="مزهرية تنطبع طبقة طبقة على طابعة ثلاثية الأبعاد"
    >
      {/* مخطط الجزء اللي ما انطبع للحين */}
      <path d={outline} fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 5" />

      {/* الطبقات المطبوعة */}
      {layers.slice(0, PRINTED).map((l) => (
        <rect
          key={l.i}
          className="print-layer"
          style={{ animationDelay: `${0.25 + l.i * 0.07}s` }}
          x={l.x}
          y={l.y}
          width={l.w}
          height={LAYER_H - 1}
          rx={(LAYER_H - 1) / 2}
          fill={l.i % 2 ? "#D9480F" : "#E8611F"}
        />
      ))}

      {/* سكة رأس الطباعة (ثابتة) */}
      <rect x="10" y={nozzleY - 36} width={WIDTH - 20} height="5" rx="2.5" fill="currentColor" opacity="0.25" />
      {/* رأس الطباعة */}
      <g className="print-nozzle" style={{ animationDelay: "0.25s" }}>
        <g transform={`translate(${WIDTH / 2} ${nozzleY})`}>
          <rect x="-34" y="-44" width="68" height="26" rx="5" fill="currentColor" />
          <rect x="-12" y="-18" width="24" height="10" fill="currentColor" />
          <path d="M -7 -8 L 7 -8 L 2 0 L -2 0 Z" fill="currentColor" />
        </g>
      </g>

      {/* سطح الطابعة */}
      <rect x="18" y={BED_Y} width={WIDTH - 36} height="10" rx="3" fill="currentColor" />
      <rect x="40" y={BED_Y + 10} width={WIDTH - 80} height="14" rx="2" fill="currentColor" opacity="0.18" />
    </svg>
  );
}
