/* ------------------------------------------------------------------ */
/*  Canvas radar — grille, anneaux, balayage rotatif, blips            */
/*  Aucun dégradé CSS : tout est dessiné pixel par pixel.              */
/* ------------------------------------------------------------------ */

import { useEffect, useRef } from "react";

interface Props {
  className?: string;
  /** 0.4 = discret (fond) · 1 = pleine intensité (audit en cours) */
  intensity?: number;
  grid?: boolean;
}

export default function RadarCanvas({ className, intensity = 1, grid = true }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !canvas.parentElement) return;
    const parent = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let angle = Math.random() * Math.PI * 2;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const blips = Array.from({ length: 12 }, () => ({
      r: 0.12 + Math.random() * 0.82,
      a: Math.random() * Math.PI * 2,
      age: 999,
      size: 1.6 + Math.random() * 2.2,
    }));

    const paintBase = () => {
      ctx.fillStyle = "#0a0d0b";
      ctx.fillRect(0, 0, w, h);
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintBase();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const TAU = Math.PI * 2;

    const frame = () => {
      const k = intensityRef.current;

      /* Estompage pour la traînée du balayage */
      ctx.fillStyle = "rgba(10,13,11,0.14)";
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.max(40, (Math.min(w, h) / 2) * 0.92);

      /* Grille */
      if (grid) {
        ctx.strokeStyle = "rgba(236,255,220,0.032)";
        ctx.lineWidth = 1;
        const step = 46;
        ctx.beginPath();
        for (let x = ((cx % step) + step) % step; x < w; x += step) {
          ctx.moveTo(x + 0.5, 0);
          ctx.lineTo(x + 0.5, h);
        }
        for (let y = ((cy % step) + step) % step; y < h; y += step) {
          ctx.moveTo(0, y + 0.5);
          ctx.lineTo(w, y + 0.5);
        }
        ctx.stroke();
      }

      /* Anneaux + croix */
      ctx.strokeStyle = `rgba(74,222,128,${0.09 * k})`;
      ctx.lineWidth = 1;
      [0.34, 0.67, 1].forEach((f) => {
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, 0, TAU);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(cx - R, cy);
      ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx, cy - R);
      ctx.lineTo(cx, cy + R);
      ctx.strokeStyle = `rgba(74,222,128,${0.06 * k})`;
      ctx.stroke();

      /* Balayage */
      const sx = cx + Math.cos(angle) * R;
      const sy = cy + Math.sin(angle) * R;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = `rgba(74,222,128,${0.9 * k})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle - 0.09) * R, cy + Math.sin(angle - 0.09) * R);
      ctx.strokeStyle = `rgba(74,222,128,${0.22 * k})`;
      ctx.lineWidth = 5;
      ctx.stroke();

      /* Pointe lumineuse */
      ctx.beginPath();
      ctx.arc(sx, sy, 2.4, 0, TAU);
      ctx.fillStyle = `rgba(217,255,77,${0.9 * k})`;
      ctx.fill();

      /* Centre */
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, TAU);
      ctx.fillStyle = `rgba(74,222,128,${0.85 * k})`;
      ctx.fill();

      /* Blips — s'illuminent au passage du balayage */
      for (const b of blips) {
        let diff = (angle - b.a) % TAU;
        if (diff < 0) diff += TAU;
        if (diff < 0.05) b.age = 0;
        else b.age += 1;

        if (b.age < 110) {
          const alpha = (1 - b.age / 110) * 0.95 * k;
          const bx = cx + Math.cos(b.a) * b.r * R;
          const by = cy + Math.sin(b.a) * b.r * R;
          ctx.beginPath();
          ctx.arc(bx, by, b.size, 0, TAU);
          ctx.fillStyle = `rgba(217,255,77,${alpha})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(bx, by, b.size + 4 + b.age * 0.08, 0, TAU);
          ctx.strokeStyle = `rgba(217,255,77,${alpha * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      angle += 0.0075;
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [grid]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
}
