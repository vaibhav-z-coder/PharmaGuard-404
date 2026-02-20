"use client";

import { useEffect, useRef, useCallback } from "react";

interface Bubble {
  x: number;
  y: number;
  radius: number;
  baseRadius: number;
  opacity: number;
  color: string;
  drift: number;
  wobblePhase: number;
  wobbleSpeed: number;
  riseSpeed: number;
  breathSpeed: number;
  breathPhase: number;
}

// Soft pastel bubble colors -- gentle and pleasant
const BUBBLE_COLORS = [
  { fill: "rgba(186, 210, 235,", stroke: "rgba(170, 198, 228," },  // soft sky
  { fill: "rgba(200, 190, 225,", stroke: "rgba(185, 175, 215," },  // lavender
  { fill: "rgba(190, 220, 210,", stroke: "rgba(175, 208, 198," },  // mint
  { fill: "rgba(210, 200, 225,", stroke: "rgba(195, 185, 212," },  // lilac
  { fill: "rgba(195, 215, 230,", stroke: "rgba(180, 200, 220," },  // powder blue
  { fill: "rgba(215, 205, 195,", stroke: "rgba(200, 192, 182," },  // warm sand
];

function createBubbles(width: number, height: number): Bubble[] {
  const bubbles: Bubble[] = [];
  // Scale count to screen area, between 14-35 bubbles
  const count = Math.max(14, Math.min(35, Math.floor((width * height) / 50000)));

  for (let i = 0; i < count; i++) {
    const colorSet = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    // Mix of sizes: ~40% large, ~35% medium, ~25% small
    const sizeRoll = Math.random();
    let baseRadius: number;
    if (sizeRoll < 0.25) {
      baseRadius = 8 + Math.random() * 14;     // small:  8-22
    } else if (sizeRoll < 0.6) {
      baseRadius = 22 + Math.random() * 28;    // medium: 22-50
    } else {
      baseRadius = 50 + Math.random() * 55;    // large:  50-105
    }

    bubbles.push({
      x: Math.random() * (width + 200) - 100,
      y: height + baseRadius + Math.random() * height * 0.5,
      radius: baseRadius,
      baseRadius,
      opacity: 0.04 + Math.random() * 0.08,
      color: colorSet.fill,
      drift: (Math.random() - 0.5) * 0.4,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.005 + Math.random() * 0.01,
      riseSpeed: 0.15 + Math.random() * 0.35,
      breathSpeed: 0.008 + Math.random() * 0.012,
      breathPhase: Math.random() * Math.PI * 2,
    });
  }

  return bubbles;
}

export default function DnaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const dimensionsRef = useRef({ w: 0, h: 0 });

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
    dimensionsRef.current = { w, h };
    bubblesRef.current = createBubbles(w, h);
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      timeRef.current += 1;
      const t = timeRef.current;
      const { w, h } = dimensionsRef.current;
      ctx.clearRect(0, 0, w, h);

      const bubbles = bubblesRef.current;

      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];

        // Gentle rise with wobble (blown by breeze)
        b.y -= b.riseSpeed;
        b.x += b.drift + Math.sin(t * b.wobbleSpeed + b.wobblePhase) * 0.6;

        // Breathing effect -- radius gently pulses
        const breathScale = 1 + Math.sin(t * b.breathSpeed + b.breathPhase) * 0.06;
        b.radius = b.baseRadius * breathScale;

        // Reset bubble when it floats above the top
        if (b.y + b.radius < -20) {
          b.y = h + b.baseRadius + Math.random() * 80;
          b.x = Math.random() * (w + 200) - 100;
          b.drift = (Math.random() - 0.5) * 0.4;
        }

        // Wrap horizontally
        if (b.x - b.radius > w + 60) b.x = -b.radius - 20;
        if (b.x + b.radius < -60) b.x = w + b.radius + 20;

        // Fade in as bubble enters from bottom, fade out near top
        let alphaMultiplier = 1;
        if (b.y > h - 80) {
          alphaMultiplier = Math.max(0, 1 - (b.y - (h - 80)) / 80);
        } else if (b.y < 80) {
          alphaMultiplier = Math.max(0, b.y / 80);
        }

        const finalOpacity = b.opacity * alphaMultiplier;
        if (finalOpacity < 0.005) continue;

        // Outer soft glow
        const glowRadius = b.radius * 2;
        const glow = ctx.createRadialGradient(
          b.x, b.y, b.radius * 0.3,
          b.x, b.y, glowRadius
        );
        glow.addColorStop(0, `${b.color}${finalOpacity * 0.5})`);
        glow.addColorStop(0.5, `${b.color}${finalOpacity * 0.2})`);
        glow.addColorStop(1, `${b.color}0)`);
        ctx.beginPath();
        ctx.arc(b.x, b.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Main bubble body
        const bodyGrad = ctx.createRadialGradient(
          b.x - b.radius * 0.25, b.y - b.radius * 0.25, b.radius * 0.1,
          b.x, b.y, b.radius
        );
        bodyGrad.addColorStop(0, `${b.color}${finalOpacity * 1.2})`);
        bodyGrad.addColorStop(0.7, `${b.color}${finalOpacity * 0.6})`);
        bodyGrad.addColorStop(1, `${b.color}${finalOpacity * 0.15})`);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // Subtle rim/edge
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${b.color}${finalOpacity * 0.25})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Tiny highlight / shine spot (top-left of bubble)
        if (b.baseRadius > 18) {
          const hlX = b.x - b.radius * 0.3;
          const hlY = b.y - b.radius * 0.3;
          const hlR = b.radius * 0.18;
          const hlGrad = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR);
          hlGrad.addColorStop(0, `rgba(255,255,255,${finalOpacity * 0.7})`);
          hlGrad.addColorStop(1, `rgba(255,255,255,0)`);
          ctx.beginPath();
          ctx.arc(hlX, hlY, hlR, 0, Math.PI * 2);
          ctx.fillStyle = hlGrad;
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [resize]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
