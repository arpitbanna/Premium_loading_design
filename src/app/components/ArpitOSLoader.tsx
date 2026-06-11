import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";

const STATUS_STAGES = [
  { threshold: 0, label: "Loading Experience" },
  { threshold: 30, label: "Building Interface" },
  { threshold: 60, label: "Preparing Portfolio" },
  { threshold: 88, label: "Launching Experience" },
  { threshold: 100, label: "Ready" },
];

function getStatus(pct: number) {
  let s = STATUS_STAGES[0];
  for (const stage of STATUS_STAGES) {
    if (pct >= stage.threshold) s = stage;
    else break;
  }
  return s;
}

function BackgroundCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let W = (c.width = window.innerWidth);
    let H = (c.height = window.innerHeight);

    const pts = Array.from({ length: 24 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 0.9 + 0.2,
      o: Math.random() * 0.045 + 0.008,
      dx: (Math.random() - 0.5) * 0.18,
      dy: (Math.random() - 0.5) * 0.18,
    }));

    const resize = () => {
      W = c.width = window.innerWidth;
      H = c.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.018)";
      ctx.lineWidth = 0.5;
      const G = 72;
      for (let x = 0; x < W; x += G) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += G) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      // Particles
      for (const p of pts) {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,214,10,${p.o})`;
        ctx.fill();
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

function RevealText({ pct }: { pct: number }) {
  const TEXT = "ARPIT BANNA";
  const blur = Math.max(0, 22 * (1 - pct / 100));
  const ghostOp = 0.06 + 0.12 * (pct / 100);
  const sharpOp = Math.min(1, (pct / 100) * 1.1);
  const scanX = pct;
  const textGlow =
    pct >= 100
      ? "0 0 48px rgba(255,214,10,0.22), 0 0 96px rgba(255,214,10,0.08)"
      : "none";

  const base: React.CSSProperties = {
    fontFamily: "'Inter', sans-serif",
    fontSize: "clamp(42px, 10vw, 76px)",
    fontWeight: 700,
    letterSpacing: "-0.035em",
    color: "#ffffff",
    lineHeight: 1,
    whiteSpace: "nowrap",
    userSelect: "none",
  };

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
    >
      {/* Ghost — blurred */}
      <div
        style={{
          ...base,
          opacity: ghostOp,
          filter: `blur(${blur}px)`,
        }}
      >
        {TEXT}
      </div>
      {/* Sharp — clipped left to right */}
      <div
        style={{
          ...base,
          position: "absolute",
          inset: 0,
          opacity: sharpOp,
          clipPath: `inset(0 ${100 - scanX}% 0 0)`,
        }}
      >
        {TEXT}
      </div>
      {/* Scan line */}
      {pct > 0 && pct < 100 && (
        <div
          style={{
            position: "absolute",
            top: "-8px",
            bottom: "-8px",
            left: `${scanX}%`,
            width: "1.5px",
            transform: "translateX(-50%)",
            background:
              "linear-gradient(to bottom, transparent 0%, #FFD60A 25%, #FFD60A 75%, transparent 100%)",
            boxShadow:
              "0 0 10px 2px rgba(255,214,10,0.45), 0 0 24px 5px rgba(255,214,10,0.18)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

interface Props {
  onComplete?: () => void;
}

export function ArpitOSLoader({ onComplete }: Props) {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready">(
    "loading",
  );
  const [status, setStatus] = useState(STATUS_STAGES[0]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef(0);

  const startSequence = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    cancelAnimationFrame(rafRef.current);
    timersRef.current = [];
    setPct(0);
    setPhase("loading");
    setStatus(STATUS_STAGES[0]);

    const DURATION = 4400;
    const start = performance.now();
    const ease = (t: number) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);
      const next = Math.round(ease(t) * 100);
      setPct(next);
      setStatus(getStatus(next));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPct(100);
        setStatus(STATUS_STAGES[STATUS_STAGES.length - 1]);
        const t1 = setTimeout(() => setPhase("ready"), 500);
        const t2 = setTimeout(() => onComplete?.(), 2000);
        timersRef.current.push(t1, t2);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach(clearTimeout);
    };
  }, [onComplete]);

  useEffect(() => {
    return startSequence();
  }, [startSequence]);

  const isReady = phase === "ready";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        background:
          "radial-gradient(ellipse at 50% 40%, #0d0d0d 0%, #050505 100%)",
        overflow: "hidden",
      }}
    >
      {/* Ambient gold glow — very subtle */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "300px",
          background:
            "radial-gradient(ellipse at center, rgba(255,214,10,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <BackgroundCanvas />

      {/* Composition — directly on background */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          width: "min(600px, calc(100vw - 48px))",
        }}
      >
        {/* ARPIT OS label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.24em",
            color: "rgba(255,255,255,0.22)",
            marginBottom: "32px",
          }}
        >
          ARPIT OS
        </motion.div>

        {/* Name — scan reveal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ marginBottom: "36px" }}
        >
          <RevealText pct={pct} />
        </motion.div>

        {/* Percentage */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "3px",
            marginBottom: "14px",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "clamp(26px, 5vw, 36px)",
              fontWeight: 600,
              color: "#ffffff",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {pct}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "13px",
              color: "rgba(255,255,255,0.2)",
              fontWeight: 400,
            }}
          >
            %
          </span>
        </motion.div>

        {/* Progress line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          style={{
            width: "100%",
            height: "1.5px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.06)",
            position: "relative",
            overflow: "visible",
            marginBottom: "20px",
          }}
        >
          {/* Track fill */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${pct}%`,
              borderRadius: "999px",
              background:
                "linear-gradient(90deg, rgba(255,183,3,0.7) 0%, #FFD60A 100%)",
              boxShadow: "0 0 6px rgba(255,214,10,0.4)",
            }}
          />
          {/* Tip glow */}
          {pct > 0 && pct < 100 && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: `${pct}%`,
                transform: "translate(-50%, -50%)",
                width: "12px",
                height: "6px",
                borderRadius: "999px",
                background: "rgba(255,214,10,0.8)",
                filter: "blur(3px)",
              }}
            />
          )}
        </motion.div>

        {/* Status text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          style={{ height: "16px", overflow: "hidden" }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={status.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{
                duration: 0.28,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                display: "block",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                letterSpacing: "0.12em",
                color: isReady
                  ? "#22c55e"
                  : "rgba(161,161,170,0.55)",
                fontWeight: isReady ? 500 : 400,
              }}
            >
              {status.label.toUpperCase()}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* Replay — appears after ready, very subtle */}
        <AnimatePresence>
          {
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              onClick={() => startSequence()}
              style={{
                marginTop: "40px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                letterSpacing: "0.18em",
                color: "rgba(255,255,255,0.2)",
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                outline: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (
                  e.currentTarget as HTMLButtonElement
                ).style.color = "#FFD60A";
              }}
              onMouseLeave={(e) => {
                (
                  e.currentTarget as HTMLButtonElement
                ).style.color = "rgba(255,255,255,0.2)";
              }}
            >
              REPLAY BOOT
            </motion.button>
          }
        </AnimatePresence>
      </div>
    </div>
  );
}