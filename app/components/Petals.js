'use client';

import { useEffect, useRef } from 'react';

function readThemePetalColors() {
  const root = getComputedStyle(document.documentElement);
  const pick = (name, fallback) => root.getPropertyValue(name).trim() || fallback;
  return [
    pick('--sage-light', '#F7DCDA'),
    pick('--sage-border', '#EAC9C7'),
    pick('--sage', '#E2B4B1'),
    '#FFFFFF',
    pick('--gold-pale', '#F7EFC8'),
  ];
}

export default function Petals({ enabled, themeKey }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const COLORS = readThemePetalColors();
    const petals = [];
    const COUNT = window.innerWidth < 600 ? 12 : 25;

    class Petal {
      constructor() {
        this.reset(true);
      }

      reset(initial) {
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height * 2 - canvas.height : -20;
        this.r = 4 + Math.random() * 5;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = 0.6 + Math.random() * 1.2;
        this.rot = Math.random() * Math.PI * 2;
        this.drot = (Math.random() - 0.5) * 0.04;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.alpha = 0.3 + Math.random() * 0.4;
      }

      update() {
        this.x += this.vx + Math.sin(this.y * 0.01) * 0.4;
        this.y += this.vy;
        this.rot += this.drot;
        if (this.y > canvas.height + 20) this.reset(false);
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.r * 0.55, this.r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    for (let i = 0; i < COUNT; i++) petals.push(new Petal());

    let animationId;
    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach((p) => {
        p.update();
        p.draw();
      });
      animationId = requestAnimationFrame(loop);
    }

    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [enabled, themeKey]);

  if (!enabled) return null;

  return <canvas id="petals-canvas" ref={canvasRef} className="active" />;
}
