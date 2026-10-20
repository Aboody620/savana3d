import { useEffect, useRef, useState } from "react";

// رسمة الواجهة: طابعة ثلاثية الأبعاد تطبع مزهرية طبقة طبقة.
// رأس الطباعة يمشي على عرض كل طبقة (مرة يمين ومرة يسار)، والفيلامنت ينرسم وراه،
// وبعد كل طبقة يرتفع الرأس. لما تكتمل المزهرية توقف لحظة وتبدأ من جديد.
// لو المستخدم مفعّل "تقليل الحركة" تظهر مزهرية مكتملة بدون حركة.

const LAYERS = 30;
const LAYER_H = 8;
const WIDTH = 320;
const BED_Y = 300;
const LAYER_MS = 420;   // زمن طباعة الطبقة الوحدة
const HOLD_MS = 1600;   // وقفة بعد ما تكتمل
const FADE_MS = 500;    // تختفي قبل ما تعيد

// عرض المزهرية عند الارتفاع t (0 أسفل → 1 أعلى)
function profile(t) {
  const belly = Math.exp(-((t - 0.34) ** 2) / 0.05);
  const neck = Math.exp(-((t - 0.82) ** 2) / 0.012);
  const lip = t > 0.93 ? (t - 0.93) * 260 : 0;
  return 74 + 104 * belly - 26 * neck + lip;
}

const layers = Array.from({ length: LAYERS }, (_, i) => {
  const w = profile(i / (LAYERS - 1));
  return { i, w, x: (WIDTH - w) / 2, y: BED_Y - (i + 1) * LAYER_H };
});

const CYCLE_MS = LAYERS * LAYER_MS + HOLD_MS + FADE_MS;
const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);

// حالة الطباعة عند لحظة معيّنة من الدورة
function stateAt(ms) {
  const printing = LAYERS * LAYER_MS;
  if (ms >= printing) {
    const fade = ms > printing + HOLD_MS ? (ms - printing - HOLD_MS) / FADE_MS : 0;
    return { done: LAYERS, progress: 0, opacity: 1 - Math.min(1, fade) };
  }
  const done = Math.floor(ms / LAYER_MS);
  return { done, progress: ease((ms % LAYER_MS) / LAYER_MS), opacity: 1 };
}

export default function PrintingVase({ className = "" }) {
  const [state, setState] = useState({ done: 0, progress: 0, opacity: 1 });
  const frame = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setState({ done: LAYERS, progress: 0, opacity: 1 });
      return undefined;
    }
    let start = null;
    const tick = (now) => {
      if (start === null) start = now;
      setState(stateAt((now - start) % CYCLE_MS));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, []);

  const { done, progress, opacity } = state;
  const current = layers[Math.min(done, LAYERS - 1)];
  const printing = done < LAYERS;
  // الطبقات الزوجية من اليمين لليسار، والفردية بالعكس — مثل مسار الطابعة الحقيقي
  const leftToRight = done % 2 === 1;
  const drawn = printing ? current.w * progress : 0;
  const drawnX = leftToRight ? current.x : current.x + current.w - drawn;
  const nozzleX = printing
    ? (leftToRight ? current.x + drawn : current.x + current.w - drawn)
    : WIDTH / 2;
  const nozzleY = (printing ? current.y : layers[LAYERS - 1].y - LAYER_H) - 2;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} 340`}
      className={className}
      role="img"
      aria-label="طابعة ثلاثية الأبعاد تطبع مزهرية طبقة طبقة"
    >
      {/* هيكل الطابعة: عمودين جانبيين */}
      <rect x="8" y="16" width="8" height={BED_Y - 6} rx="3" fill="currentColor" opacity="0.18" />
      <rect x={WIDTH - 16} y="16" width="8" height={BED_Y - 6} rx="3" fill="currentColor" opacity="0.18" />

      {/* الطبقات المطبوعة */}
      <g opacity={opacity}>
        {layers.slice(0, done).map((l) => (
          <rect key={l.i} x={l.x} y={l.y} width={l.w} height={LAYER_H - 1} rx={(LAYER_H - 1) / 2}
            fill={l.i % 2 ? "#D9480F" : "#E8611F"} />
        ))}
        {printing && drawn > 0 && (
          <rect x={drawnX} y={current.y} width={drawn} height={LAYER_H - 1} rx={(LAYER_H - 1) / 2}
            fill={done % 2 ? "#D9480F" : "#E8611F"} />
        )}
      </g>

      {/* سكة رأس الطباعة: ترتفع مع كل طبقة */}
      <rect x="8" y={nozzleY - 40} width={WIDTH - 16} height="6" rx="3" fill="currentColor" opacity="0.35" />

      {/* رأس الطباعة */}
      <g transform={`translate(${nozzleX} ${nozzleY})`}>
        <rect x="-26" y="-48" width="52" height="28" rx="5" fill="currentColor" />
        <rect x="-9" y="-20" width="18" height="10" fill="currentColor" />
        <path d="M -6 -10 L 6 -10 L 2 -1 L -2 -1 Z" fill="currentColor" />
        {printing && <circle cx="0" cy="1" r="2.2" fill="#E8611F" />}
      </g>

      {/* سطح الطابعة */}
      <rect x="18" y={BED_Y} width={WIDTH - 36} height="10" rx="3" fill="currentColor" />
      <rect x="40" y={BED_Y + 10} width={WIDTH - 80} height="14" rx="2" fill="currentColor" opacity="0.18" />
    </svg>
  );
}
