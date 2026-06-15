"use client";

import { useEffect, useRef } from "react";

/**
 * Hero radar background (Home). Client-only: canvas + rAF sweep.
 *
 * - Contact count derives from STATS.cases (passed as prop — no hard-coded
 *   numbers; repo anti-pattern).
 * - `prefers-reduced-motion`: paints one static frame, no sweep, no rAF loop.
 * - Pauses the rAF loop via IntersectionObserver when scrolled out of view
 *   (a perpetual loop on a long page is wasted CPU/battery).
 * Decorative — aria-hidden; all meaning lives in the text rendered on top.
 */
export function HeroRadar({
  contacts = 137,
  peaks = 4,
}: {
  contacts?: number;
  peaks?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cvRef = canvasRef.current;
    if (!cvRef) return;
    const ctxRef = cvRef.getContext("2d");
    if (!ctxRef) return;
    // Non-null typed aliases so TS keeps the narrowing inside the closures below.
    const cv: HTMLCanvasElement = cvRef;
    const ctx: CanvasRenderingContext2D = ctxRef;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let cx = 0;
    let cy = 0;
    let maxR = 0;
    let pts: { a: number; r: number; peak: boolean; lit: number }[] = [];

    function seedRand(s: number) {
      return function () {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
      };
    }

    function setup() {
      const DPR = Math.min(2, window.devicePixelRatio || 1);
      W = cv.clientWidth;
      H = cv.clientHeight;
      cv.width = W * DPR;
      cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = W * (W < 760 ? 0.5 : 0.72);
      cy = H * (W < 760 ? 0.34 : 0.5);
      maxR = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.02;
      const r = seedRand(137);
      const n = Math.max(12, Math.round(contacts));
      pts = [];
      for (let i = 0; i < n; i++) {
        const ang = r() * Math.PI * 2;
        const rad = (0.12 + Math.pow(r(), 0.7) * 0.92) * maxR;
        pts.push({ a: ang, r: rad, peak: i < peaks, lit: 0 });
      }
    }
    setup();

    let sweep = -Math.PI / 2;
    let last = performance.now();
    const born = performance.now();
    const SPEED = (Math.PI * 2) / 9000; // one revolution / 9s
    let raf = 0;
    let running = false;

    function frame(now: number) {
      const dt = now - last;
      last = now;
      ctx.clearRect(0, 0, W, H);
      const appear = Math.min(1, (now - born) / 1800);

      // concentric rings
      ctx.lineWidth = 1;
      for (let k = 1; k <= 5; k++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (maxR * k) / 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(247,242,232,${0.05 * appear})`;
        ctx.stroke();
      }
      // crosshair
      ctx.strokeStyle = `rgba(247,242,232,${0.05 * appear})`;
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy);
      ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR);
      ctx.lineTo(cx, cy + maxR);
      ctx.stroke();

      if (!reduce) sweep += SPEED * dt;
      const sa = ((sweep % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

      // sweep wedge + leading line
      if (!reduce) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, sa - 0.5, sa);
        ctx.closePath();
        const lg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        lg.addColorStop(0, `rgba(238,96,117,${0.16 * appear})`);
        lg.addColorStop(1, "rgba(238,96,117,0)");
        ctx.fillStyle = lg;
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = `rgba(238,96,117,${0.55 * appear})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(sa) * maxR, cy + Math.sin(sa) * maxR);
        ctx.stroke();
      }

      // contacts
      for (let i = 0; i < pts.length; i++) {
        const c = pts[i];
        if (reduce) {
          c.lit = 0.7;
        } else {
          const ca = ((c.a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          let diff = Math.abs(sa - ca);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff < 0.05) c.lit = 1;
          else c.lit *= 0.985;
        }
        const x = cx + Math.cos(c.a) * c.r;
        const y = cy + Math.sin(c.a) * c.r;
        if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
        const pulse = c.peak ? 0.6 + 0.4 * Math.sin(now / 450 + i) : 1;
        if (c.peak) {
          ctx.beginPath();
          ctx.arc(x, y, 3.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(238,96,117,${(0.5 + 0.5 * c.lit) * appear * pulse})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, 7.5 * pulse, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(238,96,117,${0.4 * appear * pulse})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          const on = 0.12 + 0.85 * c.lit;
          ctx.beginPath();
          ctx.arc(x, y, 1.7 + 1.8 * c.lit, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(247,242,232,${on * appear})`;
          ctx.fill();
        }
      }

      // reduced motion → one static frame, then stop.
      if (reduce || !running) return;
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduce) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    if (reduce) {
      // single static paint
      frame(performance.now());
    } else {
      running = true;
      raf = requestAnimationFrame(frame);
    }

    const onResize = () => setup();
    window.addEventListener("resize", onResize);

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(cv);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      io.disconnect();
    };
  }, [contacts, peaks]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* archival texture: vignette + scanlines (matches the design preview) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 22% 42%, rgba(20,20,20,0) 38%, rgba(20,20,20,.72) 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-50 mix-blend-multiply"
        style={{
          background:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0 2px, rgba(0,0,0,.20) 2px 3px)",
        }}
      />
    </div>
  );
}
